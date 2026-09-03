import { ArrowRight, Star } from "lucide-react";
import { TopNav } from "./components/ui/Navigation";
import { CourseCard } from "./components/ui/Cards";
import { Hero } from "./components/home/Hero";
import { BarBand } from "./components/home/BarBand";
import {
  DockerMark,
  NextjsMark,
  TypeScriptMark,
} from "./components/home/CourseMark";
import { placeholderCourses } from "./lib/placeholder-courses";

const marks: Record<string, React.ReactNode> = {
  nextjs: <NextjsMark />,
  docker: <DockerMark />,
  typescript: <TypeScriptMark />,
};

export default function Home() {
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
            <a
              href="#"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:brightness-95"
            >
              View all courses
              <ArrowRight size={16} strokeWidth={2} />
            </a>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {placeholderCourses.map((course) => (
              <CourseCard
                key={course.id}
                icon={marks[course.id]}
                title={course.title}
                description={course.description}
                level={course.level}
                duration={course.duration}
                modules={course.modules}
              />
            ))}
          </div>

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
