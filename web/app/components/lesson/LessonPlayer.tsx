"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Play } from "lucide-react";
import posthog from "posthog-js";

import { embedUrl, parseVideoUrl, thumbnailUrl, toStartSeconds } from "../../lib/video";
import { isPlayerOrigin, readPlayerMessage, subscribeMessages } from "../../lib/player-messages";
import { useLessonProgress } from "./LessonProgressProvider";

/** Never fires: the value is constant per environment, only server and client differ. */
const subscribeNever = () => () => {};

type PlayerProps = {
  videoUrl: string;
  lessonTitle: string;
  lessonSlug: string;
  durationSeconds: number;
  /** The lesson's own poster, when an author set one. */
  posterUrl: string | null;
  posterAlt: string | null;
  posterLqip: string | null;
  /**
   * Where the learner left off, from their progress record. An explicit `?t=`
   * in the URL wins over it: a search result asked for a specific moment, and
   * that is a stronger signal than where they happened to stop last time.
   */
  resumeSeconds: number;
};

/**
 * The lesson video.
 *
 * Playback stays on the site through the provider's own embed (CLAUDE.md
 * section 7) — there is no custom player here. Before the learner asks for it,
 * the frame is a still with a play button, so a third-party player is not loaded
 * on a page view that never played anything. Pressing play, or arriving with a
 * `?t=` start second from a search result, mounts the provider iframe.
 */
function LessonPlayerInner({
  videoUrl,
  lessonTitle,
  lessonSlug,
  durationSeconds,
  posterUrl,
  posterAlt,
  posterLqip,
  resumeSeconds,
}: PlayerProps) {
  const searchParams = useSearchParams();
  const video = parseVideoUrl(videoUrl);
  const { reportPosition, reportEnded } = useLessonProgress();

  // `?t=` is user input on its way into an embed URL: coerced to a whole number
  // of seconds and clamped to the lesson, never passed through as a string.
  const deepLinkSeconds = toStartSeconds(searchParams.get("t"), durationSeconds);
  const [activated, setActivated] = useState(false);

  /*
    The embed URL carries `window.location.origin` — YouTube's JS API refuses to
    report anything without it — so the frame cannot be built during SSR. It is
    held back until after hydration, which also keeps the server and first client
    render identical. A `?t=` deep link shows the poster for a single frame
    before the player takes over.
  */
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);

  // A link into a video moment should not need a second click, so a valid `?t=`
  // counts as activation. Derived rather than pushed into state by an effect.
  const playing = mounted && (activated || deepLinkSeconds > 0);

  // The deep link wins; otherwise pick up where the learner stopped. The resume
  // second only applies once they press play, so a page view never autoplays.
  const startSeconds =
    deepLinkSeconds > 0 ? deepLinkSeconds : toStartSeconds(resumeSeconds, durationSeconds);

  // The frame the position tracker talks to. `null` until the video is playing.
  const frameRef = useRef<HTMLIFrameElement | null>(null);


  useEffect(() => {
    const iframe = frameRef.current;
    if (!playing || !video || !iframe) return;

    const provider = video.provider;

    const onMessage = (event: MessageEvent) => {
      // Cross-origin input: the frame must be the one we mounted, and the origin
      // must be the provider's own, before anything in the payload is read.
      if (event.source !== iframe.contentWindow) return;
      if (!isPlayerOrigin(provider, event.origin)) return;

      const update = readPlayerMessage(provider, event.data);
      if (!update) return;
      if (update.seconds !== null) reportPosition(update.seconds);
      // Reported after the position so the saved second is the latest one the
      // player gave before it finished.
      if (update.ended) reportEnded();
    };

    window.addEventListener("message", onMessage);

    // A player that has not finished loading drops the subscription silently,
    // so it is repeated for a few seconds rather than sent once and hoped for.
    const messages = subscribeMessages(provider);
    const send = () => {
      for (const message of messages) {
        iframe.contentWindow?.postMessage(message, "*");
      }
    };
    send();
    const retry = setInterval(send, 1000);
    const stopRetrying = setTimeout(() => clearInterval(retry), 8000);

    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(retry);
      clearTimeout(stopRetrying);
    };
  }, [playing, reportEnded, reportPosition, video]);

  useEffect(() => {
    if (!playing || !video) return;
    posthog.capture("lesson_video_played", {
      lesson_slug: lessonSlug,
      lesson_title: lessonTitle,
      provider: video.provider,
      start_seconds: startSeconds,
      autostarted: deepLinkSeconds > 0,
      resumed: deepLinkSeconds === 0 && startSeconds > 0,
    });
    // Fires once per activation, not on every re-render of a playing video.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const frame =
    "relative aspect-video w-full overflow-hidden rounded-[12px] bg-neutral-900 shadow-md";

  if (!video) {
    // An unrecognised host (the schema warns but does not block one) gets a real
    // fallback rather than a dead frame or a crash.
    return (
      <div className={`${frame} flex flex-col items-center justify-center gap-3 px-6 text-center`}>
        <p className="text-[14px] text-white/70">This video cannot be played here.</p>
        <a
          href={videoUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-white underline underline-offset-4"
        >
          Open it at the source
          <ExternalLink size={14} strokeWidth={1.75} />
        </a>
      </div>
    );
  }

  if (playing) {
    return (
      <div className={frame}>
        <iframe
          ref={frameRef}
          src={embedUrl(video, startSeconds, window.location.origin)}
          title={lessonTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  const still = posterUrl ?? thumbnailUrl(video);

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      aria-label={`Play ${lessonTitle}`}
      className={`${frame} group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      {still ? (
        <Image
          src={still}
          alt={posterAlt || ""}
          fill
          sizes="(max-width: 1024px) 100vw, 620px"
          placeholder={posterLqip ? "blur" : undefined}
          blurDataURL={posterLqip ?? undefined}
          // hqdefault is 4:3; cropping to the 16:9 frame drops the letterbox bars.
          className="object-cover"
          priority
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-display text-[120px] leading-none text-white/90"
        >
          {lessonTitle.charAt(0)}
        </span>
      )}

      <span aria-hidden="true" className="absolute inset-0 bg-ink/35" />

      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform group-hover:scale-105"
      >
        <Play size={26} strokeWidth={0} className="ml-1 fill-ink" />
      </span>
    </button>
  );
}

export function LessonPlayer(props: PlayerProps) {
  return (
    // `useSearchParams` needs a boundary for the page to keep prerendering:
    // reading the query string in the server component would opt the whole
    // route into dynamic rendering at request time.
    <Suspense
      fallback={
        <div className="aspect-video w-full rounded-[12px] bg-neutral-900 shadow-md" />
      }
    >
      <LessonPlayerInner {...props} />
    </Suspense>
  );
}
