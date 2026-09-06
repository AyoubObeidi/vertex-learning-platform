import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { TopNav } from "../components/ui/Navigation";
import { CourseGrid } from "../components/home/CourseGrid";
import { ContinueLearningCard } from "../components/learning/ContinueLearningCard";
import { pluralize } from "../lib/format";
import { getMyLearning, type StartedCourse } from "../lib/progress-server";
import { urlFor } from "@/sanity/lib/image";

/**
 * `/my-learning` — the courses this learner has actually started.
 *
 * Presentational, per CLAUDE.md section 7: it reads existing progress for
 * display and records nothing. There is no write path here and no new route
 * behind it.
 *
 * Per-learner, so the read is uncached and the page renders dynamically. Signed
 * out is a real state rather than a redirect — browsing Vertex is public, and
 * there is nothing to protect until there is a user.
 */

export const metadata: Metadata = {
  title: "My Learning — Vertex",
  description: "The courses you have started, and where you left off.",
  // Every visitor sees something different and a crawler sees the signed-out
  // state. There is nothing here to index.
  robots: { index: false, follow: true },
};

export default async function MyLearningPage() {
  // `null` means signed out; an empty array means signed in having started
  // nothing. They are different pages.
  const started = await getMyLearning();

  const inProgress = (started ?? []).filter((entry) => entry.percent < 100);
  const completed = (started ?? []).filter((entry) => entry.percent >= 100);

  // The most recently worked-on unfinished course. `getMyLearning` returns them
  // newest first, so this is simply the first one that has somewhere to resume.
  const resumable = inProgress
    .map((entry) => (entry.resumeHref ? {...entry, resumeHref: entry.resumeHref} : null))
    .find((entry) => entry !== null);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav />

      <main className="mx-auto w-full max-w-[904px] flex-1 px-5 pb-16 pt-8 sm:px-6">
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
              My Learning
            </li>
          </ol>
        </nav>

        <h1 className="mt-7 font-display text-[38px] font-semibold leading-[1.08] tracking-[-0.01em] text-neutral-900 sm:text-[44px]">
          My Learning
        </h1>

        {started === null ? (
          <SignedOutState />
        ) : started.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <p className="mt-5 max-w-[560px] text-[17px] leading-[31px] text-neutral-700">
              Everything you have started, most recent first.
            </p>

            <p className="mt-6 text-[13px] text-neutral-500">
              {pluralize(started.length, "course")} started
              {completed.length > 0 && ` • ${completed.length} completed`}
            </p>

            {resumable && (
              <ContinueLearningCard
                title={resumable.course.title}
                summary={resumable.course.summary}
                href={resumable.resumeHref}
                percent={resumable.percent}
                cover={coverOf(resumable)}
              />
            )}

            <CourseSection
              title="In progress"
              entries={inProgress}
              emptyWhenNone
            />
            <CourseSection title="Completed" entries={completed} emptyWhenNone />
          </>
        )}
      </main>
    </div>
  );
}

/**
 * A titled grid, rendered through the same `CourseGrid` the catalog uses so the
 * two cannot drift apart. `completedByCourse` is what draws each card's bar.
 */
function CourseSection({
  title,
  entries,
  emptyWhenNone,
}: {
  title: string;
  entries: StartedCourse[];
  emptyWhenNone: boolean;
}) {
  if (entries.length === 0 && emptyWhenNone) return null;

  return (
    <section className="mt-12">
      <h2 className="font-display text-[23px] font-semibold text-neutral-900">
        {title}
        <span className="ml-3 text-[15px] font-normal text-neutral-500">
          {entries.length}
        </span>
      </h2>

      <CourseGrid
        courses={entries.map((entry) => entry.course)}
        completedByCourse={
          new Map(entries.map((entry) => [entry.course._id, entry.completedLessonIds]))
        }
      />
    </section>
  );
}

function SignedOutState() {
  return (
    <div className="mt-7 max-w-[560px]">
      <p className="text-[17px] leading-[31px] text-neutral-700">
        My Learning keeps track of the courses you have started and where you left
        off in each one. Sign in to see yours.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Link
          href="/sign-in"
          className="inline-flex h-12 items-center justify-center rounded-[10px] bg-accent px-6 text-[15px] font-medium text-white transition-colors hover:brightness-95"
        >
          Sign in
        </Link>
        <Link
          href="/courses"
          className="inline-flex h-12 items-center justify-center rounded-[10px] border border-line bg-surface px-6 text-[15px] font-medium text-neutral-900 transition-colors hover:bg-canvas"
        >
          Browse all courses
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-7 max-w-[560px]">
      <p className="text-[17px] leading-[31px] text-neutral-700">
        You have not started a course yet. Pick one and it will show up here with
        your progress.
      </p>
      <Link
        href="/courses"
        className="mt-7 inline-flex h-12 items-center justify-center rounded-[10px] bg-accent px-6 text-[15px] font-medium text-white transition-colors hover:brightness-95"
      >
        Browse all courses
      </Link>
    </div>
  );
}

function coverOf(entry: StartedCourse) {
  const image = entry.course.coverImage?.asset ? entry.course.coverImage : null;
  if (!image) return null;
  return {
    src: urlFor(image).width(176).height(176).fit("crop").url(),
    alt: image.alt || entry.course.title || "",
    blurDataURL: image.asset?.metadata?.lqip ?? undefined,
  };
}
