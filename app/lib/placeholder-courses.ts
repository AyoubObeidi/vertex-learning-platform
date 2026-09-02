/**
 * Placeholder catalog content for the home page. Replace with a GROQ query
 * against the Sanity course documents once the content model exists.
 */
export type PlaceholderCourse = {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  modules: string;
};

export const placeholderCourses: PlaceholderCourse[] = [
  {
    id: "nextjs",
    title: "Next.js for Production",
    description: "Build scalable, high-performance web applications with Next.js.",
    level: "Intermediate",
    duration: "18h 24m",
    modules: "12 modules",
  },
  {
    id: "docker",
    title: "Docker Essentials",
    description:
      "Containerize applications and streamline your development workflow.",
    level: "Beginner",
    duration: "10h 12m",
    modules: "8 modules",
  },
  {
    id: "typescript",
    title: "TypeScript Deep Dive",
    description: "Go beyond the basics and write safer, more expressive code.",
    level: "Intermediate",
    duration: "14h 36m",
    modules: "10 modules",
  },
];
