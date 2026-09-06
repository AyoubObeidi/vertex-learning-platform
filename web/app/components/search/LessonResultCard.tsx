"use client";

import Link from "next/link";
import { Check, ChevronRight, ExternalLink } from "lucide-react";

import { Badge } from "../ui/Badge";
import { CourseTile } from "./CourseTile";
import type { SearchLessonResult } from "../../lib/search";

/** The reference shows three bullets; more would overflow the tile. */
const MAX_KEY_POINTS = 3;

/**
 * A lesson matched on its own topic, rather than at a moment in its video.
 *
 * The left tile shows the lesson's authored `keyPoints` — the "in this lesson
 * you will" list — which is what makes this card answer "is this the lesson I
 * want?" without opening it.
 *
 * `completed` draws the check the reference puts on that tile. Learner progress
 * has no backend yet (CLAUDE.md section 7 keeps every write behind a server
 * route), so it is always `false` today and the check does not render — the
 * same posture as `CourseProgressBar`. Wiring it is a matter of passing a real
 * value once the progress route exists.
 */
export function LessonResultCard({
  result,
  completed = false,
  onSelect,
}: {
  result: SearchLessonResult;
  completed?: boolean;
  onSelect: (result: SearchLessonResult) => void;
}) {
  const keyPoints = result.keyPoints.slice(0, MAX_KEY_POINTS);

  return (
    <Link
      href={result.href}
      onClick={() => onSelect(result)}
      className="group flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-[18px] transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-row sm:gap-5"
    >
      {/* Key points tile */}
      <div className="relative flex w-full shrink-0 gap-3 rounded-xl bg-canvas p-4 sm:w-[272px]">
        <CourseTile src={result.courseImageUrl} courseTitle={result.courseTitle} size={22} />
        {keyPoints.length > 0 ? (
          <ul className="min-w-0 flex-1 space-y-2 text-[13px] leading-[18px] text-neutral-700">
            {keyPoints.map((point) => (
              <li key={point} className="flex gap-2">
                <span aria-hidden className="text-neutral-500">
                  •
                </span>
                <span className="min-w-0 flex-1 truncate">{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="min-w-0 flex-1 text-[13px] leading-[18px] text-neutral-500">
            {result.courseTitle}
          </p>
        )}
        {completed && (
          <span
            aria-label="Completed"
            className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-700 text-white"
          >
            <Check size={15} strokeWidth={2.5} />
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <CourseTile src={result.courseImageUrl} courseTitle={result.courseTitle} />
            <span className="truncate text-[14px] text-neutral-700">
              {result.courseTitle}
            </span>
          </div>
          <Badge variant="lessonResult">Lesson</Badge>
        </div>

        <h3 className="mt-3 text-[19px] font-semibold leading-snug text-neutral-900">
          {result.lessonTitle}
        </h3>

        {result.description && (
          <p className="mt-1.5 line-clamp-2 text-[14px] leading-[22px] text-neutral-700">
            {result.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[13px] text-neutral-500">
          <span>Module {result.moduleNumber}</span>
          <span className="ml-auto flex items-center gap-2 font-medium text-accent">
            View lesson
            <ExternalLink size={15} strokeWidth={2} />
            <ChevronRight size={16} strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
  );
}
