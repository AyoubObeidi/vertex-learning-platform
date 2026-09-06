import { z } from "zod";

import type {
  LESSONS_BY_IDS_QUERY_RESULT,
  VIDEO_MOMENTS_QUERY_RESULT,
} from "@/sanity.types";
import { deriveLessonDescription, locateLessonInOutline } from "./lesson";
import { parseVideoUrl, thumbnailUrl } from "./video";

/**
 * The shapes search speaks in, and the one place a model-produced answer is
 * turned into results.
 *
 * The grounding rule from CLAUDE.md section 11 is enforced structurally rather
 * than merely asked for in a prompt: the model returns lesson ids, one line of
 * prose each, and at most a single number — and *nothing else*. Every other
 * field on a result — title, course, "Lesson 5.1", duration, thumbnail — is
 * read back out of the dataset here. An invented lesson has no id that
 * resolves, so it is dropped before it can reach the response.
 *
 * The number is a video moment's `startSeconds`, and it is not trusted either:
 * it has to appear in a chapter or a chunk of that lesson's video document
 * before it can become a timestamp on a card. A learner is never sent to a
 * second where nothing is taught.
 */

export type SearchedLesson = LESSONS_BY_IDS_QUERY_RESULT[number];

/** What both kinds of result carry: the lesson, and where it sits. */
type SearchResultBase = {
  /** 1-based relevance rank. The default sort is this order. */
  rank: number;
  lessonId: string;
  lessonTitle: string;
  lessonSlug: string;
  /** Where the result's action goes. */
  href: string;
  courseTitle: string;
  courseSlug: string;
  courseImageUrl: string | null;
  moduleTitle: string;
  /** 1-based module number, as shown in "Module 5". */
  moduleNumber: number;
  /** `"5.1"` — derived from array order, never stored. */
  label: string;
  keyPoints: string[];
  description: string | null;
  durationSeconds: number;
  freePreview: boolean;
  thumbnailUrl: string | null;
};

/** A lesson matched on its own topic (CLAUDE.md section 11). */
export type SearchLessonResult = SearchResultBase & {
  kind: "lesson";
};

/**
 * A lesson's video matched at a specific moment (CLAUDE.md section 11).
 *
 * It is always tied to the lesson that uses that video — the video document
 * itself is an internal lookup and never a result. `momentLabel` is the
 * chapter's own title when a chapter matched, and `null` when the second came
 * from the transcript, which has no clean label to show.
 */
export type SearchVideoResult = SearchResultBase & {
  kind: "video";
  /** Verified against the video document before it got here. */
  startSeconds: number;
  momentLabel: string | null;
};

export type SearchResult = SearchLessonResult | SearchVideoResult;

export type SearchResponse = {
  query: string;
  /** A sentence or two of markdown summarising the result set. */
  reply: string;
  resultCount: number;
  /** Distinct courses across the results — the "across 8 courses" line. */
  courseCount: number;
  results: SearchResult[];
};

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The request body. The query is user input on its way to a model, so it is
 * length-capped here rather than anywhere downstream.
 */
export const SearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(200),
});

export const MAX_MODEL_RESULTS = 50;
const MAX_REPLY_LENGTH = 600;
const MAX_DESCRIPTION_LENGTH = 200;

/**
 * The model's structured output. Note what is *absent*: no title, no course, no
 * duration, no count, no URL. There is nothing here for the model to get wrong
 * about the catalog — only which lessons matched, in what order, why, and
 * optionally at which second.
 *
 * `startSeconds` is the one number the model supplies, and it is the one thing
 * it could still get wrong, so `buildSearchResults` verifies it rather than
 * believing it.
 *
 * This strict form is only used for the route's repair pass, where it is handed
 * to the provider as a JSON schema. The normal path parses the model's own text
 * with `parseSearchModelOutput` below — see the route for why.
 */
export const SearchModelOutputSchema = z.object({
  reply: z.string().max(MAX_REPLY_LENGTH),
  results: z
    .array(
      z.object({
        lessonId: z.string().min(1),
        description: z.string().max(MAX_DESCRIPTION_LENGTH),
        /**
         * The second the answer is taught at, or `null` when the whole lesson
         * is the answer.
         *
         * Nullable rather than optional because strict structured outputs
         * require every property to be in `required` — an optional key is
         * rejected outright, so "absent" has to be spelled `null`.
         */
        startSeconds: z.number().int().nullable(),
      }),
    )
    .max(MAX_MODEL_RESULTS),
});

export type SearchModelOutput = z.infer<typeof SearchModelOutputSchema>;

/* -------------------------------------------------------------------------- */
/* Reading the model's answer                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The same contract as `SearchModelOutputSchema`, but forgiving about the ways
 * a model writes JSON when the API is not constraining it: a missing
 * `startSeconds`, an over-long description, a reply that never came.
 *
 * Forgiving is the right posture here *because* nothing downstream trusts this
 * data. A malformed entry costs a result; a whole failed parse costs the search.
 * Bad entries are dropped one at a time rather than taking the answer with them,
 * and every field that reaches a card is still read back out of the dataset.
 */
const LenientResultSchema = z.object({
  lessonId: z.string().min(1),
  description: z
    .string()
    .transform((value) => value.slice(0, MAX_DESCRIPTION_LENGTH)),
  startSeconds: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? null),
});

const LenientOutputSchema = z.object({
  reply: z
    .string()
    .nullish()
    .transform((value) => (value ?? "").slice(0, MAX_REPLY_LENGTH)),
  results: z
    .array(z.unknown())
    .nullish()
    .transform((entries) =>
      (entries ?? [])
        .map((entry) => LenientResultSchema.safeParse(entry))
        .flatMap((parsed) => (parsed.success ? [parsed.data] : []))
        .slice(0, MAX_MODEL_RESULTS),
    ),
});

/**
 * Pulls the JSON object out of a model's message.
 *
 * Without a schema forced at the API level, models fence their JSON, or write a
 * sentence before it. Both are answered by taking the outermost braces of the
 * fenced block if there is one, and of the whole message otherwise.
 */
function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  return candidate.slice(start, end + 1);
}

/**
 * The model's answer, or `null` if there is not one in there.
 *
 * Never throws: the route's fallback for `null` is a repair pass, and a thrown
 * parse error would skip straight past it to a failed search.
 */
export function parseSearchModelOutput(text: string): SearchModelOutput | null {
  const json = extractJsonObject(text);
  if (!json) return null;

  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return null;
  }

  const parsed = LenientOutputSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/* -------------------------------------------------------------------------- */
/* Assembly                                                                   */
/* -------------------------------------------------------------------------- */

/** The provider still frame, falling back to the authored poster. */
function resultThumbnail(lesson: SearchedLesson): string | null {
  if (lesson.poster?.asset?.url) return lesson.poster.asset.url;
  const video = parseVideoUrl(lesson.videoUrl);
  return video ? thumbnailUrl(video) : null;
}

/**
 * A moment the dataset agrees exists.
 *
 * `label` is the chapter's own title, or `null` when only the transcript put
 * anything at that second.
 */
type VerifiedMoment = { startSeconds: number; label: string | null };

/**
 * Indexes the video documents by URL, then by second.
 *
 * The chapter wins when a second is both a chapter marker and a chunk boundary.
 * CLAUDE.md section 7 makes that a data rule rather than a prompt one — chapter
 * labels are authored and clean, transcript text is the noisier backstop — so
 * it is decided here, where the data is, and not left to the model.
 */
function indexMoments(
  moments: VIDEO_MOMENTS_QUERY_RESULT,
): Map<string, Map<number, VerifiedMoment>> {
  const byUrl = new Map<string, Map<number, VerifiedMoment>>();

  for (const video of moments) {
    const bySecond = new Map<number, VerifiedMoment>();

    for (const chunk of video.chunks ?? []) {
      bySecond.set(chunk.startSeconds, { startSeconds: chunk.startSeconds, label: null });
    }
    // Second, so a chapter overwrites the chunk at the same second.
    for (const chapter of video.chapters ?? []) {
      bySecond.set(chapter.startSeconds, {
        startSeconds: chapter.startSeconds,
        label: chapter.label,
      });
    }

    byUrl.set(video.url, bySecond);
  }

  return byUrl;
}

/**
 * The parameters for `VIDEO_MOMENTS_QUERY`: which videos to look in, and which
 * seconds to keep.
 *
 * Narrowed to the picks that actually named a second, so a query with no video
 * moments in it costs no second read at all — and the chapter and chunk arrays
 * come back filtered to a handful of entries rather than whole transcripts
 * (CLAUDE.md section 12).
 */
export function momentLookupParams(
  picks: SearchModelOutput["results"],
  lessons: LESSONS_BY_IDS_QUERY_RESULT,
): { urls: string[]; seconds: number[] } {
  const videoUrlById = new Map(lessons.map((lesson) => [lesson._id, lesson.videoUrl]));
  const urls = new Set<string>();
  const seconds = new Set<number>();

  for (const pick of picks) {
    if (pick.startSeconds === null) continue;
    const videoUrl = videoUrlById.get(pick.lessonId);
    if (!videoUrl) continue;
    urls.add(videoUrl);
    seconds.add(pick.startSeconds);
  }

  return { urls: [...urls], seconds: [...seconds] };
}

/**
 * Joins the model's picks to the documents they name.
 *
 * Model order *is* the relevance ranking, so the picks are walked in sequence
 * rather than the fetched lessons. Two kinds of hit are dropped:
 *
 * - an id with no lesson behind it, which is the hallucination guard;
 * - a lesson whose course did not resolve, because without a course there is no
 *   label and no breadcrumb — the same rule the lesson page applies when it
 *   404s a lesson missing from every outline.
 *
 * A pick that named a second the video document does not have is *not* dropped.
 * It degrades to a lesson result: the lesson is real, only the timestamp was
 * not, and sending a learner to a lesson is right where sending them to a
 * fabricated second is wrong.
 */
export function buildSearchResults(
  picks: SearchModelOutput["results"],
  lessons: LESSONS_BY_IDS_QUERY_RESULT,
  moments: VIDEO_MOMENTS_QUERY_RESULT = [],
): SearchResult[] {
  const byId = new Map(lessons.map((lesson) => [lesson._id, lesson]));
  const momentsByUrl = indexMoments(moments);
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const pick of picks) {
    const lesson = byId.get(pick.lessonId);
    if (!lesson?.course) continue;

    const position = locateLessonInOutline(lesson._id, lesson.course.modules);
    if (!position) continue;

    const moment =
      pick.startSeconds === null
        ? undefined
        : momentsByUrl.get(lesson.videoUrl)?.get(pick.startSeconds);

    // A lesson and a moment inside it are two different results, so the key
    // carries the second. The same moment twice is not.
    const key = `${pick.lessonId}@${moment?.startSeconds ?? "lesson"}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const described = pick.description.trim();

    const base = {
      rank: results.length + 1,
      lessonId: lesson._id,
      lessonTitle: lesson.title,
      lessonSlug: lesson.slug,
      courseTitle: lesson.course.title,
      courseSlug: lesson.course.slug,
      courseImageUrl: lesson.course.coverImage?.asset?.url ?? null,
      moduleTitle: position.moduleTitle,
      moduleNumber: position.moduleNumber,
      label: position.label,
      keyPoints: lesson.keyPoints ?? [],
      description: described || deriveLessonDescription(lesson.notes),
      durationSeconds: lesson.durationSeconds,
      freePreview: lesson.freePreview ?? false,
      thumbnailUrl: resultThumbnail(lesson),
    };

    results.push(
      moment
        ? {
            ...base,
            kind: "video",
            href: `/lessons/${lesson.slug}?t=${moment.startSeconds}`,
            startSeconds: moment.startSeconds,
            momentLabel: moment.label,
          }
        : { ...base, kind: "lesson", href: `/lessons/${lesson.slug}` },
    );
  }

  return results;
}

/** Distinct courses across a result set — the "across 8 courses" line. */
export function countCourses(results: SearchResult[]): number {
  return new Set(results.map((result) => result.courseSlug)).size;
}
