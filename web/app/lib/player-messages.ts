/**
 * Reading playback position out of a provider's own embed.
 *
 * CLAUDE.md section 7 forbids a custom player, and loading three provider SDKs
 * to learn one number would be its own kind of overbuilding. All three embeds
 * already speak a postMessage protocol without any SDK, so this module is the
 * whole integration: what to say to each player to make it start reporting, and
 * how to read a position out of what it says back.
 *
 * A wall-clock timer was the alternative and is wrong: it keeps "watching" a
 * paused video, which would complete lessons nobody watched.
 *
 * Two things are read out of a player: where it is, and whether it finished.
 * "Finished" is not derived from the position, because a lesson whose stored
 * duration runs slightly longer than the real video would never reach the
 * completion threshold and could never complete at all. The player saying so is
 * the only reliable end-of-video signal.
 *
 * If a provider ever says nothing — a blocked frame, a changed protocol — a
 * lesson simply never auto-completes. There is no manual fallback, so this
 * module is the whole of what makes the progress bar move.
 */

import type { VideoProvider } from "./video";

/** The origin each provider's frame posts from, for verifying a message. */
const PLAYER_ORIGINS: Record<VideoProvider, string[]> = {
  youtube: ["https://www.youtube-nocookie.com", "https://www.youtube.com"],
  vimeo: ["https://player.vimeo.com"],
  bunny: ["https://iframe.mediadelivery.net"],
};

export function isPlayerOrigin(provider: VideoProvider, origin: string): boolean {
  return PLAYER_ORIGINS[provider].includes(origin);
}

/**
 * What to post into the frame to subscribe to time updates. YouTube answers a
 * `listening` handshake with a stream of `infoDelivery` messages; Vimeo and
 * Bunny (player.js) both take an explicit `addEventListener`.
 *
 * Sent repeatedly for a few seconds after mount because a player that has not
 * finished loading silently drops the message.
 */
export function subscribeMessages(provider: VideoProvider): string[] {
  switch (provider) {
    case "youtube":
      return [JSON.stringify({ event: "listening", id: 1, channel: "widget" })];
    case "vimeo":
      return [
        JSON.stringify({ method: "addEventListener", value: "timeupdate" }),
        JSON.stringify({ method: "addEventListener", value: "ended" }),
      ];
    case "bunny":
      return [
        JSON.stringify({ context: "player.js", method: "addEventListener", value: "timeupdate" }),
        JSON.stringify({ context: "player.js", method: "addEventListener", value: "ended" }),
      ];
  }
}

/** What a player message turned out to be saying. */
export type PlayerUpdate = {
  /** Playback position in seconds, when the message carried one. */
  seconds: number | null;
  /** The player reported the video finished. */
  ended: boolean;
};

/** YouTube's `playerState` for a video that has run to the end. */
const YOUTUBE_ENDED = 0;

/**
 * What a message from a player frame says, or `null` when it says nothing this
 * page cares about.
 *
 * Every provider is deliberately parsed defensively: this is cross-origin input
 * whose shape is the provider's to change, so anything unexpected is ignored
 * rather than trusted.
 */
export function readPlayerMessage(provider: VideoProvider, data: unknown): PlayerUpdate | null {
  const payload = parse(data);
  if (!payload) return null;

  switch (provider) {
    case "youtube": {
      // { event: "infoDelivery", info: { currentTime, playerState } }
      if (payload.event !== "infoDelivery") return null;
      const info = asRecord(payload.info);
      if (!info) return null;
      return {
        seconds: finite(info.currentTime),
        ended: info.playerState === YOUTUBE_ENDED,
      };
    }
    case "vimeo": {
      // { event: "timeupdate", data: { seconds } }
      if (payload.event === "ended") return {seconds: null, ended: true};
      if (payload.event !== "timeupdate") return null;
      return {seconds: finite(asRecord(payload.data)?.seconds), ended: false};
    }
    case "bunny": {
      // player.js uses the same envelope as Vimeo, with a `context` marker.
      if (payload.context !== "player.js") return null;
      if (payload.event === "ended") return {seconds: null, ended: true};
      if (payload.event !== "timeupdate") return null;
      const data = asRecord(payload.data);
      return {seconds: finite(data?.seconds ?? data?.currentTime), ended: false};
    }
  }
}

function parse(data: unknown): Record<string, unknown> | null {
  if (typeof data === "string") {
    try {
      return asRecord(JSON.parse(data));
    } catch {
      return null;
    }
  }
  return asRecord(data);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}
