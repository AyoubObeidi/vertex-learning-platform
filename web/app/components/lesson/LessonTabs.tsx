"use client";

import { useId, useState, type ReactNode } from "react";
import posthog from "posthog-js";

type TabId = "content" | "notes";

const TABS: { id: TabId; label: string }[] = [
  { id: "content", label: "Lesson Content" },
  { id: "notes", label: "Notes" },
];

/**
 * The two panels under the video.
 *
 * `Lesson Content` is rendered on the server and handed in as children, so the
 * lesson's Portable Text never ships to the browser as data. `Notes` is a
 * learner's own scratch pad and is presentational only — CLAUDE.md section 7
 * lists it among the surfaces with no backend, so it says so rather than
 * pretending to save.
 */
export function LessonTabs({
  children,
  lessonSlug,
}: {
  children: ReactNode;
  lessonSlug: string;
}) {
  const [active, setActive] = useState<TabId>("content");
  const baseId = useId();

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Lesson" className="flex gap-8 border-b border-line">
        {TABS.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                setActive(tab.id);
                posthog.capture("lesson_tab_changed", {
                  tab: tab.id,
                  lesson_slug: lessonSlug,
                });
              }}
              className={`-mb-px border-b-2 pb-3 text-[15px] transition-colors ${
                selected
                  ? "border-accent font-medium text-accent"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-content`}
        aria-labelledby={`${baseId}-tab-content`}
        hidden={active !== "content"}
        className="pt-7"
      >
        {children}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-notes`}
        aria-labelledby={`${baseId}-tab-notes`}
        hidden={active !== "notes"}
        className="pt-7"
      >
        <label
          htmlFor={`${baseId}-notes-field`}
          className="block font-display text-[19px] font-semibold text-neutral-900"
        >
          Your notes
        </label>
        <textarea
          id={`${baseId}-notes-field`}
          rows={10}
          placeholder="Jot down what you want to come back to…"
          className="mt-4 w-full resize-y rounded-[10px] border border-line bg-surface p-4 text-[15px] leading-[27px] text-neutral-700 placeholder:text-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <p className="mt-3 text-[13px] text-neutral-500">
          Notes are not saved yet — they clear when you leave this page.
        </p>
      </div>
    </div>
  );
}
