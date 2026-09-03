import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { TopNav } from "../../components/ui/Navigation";
import { CourseHero } from "../../components/course/CourseHero";
import { LearningOutcomes } from "../../components/course/LearningOutcomes";
import { CourseContent } from "../../components/course/CourseContent";
import { CourseProgressBar } from "../../components/course/CourseProgressBar";
import { sanityFetch } from "@/sanity/lib/fetch";
import { COURSE_BY_SLUG_QUERY, COURSE_SLUGS_QUERY } from "@/sanity/lib/queries";

export async function generateStaticParams() {
  // `fresh` skips both the Sanity CDN and Next's Data Cache: the path list must
  // reflect what is published right now, not a stored response.
  const slugs = await sanityFetch({ query: COURSE_SLUGS_QUERY, fresh: true });
  return slugs
    .filter((entry): entry is { slug: string } => Boolean(entry.slug))
    .map(({ slug }) => ({ slug }));
}

function getCourse(slug: string) {
  return sanityFetch({
    query: COURSE_BY_SLUG_QUERY,
    params: { slug },
    tags: [`course:${slug}`],
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) return { title: "Course not found — Vertex" };

  return {
    title: `${course.title} — Vertex`,
    description: course.summary,
  };
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) notFound();

  // The CTA target is the course's first lesson. Lesson order is array order,
  // so the first lesson of the first module that has one wins.
  const firstLessonSlug =
    course.modules.flatMap((courseModule) => courseModule.lessons ?? [])[0]?.slug ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav />

      <main className="mx-auto w-full max-w-[904px] flex-1 px-5 pb-4 pt-8 sm:px-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-500">
            <li>
              <Link href="/courses" className="transition-colors hover:text-accent">
                All Courses
              </Link>
            </li>
            <li aria-hidden="true" className="flex items-center">
              <ChevronRight size={14} strokeWidth={1.75} />
            </li>
            <li aria-current="page" className="text-neutral-900">
              {course.title}
            </li>
          </ol>
        </nav>

        <CourseHero course={course} firstLessonSlug={firstLessonSlug} />

        <LearningOutcomes outcomes={course.learningOutcomes ?? []} />

        <CourseContent
          modules={course.modules}
          totalDurationSeconds={course.durationSeconds}
        />

        <CourseProgressBar
          percent={0}
          href={firstLessonSlug ? `/lessons/${firstLessonSlug}` : null}
        />
      </main>
    </div>
  );
}
