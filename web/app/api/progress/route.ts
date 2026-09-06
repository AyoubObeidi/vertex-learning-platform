import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { sanityFetch } from "@/sanity/lib/fetch";
import { LESSON_IN_COURSE_QUERY } from "@/sanity/lib/queries";
import { getWriteClient } from "@/sanity/lib/write-client";
import {
  COMPLETION_THRESHOLD,
  percentComplete,
  progressDocumentId,
} from "../../lib/progress";

/**
 * Learner progress writes (CLAUDE.md sections 5, 7 and 12).
 *
 * The only route in the app that changes the dataset, and the only place the
 * write token is ever used. The browser holds no token and never writes Sanity
 * or its own progress — it POSTs here and renders what comes back.
 *
 * Three things in the request are untrusted and are treated that way:
 *
 *   1. The learner. Taken from Clerk on the server and never from the body —
 *      a body-supplied user id would let any signed-in learner write another
 *      learner's record.
 *   2. The lesson. Verified to actually belong to the named course before
 *      anything is recorded, or a client could POST arbitrary lesson ids to
 *      inflate its own percentage.
 *   3. The position. Clamped to the lesson's stored duration, the same way
 *      `toStartSeconds` clamps a `?t=` on its way into an embed URL.
 */

export const runtime = "nodejs";
// Per-learner state. Next must never serve one learner's record to another.
export const dynamic = "force-dynamic";

/** Sanity document ids: what the datastore actually accepts, nothing wider. */
const SanityId = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._-]+$/);

const ProgressRequestSchema = z.object({
  courseId: SanityId,
  lessonId: SanityId,
  // Position is the only thing a client may report. Completion is derived from
  // it here, never asserted by the browser, and nothing can un-complete a
  // lesson — so there is no other action to accept.
  action: z.literal("position"),
  positionSeconds: z.number().finite().nonnegative().optional(),
  /** The player said the video finished. Completes regardless of position. */
  ended: z.boolean().optional(),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = ProgressRequestSchema.safeParse(body);
  if (!parsed.success) {
    // No issue detail: the shape of a rejection is not worth telling a caller
    // that is already sending something it should not.
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { courseId, lessonId, positionSeconds, ended } = parsed.data;

  const course = await sanityFetch({
    query: LESSON_IN_COURSE_QUERY,
    params: { courseId, lessonId },
    fresh: true,
  });

  const lessonIds = course?.lessonIds ?? [];
  if (!course?.lesson || !lessonIds.includes(lessonId)) {
    return Response.json({ error: "Unknown lesson for this course" }, { status: 400 });
  }

  const duration = course.lesson.durationSeconds;
  const clampedPosition =
    typeof positionSeconds === "number"
      ? Math.min(Math.floor(positionSeconds), Math.max(0, Math.floor(duration)))
      : 0;

  /*
    Completion is entirely automatic and one-way. Two signals set it, and
    nothing clears it: rewinding a finished lesson does not un-finish it.

    The `ended` flag is not redundant with the threshold. A lesson whose stored
    `durationSeconds` runs longer than the real video would never reach 90% of
    the stored figure, so position alone could never complete it.
  */
  const isComplete =
    ended === true || (duration > 0 && clampedPosition >= duration * COMPLETION_THRESHOLD);

  const documentId = progressDocumentId(userId, courseId);
  const lessonRef = { _type: "reference" as const, _ref: lessonId, _key: lessonId };

  // Built before the patch so a misconfigured deployment answers with this
  // rather than an unhandled throw: the token is read lazily, and without it
  // every save fails silently as far as the learner can tell.
  let writeClient;
  try {
    writeClient = getWriteClient();
  } catch {
    console.error("SANITY_API_WRITE_TOKEN is not set — learner progress cannot be saved.");
    return Response.json({ error: "Progress is not configured" }, { status: 503 });
  }

  const patch = writeClient
    .patch(documentId)
    .set({ updatedAt: new Date().toISOString() })
    .setIfMissing({ completedLessons: [] });

  if (isComplete) {
    // Sanity applies `unset` before `insert` within one patch, so removing the
    // reference and appending it in the same breath is an idempotent "make sure
    // this is in the list" — completing twice cannot duplicate it.
    patch.unset([`completedLessons[_ref=="${lessonId}"]`]).append("completedLessons", [lessonRef]);
  }

  patch.set({
    lastLesson: { _type: "reference", _ref: lessonId },
    lastPositionSeconds: clampedPosition,
  });

  let updated;
  try {
    updated = await writeClient
      .transaction()
      .createIfNotExists({
        _id: documentId,
        _type: "progress",
        userId,
        course: { _type: "reference", _ref: courseId },
        completedLessons: [],
        lastPositionSeconds: 0,
      })
      .patch(patch)
      .commit({ returnDocuments: true, autoGenerateArrayKeys: true });
  } catch {
    return Response.json({ error: "Could not save progress" }, { status: 502 });
  }

  const record = updated.find((document) => document._id === documentId);
  const completedLessonIds = uniqueRefs(record?.completedLessons);

  return Response.json({
    completedLessonIds,
    percent: percentComplete(completedLessonIds, lessonIds),
    lastPositionSeconds: clampedPosition,
    completed: completedLessonIds.includes(lessonId),
  });
}

/**
 * `append` cannot duplicate a reference the patch itself added, but two writes
 * racing on the same lesson can each see an empty array. De-duplicating on read
 * is cheaper and safer than serialising the writes.
 */
function uniqueRefs(entries: unknown): string[] {
  if (!Array.isArray(entries)) return [];
  const refs = entries
    .map((entry) =>
      entry && typeof entry === "object" && typeof (entry as { _ref?: unknown })._ref === "string"
        ? (entry as { _ref: string })._ref
        : null,
    )
    .filter((ref): ref is string => ref !== null);
  return [...new Set(refs)];
}
