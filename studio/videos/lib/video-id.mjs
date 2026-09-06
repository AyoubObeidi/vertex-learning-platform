/**
 * Video URL -> provider, provider-native id, and the Sanity document id.
 *
 * This is the Studio-side counterpart of `web/app/lib/video.ts`. The two
 * workspaces are standalone (CLAUDE.md section 5) and cannot import from each
 * other, so the URL forms are restated here. They must agree: the web module
 * turns a lesson's `videoUrl` into an embed, this one turns the same URL into
 * the document that holds that video's chapters and transcript. Change the
 * forms in one, change them in the other.
 */

/** Characters Sanity accepts in a document id. Everything else is replaced. */
const UNSAFE_ID_CHARS = /[^A-Za-z0-9._-]/g

/**
 * Provider-native id shapes, enforced rather than assumed.
 *
 * A parsed id is not just a lookup key: it becomes part of a document id and,
 * for YouTube, part of the URL handed to yt-dlp — which runs through a shell on
 * Windows (see lib/ytdlp.mjs). Pinning each provider's real id shape here means
 * nothing that reaches either of those can carry a quote, a space, or a shell
 * metacharacter, whatever ends up in a lesson's `videoUrl`.
 */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const BUNNY_LIBRARY = /^[0-9]+$/
const BUNNY_GUID = /^[A-Za-z0-9-]+$/

function youTubeId(url) {
  const host = url.hostname.replace(/^www\./, '')
  let id = null

  if (host === 'youtu.be') {
    id = url.pathname.slice(1)
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const watchId = url.searchParams.get('v')
    if (watchId) {
      id = watchId
    } else {
      const match = /^\/(?:embed|v|shorts)\/([^/]+)/.exec(url.pathname)
      if (match) id = match[1]
    }
  }

  return id && YOUTUBE_ID.test(id) ? id : null
}

function vimeoId(url) {
  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null
  const match = /^\/(?:video\/)?(\d+)/.exec(url.pathname)
  return match ? match[1] : null
}

function bunnyId(url) {
  const host = url.hostname
  if (!host.endsWith('mediadelivery.net') && !host.endsWith('b-cdn.net')) return null
  // iframe.mediadelivery.net/embed/<libraryId>/<videoGuid>
  const match = /^\/(?:embed|play)\/([^/]+)\/([^/?#]+)/.exec(url.pathname)
  if (!match) return null
  const [, library, guid] = match
  if (!BUNNY_LIBRARY.test(library) || !BUNNY_GUID.test(guid)) return null
  return `${library}/${guid}`
}

/** `null` for anything we cannot place, so the caller can report it. */
export function parseVideoUrl(videoUrl) {
  if (!videoUrl) return null

  let url
  try {
    url = new URL(videoUrl)
  } catch {
    return null
  }

  const youtube = youTubeId(url)
  if (youtube) return {provider: 'youtube', id: youtube}

  const vimeo = vimeoId(url)
  if (vimeo) return {provider: 'vimeo', id: vimeo}

  const bunny = bunnyId(url)
  if (bunny) return {provider: 'bunny', id: bunny}

  return null
}

/**
 * `video.youtube-T-D1OfcDW1M`.
 *
 * Deterministic, so a re-import replaces the document in place rather than
 * creating a second one (CLAUDE.md section 9). Bunny ids carry a slash, which
 * a document id may not, so anything outside the safe set becomes a dash.
 */
export function docIdFor({provider, id}) {
  return `video.${provider}-${String(id).replace(UNSAFE_ID_CHARS, '-')}`
}

/** The canonical watch URL for a parsed video, for handing to the fetcher. */
export function canonicalUrl({provider, id}, originalUrl) {
  if (provider === 'youtube') return `https://www.youtube.com/watch?v=${id}`
  return originalUrl
}
