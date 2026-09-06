/**
 * Offline tooling: fetch every lesson video's transcript and chapters and
 * freeze the result in `cache/`, one file per video (CLAUDE.md section 9).
 *
 * This is the only step that touches the network. It never runs in the request
 * path, and it stores no token — the dataset is read through the Sanity CLI's
 * own session, exactly as `seed/scripts/import.mjs` writes through it.
 *
 *   node videos/scripts/fetch-transcripts.mjs                 # everything missing
 *   node videos/scripts/fetch-transcripts.mjs --limit 3       # a taste first
 *   node videos/scripts/fetch-transcripts.mjs --only <id>     # one video
 *   node videos/scripts/fetch-transcripts.mjs --refresh       # re-fetch cached
 *   node videos/scripts/fetch-transcripts.mjs --from-seed     # no dataset query
 *   node videos/scripts/fetch-transcripts.mjs --keep-raw      # keep the .json3
 *
 * It is resumable: a video already in `cache/` is skipped unless `--refresh`.
 * One failure never aborts the run — failures are collected, reported, and the
 * process exits non-zero so a re-run can pick them up.
 */
import {spawnSync} from 'node:child_process'
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {chunksFromCues, cuesFromJson3, normaliseChapters} from '../lib/transcript.mjs'
import {canonicalUrl, docIdFor, parseVideoUrl} from '../lib/video-id.mjs'
import {fetchCaptions, probeVideo, resolveYtDlp} from '../lib/ytdlp.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const videosRoot = resolve(here, '..')
const studioRoot = resolve(videosRoot, '..')
const cacheDir = resolve(videosRoot, 'cache')
const rawDir = resolve(cacheDir, 'raw')

const DELAY_MS = 1200

const args = process.argv.slice(2)
const REFRESH = args.includes('--refresh')
const FROM_SEED = args.includes('--from-seed')
const KEEP_RAW = args.includes('--keep-raw')
const LIMIT = readNumberFlag('--limit')
const ONLY = readAllFlags('--only')

function readNumberFlag(flag) {
  const index = args.indexOf(flag)
  if (index === -1) return undefined
  const value = Number(args[index + 1])
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined
}

function readAllFlags(flag) {
  const values = []
  for (const [index, arg] of args.entries()) {
    if (arg === flag && args[index + 1]) values.push(args[index + 1])
  }
  return values
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

/**
 * YouTube rate-limits a run this size. A 429 is not a broken video, it is a
 * "slow down", so back off and try again rather than burning the video into the
 * failure list — a whole run's worth of retries costs more than a few pauses.
 */
const RETRY_DELAYS_MS = [20_000, 60_000]
const isRateLimited = (error) => /429|too many requests/i.test(String(error ?? ''))

async function withBackoff(attempt) {
  let result = attempt()
  for (const delay of RETRY_DELAYS_MS) {
    if (result.ok || !isRateLimited(result.error)) return result
    process.stdout.write(`rate limited, waiting ${delay / 1000}s … `)
    await sleep(delay)
    result = attempt()
  }
  return result
}

/** Minimal KEY=value reader, mirroring seed/scripts/import.mjs. */
function readEnvFile(path) {
  if (!existsSync(path)) return {}
  const values = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (!match) continue
    values[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
  }
  return values
}

/**
 * The video URLs actually in use, read from the dataset.
 *
 * Reading the dataset rather than `seed/videos.json` is what makes this correct
 * for any authored lesson, not just the seeded ones — section 9 asks for one
 * document per unique video URL, and the dataset is the only place that knows
 * what those are.
 */
function urlsFromDataset() {
  const fileEnv = readEnvFile(resolve(studioRoot, '.env'))
  const dataset = process.env.SANITY_STUDIO_DATASET || fileEnv.SANITY_STUDIO_DATASET
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID || fileEnv.SANITY_STUDIO_PROJECT_ID

  if (!dataset || !projectId) {
    throw new Error('Missing SANITY_STUDIO_DATASET or SANITY_STUDIO_PROJECT_ID (studio/.env).')
  }

  const query = "array::unique(*[_type == 'lesson' && defined(videoUrl)].videoUrl)"
  const result = spawnSync(
    'npx',
    ['sanity', 'documents', 'query', JSON.stringify(query), '-p', projectId, '-d', dataset],
    {cwd: studioRoot, encoding: 'utf8', shell: true, maxBuffer: 16 * 1024 * 1024},
  )

  if (result.status !== 0) {
    throw new Error(
      `Could not query the dataset (npx sanity documents query exited ${result.status}).\n` +
        `${(result.stderr || '').trim()}\n\n` +
        'Run `npx sanity login` from studio/, or use --from-seed to read seed/videos.json instead.',
    )
  }

  // The CLI prints a warning line before the JSON when --api-version is absent.
  const stdout = result.stdout || ''
  const start = stdout.indexOf('[')
  if (start === -1) throw new Error('The dataset query returned no array.')
  return JSON.parse(stdout.slice(start))
}

/** The offline fallback: the committed seed mapping. */
function urlsFromSeed() {
  const path = resolve(studioRoot, 'seed/videos.json')
  const mapping = JSON.parse(readFileSync(path, 'utf8'))
  return [...new Set(Object.values(mapping).map((entry) => entry.url))]
}

async function main() {
  const sourceUrls = FROM_SEED ? urlsFromSeed() : urlsFromDataset()
  console.log(`${sourceUrls.length} unique video URL(s) from ${FROM_SEED ? 'seed/videos.json' : 'the dataset'}\n`)

  mkdirSync(cacheDir, {recursive: true})
  mkdirSync(rawDir, {recursive: true})

  const runner = resolveYtDlp()
  console.log(`Using yt-dlp ${runner.version}\n`)

  const unsupported = []
  const failed = []
  let fetched = 0
  let skipped = 0

  // Parse and de-duplicate first, so the counts printed below are honest.
  const targets = []
  const seen = new Set()
  for (const url of sourceUrls) {
    const parsed = parseVideoUrl(url)
    if (!parsed) {
      unsupported.push({url, reason: 'not a recognised video URL'})
      continue
    }
    if (parsed.provider !== 'youtube') {
      // Playback works for Vimeo and Bunny, ingestion does not. CLAUDE.md
      // section 9: a provider is not supported until both exist.
      unsupported.push({url, reason: `${parsed.provider} ingestion is not implemented`})
      continue
    }
    const docId = docIdFor(parsed)
    if (seen.has(docId)) continue
    seen.add(docId)
    targets.push({url, parsed, docId})
  }

  const selected = targets
    .filter(({parsed, url}) => ONLY.length === 0 || ONLY.includes(parsed.id) || ONLY.includes(url))
    .slice(0, LIMIT ?? Infinity)

  for (const [index, target] of selected.entries()) {
    const cachePath = resolve(cacheDir, `${target.docId}.json`)
    const position = `[${index + 1}/${selected.length}]`

    if (existsSync(cachePath) && !REFRESH) {
      skipped++
      continue
    }

    process.stdout.write(`${position} ${target.parsed.id} … `)
    const watchUrl = canonicalUrl(target.parsed, target.url)

    const probe = await withBackoff(() => probeVideo(runner, watchUrl))
    if (!probe.ok) {
      process.stdout.write(`probe failed (${probe.error})\n`)
      failed.push({id: target.parsed.id, reason: probe.error})
      await sleep(DELAY_MS)
      continue
    }

    const captions = await withBackoff(() =>
      fetchCaptions(runner, watchUrl, target.parsed.id, rawDir, {probe, keepRaw: KEEP_RAW}),
    )
    if (!captions.ok) {
      process.stdout.write(`captions failed (${captions.error})\n`)
      failed.push({id: target.parsed.id, reason: captions.error})
      await sleep(DELAY_MS)
      continue
    }

    const chunks = captions.json ? chunksFromCues(cuesFromJson3(captions.json)) : []
    const chapters = normaliseChapters(probe.chapters, probe.durationSeconds)

    writeFileSync(
      cachePath,
      `${JSON.stringify(
        {
          docId: target.docId,
          provider: target.parsed.provider,
          videoId: target.parsed.id,
          url: target.url,
          title: probe.title,
          durationSeconds: probe.durationSeconds,
          captionSource: captions.captionSource,
          chapterSource: chapters.length > 0 ? 'provider' : 'none',
          chapters,
          chunks,
          fetchedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
      'utf8',
    )

    fetched++
    process.stdout.write(
      `${chapters.length} chapters, ${chunks.length} chunks (${captions.captionSource})\n`,
    )
    await sleep(DELAY_MS)
  }

  console.log(
    `\nFetched ${fetched}, already cached ${skipped}, ` +
      `unsupported ${unsupported.length}, failed ${failed.length}.`,
  )

  if (unsupported.length > 0) {
    console.log('\nSkipped (no ingestion for this provider):')
    for (const entry of unsupported) console.log(`  - ${entry.url} → ${entry.reason}`)
  }

  if (failed.length > 0) {
    console.log('\nFailed:')
    for (const entry of failed) console.log(`  ✗ ${entry.id} → ${entry.reason}`)
    console.log('\nRe-run to retry, or target one with --only <videoId>.')
    process.exitCode = 1
  }
}

try {
  await main()
} catch (error) {
  console.error(`\n${error.message}`)
  process.exit(1)
}
