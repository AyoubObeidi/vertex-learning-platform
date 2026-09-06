/**
 * json3 captions -> clean cues -> timestamped chunks.
 *
 * Pure functions, no I/O. This is the part of the pipeline whose output the
 * search agent actually reads, so it is the part worth being able to reason
 * about in isolation.
 *
 * The chunk is the unit of retrieval: short enough that its `startSeconds` is a
 * precise place to start playing, long enough to carry an idea a learner could
 * have typed. Whole transcripts are never assembled anywhere (CLAUDE.md
 * sections 8 and 12).
 */

/** ~40s of speech is a paragraph's worth: one idea, one seek target. */
export const CHUNK_DEFAULTS = {targetSeconds: 40, maxSeconds: 60, maxChars: 600}

/** "[Music]", "[Applause]" — sound cues, not words anyone searches for. */
const NON_SPEECH = /^\[[^\]]*\]$/

function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Flattens a json3 caption file into `{startSeconds, text}` cues.
 *
 * Three quirks of YouTube's auto-generated tracks are handled here, all of them
 * observed in real files:
 *
 * 1. The first event is a window definition with no `segs` at all.
 * 2. The rolling caption effect emits `aAppend: 1` events whose only segment is
 *    a newline. Keeping them would duplicate every line.
 * 3. A real event's `segs` are individual words with their own `tOffsetMs`, so
 *    the text has to be concatenated rather than read from one field.
 */
export function cuesFromJson3(json) {
  const events = Array.isArray(json?.events) ? json.events : []
  const cues = []

  for (const event of events) {
    if (!Array.isArray(event?.segs)) continue
    if (event.aAppend) continue

    const text = cleanText(event.segs.map((seg) => seg?.utf8 ?? '').join(''))
    if (!text || NON_SPEECH.test(text)) continue

    const startMs = Number(event.tStartMs)
    if (!Number.isFinite(startMs) || startMs < 0) continue

    cues.push({startSeconds: Math.floor(startMs / 1000), text})
  }

  cues.sort((a, b) => a.startSeconds - b.startSeconds)

  // Drop exact repeats — a rolling track can restate a line at the same second.
  const seen = new Set()
  return cues.filter((cue) => {
    const key = `${cue.startSeconds}|${cue.text}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Groups cues into chunks.
 *
 * A chunk closes once it has reached `targetSeconds`, or earlier if the next
 * cue would push it past `maxSeconds` or `maxChars`. A single cue longer than
 * either limit still becomes its own chunk rather than being dropped or split
 * mid-sentence — an over-long cue is rare and truncating it would lose words
 * the transcript is there to provide.
 */
export function chunksFromCues(cues, options = {}) {
  const {targetSeconds, maxSeconds, maxChars} = {...CHUNK_DEFAULTS, ...options}
  const chunks = []

  let startSeconds = null
  let parts = []
  let length = 0

  const flush = () => {
    if (parts.length === 0) return
    chunks.push({startSeconds, text: parts.join(' ')})
    startSeconds = null
    parts = []
    length = 0
  }

  for (const cue of cues) {
    if (startSeconds === null) {
      startSeconds = cue.startSeconds
      parts = [cue.text]
      length = cue.text.length
      continue
    }

    const span = cue.startSeconds - startSeconds
    const wouldOverflow = span >= maxSeconds || length + 1 + cue.text.length > maxChars
    const isFullEnough = span >= targetSeconds

    if (wouldOverflow || isFullEnough) {
      flush()
      startSeconds = cue.startSeconds
      parts = [cue.text]
      length = cue.text.length
      continue
    }

    parts.push(cue.text)
    length += 1 + cue.text.length
  }

  flush()
  return chunks
}

/**
 * yt-dlp chapters -> the table of contents.
 *
 * Fewer than two surviving chapters counts as none. A lone marker spanning a
 * whole video is not a table of contents, and it would win the chapter-first
 * stage of timestamp resolution (CLAUDE.md section 7) and answer second 0 for
 * every query. Those videos fall through to transcript matching, which is what
 * the fallback exists for.
 */
export function normaliseChapters(chapters, durationSeconds) {
  if (!Array.isArray(chapters)) return []

  const seen = new Set()
  const cleaned = []

  for (const chapter of chapters) {
    const start = Number(chapter?.start_time)
    const label = cleanText(chapter?.title)
    if (!label || !Number.isFinite(start) || start < 0) continue

    const startSeconds = Math.floor(start)
    if (typeof durationSeconds === 'number' && durationSeconds > 0 && startSeconds > durationSeconds) {
      continue
    }
    if (seen.has(startSeconds)) continue

    seen.add(startSeconds)
    cleaned.push({startSeconds, label})
  }

  cleaned.sort((a, b) => a.startSeconds - b.startSeconds)
  return cleaned.length >= 2 ? cleaned : []
}

/** Seconds to "4:32" / "1:04:32", for the build report. */
export function formatTimestamp(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const paddedSeconds = String(seconds).padStart(2, '0')
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`
  return `${minutes}:${paddedSeconds}`
}
