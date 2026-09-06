"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import posthog from "posthog-js";

/**
 * The band under the results, which doubles as the empty state CLAUDE.md
 * section 11 asks for: when nothing matched, this is the whole answer, and it
 * points at the full catalog rather than leaving the learner on a blank page.
 */
export function BrowseCatalogBand({ query }: { query: string }) {
  return (
    <div className="mt-3 flex flex-col gap-5 rounded-[14px] bg-primary-100/60 px-7 py-6 sm:flex-row sm:items-center sm:gap-8">
      <span
        aria-hidden
        className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-primary-200/60 text-accent"
      >
        <Search size={22} strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold text-neutral-900">
          Can&rsquo;t find what you&rsquo;re looking for?
        </p>
        <p className="mt-1 text-[14px] text-neutral-700">
          Try different keywords or browse our full course catalog.
        </p>
      </div>
      <Link
        href="/courses"
        onClick={() => posthog.capture("search_browse_catalog_clicked", { query })}
        className="inline-flex h-[50px] shrink-0 items-center justify-center gap-3 rounded-xl bg-neutral-0 px-6 text-[15px] font-semibold text-accent shadow-sm transition-shadow hover:shadow-md"
      >
        Browse all courses
        <ArrowRight size={18} strokeWidth={2} />
      </Link>
    </div>
  );
}
