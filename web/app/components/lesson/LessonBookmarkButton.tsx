"use client";

import { Bookmark } from "lucide-react";
import posthog from "posthog-js";

/**
 * A label, not a saved state. Bookmarking has no backend yet — the course page's
 * button behaves the same way — so this captures the intent and nothing else.
 */
export function LessonBookmarkButton({
  lessonSlug,
  lessonTitle,
  courseSlug,
}: {
  lessonSlug: string;
  lessonTitle: string;
  courseSlug: string;
}) {
  return (
    <button
      type="button"
      aria-label="Bookmark this lesson"
      onClick={() =>
        posthog.capture("lesson_bookmarked", {
          lesson_slug: lessonSlug,
          lesson_title: lessonTitle,
          course_slug: courseSlug,
        })
      }
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface text-neutral-900 transition-colors hover:bg-canvas hover:text-accent"
    >
      <Bookmark size={18} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
