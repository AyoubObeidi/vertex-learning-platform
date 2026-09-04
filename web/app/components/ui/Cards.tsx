"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Clock, ExternalLink, FileText, PlayCircle } from "lucide-react";
import posthog from "posthog-js";
import { Badge } from "./Badge";

/** A cover image already resolved to a URL, so this file stays Sanity-agnostic. */
export type CardCover = {
  src: string;
  alt: string;
  blurDataURL?: string;
};

function CardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {children}
    </div>
  );
}

export function CourseCard({
  initial,
  icon,
  cover,
  href,
  title,
  description,
  level,
  duration,
  modules,
}: {
  initial?: string;
  icon?: ReactNode;
  cover?: CardCover;
  href?: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  modules: string;
}) {
  const tile = cover ? (
    <div className="relative h-[74px] w-[74px] overflow-hidden rounded-[16px] bg-neutral-900">
      <Image
        src={cover.src}
        alt={cover.alt}
        fill
        sizes="74px"
        placeholder={cover.blurDataURL ? "blur" : undefined}
        blurDataURL={cover.blurDataURL}
        className="object-cover"
      />
    </div>
  ) : (
    (icon ?? (
      <div className="flex h-[74px] w-[74px] items-center justify-center rounded-[16px] bg-neutral-900 font-display text-3xl text-white">
        {initial}
      </div>
    ))
  );

  const body = (
    <>
      {tile}
      <h3 className="mt-6 font-display text-[19px] font-semibold leading-snug text-neutral-900">
        {title}
      </h3>
      <p className="mt-4 text-[14px] leading-[24px] text-neutral-700">{description}</p>
      <div className="mt-auto border-t border-line pt-6">
        <div className="-mx-1 flex flex-wrap items-center gap-x-1.5 gap-y-2 whitespace-nowrap text-[10px] text-neutral-500">
          {level && (
            <span className="flex items-center gap-1">
              <BarChart3 size={12} strokeWidth={1.75} /> {level}
            </span>
          )}
          {duration && (
            <span className="flex items-center gap-1">
              <Clock size={12} strokeWidth={1.75} /> {duration}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FileText size={12} strokeWidth={1.75} /> {modules}
          </span>
        </div>
      </div>
    </>
  );

  const shell =
    "flex h-full flex-col rounded-md border border-line bg-surface p-[26px] pt-8 transition-shadow hover:shadow-md";

  if (!href) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <Link
      href={href}
      className={`${shell} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
      onClick={() =>
        posthog.capture("course_card_clicked", {
          course_title: title,
          course_level: level,
          course_duration: duration,
          course_modules: modules,
        })
      }
    >
      {body}
    </Link>
  );
}

export function LessonCard({
  badgeVariant,
  badgeLabel,
  title,
  description,
  meta,
  cta,
}: {
  badgeVariant: "video" | "lesson";
  badgeLabel: string;
  title: string;
  description: string;
  meta: string;
  cta: string;
}) {
  return (
    <CardShell>
      <Badge variant={badgeVariant}>{badgeLabel}</Badge>
      <div>
        <h3 className="font-display text-lg font-semibold text-neutral-900">{title}</h3>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-500">{meta}</span>
        <span className="flex items-center gap-1 font-medium text-primary-500">
          <PlayCircle size={16} /> {cta}
        </span>
      </div>
    </CardShell>
  );
}

export function ResourceCard({
  title,
  description,
  meta,
}: {
  title: string;
  description: string;
  meta: string;
}) {
  return (
    <CardShell>
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-100 text-primary-500">
        <FileText size={20} />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold text-neutral-900">{title}</h3>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-500">{meta}</span>
        <ExternalLink size={16} className="text-neutral-500" />
      </div>
    </CardShell>
  );
}
