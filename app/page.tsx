import {
  Bell,
  Bookmark,
  BarChart3,
  Clock,
  Play,
  Search,
  User,
  ChevronRight,
  Eye,
  Grid2x2,
  Target,
  Accessibility,
} from "lucide-react";
import { Button } from "./components/ui/Button";
import { TextInput, Select } from "./components/ui/Input";
import { Badge } from "./components/ui/Badge";
import { StatusIndicator } from "./components/ui/StatusIndicator";
import { ProgressBar } from "./components/ui/ProgressBar";
import { CourseCard, LessonCard, ResourceCard } from "./components/ui/Cards";
import { TopNav, Breadcrumbs, Pagination } from "./components/ui/Navigation";
import { Logo } from "./components/ui/Logo";

function Section({
  number,
  title,
  children,
  className = "",
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-neutral-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-5 flex items-center gap-2">
        <span className="text-xs font-semibold text-primary-500">{number}</span>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, hex, className }: { name: string; hex: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-16 w-full rounded-md ${className}`} />
      <div className="text-xs">
        <div className="font-medium text-neutral-900">{name}</div>
        <div className="text-neutral-500">{hex}</div>
      </div>
    </div>
  );
}

const primarySwatches = [
  { name: "Primary 500", hex: "#F97316", className: "bg-primary-500" },
  { name: "Primary 400", hex: "#FB923C", className: "bg-primary-400" },
  { name: "Primary 300", hex: "#FDBA74", className: "bg-primary-300" },
  { name: "Primary 200", hex: "#FED7AA", className: "bg-primary-200" },
  { name: "Primary 100", hex: "#FFEEE5", className: "bg-primary-100" },
];

const neutralSwatches = [
  { name: "Neutral 900", hex: "#0F172A", className: "bg-neutral-900" },
  { name: "Neutral 700", hex: "#33415C", className: "bg-neutral-700" },
  { name: "Neutral 500", hex: "#64748B", className: "bg-neutral-500" },
  { name: "Neutral 300", hex: "#CBD5E1", className: "bg-neutral-300" },
  { name: "Neutral 200", hex: "#E2E8F0", className: "bg-neutral-200" },
  { name: "Neutral 100", hex: "#F1F5F9", className: "bg-neutral-100" },
  { name: "Neutral 50", hex: "#FAFAFC", className: "bg-neutral-50 border border-neutral-200" },
  { name: "White", hex: "#FFFFFF", className: "bg-white border border-neutral-200" },
];

const typeScale = [
  { style: "Display 1", font: "Playfair Display", size: "48 / 56", weight: "Bold", use: "Page titles" },
  { style: "Display 2", font: "Playfair Display", size: "36 / 44", weight: "Bold", use: "Section titles" },
  { style: "Heading 1", font: "Inter", size: "28 / 36", weight: "Semi Bold", use: "Card titles" },
  { style: "Heading 2", font: "Inter", size: "22 / 30", weight: "Semi Bold", use: "Sub section" },
  { style: "Heading 3", font: "Inter", size: "18 / 26", weight: "Medium", use: "Small titles" },
  { style: "Body Large", font: "Inter", size: "16 / 24", weight: "Regular", use: "Body copy" },
  { style: "Body", font: "Inter", size: "14 / 20", weight: "Regular", use: "Supporting text" },
  { style: "Small", font: "Inter", size: "12 / 16", weight: "Regular", use: "Captions, meta" },
];

const spacing = [4, 8, 12, 16, 24, 32, 40, 48, 64];

const outlineIcons = [Bell, Search, Play, BarChart3, Bookmark, Clock, User, ChevronRight];

const principles = [
  { icon: Eye, title: "Clarity First", desc: "Every element should communicate clearly." },
  { icon: Grid2x2, title: "Consistency", desc: "Use components and patterns consistently across the platform." },
  { icon: Target, title: "Focus & Calm", desc: "Remove noise and help learners focus on what matters." },
  { icon: Accessibility, title: "Accessible", desc: "Design with accessibility and inclusion in mind." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <TopNav />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        {/* Header */}
        <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          <Logo />
          <h1 className="mt-4 font-display text-5xl font-bold text-neutral-900">
            Design System
          </h1>
          <p className="mt-3 max-w-xl text-base text-neutral-500">
            A unified design language for the Vertex learning platform. Clean, modern and
            focused on clarity, consistency and intuitive learning experiences.
          </p>
          <p className="mt-4 text-xs font-semibold tracking-wide text-neutral-500">
            VERSION 1.0 &nbsp;·&nbsp; SEPTEMBER 2026
          </p>
        </div>

        {/* Colors */}
        <Section number="01" title="Colors">
          <p className="mb-3 text-sm font-medium text-neutral-700">Primary</p>
          <div className="mb-6 grid grid-cols-5 gap-4">
            {primarySwatches.map((s) => (
              <Swatch key={s.name} {...s} />
            ))}
          </div>
          <p className="mb-3 text-sm font-medium text-neutral-700">Neutral</p>
          <div className="grid grid-cols-8 gap-4">
            {neutralSwatches.map((s) => (
              <Swatch key={s.name} {...s} />
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-2 gap-6">
          {/* Typography */}
          <Section number="02" title="Typography">
            <div className="flex flex-col gap-6">
              <div>
                <p className="font-display text-4xl font-semibold text-neutral-900">Ag</p>
                <p className="mt-2 text-sm font-medium text-neutral-900">Playfair Display</p>
                <p className="text-xs text-neutral-500">Elegant · Readable · Timeless</p>
              </div>
              <div>
                <p className="font-sans text-4xl font-semibold text-neutral-900">Ag</p>
                <p className="mt-2 text-sm font-medium text-neutral-900">Inter</p>
                <p className="text-xs text-neutral-500">Clean · Modern · Highly legible</p>
              </div>
            </div>
          </Section>

          {/* Type scale */}
          <Section number="03" title="Type Scale">
            <div className="flex flex-col gap-2">
              {typeScale.map((t) => (
                <div
                  key={t.style}
                  className="flex items-center justify-between border-b border-neutral-100 py-1.5 text-xs last:border-0"
                >
                  <span className="w-24 font-medium text-neutral-900">{t.style}</span>
                  <span className="w-16 text-neutral-500">{t.size}</span>
                  <span className="text-neutral-500">{t.use}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Spacing */}
          <Section number="04" title="Spacing System">
            <p className="mb-4 text-xs text-neutral-500">Base unit: 4px</p>
            <div className="flex items-end gap-3">
              {spacing.map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div
                    className="rounded-sm bg-primary-200"
                    style={{ width: Math.max(s / 1.5, 8), height: Math.max(s / 1.5, 8) }}
                  />
                  <span className="text-[10px] text-neutral-500">{s}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Radius & shadows */}
          <Section number="05" title="Radius & Shadows">
            <p className="mb-3 text-sm font-medium text-neutral-700">Radius</p>
            <div className="mb-5 flex gap-4">
              {[
                { label: "4px", cls: "rounded-xs" },
                { label: "8px", cls: "rounded-sm" },
                { label: "12px", cls: "rounded-md" },
                { label: "16px", cls: "rounded-lg" },
                { label: "24px", cls: "rounded-xl" },
                { label: "Full", cls: "rounded-full" },
              ].map((r) => (
                <div key={r.label} className="flex flex-col items-center gap-1.5">
                  <div className={`h-10 w-10 border border-neutral-300 bg-neutral-50 ${r.cls}`} />
                  <span className="text-[10px] text-neutral-500">{r.label}</span>
                </div>
              ))}
            </div>
            <p className="mb-3 text-sm font-medium text-neutral-700">Shadows</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-md border border-neutral-100 bg-white p-3 text-xs font-medium text-neutral-700 shadow-sm">
                SM
              </div>
              <div className="rounded-md border border-neutral-100 bg-white p-3 text-xs font-medium text-neutral-700 shadow-md">
                MD
              </div>
              <div className="rounded-md border border-neutral-100 bg-white p-3 text-xs font-medium text-neutral-700 shadow-lg">
                LG
              </div>
              <div className="rounded-md border border-neutral-100 bg-white p-3 text-xs font-medium text-neutral-700 shadow-xl">
                XL
              </div>
            </div>
          </Section>
        </div>

        {/* Icons */}
        <Section number="06" title="Icons">
          <div className="flex gap-6">
            {outlineIcons.map((Icon, i) => (
              <Icon key={i} size={20} strokeWidth={1.75} className="text-neutral-700" />
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section number="07" title="Buttons">
          <div className="grid grid-cols-4 gap-6 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-neutral-500">Primary</span>
              <Button variant="primary">Get Started</Button>
              <Button variant="primary" disabled>
                Get Started
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-neutral-500">Secondary</span>
              <Button variant="secondary">Explore Courses</Button>
              <Button variant="secondary" disabled>
                Explore Courses
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-neutral-500">Tertiary</span>
              <Button variant="tertiary">View Lesson</Button>
              <Button variant="tertiary" disabled>
                View Lesson
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-neutral-500">Text</span>
              <Button variant="text">Watch Video</Button>
              <Button variant="text" disabled>
                Watch Video
              </Button>
            </div>
          </div>
        </Section>

        {/* Inputs */}
        <Section number="08" title="Inputs">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-2 text-xs font-medium text-neutral-500">Search / Text Input</p>
              <TextInput placeholder="Search anything..." shortcut="⌘ K" />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-neutral-500">Select</p>
              <Select defaultValue="Most Relevant">
                <option>Most Relevant</option>
                <option>Newest</option>
                <option>Popular</option>
              </Select>
            </div>
          </div>
        </Section>

        <div className="grid grid-cols-3 gap-6">
          {/* Badges */}
          <Section number="09" title="Badges / Tags">
            <div className="flex gap-3">
              <Badge variant="video">Video</Badge>
              <Badge variant="lesson">Lesson</Badge>
              <Badge variant="popular">Popular</Badge>
            </div>
          </Section>

          {/* Status */}
          <Section number="10" title="Status / Indicators">
            <div className="flex flex-col gap-2">
              <StatusIndicator status="in-progress" />
              <StatusIndicator status="completed" />
              <StatusIndicator status="now-playing" />
              <StatusIndicator status="locked" />
            </div>
          </Section>

          {/* Progress */}
          <Section number="11" title="Progress Bar">
            <ProgressBar value={35} />
          </Section>
        </div>

        {/* Cards */}
        <Section number="12" title="Cards">
          <div className="grid grid-cols-4 gap-4">
            <CourseCard
              initial="N"
              title="Next.js for Production"
              description="Build scalable, high-performance web applications with Next.js."
              level="Intermediate"
              duration="18h 24m"
              modules="12 modules"
            />
            <LessonCard
              badgeVariant="video"
              badgeLabel="Video"
              title="Data Fetching in Server Components"
              description="Learn how to fetch data on the server using async/await and best practices."
              meta="Lesson 5.1 · 12:45"
              cta="Watch from 12:45"
            />
            <LessonCard
              badgeVariant="lesson"
              badgeLabel="Lesson"
              title="Data Fetching & Caching"
              description="Explore different data fetching methods in Next.js and how to cache and revalidate data for optimal performance."
              meta="Module 5"
              cta="View lesson"
            />
            <ResourceCard
              title="Caching and Revalidation Guide"
              description="Deep dive into Next.js caching strategies."
              meta="PDF · 1.2 MB"
            />
          </div>
        </Section>

        {/* Navigation */}
        <Section number="13" title="Navigation">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <Logo size="sm" />
              <div className="flex gap-5 text-sm font-medium text-neutral-700">
                <span className="text-neutral-900">Courses</span>
                <span>My Learning</span>
              </div>
            </div>
            <Breadcrumbs items={["All Courses", "Next.js for Production", "Data Fetching & Caching"]} />
            <Pagination page={1} total={8} />
          </div>
        </Section>

        {/* Principles */}
        <Section number="14" title="Principles">
          <div className="grid grid-cols-4 gap-6">
            {principles.map((p) => (
              <div key={p.title} className="flex flex-col gap-2">
                <p.icon size={20} className="text-primary-500" />
                <p className="text-sm font-semibold text-neutral-900">{p.title}</p>
                <p className="text-xs text-neutral-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}
