import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { TopNav } from "./components/ui/Navigation";
import { Hero } from "./components/home/Hero";
import { BarBand } from "./components/home/BarBand";
import { CourseGrid } from "./components/home/CourseGrid";
import { sanityFetch } from "@/sanity/lib/fetch";
import { POPULAR_COURSES_QUERY } from "@/sanity/lib/queries";

export default async function Home() {
  const courses = await sanityFetch({
    query: POPULAR_COURSES_QUERY,
    tags: ["courses"],
  });

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav />

      <main className="flex-1">
        <Hero />

        <section className="mx-auto w-full max-w-[904px] px-5 pb-9 pt-12 sm:px-6 sm:pt-[46px]">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-[26px] font-semibold text-neutral-900">
              All Courses
            </h2>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:brightness-95"
            >
              View all courses
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>

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
