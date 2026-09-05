"use client";

import { useState } from "react";
import { ChevronDown, ListTree } from "lucide-react";

import { LessonSidebar } from "./LessonSidebar";
import type { LessonCourse, LessonPosition } from "../../lib/lesson";

type OutlineProps = {
  course: LessonCourse;
  position: LessonPosition;
  currentLessonId: string;
  completedLessonIds: string[];
  percentComplete: number;
};

/**
 * The course outline, with the responsive behaviour CLAUDE.md section 3 asks
 * for: the desktop sidebar exactly as designed, and below `lg` the same panel
 * collapsed behind a disclosure above the lesson so it never eats the screen.
 */
export function LessonOutline(props: OutlineProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="lesson-outline"
        className="flex w-full items-center gap-3 border-b border-line bg-surface px-5 py-4 text-left text-[14px] font-medium text-neutral-900 lg:hidden"
      >
        <ListTree size={16} strokeWidth={1.75} aria-hidden="true" className="text-accent" />
        <span className="flex-1">
          Course content — Module {props.position.moduleNumber} of {props.position.moduleCount}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          aria-hidden="true"
          className={`text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id="lesson-outline"
        className={`${open ? "block" : "hidden"} border-b border-line lg:block lg:h-full lg:border-b-0`}
      >
        <LessonSidebar {...props} />
      </div>
    </>
  );
}
