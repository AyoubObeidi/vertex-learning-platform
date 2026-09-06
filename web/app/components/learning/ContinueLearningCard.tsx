"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import posthog from "posthog-js";

import { ProgressBar } from "../ui/ProgressBar";

/**
 * The one card at the top of My Learning: the course the learner was most
 * recently working on, and the way straight back into it.
 *
 * The href already carries the lesson and the second they stopped at — that is
 * `resumeTarget`'s job, decided once on the server — so this component only
 * displays and records the click.
 *
 * No new visual language: the accent CTA is the one from `CourseProgressBar`
 * and the bar is the shared `ProgressBar`.
 */
export function ContinueLearningCard({
  title,
  summary,
  href,
  percent,
  cover,
}: {
  title: string;
  summary: string | null;
  href: string;
  percent: number;
  cover: { src: string; alt: string; blurDataURL?: string } | null;
}) {
  return (
    <section
      aria-labelledby="continue-learning-heading"
      className="mt-7 rounded-[14px] border border-line bg-surface p-6 sm:p-7"
    >
      <h2
        id="continue-learning-heading"
        className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent"
      >
        Continue learning
      </h2>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-7">
        {cover ? (
          <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[16px] bg-neutral-900">
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes="88px"
              placeholder={cover.blurDataURL ? "blur" : undefined}
              blurDataURL={cover.blurDataURL}
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[16px] bg-neutral-900 font-display text-3xl text-white">
            {title.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[21px] font-semibold leading-snug text-neutral-900">
            {title}
          </h3>
          {summary && (
            <p className="mt-2 line-clamp-2 text-[14px] leading-[24px] text-neutral-700">
              {summary}
            </p>
          )}
          <div className="mt-4 max-w-[420px]">
            <ProgressBar value={percent} />
          </div>
        </div>

        <Link
          href={href}
          onClick={() =>
            posthog.capture("my_learning_resumed", {
              course_title: title,
              progress_percent: percent,
            })
          }
          className="inline-flex h-[54px] shrink-0 items-center justify-center gap-3 rounded-[10px] bg-accent px-7 text-[15px] font-medium text-white transition-colors hover:brightness-95"
        >
          Continue Learning
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
