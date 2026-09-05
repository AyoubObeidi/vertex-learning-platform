import type { LESSON_BY_SLUG_QUERY_RESULT, BlockContent } from "@/sanity.types";

/**
 * Everything the lesson page shows about *where* a lesson sits is derived here,
 * never stored: the "Lesson 5.1" label, "Module 5 of 12", and the previous and
 * next lessons. CLAUDE.md section 8 keeps those numbers out of the content model
 * so reordering a module in the Studio cannot leave a stale label behind.
 */

export type Lesson = NonNullable<LESSON_BY_SLUG_QUERY_RESULT>;
export type LessonCourse = NonNullable<Lesson["course"]>;
export type CourseModule = LessonCourse["modules"][number];
export type ModuleLesson = CourseModule["lessons"][number];

export type LessonPosition = OutlineIndex & {
  module: CourseModule;
  previous: ModuleLesson | null;
  next: ModuleLesson | null;
};

/**
 * The least a course outline has to look like for a lesson to be located in it.
 *
 * Deliberately minimal: the lesson page reads a rich outline (durations, slugs,
 * free-preview flags) while search reads an id-only one, and both must derive
 * "Lesson 5.1" the same way. Widening the parameter instead of copying the walk
 * is what keeps a second, drifting copy of that derivation from existing.
 */
type OutlineModule = {
  title: string;
  lessons: ReadonlyArray<{ _id: string }> | null;
};

export type OutlineIndex = {
  /** 1-based module number, as shown in "Module 5 of 12". */
  moduleNumber: number;
  /** 1-based lesson number inside its module, as shown in "Lesson 5.1". */
  lessonNumber: number;
  /** `"5.1"`. */
  label: string;
  moduleCount: number;
  moduleTitle: string;
  /** Position in the course flattened in module order — the neighbour cursor. */
  flatIndex: number;
};

/**
 * Where a lesson sits in a course outline, by array position (CLAUDE.md
 * section 8 keeps these numbers out of the content model, so reordering a module
 * in the Studio cannot leave a stale label behind).
 *
 * Returns `null` when the lesson is not in the outline at all.
 */
export function locateLessonInOutline(
  lessonId: string,
  modules: ReadonlyArray<OutlineModule> | null | undefined,
): OutlineIndex | null {
  const outline = modules ?? [];

  // Flattened in module order, so a neighbour lookup is a single index step.
  const flatIndex = outline
    .flatMap((courseModule) => courseModule.lessons ?? [])
    .findIndex((lesson) => lesson._id === lessonId);
  if (flatIndex === -1) return null;

  for (const [moduleIndex, courseModule] of outline.entries()) {
    const lessons = courseModule.lessons ?? [];
    const lessonIndex = lessons.findIndex((lesson) => lesson._id === lessonId);
    if (lessonIndex === -1) continue;

    return {
      moduleNumber: moduleIndex + 1,
      lessonNumber: lessonIndex + 1,
      label: `${moduleIndex + 1}.${lessonIndex + 1}`,
      moduleCount: outline.length,
      moduleTitle: courseModule.title,
      flatIndex,
    };
  }

  return null;
}

/**
 * The lesson page's view: the outline position plus the neighbours it links to.
 * Previous and next cross module boundaries — walking to the end of module 1
 * continues into module 2 — because that is how a learner moves through a
 * course.
 *
 * Returns `null` when the lesson is not in the outline at all, which the page
 * treats as a 404: a lesson with no place in a course has no breadcrumb, no
 * sidebar, and no neighbours.
 */
export function getLessonPosition(
  lessonId: string,
  course: LessonCourse,
): LessonPosition | null {
  const modules = course.modules ?? [];
  const index = locateLessonInOutline(lessonId, modules);
  if (!index) return null;

  const flattened = modules.flatMap((courseModule) => courseModule.lessons ?? []);

  return {
    ...index,
    module: modules[index.moduleNumber - 1],
    previous: flattened[index.flatIndex - 1] ?? null,
    next: flattened[index.flatIndex + 1] ?? null,
  };
}

/** The plain-text projection of a Portable Text block. */
function blockToPlainText(block: BlockContent[number]): string {
  if (block._type !== "block") return "";
  return (block.children ?? [])
    .map((child) => ("text" in child && typeof child.text === "string" ? child.text : ""))
    .join("")
    .trim();
}

/**
 * The one-line description under the lesson title.
 *
 * A lesson has no `summary` field, and the design shows this line as a
 * condensed restatement of the Overview's opening sentence — so it is derived
 * from the first paragraph of `notes` rather than invented or left blank.
 * Headings and list items are skipped; only a `normal` block qualifies.
 *
 * Returns `null` when there is nothing real to show, so the caller drops the
 * line instead of rendering a placeholder.
 */
export function deriveLessonDescription(
  notes: BlockContent | null,
  maxLength = 180,
): string | null {
  const paragraph = (notes ?? [])
    .filter((block) => block._type === "block" && block.style === "normal" && !block.listItem)
    .map(blockToPlainText)
    .find((text) => text.length > 0);

  if (!paragraph) return null;

  // Prefer the first full sentence; it is what the design's line reads like.
  const sentenceEnd = /[.!?](\s|$)/.exec(paragraph);
  const sentence =
    sentenceEnd && sentenceEnd.index + 1 <= maxLength
      ? paragraph.slice(0, sentenceEnd.index + 1)
      : paragraph;

  if (sentence.length <= maxLength) return sentence;

  // Otherwise cut on a word boundary rather than mid-word.
  const clipped = sentence.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).replace(/[,;:]$/, "")}…`;
}
