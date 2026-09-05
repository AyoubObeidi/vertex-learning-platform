"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Play } from "lucide-react";
import posthog from "posthog-js";

import { embedUrl, parseVideoUrl, thumbnailUrl, toStartSeconds } from "../../lib/video";

type PlayerProps = {
  videoUrl: string;
  lessonTitle: string;
  lessonSlug: string;
  durationSeconds: number;
  /** The lesson's own poster, when an author set one. */
  posterUrl: string | null;
  posterAlt: string | null;
  posterLqip: string | null;
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
}: PlayerProps) {
  const searchParams = useSearchParams();
  const video = parseVideoUrl(videoUrl);

  // `?t=` is user input on its way into an embed URL: coerced to a whole number
  // of seconds and clamped to the lesson, never passed through as a string.
  const startSeconds = toStartSeconds(searchParams.get("t"), durationSeconds);
  const [activated, setActivated] = useState(false);

  // A link into a video moment should not need a second click, so a valid `?t=`
  // counts as activation. Derived rather than pushed into state by an effect.
  const playing = activated || startSeconds > 0;

  useEffect(() => {
    if (!playing || !video) return;
    posthog.capture("lesson_video_played", {
      lesson_slug: lessonSlug,
      lesson_title: lessonTitle,
      provider: video.provider,
      start_seconds: startSeconds,
      autostarted: startSeconds > 0,
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
          src={embedUrl(video, startSeconds)}
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

      <span aria-hidden="true" className="absolute inset-0 bg-neutral-900/35" />

      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform group-hover:scale-105"
      >
        <Play size={26} strokeWidth={0} className="ml-1 fill-neutral-900" />
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
