"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Captures the lesson view — one of the engagement moments CLAUDE.md section 7
 * asks PostHog to instrument. Renders nothing; it exists so the page itself can
 * stay a server component.
 */
export function LessonViewTracker(properties: {
  lesson_slug: string;
  lesson_title: string;
  lesson_label: string;
  lesson_duration_seconds: number;
  module_index: number;
  module_title: string;
  course_slug: string;
  course_title: string;
}) {
  useEffect(() => {
    posthog.capture("lesson_viewed", properties);
    // Keyed on the lesson so a client-side navigation between lessons captures
    // again, while a re-render of the same lesson does not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.lesson_slug]);

  return null;
}
