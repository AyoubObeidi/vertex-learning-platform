import { z } from "zod";

import type { LESSONS_BY_IDS_QUERY_RESULT } from "@/sanity.types";
import { deriveLessonDescription, locateLessonInOutline } from "./lesson";
import { parseVideoUrl, thumbnailUrl } from "./video";

/**
 * The shapes search speaks in, and the one place a model-produced answer is
 * turned into results.
 *
 * The grounding rule from CLAUDE.md section 11 is enforced structurally rather
 * than merely asked for in a prompt: the model returns lesson ids and one line
 * of prose each, and *nothing else*. Every other field on a result — title,
 * course, "Lesson 5.1", duration, thumbnail — is read back out of the dataset
 * here. An invented lesson has no id that resolves, so it is dropped before it
 * can reach the response.
 */

export type SearchedLesson = LESSONS_BY_IDS_QUERY_RESULT[number];

/**
 * A lesson matched on its own topic (CLAUDE.md section 11).
 *
 * `kind` is discriminated from the outset so video-moment results — a lesson's
 * video matched at a specific second — can join this union when transcript and
 * chapter ingestion lands, without the consumer changing shape.
 */
export type SearchLessonResult = {
  kind: "lesson";
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
  /** `"5.1"` — derived from array order, never stored. */
  label: string;
  keyPoints: string[];
  description: string | null;
  durationSeconds: number;
  freePreview: boolean;
  thumbnailUrl: string | null;
};

export type SearchResult = SearchLessonResult;

export type SearchResponse = {
  query: string;
  /** A sentence or two of markdown summarising the result set. */
  reply: string;
  resultCount: number;
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

/**
 * The model's structured output. Note what is *absent*: no title, no course, no
 * duration, no count, no URL. There is nothing here for the model to get wrong
 * about the catalog — only which lessons matched, in what order, and why.
 */
export const SearchModelOutputSchema = z.object({
  reply: z.string().max(600),
  results: z
    .array(
      z.object({
        lessonId: z.string().min(1),
        description: z.string().max(200),
      }),
    )
    .max(MAX_MODEL_RESULTS),
});

export type SearchModelOutput = z.infer<typeof SearchModelOutputSchema>;

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
 * Joins the model's picks to the documents they name.
 *
 * Model order *is* the relevance ranking, so the picks are walked in sequence
 * rather than the fetched lessons. Two kinds of hit are dropped:
 *
 * - an id with no lesson behind it, which is the hallucination guard;
 * - a lesson whose course did not resolve, because without a course there is no
 *   label and no breadcrumb — the same rule the lesson page applies when it
 *   404s a lesson missing from every outline.
 */
export function buildSearchResults(
  picks: SearchModelOutput["results"],
  lessons: LESSONS_BY_IDS_QUERY_RESULT,
): SearchLessonResult[] {
  const byId = new Map(lessons.map((lesson) => [lesson._id, lesson]));
  const results: SearchLessonResult[] = [];
  const seen = new Set<string>();

  for (const pick of picks) {
    if (seen.has(pick.lessonId)) continue;
    const lesson = byId.get(pick.lessonId);
    if (!lesson?.course) continue;

    const position = locateLessonInOutline(lesson._id, lesson.course.modules);
    if (!position) continue;

    seen.add(pick.lessonId);

    const described = pick.description.trim();

    results.push({
      kind: "lesson",
      rank: results.length + 1,
      lessonId: lesson._id,
      lessonTitle: lesson.title,
      lessonSlug: lesson.slug,
      href: `/lessons/${lesson.slug}`,
      courseTitle: lesson.course.title,
      courseSlug: lesson.course.slug,
      courseImageUrl: lesson.course.coverImage?.asset?.url ?? null,
      moduleTitle: position.moduleTitle,
      label: position.label,
      keyPoints: lesson.keyPoints ?? [],
      description: described || deriveLessonDescription(lesson.notes),
      durationSeconds: lesson.durationSeconds,
      freePreview: lesson.freePreview ?? false,
      thumbnailUrl: resultThumbnail(lesson),
    });
  }

  return results;
}
