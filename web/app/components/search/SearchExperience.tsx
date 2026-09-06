"use client";

import { Suspense, use, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

import { BrowseCatalogBand } from "./BrowseCatalogBand";
import { LessonResultCard } from "./LessonResultCard";
import { SearchField } from "./SearchField";
import { SearchSkeleton } from "./SearchSkeleton";
import { VideoResultCard } from "./VideoResultCard";
import { Select } from "../ui/Input";
import { pluralize } from "../../lib/format";
import type { SearchResponse, SearchResult } from "../../lib/search";

/**
 * The search results page (CLAUDE.md sections 5 and 11).
 *
 * A client component by design: the browser holds no token, never reaches the
 * Context MCP or the model, and never queries Sanity. It POSTs a query string
 * to `/api/search` and renders the grounded result set that comes back.
 *
 * The query lives in the URL, so a result set is shareable and the back button
 * moves between searches. This component follows `?q=` rather than owning it —
 * the page passes the current value in and keys this subtree on it, so a new
 * search is a fresh mount rather than an unwinding of the previous one.
 *
 * The request is a promise read with `use()` under Suspense, not an effect.
 * That makes the skeleton a render state instead of a state update, and leaves
 * the retry button as the only thing that has to set state for it.
 *
 * It is also deliberately browser-only. A search is a paid model call, and
 * rendering this on the server would run one per page render — in addition to
 * the one the browser then makes. `useOnClient` is what holds it back until
 * hydration, without the mismatch that a `typeof window` check would cause.
 */

type SortOrder = "relevance" | "shortest" | "longest";

const SEARCHING = "Searching across every course…";

const SORT_LABELS: Record<SortOrder, string> = {
  relevance: "Most Relevant",
  shortest: "Shortest first",
  longest: "Longest first",
};

/** Never rejects: a failure is a value, so `use()` has something to hand back. */
type SearchOutcome = { ok: true; data: SearchResponse } | { ok: false };

/**
 * One in-flight or settled request per query.
 *
 * Two reasons this exists rather than a bare `fetch` per mount: React re-runs a
 * `useState` initializer under development's Strict Mode, and a search is a
 * paid model call — so the same query must not fire twice. It also means
 * pressing Back to an earlier search shows its results immediately instead of
 * paying for them again.
 */
const CACHE_LIMIT = 10;
const cache = new Map<string, Promise<SearchOutcome>>();

async function search(query: string): Promise<SearchOutcome> {
  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) return { ok: false };
    return { ok: true, data: (await response.json()) as SearchResponse };
  } catch {
    // The server logs the real failure. The browser is told nothing that could
    // leak the MCP URL, a token, or a provider payload.
    return { ok: false };
  }
}

function requestSearch(query: string, { refresh = false } = {}): Promise<SearchOutcome> {
  if (!refresh) {
    const cached = cache.get(query);
    if (cached) return cached;
  }

  const promise = search(query);
  cache.set(query, promise);

  // A failure must not be remembered, or the retry button would hand back the
  // same failure for ever.
  void promise.then((outcome) => {
    if (!outcome.ok && cache.get(query) === promise) cache.delete(query);
  });

  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }

  return promise;
}

/**
 * `false` while rendering on the server and through hydration, `true` after.
 *
 * A `useSyncExternalStore` with a distinct server snapshot rather than an
 * effect: React re-renders once it takes over, so nothing here sets state, and
 * the server and client agree on the first paint.
 */
const NEVER_CHANGES = () => () => {};
function useOnClient(): boolean {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );
}

/**
 * "Most relevant" is the order the route returned — the model's ranking, which
 * section 11 makes the default — so it is restored by rank rather than
 * recomputed.
 */
function sortResults(results: SearchResult[], order: SortOrder): SearchResult[] {
  const sorted = [...results];
  switch (order) {
    case "shortest":
      return sorted.sort((a, b) => a.durationSeconds - b.durationSeconds || a.rank - b.rank);
    case "longest":
      return sorted.sort((a, b) => b.durationSeconds - a.durationSeconds || a.rank - b.rank);
    default:
      return sorted.sort((a, b) => a.rank - b.rank);
  }
}

/* -------------------------------------------------------------------------- */

/** The line under the heading. Suspends alongside the results it counts. */
function ResultSummary({ promise }: { promise: Promise<SearchOutcome> }) {
  const outcome = use(promise);
  if (!outcome.ok) return <>Search is unavailable right now.</>;
  return (
    <>
      Found {pluralize(outcome.data.resultCount, "result")} across{" "}
      {pluralize(outcome.data.courseCount, "course")}
    </>
  );
}

function Toolbar({
  count,
  sort,
  disabled,
  onSortChange,
}: {
  count: string;
  sort: SortOrder;
  disabled: boolean;
  onSortChange: (order: SortOrder) => void;
}) {
  return (
    <div className="mt-9 flex items-center justify-between gap-4">
      <p className="text-[15px] font-semibold text-neutral-900">{count}</p>
      <div className="w-[168px]">
        <label htmlFor="search-sort" className="sr-only">
          Sort results
        </label>
        <Select
          id="search-sort"
          selectSize="search"
          value={sort}
          disabled={disabled}
          onChange={(event) => onSortChange(event.target.value as SortOrder)}
        >
          {(Object.keys(SORT_LABELS) as SortOrder[]).map((order) => (
            <option key={order} value={order}>
              {SORT_LABELS[order]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

/**
 * What is on screen while the search runs — and what the server renders for a
 * `?q=` URL, since the request itself only starts once the browser takes over.
 */
function PendingResults({
  sort,
  onSortChange,
}: {
  sort: SortOrder;
  onSortChange: (order: SortOrder) => void;
}) {
  return (
    <>
      <Toolbar count="Searching…" sort={sort} disabled onSortChange={onSortChange} />
      <div className="mt-4">
        <SearchSkeleton />
      </div>
    </>
  );
}

function ResultList({
  promise,
  query,
  sort,
  onSortChange,
  onRetry,
}: {
  promise: Promise<SearchOutcome>;
  query: string;
  sort: SortOrder;
  onSortChange: (order: SortOrder) => void;
  onRetry: () => void;
}) {
  const outcome = use(promise);
  const results = useMemo(
    () => (outcome.ok ? sortResults(outcome.data.results, sort) : []),
    [outcome, sort],
  );

  function handleSelect(result: SearchResult) {
    posthog.capture("search_result_clicked", {
      query,
      kind: result.kind,
      rank: result.rank,
      lesson_slug: result.lessonSlug,
      course_slug: result.courseSlug,
      start_seconds: result.kind === "video" ? result.startSeconds : null,
    });
  }

  if (!outcome.ok) {
    return (
      <div className="mt-9 rounded-[14px] border border-line bg-surface px-7 py-10 text-center">
        <p className="text-[16px] font-semibold text-neutral-900">
          Search is unavailable right now.
        </p>
        <p className="mt-2 text-[14px] text-neutral-700">
          Something went wrong on our side. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-6 text-[14px] font-medium text-white transition-colors hover:brightness-95"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <Toolbar
        count={pluralize(outcome.data.resultCount, "result")}
        sort={sort}
        disabled={results.length === 0}
        onSortChange={onSortChange}
      />
      <div className="mt-4 flex flex-col gap-3">
        {results.map((result) =>
          result.kind === "video" ? (
            <VideoResultCard
              key={`${result.lessonId}@${result.startSeconds}`}
              result={result}
              onSelect={handleSelect}
            />
          ) : (
            <LessonResultCard
              key={result.lessonId}
              result={result}
              onSelect={handleSelect}
            />
          ),
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

export function SearchExperience({ query }: { query: string }) {
  const router = useRouter();
  const onClient = useOnClient();
  const [retry, setRetry] = useState<Promise<SearchOutcome> | null>(null);
  const [sort, setSort] = useState<SortOrder>("relevance");

  // Safe to call during render: `requestSearch` is memoised per query, so this
  // returns the same promise every time rather than starting a second search.
  const promise = retry ?? (onClient && query ? requestSearch(query) : null);

  function submit(next: string) {
    // Pushing rather than replacing, so Back returns to the previous search.
    router.push(`/search?q=${encodeURIComponent(next)}`);
  }

  return (
    <div className="mx-auto w-full max-w-[918px] px-5 pb-16 pt-10 sm:px-6 sm:pt-12">
      <header className="text-center">
        <p className="inline-flex items-center rounded-md bg-primary-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          Search results
        </p>

        <h1 className="mx-auto mt-5 max-w-[760px] font-display text-[32px] font-semibold leading-[1.15] tracking-[-0.01em] text-neutral-900 sm:text-[40px]">
          {query ? (
            <>
              Results for <span className="text-accent">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Search your learning"
          )}
        </h1>

        <p className="mt-3 min-h-[22px] text-[15px] text-neutral-500">
          {!query ? (
            "Ask in plain English and we'll find the exact lessons and moments."
          ) : promise ? (
            <Suspense fallback={SEARCHING}>
              <ResultSummary promise={promise} />
            </Suspense>
          ) : (
            SEARCHING
          )}
        </p>

        <div className="mt-7">
          <SearchField query={query} onSubmit={submit} />
        </div>
      </header>

      {query &&
        (promise ? (
          <Suspense fallback={<PendingResults sort={sort} onSortChange={setSort} />}>
            <ResultList
              promise={promise}
              query={query}
              sort={sort}
              onSortChange={(order) => {
                setSort(order);
                posthog.capture("search_sorted", { query, sort: order });
              }}
              onRetry={() => setRetry(requestSearch(query, { refresh: true }))}
            />
          </Suspense>
        ) : (
          <PendingResults sort={sort} onSortChange={setSort} />
        ))}

      {/* Under the results in the reference, and the whole answer when there are
          none — the empty state CLAUDE.md section 11 asks for. */}
      <div className="mt-3">
        <BrowseCatalogBand query={query} />
      </div>
    </div>
  );
}
