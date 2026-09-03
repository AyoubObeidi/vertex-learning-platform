import type { COURSES_CATALOG_QUERY_RESULT } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import { CourseCard } from "../ui/Cards";
import { formatDuration, formatLevel, pluralize } from "../../lib/format";

/**
 * The one place a Sanity course becomes a card. The home page and the catalog
 * page both render through it so the two lists cannot drift apart.
 */
export type CourseCardData = COURSES_CATALOG_QUERY_RESULT[number];

export function CourseGrid({
  courses,
  emptyMessage = "No courses are published yet.",
}: {
  courses: CourseCardData[];
  emptyMessage?: string;
}) {
  if (courses.length === 0) {
    return <p className="mt-7 text-[15px] text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const cover = course.coverImage?.asset ? course.coverImage : null;
        return (
          <CourseCard
            key={course._id}
            href={course.slug ? `/courses/${course.slug}` : undefined}
            initial={course.title?.charAt(0)}
            cover={
              cover
                ? {
                    src: urlFor(cover).width(148).height(148).fit("crop").url(),
                    alt: cover.alt || course.title || "",
                    blurDataURL: cover.asset?.metadata?.lqip ?? undefined,
                  }
                : undefined
            }
            title={course.title ?? ""}
            description={course.summary ?? ""}
            level={formatLevel(course.level) ?? ""}
            duration={formatDuration(course.durationSeconds) ?? ""}
            modules={pluralize(course.moduleCount ?? 0, "module")}
          />
        );
      })}
    </div>
  );
}
