/**
 * Locating and running yt-dlp.
 *
 * Why an external tool rather than plain `fetch`, the way
 * `seed/scripts/harvest-videos.mjs` scrapes YouTube: caption bodies are no
 * longer served to an unauthenticated fetch. Every caption `baseUrl` taken from
 * the watch page returns HTTP 200 with an empty body, and the InnerTube player
 * and `get_transcript` endpoints answer UNPLAYABLE / FAILED_PRECONDITION.
 * Chapters still scrape; transcripts do not. Re-implementing yt-dlp's player
 * handshake would be a fragile copy of a maintained tool, and this is offline
 * tooling (CLAUDE.md section 9), so an external dependency is acceptable here in
 * a way it never would be in the request path.
 *
 * The tool is located, never installed. If it is missing the caller is told how
 * to install it and nothing else happens.
 */
import {spawnSync} from 'node:child_process'
import {readdirSync, readFileSync, rmSync} from 'node:fs'
import {resolve} from 'node:path'

/** Long enough for a slow caption download, short enough to not hang a run. */
const TIMEOUT_MS = 120_000

export const INSTALL_HINT = `yt-dlp was not found.

Install it, then re-run:

  python -m pip install --user yt-dlp

or, if you prefer a standalone binary:

  winget install yt-dlp.yt-dlp

If it lives somewhere off PATH, point at it explicitly:

  $env:YT_DLP = "C:\\path\\to\\yt-dlp.exe"`

function tryRunner(runner) {
  try {
    const result = spawnSync(runner.command, [...runner.args, '--version'], {
      encoding: 'utf8',
      shell: true,
      timeout: 20_000,
    })
    if (result.status === 0) return {...runner, version: (result.stdout || '').trim()}
  } catch {
    // fall through to the next candidate
  }
  return null
}

/**
 * `$YT_DLP` -> `yt-dlp` on PATH -> `python -m yt_dlp`. Resolved once per run.
 */
export function resolveYtDlp() {
  const candidates = []
  if (process.env.YT_DLP) candidates.push({command: `"${process.env.YT_DLP}"`, args: []})
  candidates.push({command: 'yt-dlp', args: []})
  candidates.push({command: 'python', args: ['-m', 'yt_dlp']})

  for (const candidate of candidates) {
    const found = tryRunner(candidate)
    if (found) return found
  }

  throw new Error(INSTALL_HINT)
}

/** Arguments every invocation shares. Politeness matches harvest-videos.mjs. */
const COMMON_ARGS = ['--no-playlist', '--no-warnings', '--sleep-requests', '1']

/**
 * `shell: true` is unavoidable on Windows — `yt-dlp` installs as a `.cmd`
 * shim, which spawn cannot execute directly — and it means arguments are
 * concatenated rather than escaped. So anything that could contain a space is
 * quoted here. URLs reaching this module are already parsed and
 * provider-checked; the output path is ours but may sit under a directory with
 * a space in its name.
 */
const quote = (value) => `"${String(value).replace(/"/g, '\\"')}"`

function run(runner, args) {
  const result = spawnSync(runner.command, [...runner.args, ...COMMON_ARGS, ...args], {
    encoding: 'utf8',
    shell: true,
    timeout: TIMEOUT_MS,
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.error) return {ok: false, error: result.error.message}
  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim().split('\n').filter(Boolean)
    return {ok: false, error: stderr[stderr.length - 1] || `exited ${result.status}`}
  }
  return {ok: true, stdout: result.stdout}
}

/**
 * Metadata in one call: duration, chapters, and which caption tracks exist.
 */
export function probeVideo(runner, url) {
  const result = run(runner, ['--skip-download', '--dump-single-json', quote(url)])
  if (!result.ok) return result

  let meta
  try {
    meta = JSON.parse(result.stdout)
  } catch {
    return {ok: false, error: 'could not parse yt-dlp metadata'}
  }

  return {
    ok: true,
    id: meta.id,
    title: meta.title,
    durationSeconds: Number.isFinite(meta.duration) ? Math.round(meta.duration) : undefined,
    chapters: Array.isArray(meta.chapters) ? meta.chapters : [],
    subtitleLangs: Object.keys(meta.subtitles || {}),
    autoLangs: Object.keys(meta.automatic_captions || {}),
  }
}

const isEnglish = (lang) => lang === 'en' || lang.startsWith('en-') || lang.startsWith('en.')

/**
 * Plain `en` beats `en-US` beats `en-orig`.
 *
 * The filename cannot tell you whether a track was author-uploaded or
 * generated — yt-dlp writes an auto track as `<id>.en.json3` too, exactly like
 * a manual one. That distinction comes from the probe, not from here.
 */
function pickCaptionFile(files, videoId) {
  const langOf = (name) => name.slice(videoId.length + 1).replace(/\.json3$/, '')
  return [...files].sort((a, b) => {
    const [x, y] = [langOf(a), langOf(b)]
    if (x === 'en') return -1
    if (y === 'en') return 1
    return x.length - y.length || x.localeCompare(y)
  })[0]
}

/**
 * Downloads the English captions as json3 and returns the parsed file.
 *
 * `captionSource` comes from the probe: `manual` when the author uploaded an
 * English track, `auto` when only YouTube's generated one exists, `none` when
 * there is neither. Knowing which up front also means only one track is
 * downloaded instead of both.
 */
export function fetchCaptions(runner, url, videoId, outDir, {probe, keepRaw = false} = {}) {
  const hasManual = (probe?.subtitleLangs ?? []).some(isEnglish)
  const hasAuto = (probe?.autoLangs ?? []).some(isEnglish)
  if (!hasManual && !hasAuto) return {ok: true, captionSource: 'none', json: null}

  const result = run(runner, [
    '--skip-download',
    hasManual ? '--write-subs' : '--write-auto-subs',
    '--sub-langs',
    quote('en.*,en'),
    '--sub-format',
    'json3',
    '-o',
    quote(resolve(outDir, '%(id)s')),
    quote(url),
  ])
  if (!result.ok) return result

  const written = readdirSync(outDir).filter(
    (name) => name.startsWith(`${videoId}.`) && name.endsWith('.json3'),
  )
  if (written.length === 0) return {ok: true, captionSource: 'none', json: null}

  const chosen = pickCaptionFile(written, videoId)
  let json = null
  try {
    json = JSON.parse(readFileSync(resolve(outDir, chosen), 'utf8'))
  } catch {
    return {ok: false, error: `could not parse ${chosen}`}
  }

  if (!keepRaw) {
    for (const name of written) {
      try {
        rmSync(resolve(outDir, name))
      } catch {
        // leaving a stray file behind is not worth failing a run over
      }
    }
  }

  return {ok: true, captionSource: hasManual ? 'manual' : 'auto', json}
}
