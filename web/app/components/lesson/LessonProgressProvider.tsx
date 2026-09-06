"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import posthog from "posthog-js";

import {
  percentComplete,
  POSITION_SAVE_INTERVAL_MS,
  PROGRESS_MILESTONES,
  type ProgressRecord,
} from "../../lib/progress";

/**
 * The lesson page's live view of learner progress (CLAUDE.md sections 5 and 7).
 *
 * Server-rendered progress seeds this; from then on the player, the complete
 * toggle and the outline all read and write here, so marking a lesson complete
 * moves the sidebar bar without a refetch or a reload.
 *
 * Nothing here talks to Sanity. Every write is a POST to `/api/progress`, which
 * holds the write token and is the only thing that can change the dataset. The
 * browser also does not decide what "complete" means: it reports a position and
 * the route applies the threshold, so the rule lives in exactly one place.
 *
 * Completion is entirely automatic — there is no control a learner can press —
 * so the two signals below are the whole of what moves the bar. `reportEnded`
 * exists alongside `reportPosition` because a lesson whose stored duration is
 * longer than the real video would never reach the threshold on position alone.
 */

type ProgressContextValue = {
  completedLessonIds: string[];
  percent: number;
  /** Whether *this* lesson is complete. */
  completed: boolean;
  /** Progress is per-learner; signed out, nothing is recorded. */
  enabled: boolean;
  /** Called by the player as playback advances. Throttled internally. */
  reportPosition: (seconds: number) => void;
  /** Called when the player says the video finished. Completes immediately. */
  reportEnded: () => void;
};

const LessonProgressContext = createContext<ProgressContextValue | null>(null);

export function useLessonProgress(): ProgressContextValue {
  const value = useContext(LessonProgressContext);
  if (!value) {
    throw new Error("useLessonProgress must be used inside LessonProgressProvider");
  }
  return value;
}

type ProviderProps = {
  children: ReactNode;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  lessonDurationSeconds: number;
  /** Every lesson in the course, in module order — the percentage denominator. */
  courseLessonIds: string[];
  initial: ProgressRecord;
  signedIn: boolean;
};

type ProgressResponse = {
  completedLessonIds?: string[];
  percent?: number;
  completed?: boolean;
};

export function LessonProgressProvider({
  children,
  courseId,
  courseTitle,
  lessonId,
  lessonSlug,
  lessonTitle,
  lessonDurationSeconds,
  courseLessonIds,
  initial,
  signedIn,
}: ProviderProps) {
  const [completedLessonIds, setCompletedLessonIds] = useState(initial.completedLessonIds);

  const completed = completedLessonIds.includes(lessonId);
  const percent = percentComplete(completedLessonIds, courseLessonIds);

  // Ref rather than state: the player reports several times a second and none of
  // those reports should re-render the page.
  const latestPosition = useRef(0);
  const lastSavedAt = useRef(0);
  const reachedMilestones = useRef(new Set<number>());
  // Read inside callbacks that must not be re-created on every completion
  // change. Synced in an effect rather than during render — a ref written while
  // rendering is not a render output React knows about.
  const completedRef = useRef(completed);
  useEffect(() => {
    completedRef.current = completed;
  }, [completed]);

  const post = useCallback(
    async (
      body: Record<string, unknown>,
      options?: { keepalive?: boolean },
    ): Promise<ProgressResponse | null> => {
      try {
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, lessonId, ...body }),
          keepalive: options?.keepalive,
        });
        if (!response.ok) return null;
        return (await response.json()) as ProgressResponse;
      } catch {
        // A failed save is not worth interrupting playback for. The next tick,
        // or the final flush, tries again.
        return null;
      }
    },
    [courseId, lessonId],
  );

  const applyResponse = useCallback((result: ProgressResponse | null) => {
    if (result?.completedLessonIds) setCompletedLessonIds(result.completedLessonIds);
  }, []);

  const savePosition = useCallback(
    async (
      seconds: number,
      options?: { keepalive?: boolean; ended?: boolean },
    ) => {
      lastSavedAt.current = Date.now();
      const wasCompleted = completedRef.current;
      const result = await post(
        { action: "position", positionSeconds: seconds, ended: options?.ended ?? false },
        options,
      );
      applyResponse(result);

      // The route owns the completion threshold, so the client learns a lesson
      // auto-completed by being told, not by deciding.
      if (result?.completed && !wasCompleted) {
        posthog.capture("lesson_completed", {
          source: "auto",
          lesson_slug: lessonSlug,
          lesson_title: lessonTitle,
          course_title: courseTitle,
        });
      }
    },
    [applyResponse, courseTitle, lessonSlug, lessonTitle, post],
  );

  const reportPosition = useCallback(
    (seconds: number) => {
      if (!signedIn || !Number.isFinite(seconds) || seconds < 0) return;
      latestPosition.current = Math.floor(seconds);

      if (lessonDurationSeconds > 0) {
        const watched = seconds / lessonDurationSeconds;
        for (const milestone of PROGRESS_MILESTONES) {
          if (watched >= milestone && !reachedMilestones.current.has(milestone)) {
            reachedMilestones.current.add(milestone);
            posthog.capture("lesson_video_progress", {
              percent_watched: Math.round(milestone * 100),
              lesson_slug: lessonSlug,
              lesson_title: lessonTitle,
              course_title: courseTitle,
            });
          }
        }
      }

      if (Date.now() - lastSavedAt.current < POSITION_SAVE_INTERVAL_MS) return;
      void savePosition(latestPosition.current);
    },
    [courseTitle, lessonDurationSeconds, lessonSlug, lessonTitle, savePosition, signedIn],
  );

  // Closing the tab or backgrounding it must not lose the last fifteen seconds.
  // `keepalive` lets the request outlive the page.
  useEffect(() => {
    if (!signedIn) return;

    const flush = () => {
      if (latestPosition.current <= 0) return;
      if (Date.now() - lastSavedAt.current < 1000) return;
      void savePosition(latestPosition.current, { keepalive: true });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [savePosition, signedIn]);

  /**
   * The video finished. Saved immediately rather than on the throttle — this is
   * the moment the lesson completes, and a learner who closes the tab on the end
   * card should not lose it.
   */
  const reportEnded = useCallback(() => {
    if (!signedIn) return;
    void savePosition(latestPosition.current, { ended: true });
  }, [savePosition, signedIn]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      completedLessonIds,
      percent,
      completed,
      enabled: signedIn,
      reportPosition,
      reportEnded,
    }),
    [completed, completedLessonIds, percent, reportEnded, reportPosition, signedIn],
  );

  return (
    <LessonProgressContext.Provider value={value}>{children}</LessonProgressContext.Provider>
  );
}
