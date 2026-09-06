/**
 * Cached ingestion results -> `video` documents.
 *
 * Deterministic: the same cache always produces the same documents, ids, and
 * `_key`s, so a re-import replaces in place instead of growing a second set
 * (CLAUDE.md section 9).
 */

/**
 * Array member keys.
 *
 * `startSeconds` is already unique within a document — two chapters or two
 * chunks cannot begin at the same second — so it makes a stable, readable key
 * without hashing. A negative second never reaches here, but the `n` prefix
 * keeps the key a valid identifier if one ever did.
 */
function keyAt(prefix, startSeconds) {
  const seconds = Math.trunc(startSeconds)
  return `${prefix}${seconds < 0 ? `n${Math.abs(seconds)}` : seconds}`
}

/**
 * Builds one document from a cache entry, applying any authored chapter
 * override.
 *
 * Authored chapters win over the provider's. Section 9 allows either, and an
 * author who has bothered to write a table of contents knows the material
 * better than a video's own markers do.
 */
export function buildVideoDocument(entry, override) {
  const authored = Array.isArray(override) ? override : undefined

  // An authored chapter with no label is an editing slip in chapters.json, and
  // the provider's own are already label-guarded by `normaliseChapters`. Dropped
  // rather than coerced: a chapter labelled "undefined" is worse than no chapter,
  // because search matches chapter labels first.
  const chapters = (authored ?? entry.chapters ?? [])
    .filter((chapter) => typeof chapter?.label === 'string' && chapter.label.trim() !== '')
    .map((chapter) => ({
      _type: 'videoChapter',
      _key: keyAt('ch', chapter.startSeconds),
      startSeconds: Math.trunc(chapter.startSeconds),
      label: chapter.label.trim(),
    }))
    .sort((a, b) => a.startSeconds - b.startSeconds)

  const chunks = (entry.chunks ?? [])
    .map((chunk) => ({
      _type: 'videoChunk',
      _key: keyAt('c', chunk.startSeconds),
      startSeconds: Math.trunc(chunk.startSeconds),
      text: chunk.text,
    }))
    .sort((a, b) => a.startSeconds - b.startSeconds)

  let chapterSource = 'none'
  if (authored && authored.length > 0) chapterSource = 'authored'
  else if (chapters.length > 0) chapterSource = 'provider'

  // Every spelling of this video's URL that a lesson actually stores, `url`
  // first. A lesson is joined to its video on the URL it holds and nothing
  // else (CLAUDE.md section 8), so one video reached by two spellings needs
  // both here or the second lesson matches nothing. An entry cached before
  // this field existed has only the one.
  const urls = [...new Set([entry.url, ...(entry.urls ?? [])])]

  const document = {
    _id: entry.docId,
    _type: 'video',
    videoId: entry.videoId,
    url: entry.url,
    urls,
    provider: entry.provider,
    captionSource: entry.captionSource ?? 'none',
    chapterSource,
    chapters,
    chunks,
    ingestedAt: entry.fetchedAt ?? new Date().toISOString(),
  }

  if (entry.title) document.title = entry.title
  if (Number.isFinite(entry.durationSeconds)) {
    document.durationSeconds = Math.trunc(entry.durationSeconds)
  }

  return document
}

/**
 * Builds every document, separating out the empty ones.
 *
 * A video with neither chapters nor chunks carries no information the search
 * agent could use; writing it would only add a document every query has to
 * filter past. It is reported instead.
 */
export function buildDocuments(entries, overrides = {}) {
  const documents = []
  const empty = []

  for (const entry of entries) {
    const document = buildVideoDocument(entry, overrides[entry.docId])
    if (document.chapters.length === 0 && document.chunks.length === 0) {
      empty.push(document)
      continue
    }
    documents.push(document)
  }

  documents.sort((a, b) => a._id.localeCompare(b._id))
  return {documents, empty}
}
