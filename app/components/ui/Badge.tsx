import { ReactNode } from "react";

type BadgeVariant = "video" | "lesson" | "popular" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  video: "bg-neutral-900 text-white",
  lesson: "bg-primary-100 text-primary-500",
  popular: "bg-primary-500 text-white",
  neutral: "bg-neutral-100 text-neutral-700",
};

/**
 * A small badge component for labeling and categorizing content.
 * Displays with different color schemes based on the variant.
 *
 * @param variant - Visual style of the badge (video, lesson, popular, neutral)
 * @param children - Content to display inside the badge
 */
export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
