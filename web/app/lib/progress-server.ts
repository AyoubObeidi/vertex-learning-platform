import "server-only";

import { auth } from "@clerk/nextjs/server";

import { sanityFetch } from "@/sanity/lib/fetch";
import {
  MY_LEARNING_QUERY,
  PROGRESS_BY_ID_QUERY,
  PROGRESS_FOR_USER_QUERY,
} from "@/sanity/lib/queries";
import {
  EMPTY_PROGRESS,
  lessonHref,
  percentComplete,
  progressDocumentId,
  resumeTarget,
  type ProgressRecord,
} from "./progress";

/**
 * Reading learner progress on the server (CLAUDE.md sections 5 and 12).
 *
 * Every read here is `fresh` — uncached. Progress is per-learner, so a stored
 * response is not just stale, it is one learner's state waiting to be served to
 * another. That does mean the pages calling these render dynamically; that is
 * the correct trade for per-user state.
 *
 * A signed-out visitor is not an error. They get the zero record and every
 * surface renders exactly the state it renders today.
 */

/** One learner's progress in one course. Zero record when signed out. */
export async function getCourseProgress(courseId: string): Promise<ProgressRecord> {
  const { userId } = await auth();
  if (!userId) return EMPTY_PROGRESS;

  const record = await sanityFetch({
    query: PROGRESS_BY_ID_QUERY,
    params: { id: progressDocumentId(userId, courseId) },
    fresh: true,
  });

  if (!record) return {...EMPTY_PROGRESS, signedIn: true};

  return {
    completedLessonIds: record.completedLessonIds ?? [],
    lastLessonId: record.lastLessonId ?? null,
    lastPositionSeconds: record.lastPositionSeconds ?? 0,
    signedIn: true,
  };
}

/**
 * Completed lesson ids for every course the learner has started, by course id.
 * One query for the whole catalog rather than one per card.
 */
export async function getCatalogProgress(): Promise<Map<string, string[]>> {
  const { userId } = await auth();
  if (!userId) return new Map();

  const records = await sanityFetch({
    query: PROGRESS_FOR_USER_QUERY,
    params: { userId },
    fresh: true,
  });

  return new Map(
    records.map((record) => [record.courseId, record.completedLessonIds ?? []] as const),
  );
}

/** One started course, as My Learning shows it. */
export type StartedCourse = {
  course: NonNullable<MyLearningRow["course"]>;
  completedLessonIds: string[];
  /** 0-100, derived the same way every other surface derives it. */
  percent: number;
  /** Where "Continue" goes: the lesson they stopped in, at the second they stopped. */
  resumeHref: string | null;
  /** The lesson that resume link points at, for naming it in the UI. */
  resumeLessonSlug: string | null;
};

type MyLearningRow = Awaited<ReturnType<typeof fetchMyLearning>>[number];

function fetchMyLearning(userId: string) {
  return sanityFetch({query: MY_LEARNING_QUERY, params: {userId}, fresh: true});
}

/**
 * Every course this learner has started, most recently worked on first.
 *
 * Read-only: My Learning is one of the presentational surfaces in CLAUDE.md
 * section 7, allowed to read existing progress for display and to record
 * nothing. A record whose course has since been deleted is dropped rather than
 * rendered as an empty card.
 */
export async function getMyLearning(): Promise<StartedCourse[] | null> {
  const { userId } = await auth();
  // `null` rather than an empty array: "signed out" and "started nothing" are
  // different pages, and the caller has to be able to tell them apart.
  if (!userId) return null;

  const rows = await fetchMyLearning(userId);

  return rows.flatMap((row) => {
    const course = row.course;
    if (!course) return [];

    const completedLessonIds = row.completedLessonIds ?? [];
    const resume = resumeTarget(
      {
        completedLessonIds,
        lastLessonId: row.lastLessonId,
        lastPositionSeconds: row.lastPositionSeconds ?? 0,
        signedIn: true,
      },
      course.lessons ?? [],
    );

    return [
      {
        course,
        completedLessonIds,
        percent: percentComplete(completedLessonIds, course.lessonIds ?? []),
        resumeHref: resume ? lessonHref(resume.slug, resume.startSeconds) : null,
        resumeLessonSlug: resume?.slug ?? null,
      },
    ];
  });
}
