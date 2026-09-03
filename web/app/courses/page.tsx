import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";

import { TopNav } from "../components/ui/Navigation";
import { BarBand } from "../components/home/BarBand";
import { CourseGrid } from "../components/home/CourseGrid";
import { pluralize } from "../lib/format";
import { sanityFetch } from "@/sanity/lib/fetch";
import { COURSES_CATALOG_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "All Courses — Vertex",
  description: "Every course in the Vertex catalog.",
};

export default async function CoursesPage() {
  const courses = await sanityFetch({
    query: COURSES_CATALOG_QUERY,
    tags: ["courses"],
  });

  // Derived from the courses already fetched rather than a second query.
  const categoryCount = new Set(
    courses.map((course) => course.category?.slug).filter(Boolean),
  ).size;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-[904px] px-5 pb-9 pt-8 sm:px-6">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-500">
              <li>
                <Link href="/" className="transition-colors hover:text-accent">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="flex items-center">
                <ChevronRight size={14} strokeWidth={1.75} />
              </li>
              <li aria-current="page" className="text-neutral-900">
                All Courses
              </li>
            </ol>
          </nav>

          <h1 className="mt-7 font-display text-[38px] font-semibold leading-[1.08] tracking-[-0.01em] text-neutral-900 sm:text-[44px]">
            All Courses
          </h1>

          <p className="mt-5 max-w-[560px] text-[17px] leading-[31px] text-neutral-700">
            Every course in the catalog, from first principles to production.
          </p>

          <p className="mt-6 text-[13px] text-neutral-500">
            {pluralize(courses.length, "course")}
            {categoryCount > 0 && ` • ${pluralize(categoryCount, "category", "categories")}`}
          </p>

          <CourseGrid courses={courses} />

          <div className="mt-14 flex items-center gap-5">
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
            <span className="flex items-center gap-4">
              <Star
                size={21}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-accent"
              />
              <span className="text-base text-neutral-700">
                New courses and lessons added every week.
              </span>
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </div>
        </section>

        <BarBand />
      </main>
    </div>
  );
}
