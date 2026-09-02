import { ReactNode } from "react";
import { BarChart3, Clock, ExternalLink, FileText, PlayCircle } from "lucide-react";
import { Badge } from "./Badge";

/**
 * Internal wrapper component providing consistent styling for card layouts.
 *
 * @param children - Card content
 */
function CardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {children}
    </div>
  );
}

/**
 * Displays a course as a card with metadata including level, duration, and module count.
 * Shows either a custom icon or an initial letter on a dark background.
 *
 * @param initial - Single letter to display when no icon is provided
 * @param icon - Optional custom icon/logo for the course
 * @param title - Course title
 * @param description - Course description
 * @param level - Difficulty level (e.g., "Beginner", "Intermediate")
 * @param duration - Total course duration (e.g., "18h 24m")
 * @param modules - Number of modules (e.g., "12 modules")
 */
export function CourseCard({
  initial,
  icon,
  title,
  description,
  level,
  duration,
  modules,
}: {
  initial?: string;
  icon?: ReactNode;
  title: string;
  description: string;
  level: string;
  duration: string;
  modules: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-md border border-line bg-surface p-[26px] pt-8 transition-shadow hover:shadow-md">
      {icon ?? (
        <div className="flex h-[74px] w-[74px] items-center justify-center rounded-[16px] bg-neutral-900 font-display text-3xl text-white">
          {initial}
        </div>
      )}
      <h3 className="mt-6 font-display text-[19px] font-semibold leading-snug text-neutral-900">
        {title}
      </h3>
      <p className="mt-4 text-[14px] leading-[24px] text-neutral-700">{description}</p>
      <div className="mt-auto border-t border-line pt-6">
        <div className="-mx-1 flex flex-wrap items-center gap-x-1.5 gap-y-2 whitespace-nowrap text-[10px] text-neutral-500">
          <span className="flex items-center gap-1">
            <BarChart3 size={12} strokeWidth={1.75} /> {level}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} strokeWidth={1.75} /> {duration}
          </span>
          <span className="flex items-center gap-1">
            <FileText size={12} strokeWidth={1.75} /> {modules}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Displays a lesson or video result as a card with a badge, title, description, and call-to-action.
 * Used in search results and lesson listings.
 *
 * @param badgeVariant - Type of badge to display (video or lesson)
 * @param badgeLabel - Text for the badge
 * @param title - Lesson or video title
 * @param description - Brief description of the content
 * @param meta - Metadata string (e.g., "Lesson 5.1 · 12:45")
 * @param cta - Call-to-action text (e.g., "Watch from 12:45")
 */
export function LessonCard({
  badgeVariant,
  badgeLabel,
  title,
  description,
  meta,
  cta,
}: {
  badgeVariant: "video" | "lesson";
  badgeLabel: string;
  title: string;
  description: string;
  meta: string;
  cta: string;
}) {
  return (
    <CardShell>
      <Badge variant={badgeVariant}>{badgeLabel}</Badge>
      <div>
        <h3 className="font-display text-lg font-semibold text-neutral-900">{title}</h3>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-500">{meta}</span>
        <span className="flex items-center gap-1 font-medium text-primary-500">
          <PlayCircle size={16} /> {cta}
        </span>
      </div>
    </CardShell>
  );
}

/**
 * Displays a downloadable resource as a card with an icon, title, and file metadata.
 *
 * @param title - Resource title
 * @param description - Brief description of the resource
 * @param meta - File metadata (e.g., "PDF · 1.2 MB")
 */
export function ResourceCard({
  title,
  description,
  meta,
}: {
  title: string;
  description: string;
  meta: string;
}) {
  return (
    <CardShell>
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-100 text-primary-500">
        <FileText size={20} />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold text-neutral-900">{title}</h3>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-500">{meta}</span>
        <ExternalLink size={16} className="text-neutral-500" />
      </div>
    </CardShell>
  );
}
