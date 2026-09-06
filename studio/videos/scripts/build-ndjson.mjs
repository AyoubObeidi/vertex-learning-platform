/**
 * Builds videos/dist/vertex-videos.ndjson from what `videos:fetch` cached.
 *
 *   node videos/scripts/build-ndjson.mjs
 *
 * No network. Reads `cache/*.json` and the authored overrides in
 * `chapters.json`, validates every invariant in ../lib/validate.mjs, and exits
 * non-zero rather than writing a lookup table that would resolve a query to the
 * wrong second.
 */
import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {buildDocuments} from '../lib/build.mjs'
import {formatTimestamp} from '../lib/transcript.mjs'
import {validateDocuments} from '../lib/validate.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const videosRoot = resolve(here, '..')
const cacheDir = resolve(videosRoot, 'cache')
const overridesPath = resolve(videosRoot, 'chapters.json')
const outputPath = resolve(videosRoot, 'dist/vertex-videos.ndjson')

async function readCache() {
  if (!existsSync(cacheDir)) {
    console.error('No cache/ directory. Run: npm run videos:fetch')
    process.exit(1)
  }

  const files = (await readdir(cacheDir)).filter((name) => name.endsWith('.json'))
  if (files.length === 0) {
    console.error('cache/ is empty. Run: npm run videos:fetch')
    process.exit(1)
  }

  const entries = []
  for (const file of files.sort()) {
    entries.push(JSON.parse(await readFile(resolve(cacheDir, file), 'utf8')))
  }
  return entries
}

async function readOverrides() {
  if (!existsSync(overridesPath)) return {}
  const parsed = JSON.parse(await readFile(overridesPath, 'utf8'))
  // Ignore the `_readme` key the shipped file uses to explain itself.
  return Object.fromEntries(Object.entries(parsed).filter(([key]) => !key.startsWith('_')))
}

async function main() {
  const entries = await readCache()
  const overrides = await readOverrides()
  const {documents, empty} = buildDocuments(entries, overrides)

  const problems = validateDocuments(documents)
  if (problems.length > 0) {
    console.error(`\n${problems.length} consistency problem(s):`)
    for (const problem of problems) console.error(`  ✗ ${problem}`)
    process.exit(1)
  }

  await mkdir(dirname(outputPath), {recursive: true})
  await writeFile(outputPath, documents.map((doc) => JSON.stringify(doc)).join('\n') + '\n')

  console.log('Video documents:\n')
  for (const document of documents) {
    const duration = Number.isFinite(document.durationSeconds)
      ? formatTimestamp(document.durationSeconds)
      : '?'
    console.log(
      `  ${document.videoId}  ${duration.padStart(7)}  ` +
        `${String(document.chapters.length).padStart(3)} chapters  ` +
        `${String(document.chunks.length).padStart(4)} chunks  ` +
        `${document.captionSource}/${document.chapterSource}  ` +
        `${document.title ?? ''}`,
    )
  }

  const transcriptOnly = documents.filter((doc) => doc.chapters.length === 0)
  const noCaptions = documents.filter((doc) => doc.chunks.length === 0)
  const totalChunks = documents.reduce((total, doc) => total + doc.chunks.length, 0)
  const totalChapters = documents.reduce((total, doc) => total + doc.chapters.length, 0)

  console.log(
    `\n${documents.length} documents, ${totalChapters} chapters, ${totalChunks} chunks.`,
  )

  if (transcriptOnly.length > 0) {
    // Expected, not a failure: search falls back to transcript matching for
    // these (CLAUDE.md section 7). Worth seeing, because a sudden jump here
    // means chapter extraction broke.
    console.log(`\n${transcriptOnly.length} video(s) with no chapters — transcript-only:`)
    for (const doc of transcriptOnly) console.log(`  - ${doc.videoId}  ${doc.title ?? ''}`)
  }

  if (noCaptions.length > 0) {
    console.log(`\n${noCaptions.length} video(s) with no transcript — chapters only:`)
    for (const doc of noCaptions) console.log(`  - ${doc.videoId}  ${doc.title ?? ''}`)
  }

  console.log(`\nWrote ${outputPath}`)

  if (empty.length > 0) {
    console.error(`\n${empty.length} video(s) had neither chapters nor a transcript and were skipped:`)
    for (const doc of empty) console.error(`  ✗ ${doc.videoId}  ${doc.title ?? ''}`)
    console.error('\nThose lessons cannot be found by video search. Author chapters in')
    console.error('chapters.json, or replace the video in seed/videos.json.')
    process.exitCode = 1
  }
}

await main()
