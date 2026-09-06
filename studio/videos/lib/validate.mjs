/**
 * The invariants a video document must satisfy.
 *
 * The build fails on any violation rather than importing a lookup table that
 * would resolve a query to the wrong second — a timestamp that is subtly wrong
 * is worse than no result at all, because it looks like an answer.
 */
import {docIdFor, parseVideoUrl} from './video-id.mjs'

/** Field vocabularies, mirrored from studio/schemaTypes/documents/video.ts. */
const PROVIDERS = new Set(['youtube', 'vimeo', 'bunny'])
const CAPTION_SOURCES = new Set(['manual', 'auto', 'none'])
const CHAPTER_SOURCES = new Set(['provider', 'authored', 'none'])

const ID_PATTERN = /^video\.[A-Za-z0-9._-]+$/
/** A chunk this long means the chunker mis-grouped, not that someone talked a lot. */
const MAX_CHUNK_CHARS = 1000

function checkOrdered(items, label, document, problems) {
  let previous = -Infinity
  for (const item of items) {
    const {startSeconds} = item
    if (!Number.isInteger(startSeconds) || startSeconds < 0) {
      problems.push(`${document._id}: ${label} has a non-integer or negative startSeconds (${startSeconds})`)
      continue
    }
    if (startSeconds <= previous) {
      problems.push(`${document._id}: ${label} is not in ascending order at ${startSeconds}s`)
    }
    if (
      Number.isFinite(document.durationSeconds) &&
      startSeconds > document.durationSeconds
    ) {
      problems.push(
        `${document._id}: ${label} at ${startSeconds}s is past the video (${document.durationSeconds}s)`,
      )
    }
    previous = startSeconds
  }
}

export function validateDocuments(documents) {
  const problems = []
  const idsSeen = new Set()
  const urlsSeen = new Set()

  for (const document of documents) {
    if (!ID_PATTERN.test(document._id)) {
      problems.push(`${document._id}: not a valid video document id`)
    }
    if (idsSeen.has(document._id)) problems.push(`${document._id}: duplicate _id`)
    idsSeen.add(document._id)

    // Every spelling this document answers to must round-trip to its own id, or
    // the join from a lesson's videoUrl would land somewhere else — and no two
    // documents may claim the same spelling, or it would land in both.
    if (!Array.isArray(document.urls) || !document.urls.includes(document.url)) {
      problems.push(`${document._id}: urls must list url (${document.url})`)
    }

    for (const url of new Set([document.url, ...(document.urls ?? [])])) {
      if (urlsSeen.has(url)) {
        problems.push(`${document._id}: duplicate url ${url}`)
      }
      urlsSeen.add(url)

      const parsed = parseVideoUrl(url)
      if (!parsed) {
        problems.push(`${document._id}: url is not a recognised video URL (${url})`)
      } else if (docIdFor(parsed) !== document._id) {
        problems.push(`${document._id}: url ${url} resolves to ${docIdFor(parsed)}`)
      } else if (parsed.provider !== document.provider) {
        problems.push(`${document._id}: provider "${document.provider}" disagrees with ${url}`)
      }
    }

    if (!PROVIDERS.has(document.provider)) {
      problems.push(`${document._id}: unknown provider "${document.provider}"`)
    }
    if (!CAPTION_SOURCES.has(document.captionSource)) {
      problems.push(`${document._id}: unknown captionSource "${document.captionSource}"`)
    }
    if (!CHAPTER_SOURCES.has(document.chapterSource)) {
      problems.push(`${document._id}: unknown chapterSource "${document.chapterSource}"`)
    }
    if (document.chapterSource === 'none' && document.chapters.length > 0) {
      problems.push(`${document._id}: chapterSource is "none" but it has chapters`)
    }
    if (document.chapterSource !== 'none' && document.chapters.length === 0) {
      problems.push(`${document._id}: chapterSource is "${document.chapterSource}" but it has no chapters`)
    }
    if (document.captionSource === 'none' && document.chunks.length > 0) {
      problems.push(`${document._id}: captionSource is "none" but it has chunks`)
    }

    if (document.durationSeconds !== undefined && !Number.isInteger(document.durationSeconds)) {
      problems.push(`${document._id}: durationSeconds is not a whole number`)
    }

    checkOrdered(document.chapters, 'chapters', document, problems)
    checkOrdered(document.chunks, 'chunks', document, problems)

    for (const chapter of document.chapters) {
      if (!chapter.label || !chapter.label.trim()) {
        problems.push(`${document._id}: empty chapter label at ${chapter.startSeconds}s`)
      }
      if (!chapter._key) problems.push(`${document._id}: chapter at ${chapter.startSeconds}s has no _key`)
    }

    for (const chunk of document.chunks) {
      if (!chunk.text || !chunk.text.trim()) {
        problems.push(`${document._id}: empty chunk text at ${chunk.startSeconds}s`)
      } else if (chunk.text.length > MAX_CHUNK_CHARS) {
        problems.push(
          `${document._id}: chunk at ${chunk.startSeconds}s is ${chunk.text.length} chars (max ${MAX_CHUNK_CHARS})`,
        )
      }
      if (!chunk._key) problems.push(`${document._id}: chunk at ${chunk.startSeconds}s has no _key`)
    }

    if (document.chapters.length === 0 && document.chunks.length === 0) {
      problems.push(`${document._id}: has neither chapters nor chunks`)
    }
  }

  return problems
}
