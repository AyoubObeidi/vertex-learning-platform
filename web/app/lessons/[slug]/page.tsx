import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, CheckCircle2, ChevronRight, Clock, Lightbulb, Users } from "lucide-react";

import { TopNav } from "../../components/ui/Navigation";
import { PortableTextBody } from "../../components/portable-text/PortableTextBody";
import { LessonBookmarkButton } from "../../components/lesson/LessonBookmarkButton";
import { LessonFooterNav } from "../../components/lesson/LessonFooterNav";
import { LessonOutline } from "../../components/lesson/LessonOutline";
import { LessonPlayer } from "../../components/lesson/LessonPlayer";
import { LessonResources } from "../../components/lesson/LessonResources";
import { LessonTabs } from "../../components/lesson/LessonTabs";
import { LessonViewTracker } from "../../components/lesson/LessonViewTracker";
import { deriveLessonDescription, getLessonPosition } from "../../lib/lesson";
import { formatCount, formatDuration, formatLevel } from "../../lib/format";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { LESSON_BY_SLUG_QUERY, LESSON_SLUGS_QUERY } from "@/sanity/lib/queries";

export async function generateStaticParams() {
  // `fresh` skips both the Sanity CDN and Next's Data Cache: the path list must
  // reflect what is published right now, not a stored response.
  const slugs = await sanityFetch({ query: LESSON_SLUGS_QUERY, fresh: true });
  return slugs
    .filter((entry): entry is { slug: string } => Boolean(entry.slug))
    .map(({ slug }) => ({ slug }));
}

function getLesson(slug: string) {
  return sanityFetch({
    query: LESSON_BY_SLUG_QUERY,
    params: { slug },
    tags: [`lesson:${slug}`],
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/lessons/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await getLesson(slug);

  if (!lesson) return { title: "Lesson not found — Vertex" };

  return {
    title: lesson.course
      ? `${lesson.title} — ${lesson.course.title} — Vertex`
      : `${lesson.title} — Vertex`,
    description: deriveLessonDescription(lesson.notes) ?? undefined,
  };
}

function MetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap text-[13px] text-neutral-500">
      {icon}
      {label}
    </span>
  );
}

export default async function LessonPage({ params }: PageProps<"/lessons/[slug]">) {
  const { slug } = await params;
  const lesson = await getLesson(slug);

  if (!lesson) notFound();

  // A lesson with no course has no breadcrumb, no outline, and no neighbours —
  // there is no page to render, so it is a 404 rather than a degraded view.
  const course = lesson.course;
  if (!course) notFound();

  const position = getLessonPosition(lesson._id, course);
  if (!position) notFound();

  const description = deriveLessonDescription(lesson.notes);
  const duration = formatDuration(lesson.durationSeconds);
  const level = formatLevel(course.level);
  const students = formatCount(lesson.studentCount);
  const keyPoints = lesson.keyPoints ?? [];
  const resources = lesson.resources ?? [];

  // Progress has no backend yet (CLAUDE.md section 7 puts it behind a server
  // route keyed by the Clerk user id), so the outline renders its zero state.
  const completedLessonIds: string[] = [];
  const percentComplete = 0;

  const posterSource = lesson.poster?.asset ? lesson.poster : null;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav width="full" />

      <LessonViewTracker
        lesson_slug={lesson.slug}
        lesson_title={lesson.title}
        lesson_label={position.label}
        lesson_duration_seconds={lesson.durationSeconds}
        module_index={position.moduleNumber}
        module_title={position.module.title}
        course_slug={course.slug}
        course_title={course.title}
      />

      <div className="flex flex-1 flex-col lg:flex-row lg:items-stretch">
        <aside
          aria-label="Course content"
          className="shrink-0 bg-canvas lg:sticky lg:top-0 lg:h-screen lg:w-[315px] lg:border-r lg:border-line"
        >
          <LessonOutline
            course={course}
            position={position}
            currentLessonId={lesson._id}
            completedLessonIds={completedLessonIds}
            percentComplete={percentComplete}
          />
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[800px] px-5 pt-7 pb-10 sm:px-11 lg:pt-9">
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
                <li>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="transition-colors hover:text-accent"
                  >
                    {course.title}
                  </Link>
                </li>
                <li aria-hidden="true" className="flex items-center">
                  <ChevronRight size={14} strokeWidth={1.75} />
                </li>
                <li>{position.module.title}</li>
                <li aria-hidden="true" className="flex items-center">
                  <ChevronRight size={14} strokeWidth={1.75} />
                </li>
                <li aria-current="page" className="text-neutral-900">
                  {lesson.title}
                </li>
              </ol>
            </nav>

            <div className="mt-7 flex items-start gap-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-md bg-primary-100 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                    Lesson {position.label}
                  </span>
                  {lesson.freePreview && (
                    <span className="inline-flex items-center rounded-md border border-line px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Free preview
                    </span>
                  )}
                </div>

                <h1 className="mt-5 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.01em] text-neutral-900 sm:text-[40px] lg:text-[46px]">
                  {lesson.title}
                </h1>

                {description && (
                  <p className="mt-5 max-w-[560px] text-[16px] leading-[31px] text-neutral-700">
                    {description}
                  </p>
                )}
              </div>

              <LessonBookmarkButton
                lessonSlug={lesson.slug}
                lessonTitle={lesson.title}
                courseSlug={course.slug}
              />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
              {duration && (
                <MetaChip icon={<Clock size={16} strokeWidth={1.75} />} label={duration} />
              )}
              {level && (
                <MetaChip icon={<BarChart3 size={16} strokeWidth={1.75} />} label={level} />
              )}
              {students && (
                <MetaChip
                  icon={<Users size={16} strokeWidth={1.75} />}
                  label={`${students} students`}
                />
              )}
            </div>

            <div className="mt-7">
              <LessonPlayer
                videoUrl={lesson.videoUrl}
                lessonTitle={lesson.title}
                lessonSlug={lesson.slug}
                durationSeconds={lesson.durationSeconds}
                posterUrl={
                  posterSource
                    ? urlFor(posterSource).width(1240).height(698).fit("crop").url()
                    : null
                }
                posterAlt={posterSource?.alt ?? null}
                posterLqip={posterSource?.asset?.metadata?.lqip ?? null}
              />
            </div>

            <LessonTabs lessonSlug={lesson.slug}>
              {lesson.notes && lesson.notes.length > 0 && (
                <section>
                  <h3 className="font-display text-[19px] font-semibold text-neutral-900">
                    Overview
                  </h3>
                  <div className="mt-4">
                    <PortableTextBody value={lesson.notes} />
                  </div>
                </section>
              )}

              {keyPoints.length > 0 && (
                <section className="mt-9 border-t border-line pt-8">
                  <h3 className="text-[15px] font-semibold text-neutral-900">
                    In this lesson you will:
                  </h3>
                  <ul className="mt-5 space-y-4">
                    {keyPoints.map((point) => (
                      <li key={point} className="flex items-start gap-3.5">
                        <CheckCircle2
                          size={17}
                          strokeWidth={1.75}
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-accent"
                        />
                        <span className="text-[15px] leading-[25px] text-neutral-700">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {lesson.proTip && (
                <aside className="mt-8 flex items-start gap-3.5 rounded-[10px] bg-primary-100/70 p-5">
                  <Lightbulb
                    size={18}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="mt-px shrink-0 text-accent"
                  />
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-neutral-900">Pro Tip</p>
                    <p className="mt-1.5 text-[14px] leading-[24px] text-neutral-700">
                      {lesson.proTip}
                    </p>
                  </div>
                </aside>
              )}

              <LessonResources resources={resources} lessonSlug={lesson.slug} />
            </LessonTabs>
          </div>

          <LessonFooterNav
            previous={position.previous}
            next={position.next}
            currentLessonSlug={lesson.slug}
          />
        </main>
      </div>
    </div>
  );
}
