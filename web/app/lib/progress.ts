/**
 * Learner progress, the parts that are pure derivation (CLAUDE.md sections 7
 * and 8). No client, no token, no Clerk — this module is imported by the server
 * route, by server components, and by client components alike, so it must stay
 * free of anything that only works on one side.
 *
 * A progress record is app state, not content: one document per learner per
 * course, keyed by the Clerk user id, written only by `/api/progress`.
 */

/** Fraction of a lesson's duration that counts as having watched it. */
export const COMPLETION_THRESHOLD = 0.9;

/** How often a playing video reports its position, in milliseconds. */
export const POSITION_SAVE_INTERVAL_MS = 15_000;

/** Watched-fraction marks reported to PostHog, once each per activation. */
export const PROGRESS_MILESTONES = [0.25, 0.5, 0.75] as const;

export type ProgressRecord = {
  completedLessonIds: string[];
  lastLessonId: string | null;
  lastPositionSeconds: number;
  /**
   * Whether there is a learner to record anything for. Signed out this is
   * `false` and every progress affordance is hidden — not disabled, absent.
   */
  signedIn: boolean;
};

export const EMPTY_PROGRESS: ProgressRecord = {
  completedLessonIds: [],
  lastLessonId: null,
  lastPositionSeconds: 0,
  signedIn: false,
};

/**
 * The deterministic document id for one learner's progress in one course.
 *
 * Deterministic so a write is `createIfNotExists` plus `patch` with no lookup
 * query first, and so two concurrent writes converge on one document instead of
 * racing to create two.
 *
 * Clerk ids (`user_2ab…`) and Sanity document ids happen to share a character
 * set, but this does not assume that: anything outside what Sanity accepts in an
 * id is replaced, per CLAUDE.md section 9.
 */
export function progressDocumentId(userId: string, courseId: string): string {
  return `progress.${sanitizeIdPart(userId)}.${sanitizeIdPart(courseId)}`;
}

function sanitizeIdPart(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "-");
}

/**
 * Completion as a percentage of the course.
 *
 * Derived, never stored: a stored percentage would drift the moment an author
 * adds a lesson. Completions are intersected with the course's current lesson
 * ids, so a lesson removed from the course stops counting toward its own total
 * rather than pushing the bar past 100.
 */
export function percentComplete(
  completedLessonIds: readonly string[],
  courseLessonIds: readonly string[],
): number {
  if (courseLessonIds.length === 0) return 0;
  const completed = new Set(completedLessonIds);
  const hits = courseLessonIds.filter((id) => completed.has(id)).length;
  return Math.round((hits / courseLessonIds.length) * 100);
}

/** Every lesson id in a course, flattened in module order. */
export function courseLessonIds(
  modules: ReadonlyArray<{ lessons: ReadonlyArray<{ _id: string }> | null }> | null | undefined,
): string[] {
  return (modules ?? []).flatMap((courseModule) =>
    (courseModule.lessons ?? []).map((lesson) => lesson._id),
  );
}

/**
 * Where "Continue Learning" should go, and from what second.
 *
 * The lesson the learner left off in wins, because that is what they were
 * actually doing. Once it is finished — or when there is no record at all — the
 * first lesson they have not completed is next, and a fully completed course
 * falls back to its first lesson so the CTA is never dead.
 */
export function resumeTarget(
  progress: ProgressRecord,
  lessons: ReadonlyArray<{ _id: string; slug: string | null }>,
): { slug: string; startSeconds: number } | null {
  const playable = lessons.filter(
    (lesson): lesson is { _id: string; slug: string } => Boolean(lesson.slug),
  );
  if (playable.length === 0) return null;

  const completed = new Set(progress.completedLessonIds);

  const last = playable.find((lesson) => lesson._id === progress.lastLessonId);
  if (last && !completed.has(last._id)) {
    return { slug: last.slug, startSeconds: Math.max(0, progress.lastPositionSeconds) };
  }

  const nextUnfinished = playable.find((lesson) => !completed.has(lesson._id));
  return { slug: (nextUnfinished ?? playable[0]).slug, startSeconds: 0 };
}

/** `/lessons/foo` or `/lessons/foo?t=125`. */
export function lessonHref(slug: string, startSeconds = 0): string {
  return startSeconds > 0 ? `/lessons/${slug}?t=${startSeconds}` : `/lessons/${slug}`;
}
