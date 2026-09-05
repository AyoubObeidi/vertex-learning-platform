/**
 * Turns a lesson's stored `videoUrl` into what the page needs to play it: a
 * provider embed URL and, where the provider offers one, a thumbnail.
 *
 * Playback stays on the site (CLAUDE.md section 7). Every provider is shown
 * through its own player in an iframe — there is no custom player here, and a
 * result linking to a moment starts the embed at that second using the
 * provider's own start parameter.
 *
 * The providers match the host allowlist on `lesson.videoUrl` in the Studio
 * schema. Transcript ingestion for Vimeo and Bunny does not exist yet; this
 * module only covers playback, so an author pasting one of those links gets a
 * working frame rather than a dead one.
 */

export type VideoProvider = "youtube" | "vimeo" | "bunny";

export type ParsedVideo = {
  provider: VideoProvider;
  /** Provider-native id. YouTube video id, Vimeo id, or Bunny `<library>/<guid>`. */
  id: string;
  /** The original URL, for the "watch it at the source" fallback. */
  sourceUrl: string;
};

/**
 * Coerces a start position into a whole number of seconds inside the video.
 *
 * `?t=` is user input on its way into an embed URL, so it is never passed
 * through as a string: anything non-finite, negative, or past the end of the
 * lesson collapses to 0.
 */
export function toStartSeconds(
  value: string | number | null | undefined,
  durationSeconds?: number | null,
): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  const seconds = Math.floor(parsed);
  if (typeof durationSeconds === "number" && durationSeconds > 0) {
    return Math.min(seconds, Math.floor(durationSeconds));
  }
  return seconds;
}

function youTubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id || null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const watchId = url.searchParams.get("v");
    if (watchId) return watchId;
    // /embed/<id>, /v/<id>, /shorts/<id>
    const match = /^\/(?:embed|v|shorts)\/([^/]+)/.exec(url.pathname);
    if (match) return match[1];
  }

  return null;
}

function vimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  // vimeo.com/123456789 and player.vimeo.com/video/123456789
  const match = /^\/(?:video\/)?(\d+)/.exec(url.pathname);
  return match ? match[1] : null;
}

function bunnyId(url: URL): string | null {
  const host = url.hostname;
  if (!host.endsWith("mediadelivery.net") && !host.endsWith("b-cdn.net")) return null;
  // iframe.mediadelivery.net/embed/<libraryId>/<videoGuid>
  const match = /^\/(?:embed|play)\/([^/]+)\/([^/?#]+)/.exec(url.pathname);
  return match ? `${match[1]}/${match[2]}` : null;
}

/** `null` for anything we cannot play, so the caller can show a real fallback. */
export function parseVideoUrl(videoUrl: string | null | undefined): ParsedVideo | null {
  if (!videoUrl) return null;

  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    return null;
  }

  const youtube = youTubeId(url);
  if (youtube) return { provider: "youtube", id: youtube, sourceUrl: videoUrl };

  const vimeo = vimeoId(url);
  if (vimeo) return { provider: "vimeo", id: vimeo, sourceUrl: videoUrl };

  const bunny = bunnyId(url);
  if (bunny) return { provider: "bunny", id: bunny, sourceUrl: videoUrl };

  return null;
}

/**
 * The URL for the iframe. `autoplay` is on because this is only ever mounted
 * after the learner asked for the video — either by pressing play or by
 * arriving on a link that names a start second.
 */
export function embedUrl(video: ParsedVideo, startSeconds = 0): string {
  const start = Math.max(0, Math.floor(startSeconds));

  switch (video.provider) {
    case "youtube": {
      // youtube-nocookie serves the same player without setting a tracking
      // cookie until playback actually begins.
      const params = new URLSearchParams({
        autoplay: "1",
        rel: "0",
        modestbranding: "1",
        playsinline: "1",
      });
      if (start > 0) params.set("start", String(start));
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?${params}`;
    }
    case "vimeo": {
      const params = new URLSearchParams({autoplay: "1", dnt: "1"});
      // Vimeo takes the start position as a fragment, not a query parameter.
      const fragment = start > 0 ? `#t=${start}s` : "";
      return `https://player.vimeo.com/video/${encodeURIComponent(video.id)}?${params}${fragment}`;
    }
    case "bunny": {
      const params = new URLSearchParams({autoplay: "true", preload: "true"});
      if (start > 0) params.set("t", String(start));
      return `https://iframe.mediadelivery.net/embed/${video.id}?${params}`;
    }
  }
}

/**
 * A still for the poster frame. Only YouTube publishes one at a predictable
 * URL; the others fall back to the lesson poster or a monogram tile.
 *
 * `hqdefault` rather than `maxresdefault`: maxres 404s for any source below
 * 720p and `next/image` has no fallback for a dead remote URL. hqdefault always
 * exists — it is 4:3, so the 16:9 frame crops the letterbox bars away.
 */
export function thumbnailUrl(video: ParsedVideo): string | null {
  if (video.provider !== "youtube") return null;
  return `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/hqdefault.jpg`;
}
