"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, FileText, Folder, Play, PlayCircle } from "lucide-react";

import { Badge } from "../ui/Badge";
import { CourseTile } from "./CourseTile";
import { formatTimestamp } from "../../lib/format";
import type { SearchVideoResult } from "../../lib/search";

/**
 * A lesson's video matched at a specific moment.
 *
 * The whole card is one link into `/lessons/<slug>?t=<seconds>`, where
 * `LessonPlayer` reads `?t=` and starts the provider embed there — playback
 * stays on the site (CLAUDE.md section 7) and the learner is never sent out to
 * YouTube.
 *
 * The timestamp on the thumbnail and the one in the action are the same value,
 * as drawn in the reference: it is the matched second, not the clip's runtime.
 */
export function VideoResultCard({
  result,
  onSelect,
}: {
  result: SearchVideoResult;
  onSelect: (result: SearchVideoResult) => void;
}) {
  const timestamp = formatTimestamp(result.startSeconds) ?? "0:00";

  return (
    <Link
      href={result.href}
      onClick={() => onSelect(result)}
      // The chapter's own label is the clearest name for the moment, but the
      // reference has no slot for it, so it enriches the link's accessible name
      // instead of being dropped on the floor.
      aria-label={
        result.momentLabel
          ? `${result.lessonTitle} — watch from ${timestamp}, ${result.momentLabel}`
          : `${result.lessonTitle} — watch from ${timestamp}`
      }
      title={result.momentLabel ?? undefined}
      className="group flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-[18px] transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-row sm:gap-5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-neutral-900 sm:aspect-auto sm:h-[141px] sm:w-[272px]">
        {result.thumbnailUrl && (
          <Image
            src={result.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 640px) 272px, 100vw"
            className="object-cover"
          />
        )}
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-transform group-hover:scale-105">
            <Play size={18} strokeWidth={2} className="ml-0.5 fill-current" />
          </span>
        </span>
        <span className="absolute bottom-2 right-2 rounded-md bg-ink/85 px-2 py-1 text-[12px] font-medium tabular-nums text-white">
          {timestamp}
        </span>
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <CourseTile src={result.courseImageUrl} courseTitle={result.courseTitle} />
            <span className="truncate text-[14px] text-neutral-700">
              {result.courseTitle}
            </span>
          </div>
          <Badge variant="videoResult">Video</Badge>
        </div>

        <h3 className="mt-3 text-[19px] font-semibold leading-snug text-neutral-900">
          {result.lessonTitle}
        </h3>

        {result.description && (
          <p className="mt-1.5 line-clamp-2 text-[14px] leading-[22px] text-neutral-700">
            {result.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-[13px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <FileText size={14} strokeWidth={1.75} />
            Lesson {result.label}
          </span>
          <span aria-hidden className="text-neutral-300">
            ·
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <Folder size={14} strokeWidth={1.75} />
            <span className="truncate">{result.moduleTitle}</span>
          </span>
          <span className="ml-auto flex items-center gap-2 font-medium text-accent">
            <PlayCircle size={16} strokeWidth={2} />
            Watch from {timestamp}
            <ChevronRight size={16} strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
  );
}
