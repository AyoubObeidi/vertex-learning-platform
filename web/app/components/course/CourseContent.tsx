"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown, PlayCircle } from "lucide-react";
import posthog from "posthog-js";

import type { COURSE_BY_SLUG_QUERY_RESULT } from "@/sanity.types";
import { formatDuration, pluralize } from "../../lib/format";

type Course = NonNullable<COURSE_BY_SLUG_QUERY_RESULT>;
type CourseModule = Course["modules"][number];

/** How many modules the design shows before the "Show all" toggle. */
const COLLAPSED_MODULE_COUNT = 6;

function ModuleRow({
  module: courseModule,
  index,
  isFirst,
  isLast,
  expanded,
  onToggle,
  courseTitle,
}: {
  module: CourseModule;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
  courseTitle?: string;
}) {
  const panelId = useId();
  const duration = formatDuration(courseModule.durationSeconds);
  const lessons = courseModule.lessons ?? [];

  return (
    <div className="relative border-b border-line last:border-b-0">
      {/*
        The timeline running through the numbered markers. A row's marker sits
        38px from its top (20px padding + half of the 36px circle), so the first
        row's line starts there and the last row's line stops there.
      */}
      {!(isFirst && isLast) && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-[42px] w-px bg-line sm:left-[50px] ${
            isFirst ? "top-[38px] bottom-0" : isLast ? "top-0 h-[38px]" : "inset-y-0"
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
                module_index: index + 1,
                lesson_count: lessons.length,
                course_title: courseTitle,
              });
            }
            onToggle();
          }}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-center gap-5 px-6 py-5 text-left transition-colors hover:bg-canvas sm:px-8"
        >
          <span
            aria-hidden="true"
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-display text-[15px] text-neutral-700"
          >
            {index + 1}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block font-display text-[16px] font-semibold leading-snug text-neutral-900">
              {courseModule.title}
            </span>
            {courseModule.summary && (
              <span className="mt-1 block text-[13px] leading-[21px] text-neutral-500">
                {courseModule.summary}
              </span>
            )}
          </span>

          <span className="hidden whitespace-nowrap text-[13px] text-neutral-500 sm:block">
            {duration ?? pluralize(lessons.length, "lesson")}
          </span>

          <ChevronDown
            size={18}
            strokeWidth={1.75}
            aria-hidden="true"
            className={`shrink-0 text-neutral-500 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>

      {expanded && (
        <ul id={panelId} className="pb-3 pl-[68px] pr-6 sm:pl-[76px] sm:pr-8">
          {lessons.map((lesson, lessonIndex) => (
            <li key={lesson._id}>
              <Link
                href={`/lessons/${lesson.slug}`}
                className="flex items-center gap-3 rounded-md py-2.5 text-[14px] text-neutral-700 transition-colors hover:text-accent"
                onClick={() =>
                  posthog.capture("lesson_clicked", {
                    lesson_title: lesson.title,
                    lesson_slug: lesson.slug,
                    lesson_index: lessonIndex + 1,
                    module_title: courseModule.title,
                    module_index: index + 1,
                    is_free_preview: lesson.freePreview ?? false,
                    course_title: courseTitle,
                  })
                }
              >
                <PlayCircle
                  size={16}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="shrink-0 text-neutral-300"
                />
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-neutral-500">
                    {index + 1}.{lessonIndex + 1}
                  </span>{" "}
                  {lesson.title}
                </span>
                {lesson.freePreview && (
                  <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    Free
                  </span>
                )}
                <span className="shrink-0 whitespace-nowrap text-[13px] text-neutral-500">
                  {formatDuration(lesson.durationSeconds)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CourseContent({
  modules,
  totalDurationSeconds,
}: {
  modules: CourseModule[];
  totalDurationSeconds: number;
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (modules.length === 0) return null;

  const hasMore = modules.length > COLLAPSED_MODULE_COUNT;
  const visible = showAll ? modules : modules.slice(0, COLLAPSED_MODULE_COUNT);
  const duration = formatDuration(totalDurationSeconds);

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-[26px] font-semibold text-neutral-900">
          Course Content
        </h2>
        <p className="text-[13px] text-neutral-500">
          {pluralize(modules.length, "module")}
          {duration ? ` • ${duration}` : ""}
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[14px] border border-line bg-surface">
        {visible.map((courseModule, index) => (
          <ModuleRow
            key={courseModule._key}
            module={courseModule}
            index={index}
            isFirst={index === 0}
            isLast={index === visible.length - 1}
            expanded={expandedKey === courseModule._key}
            onToggle={() =>
              setExpandedKey((current) =>
                current === courseModule._key ? null : courseModule._key,
              )
            }
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => {
              const next = !showAll;
              posthog.capture("show_all_modules_clicked", {
                action: next ? "show_all" : "show_fewer",
                total_modules: modules.length,
              });
              setShowAll(next);
            }}
            className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-line bg-surface px-6 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            {showAll
              ? "Show fewer modules"
              : `Show all ${pluralize(modules.length, "module")}`}
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              className={`transition-transform ${showAll ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}
    </section>
  );
}
