import {
  Cloud,
  Code2,
  Database,
  Gauge,
  GitBranch,
  Layers,
  Rocket,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { COURSE_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type Course = NonNullable<COURSE_BY_SLUG_QUERY_RESULT>;
type Outcome = NonNullable<Course["learningOutcomes"]>[number];

/**
 * The schema stores a value from a fixed icon vocabulary
 * (studio/schemaTypes/objects/learningOutcome.ts); the mapping to an actual
 * glyph lives here. An unrecognised value falls back rather than crashing.
 */
const icons: Record<Outcome["icon"], LucideIcon> = {
  zap: Zap,
  layers: Layers,
  shield: Shield,
  rocket: Rocket,
  code: Code2,
  database: Database,
  gauge: Gauge,
  "git-branch": GitBranch,
};

export function LearningOutcomes({ outcomes }: { outcomes: Outcome[] }) {
  if (outcomes.length === 0) return null;

  return (
    <section className="mt-14 rounded-[14px] border border-line bg-surface px-7 py-8 sm:px-10 sm:py-10">
      <h2 className="font-display text-[26px] font-semibold text-neutral-900">
        What you&apos;ll learn
      </h2>

      <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
        {outcomes.map((outcome) => {
          const Icon = icons[outcome.icon] ?? Cloud;
          return (
            <div
              key={outcome._key}
              className="flex gap-6 rounded-[12px] border border-line bg-canvas px-7 py-7"
            >
              <Icon
                size={38}
                strokeWidth={1.25}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-accent"
              />
              <div className="min-w-0">
                <h3 className="font-display text-[18px] font-semibold leading-snug text-neutral-900">
                  {outcome.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-[25px] text-neutral-500">
                  {outcome.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
