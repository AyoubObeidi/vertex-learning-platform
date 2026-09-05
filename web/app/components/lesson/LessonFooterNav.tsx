"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import posthog from "posthog-js";

import type { ModuleLesson } from "../../lib/lesson";
import { formatDuration } from "../../lib/format";

/**
 * The sticky prev/next bar. Neighbours cross module boundaries — the course's
 * lessons flattened in module order — because that is how a learner moves
 * through a course. At either end the corresponding side is simply absent
 * rather than a disabled button that goes nowhere.
 */
export function LessonFooterNav({
  previous,
  next,
  currentLessonSlug,
}: {
  previous: ModuleLesson | null;
  next: ModuleLesson | null;
  currentLessonSlug: string;
}) {
  if (!previous && !next) return null;

  const capture = (direction: "previous" | "next", target: ModuleLesson) =>
    posthog.capture("lesson_nav_clicked", {
      direction,
      from_lesson_slug: currentLessonSlug,
      to_lesson_slug: target.slug,
      to_lesson_title: target.title,
    });

  return (
    <div className="sticky bottom-0 z-20 border-t border-line bg-canvas">
      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-11">
        {previous ? (
          <div className="flex min-w-0 items-center gap-5">
            <Link
              href={`/lessons/${previous.slug}`}
              onClick={() => capture("previous", previous)}
              className="inline-flex h-12 shrink-0 items-center gap-2.5 rounded-[10px] border border-line bg-surface px-5 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-canvas"
            >
              <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
              Previous Lesson
            </Link>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[13px] text-neutral-700">{previous.title}</p>
              <p className="text-[12px] text-neutral-500">
                {formatDuration(previous.durationSeconds)}
              </p>
            </div>
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}

        {next ? (
          <div className="flex min-w-0 items-center justify-end gap-5">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-[13px] text-neutral-700">{next.title}</p>
              <p className="text-[12px] text-neutral-500">
                {formatDuration(next.durationSeconds)}
              </p>
            </div>
            <Link
              href={`/lessons/${next.slug}`}
              onClick={() => capture("next", next)}
              className="inline-flex h-12 shrink-0 items-center gap-2.5 rounded-[10px] bg-accent px-6 text-[14px] font-medium text-white transition-colors hover:brightness-95"
            >
              Next Lesson
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>
    </div>
  );
}
