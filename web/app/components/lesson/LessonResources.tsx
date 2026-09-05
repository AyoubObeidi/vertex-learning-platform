"use client";

import { Code2, Download, ExternalLink, FileText, PlayCircle } from "lucide-react";
import posthog from "posthog-js";

import type { Lesson } from "../../lib/lesson";

type Resource = NonNullable<Lesson["resources"]>[number];

const iconFor: Record<Resource["type"], typeof FileText> = {
  documentation: FileText,
  article: FileText,
  code: Code2,
  download: Download,
  video: PlayCircle,
};

/** `"https://nextjs.org/docs/..."` → `"nextjs.org"`, for the analytics payload. */
function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function LessonResources({
  resources,
  lessonSlug,
}: {
  resources: Resource[];
  lessonSlug: string;
}) {
  if (resources.length === 0) return null;

  return (
    <section className="mt-10 border-t border-line pt-8">
      <h3 className="font-display text-[19px] font-semibold text-neutral-900">Resources</h3>

      <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => {
          const Icon = iconFor[resource.type] ?? FileText;
          return (
            <li key={resource._key}>
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() =>
                  posthog.capture("lesson_resource_clicked", {
                    resource_title: resource.title,
                    resource_type: resource.type,
                    resource_host: hostOf(resource.url),
                    lesson_slug: lessonSlug,
                  })
                }
                className="flex h-full flex-col rounded-[10px] border border-line bg-surface p-4 transition-colors hover:border-accent/40 hover:bg-canvas"
              >
                <span className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-primary-100 text-accent"
                  >
                    <Icon size={13} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-neutral-900">
                    {resource.title}
                  </span>
                </span>

                <span className="mt-3 flex items-end gap-2">
                  <span className="min-w-0 flex-1 text-[12px] leading-[18px] text-neutral-500">
                    {resource.description}
                  </span>
                  <ExternalLink
                    size={13}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="mb-px shrink-0 text-neutral-500"
                  />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
