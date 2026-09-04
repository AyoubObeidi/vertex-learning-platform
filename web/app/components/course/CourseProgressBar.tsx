"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import posthog from "posthog-js";

/**
 * The sticky footer bar from the design. Presentational for now: learner
 * progress is not tracked yet (CLAUDE.md section 7 keeps that behind a server
 * route), so `percent` arrives as 0 and the bar invites the learner to start.
 * Wiring real progress is a matter of passing a real `percent` and `href`.
 */
export function CourseProgressBar({
  percent,
  href,
}: {
  percent: number;
  href: string | null;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const started = clamped > 0;

  return (
    <div className="sticky bottom-0 z-10 mt-14 pb-6">
      <div className="flex flex-col gap-5 rounded-[14px] border border-line bg-surface px-7 py-6 shadow-lg sm:flex-row sm:items-center sm:gap-8 sm:py-5">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-neutral-500">Your Progress</p>
          <div className="mt-2 flex items-center gap-4">
            <p className="whitespace-nowrap text-[15px] font-medium text-neutral-900">
              {started ? `${clamped}% complete` : "Not started"}
            </p>
            <div
              role="progressbar"
              aria-valuenow={clamped}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course progress"
              className="h-2 max-w-[320px] flex-1 overflow-hidden rounded-full bg-neutral-200"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${clamped}%` }}
              />
            </div>
          </div>
        </div>

        {href && (
          <Link
            href={href}
            className="inline-flex h-[54px] shrink-0 items-center justify-center gap-3 rounded-[10px] bg-accent px-7 text-[15px] font-medium text-white transition-colors hover:brightness-95"
            onClick={() =>
              posthog.capture("course_progress_cta_clicked", {
                action: started ? "continue_learning" : "start_learning",
                progress_percent: clamped,
              })
            }
          >
            {started ? "Continue Learning" : "Start Learning"}
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
        )}
      </div>
    </div>
  );
}
