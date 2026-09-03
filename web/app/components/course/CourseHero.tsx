import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Bookmark, Clock, FileText, Users } from "lucide-react";

import type { COURSE_BY_SLUG_QUERY_RESULT } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import { formatCount, formatDuration, formatLevel, pluralize } from "../../lib/format";

type Course = NonNullable<COURSE_BY_SLUG_QUERY_RESULT>;

/**
 * The cover tile. The design shows a black square carrying the course's brand
 * mark; when a course has a cover image we render it in that frame, and fall
 * back to a monogram on the same black ground when it does not.
 */
function CoverTile({ course }: { course: Course }) {
  const source = course.coverImage?.asset ? course.coverImage : null;

  return (
    <div className="relative aspect-[280/330] w-full max-w-[280px] shrink-0 overflow-hidden rounded-[18px] bg-neutral-900 shadow-lg">
      {source ? (
        <Image
          src={urlFor(source).width(560).height(660).fit("crop").url()}
          alt={source.alt || course.title}
          fill
          sizes="280px"
          placeholder={source.asset?.metadata?.lqip ? "blur" : undefined}
          blurDataURL={source.asset?.metadata?.lqip ?? undefined}
          className="object-cover"
          priority
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center font-display text-[150px] leading-none text-white"
        >
          {course.title.charAt(0)}
        </span>
      )}
    </div>
  );
}

function MetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap text-[13px] text-neutral-500">
      {icon}
      {label}
    </span>
  );
}

export function CourseHero({
  course,
  firstLessonSlug,
}: {
  course: Course;
  firstLessonSlug: string | null;
}) {
  const level = formatLevel(course.level);
  const duration = formatDuration(course.durationSeconds);
  const students = formatCount(course.studentCount);

  return (
    <section className="mt-8 flex flex-col gap-9 lg:flex-row lg:gap-[52px]">
      <CoverTile course={course} />

      <div className="min-w-0 flex-1 lg:pt-1">
        {course.popular && (
          <span className="inline-flex items-center rounded-md bg-primary-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            Popular
          </span>
        )}

        <h1 className="mt-5 font-display text-[38px] font-semibold leading-[1.08] tracking-[-0.01em] text-neutral-900 sm:text-[42px] lg:text-[48px]">
          {course.title}
        </h1>

        <p className="mt-5 max-w-[560px] text-[17px] leading-[31px] text-neutral-700">
          {course.summary}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
          {level && (
            <MetaChip icon={<BarChart3 size={16} strokeWidth={1.75} />} label={level} />
          )}
          {duration && (
            <MetaChip icon={<Clock size={16} strokeWidth={1.75} />} label={duration} />
          )}
          <MetaChip
            icon={<FileText size={16} strokeWidth={1.75} />}
            label={pluralize(course.moduleCount, "module")}
          />
          {students && (
            <MetaChip
              icon={<Users size={16} strokeWidth={1.75} />}
              label={`${students} students`}
            />
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {firstLessonSlug && (
            <Link
              href={`/lessons/${firstLessonSlug}`}
              className="inline-flex h-[58px] items-center justify-center gap-3 rounded-[10px] bg-accent px-7 text-[16px] font-medium text-white transition-colors hover:brightness-95"
            >
              Start Learning
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
          )}
          <button
            type="button"
            className="inline-flex h-[58px] items-center justify-center gap-3 rounded-[10px] border border-line bg-surface px-7 text-[16px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <Bookmark size={18} strokeWidth={1.75} />
            Bookmark
          </button>
        </div>
      </div>
    </section>
  );
}
