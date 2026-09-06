import { ReactNode } from "react";

type BadgeVariant =
  | "video"
  | "lesson"
  | "popular"
  | "neutral"
  /** The two search-result kinds. See the note below. */
  | "videoResult"
  | "lessonResult";

/**
 * `video`/`lesson` are the design-system swatches from
 * `.agents/design/vertex-designsystem.png`. `videoResult`/`lessonResult` are the
 * badges on the search results page, which are a different pair of colours in
 * `.agents/design/vertex-search.png` — hence two variants rather than a
 * restyle of the first two, which would put `/design-system` out of step with
 * its own reference.
 */
const variantClasses: Record<BadgeVariant, string> = {
  video: "bg-neutral-900 text-white",
  lesson: "bg-primary-100 text-primary-500",
  popular: "bg-primary-500 text-white",
  neutral: "bg-neutral-100 text-neutral-700",
  videoResult: "bg-primary-100 text-accent",
  lessonResult: "bg-lesson-100 text-lesson-500",
};

/** Search-result badges are a squarer, tighter chip than the pill variants. */
const shapeClasses: Partial<Record<BadgeVariant, string>> = {
  videoResult: "rounded-md px-2 py-[3px] tracking-[0.06em]",
  lessonResult: "rounded-md px-2 py-[3px] tracking-[0.06em]",
};

export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  const shape = shapeClasses[variant] ?? "rounded-full px-2.5 py-1 tracking-wide";
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold uppercase ${shape} ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
