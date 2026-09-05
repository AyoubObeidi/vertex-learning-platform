"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Play } from "lucide-react";
import posthog from "posthog-js";

import type { LessonCourse, LessonPosition } from "../../lib/lesson";
import { formatDuration } from "../../lib/format";
import { urlFor } from "@/sanity/lib/image";

type SidebarProps = {
  course: LessonCourse;
  position: LessonPosition;
  currentLessonId: string;
  /**
   * Learner progress. Zero today: CLAUDE.md section 7 keeps progress in its own
   * record written through a server route, and none of that exists yet. Wiring
   * it later means passing real values here, nothing more.
   */
  completedLessonIds: string[];
  percentComplete: number;
};

/** The 60px course tile — cover image when there is one, monogram when not. */
function CourseTile({ course }: { course: LessonCourse }) {
  const source = course.coverImage?.asset ? course.coverImage : null;

  return (
    <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[10px] bg-neutral-900">
      {source ? (
        <Image
          src={urlFor(source).width(120).height(120).fit("crop").url()}
          alt=""
          fill
          sizes="60px"
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center font-display text-[30px] leading-none text-white"
        >
          {course.title.charAt(0)}
        </span>
      )}
    </div>
  );
}

function ModuleRow({
  courseModule,
  moduleNumber,
  isCurrent,
  isCompleted,
  isFirst,
  isLast,
  expanded,
  onToggle,
  currentLessonId,
  completedLessonIds,
  courseTitle,
}: {
  courseModule: LessonCourse["modules"][number];
  moduleNumber: number;
  isCurrent: boolean;
  isCompleted: boolean;
  isFirst: boolean;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
  currentLessonId: string;
  completedLessonIds: string[];
  courseTitle: string;
}) {
  const panelId = `module-panel-${courseModule._key}`;
  const lessons = courseModule.lessons ?? [];
  const duration = formatDuration(courseModule.durationSeconds);

  return (
    <li className={`relative border-b border-line last:border-b-0 ${expanded ? "bg-line/25" : ""}`}>
      {/*
        The timeline through the numbered markers, same construction as the
        course page: a marker sits 34px from the row's top, so the first row's
        line starts there and the last row's stops there.
      */}
      {!(isFirst && isLast) && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-[40px] w-px bg-line ${
            isFirst ? "top-[36px] bottom-0" : isLast ? "top-0 h-[36px]" : "inset-y-0"
          }`}
        />
      )}

      <h3>
        <button
          type="button"
          onClick={() => {
            if (!expanded) {
              posthog.capture("module_expanded", {
                module_title: courseModule.title,
                module_index: moduleNumber,
                lesson_count: lessons.length,
                course_title: courseTitle,
              });
            }
            onToggle();
          }}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-start gap-[18px] py-[18px] pl-6 pr-5 text-left transition-colors hover:bg-line/30"
        >
          <span
            aria-hidden="true"
            className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] ${
              isCurrent
                ? "bg-accent font-semibold text-white"
                : "border border-line bg-surface text-neutral-700"
            }`}
          >
            {moduleNumber}
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={`block text-[14px] leading-snug ${
                "font-semibold text-neutral-900"
              }`}
            >
              {courseModule.title}
            </span>
            {duration && (
              <span className="mt-1 block text-[13px] text-neutral-500">{duration}</span>
            )}
          </span>

          {isCompleted ? (
            <span
              aria-label="Completed"
              className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-accent text-accent"
            >
              <Check size={11} strokeWidth={2.5} aria-hidden="true" />
            </span>
          ) : (
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              className={`mt-1 shrink-0 text-neutral-500 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
      </h3>

      {expanded && (
        <ul id={panelId} className="relative pb-3 pl-6 pr-5">
          {lessons.map((lesson) => {
            const isCurrentLesson = lesson._id === currentLessonId;
            const isDone = completedLessonIds.includes(lesson._id);

            const body = (
              <>
                <span
                  aria-hidden="true"
                  className="mt-[5px] flex w-8 shrink-0 justify-center"
                >
                  <span
                    className={`h-[9px] w-[9px] rounded-full ${
                      isCurrentLesson
                        ? "bg-accent"
                        : isDone
                          ? "bg-accent/40"
                          : "border border-neutral-300 bg-surface"
                    }`}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[14px] leading-snug ${
                      isCurrentLesson
                        ? "font-semibold text-neutral-900"
                        : "text-neutral-700"
                    }`}
                  >
                    {lesson.title}
                  </span>
                  <span
                    className={`mt-1 block text-[13px] ${
                      isCurrentLesson ? "text-accent" : "text-neutral-500"
                    }`}
                  >
                    {isCurrentLesson ? "Now playing" : formatDuration(lesson.durationSeconds)}
                  </span>
                </span>
                {isCurrentLesson && (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent"
                  >
                    <Play size={10} strokeWidth={0} className="ml-px fill-white" />
                  </span>
                )}
              </>
            );

            return (
              <li key={lesson._id}>
                {isCurrentLesson ? (
                  <span
                    aria-current="page"
                    className="flex items-start gap-[18px] rounded-md py-2.5"
                  >
                    {body}
                  </span>
                ) : (
                  <Link
                    href={`/lessons/${lesson.slug}`}
                    className="flex items-start gap-[18px] rounded-md py-2.5 transition-colors hover:bg-line/50"
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

/**
 * The course outline beside the lesson. Every number in it — the module count,
 * each module's duration, "Module 5 of 12" — is derived from the outline, never
 * stored.
 */
export function LessonSidebar({
  course,
  position,
  currentLessonId,
  completedLessonIds,
  percentComplete,
}: SidebarProps) {
  const modules = course.modules ?? [];
  const [expandedKey, setExpandedKey] = useState<string | null>(position.module._key);
  const [listOpen, setListOpen] = useState(true);

  const clamped = Math.min(100, Math.max(0, Math.round(percentComplete)));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-9 py-6">
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex items-center gap-2.5 text-[14px] font-medium text-accent transition-colors hover:brightness-90"
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          Back to course
        </Link>

        <div className="mt-5 flex items-start gap-3.5">
          <CourseTile course={course} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-snug text-neutral-900">
              {course.title}
            </p>
            <p className="mt-1 text-[12px] text-neutral-500">
              {clamped > 0 ? `${clamped}% complete` : "Not started"}
            </p>
            <div
              role="progressbar"
              aria-valuenow={clamped}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course progress"
              className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-neutral-200"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${clamped}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <h2>
          <button
            type="button"
            onClick={() => setListOpen((open) => !open)}
            aria-expanded={listOpen}
            aria-controls="course-module-list"
            className="flex w-full items-center justify-between border-b border-line px-9 py-[18px] text-left transition-colors hover:bg-line/30"
          >
            <span className="text-[14px] font-medium text-neutral-900">
              Module {position.moduleNumber} of {position.moduleCount}
            </span>
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              className={`text-neutral-500 transition-transform ${listOpen ? "" : "-rotate-90"}`}
            />
          </button>
        </h2>

        {listOpen && (
          <ul id="course-module-list">
            {modules.map((courseModule, index) => (
              <ModuleRow
                key={courseModule._key}
                courseModule={courseModule}
                moduleNumber={index + 1}
                isCurrent={index + 1 === position.moduleNumber}
                isCompleted={
                  (courseModule.lessons ?? []).length > 0 &&
                  (courseModule.lessons ?? []).every((lesson) =>
                    completedLessonIds.includes(lesson._id),
                  )
                }
                isFirst={index === 0}
                isLast={index === modules.length - 1}
                expanded={expandedKey === courseModule._key}
                onToggle={() =>
                  setExpandedKey((current) =>
                    current === courseModule._key ? null : courseModule._key,
                  )
                }
                currentLessonId={currentLessonId}
                completedLessonIds={completedLessonIds}
                courseTitle={course.title}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
