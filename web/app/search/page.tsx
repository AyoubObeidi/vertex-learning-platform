import type { Metadata } from "next";

import { SearchExperience } from "../components/search/SearchExperience";
import { TopNav } from "../components/ui/Navigation";

/**
 * `/search?q=…` — the search results page (CLAUDE.md section 11).
 *
 * A thin server shell around a client component. All the search itself happens
 * behind `POST /api/search`: the browser only ever sends a query string and
 * renders the grounded results, so nothing here touches Sanity, the Context
 * MCP, or the model.
 */

export const metadata: Metadata = {
  title: "Search — Vertex",
  description:
    "Search every course in plain English and jump straight to the moment a topic is taught.",
  // A query-driven page backed by an LLM call has nothing to offer a crawler,
  // and every distinct `?q=` would be a new URL to crawl.
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;

  // `?q=` can arrive repeated (`?q=a&q=b`). Take the first, and cap it at the
  // route's own limit so a pathological URL cannot make it into a request body.
  const raw = Array.isArray(q) ? q[0] : q;
  const query = (raw ?? "").trim().slice(0, 200);

  return (
    <main className="min-h-screen bg-canvas">
      <TopNav width="full" />
      {/* Keyed on the query so a new search remounts with clean state rather
          than reconciling one result set into another. */}
      <SearchExperience key={query} query={query} />
    </main>
  );
}
