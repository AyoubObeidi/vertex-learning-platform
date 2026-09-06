import Image from "next/image";

/**
 * The small square that identifies the course on a result card.
 *
 * The reference draws a brand mark per course (the Next.js N, the React atom).
 * The content model has no such field — `course.coverImage` is a photograph —
 * so the cover is used, cropped square, the same way `CourseCard` renders it at
 * a larger size. Adding a real `icon` field to `course` would replace this
 * without touching the card.
 */
export function CourseTile({
  src,
  courseTitle,
  size = 26,
}: {
  src: string | null;
  courseTitle: string;
  size?: number;
}) {
  if (!src) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-[7px] bg-neutral-900 font-display text-[13px] leading-none text-white"
      >
        {courseTitle.charAt(0)}
      </span>
    );
  }

  return (
    <span
      style={{ width: size, height: size }}
      className="relative shrink-0 overflow-hidden rounded-[7px] bg-neutral-900"
    >
      <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  );
}
