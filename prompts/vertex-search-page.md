# Implementation prompt: the search results page, wired to Sanity

## Goal

Build the Vertex search results page at `/search?q=…` exactly as drawn in
`.agents/design/vertex-search.png`, and extend the existing search pipeline so it
can produce the two kinds of result the design shows — **video moments** and
**lessons** (CLAUDE.md §11).

Today `POST /api/search` returns lesson results only. Four of the six cards in
the design are VIDEO cards, so the pipeline work is not optional decoration: it
is what makes the page real. The `video` documents that back it already exist in
the dataset (verified below), they are simply invisible to the agent.

Confirmed with the user in the question panel:

| Question                                                        | Answer                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Extend search to produce video moment results?                  | **Yes.** Chapters first, transcript chunks as fallback.                                    |
| The "completed" check on lesson cards, with no progress backend | **Build it, render off.** `completed` prop, always `false` until the progress route lands. |
| Sort options beside "Most Relevant"                             | **Shortest first / Longest first**, on lesson duration.                                    |

---

## Skills and docs read

- **CLAUDE.md** — all sections, especially §3 (UI is reproduced, not designed),
  §5 (the search UI is a _client component_ rendering what the route returns;
  the browser holds no token and never calls the MCP or the LLM), §7 (grounding,
  chapter-then-transcript, playback stays on the site, video documents are an
  internal lookup and never a result on their own), §11 (the whole behaviour
  spec for this page), §12 (traps), §13 (checks).
- **`.agents/skills/dial-your-context/SKILL.md`** — for the delta-only style the
  Context document's `instructions` are written in; the video rules are added in
  that style.
- **`.agents/skills/create-agent-with-sanity-context/SKILL.md`** — the
  `groqFilter` semantics: it limits what the agent can _see_, so `video` has to
  be inside it before the agent can query chapters or chunks at all.
- **`node_modules/next/dist/docs/`** — App Router `searchParams` on a page,
  `useSearchParams` in a client component and its Suspense requirement.

## Code inspected

- `web/app/api/search/route.ts` — the existing two-stage route: MCP tool loop →
  structured output of `{lessonId, description}` → re-read by id → assemble.
  Rate limit, PostHog `search_performed`, MCP client always closed.
- `web/app/lib/search.ts` — `SearchLessonResult` is already `kind`-discriminated
  "so video-moment results can join this union… without the consumer changing
  shape". This task is the one that adds that member.
- `web/app/lib/search-prompt.ts` — the inline system prompt; a template literal
  full of GROQ with every inner backtick escaped (CLAUDE.md §12).
- `web/app/lib/lesson.ts` — `locateLessonInOutline()` derives "5.1" and the
  module title from array order; `deriveLessonDescription()` is the fallback
  one-liner. Both already used by search.
- `web/app/lib/video.ts` — `parseVideoUrl`, `thumbnailUrl` (YouTube `hqdefault`
  only), `embedUrl`, `toStartSeconds`.
- `web/app/components/lesson/LessonPlayer.tsx` — reads `?t=` and _autostarts_
  when it is > 0. So a video result's action is simply
  `/lessons/<slug>?t=<seconds>`; nothing new is needed on the lesson page.
- `web/app/components/ui/{Input,Badge,Navigation,Button}.tsx`,
  `web/app/globals.css` — the tokens and components to reuse.
- `web/app/components/home/Hero.tsx` — the `⌘ K` search field on the home page
  is inert; it is what should send a learner here.
- `web/app/components/course/CourseProgressBar.tsx` — the precedent for a
  presentational-until-the-backend-lands surface, and the comment style for it.
- `web/sanity/lib/queries.ts`, `fetch.ts` — `defineQuery` + `sanityFetch`
  conventions, `fresh` semantics.
- `studio/context/agent-context.mjs` — carries a TODO that names this exact
  task: _"Add `video` here as part of the video-results work in section 11,
  together with the query rules for it."_
- `studio/schemaTypes/documents/video.ts`, `objects/video{Chapter,Chunk}.ts` —
  `videoId`, `url`, `provider`, `durationSeconds`, `chapters[{startSeconds,
label}]`, `chunks[{startSeconds, text}]`, `captionSource`, `chapterSource`.
- `web/proxy.ts` — bare `clerkMiddleware()`, nothing protected. `/search` and
  `/api/search` stay public, matching "browsing is public" (§7).

## Live checks already run against the dataset

```
{"videos": 134, "withChapters": 80, "withChunks": 134, "lessons": 135}
*[_type=="lesson" && !(videoUrl in *[_type=="video"].url)] → 1 lesson
  ("Constraints and defaults", https://www.youtube.com/watch?v=bfpT28smq2E)
```

So the join is 134/135. One lesson has no video document and can therefore only
ever produce a lesson result — which is correct behaviour, not a bug, and the
assembly code must not assume a video document exists.

A sampled video document has clean chapter labels (`Intro`, `Cache
revalidation`, `revalidatePath`) and sentence-length chunks, which is what the
chapter-first rule in §7 depends on.

## Design measurements taken from the reference

Sampled from `.agents/design/vertex-search.png` (1122×1402; the image includes a
~22px browser frame, so the page viewport inside it is ~1077px):

| Element        | Measurement                                                                       |
| -------------- | --------------------------------------------------------------------------------- |
| Top nav        | full-bleed, same shell as the lesson page (`TopNav width="full"`)                 |
| Content column | x 102→1019 → **917px**, centred. Use `max-w-[918px]`                              |
| Search field   | x 198→927 → **729px** wide, **~50px** tall, radius ~12, white fill, `border-line` |
| Video card     | y 346→521 → **175px** tall; gap between cards **~11px**                           |
| Lesson card    | y 901→1027 → **126px** tall                                                       |
| Card padding   | 18px; card is `bg-surface`, `border-line`, radius ~14                             |
| Thumbnail      | x 120→391, y 365→505 → **272×141**, radius ~12, `object-cover`                    |
| VIDEO badge    | fill `#fdefe9`, text `accent`, radius ~6, 11px semibold uppercase                 |
| LESSON badge   | fill `#efedfa`, text `#5b4fd6` — **a new colour pair**, see D6                    |
| Footer band    | full column width, warm pink fill `#fdf5f3`, radius ~14                           |

Everything else (type scale, weights, icon sizes) is read off the reference
during implementation and checked back against crops.

---

## Decisions and assumptions

### D1 — A video moment is grounded exactly the way a lesson is

The existing guarantee (`web/app/lib/search.ts`: the model returns ids and prose
and _nothing else_, every displayed field is re-read from the dataset) is
extended rather than loosened. The model's per-result output gains **one**
optional number:

```ts
{ lessonId: string, description: string, startSeconds?: number }
```

`startSeconds` is not trusted. After the lessons are re-read by id, the server
reads the `video` documents for those lessons' `videoUrl`s and keeps only the
chapters and chunks whose `startSeconds` is one the model actually named. A pick
becomes a **video result** only if that second exists in that lesson's video
document. If it does not, the pick **degrades to a lesson result** rather than
being dropped — the lesson is real, only the timestamp was not.

So an invented lesson still cannot appear (no id resolves) and now an invented
timestamp cannot appear either (no moment resolves). A learner is never sent to
a second where nothing is taught.

### D2 — Chapter first, transcript second, decided server side

§7 makes this a data rule, so it is enforced where the data is, not left to the
model: when a named second matches **both** a chapter and a chunk, the chapter
wins and its `label` becomes the moment label. The prompt still asks the model
to prefer chapters, because that is what makes it _look_ for them.

### D3 — The "clip length" pill shows the matched second

In the design every card's thumbnail pill and its CTA read the same value
(`12:45` / "Watch from 12:45"; `15:18` / "Watch from 15:18"; `06:41` /
"Watch from 06:41"). So the pill is the matched moment formatted `mm:ss`, not
the video's runtime. Implemented that way, from `startSeconds`.

### D4 — The course tile shows the course cover image

The design draws a brand logo per course (the Next.js N, the React atom, the JS
square). Those do not exist in the content model — `course.coverImage` is a
photograph. Rather than invent a field, add a seed pass, or hardcode logos
keyed off course titles, the tile renders `coverImage` in a 26px rounded square
with `object-cover`, which is how `CourseCard` already renders a cover. Flagged
to the user; adding a real `icon` field to `course` is a separate, easy change
if they want the logos.

### D5 — Client component, JSON, `?q=` in the URL

CLAUDE.md §5 states the search UI is a client component rendering the route's
response, so `/search` is a thin server page (metadata + shell) around a client
component that POSTs to `/api/search`. Submitting pushes `?q=` so a result set
is shareable and the back button works, and the client re-runs the search when
`?q=` changes. The route keeps returning a single JSON body (the deviation from
"streams results back" already recorded in `prompts/vertex-intelligent-search.md`
D2): under D1 no card exists until the model has finished _and_ the server has
re-read the dataset, so there is nothing incremental to stream.

An LLM call takes seconds, so the loading state is skeleton cards, not a spinner
on an empty page.

### D6 — Two new badge colours, as new variants

The design's VIDEO badge (light orange fill, accent text) and LESSON badge
(lavender fill, indigo text) are not the existing `Badge` `video`/`lesson`
variants — those are dark-fill and orange-fill, drawn that way in
`.agents/design/vertex-designsystem.png` and shown on `/design-system`. Changing
them would break that page against _its_ reference. So two variants are added,
`videoResult` and `lessonResult`, and the lavender pair becomes two tokens in
`globals.css` (`--color-lesson-100`, `--color-lesson-500`) so the colour is not
hardcoded in a component.

### D7 — Sorting is client side, over the returned set

"Most relevant" is the rank order the route returned, so the client keeps the
array as-is and sorts a copy for the other two options. No re-query — §11 asks
for all results in one response, and re-running an LLM call to reorder a list
would be absurd.

### D8 — The empty state is the band from the design

§11 wants an empty state that points to the full catalog. The design already has
one: the "Can't find what you're looking for?" band with **Browse all courses**.
It renders under the results _and_ stands alone as the empty state, so there is
one component and one message either way.

### D9 — `/search` is `noindex`

A query-driven page with an LLM behind it should not be crawled. `robots:
{index: false}` in the page's metadata. It stays fully public to a learner.

### D10 — No `revalidate`, no caching of a search

`sanityFetch({fresh: true})` for both search reads (the existing route already
does this for lessons) and `Cache-Control: no-store` on the response, unchanged.

---

## Files to touch

### Studio

| File                               | Change                                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `studio/context/agent-context.mjs` | add `"video"` to `GROQ_FILTER`; add the video-query rules to `INSTRUCTIONS` and delete the TODO comment that asks for exactly this |

Then rebuild and re-import the Context document (`npm run context:build`,
`npm run context:import`). No schema change, so **no Studio redeploy is needed**.

### Web — pipeline

| File                           | Change                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `web/sanity/lib/queries.ts`    | **new** `VIDEO_MOMENTS_QUERY` — chapters and chunks filtered to the named seconds only                                                                                         |
| `web/sanity.types.ts`          | regenerated by TypeGen                                                                                                                                                         |
| `web/app/lib/search.ts`        | `SearchVideoResult` added to the union; `startSeconds` added to the model schema; `buildSearchResults()` takes the moments and applies D1/D2/D3; `courseCount` on the response |
| `web/app/lib/search-prompt.ts` | the video-moment rules and the extended output contract                                                                                                                        |
| `web/app/api/search/route.ts`  | second read for moments; pass through to the builder                                                                                                                           |

### Web — page

| File                                              | Change                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `web/app/search/page.tsx`                         | **new** — server shell, metadata, `noindex`                              |
| `web/app/components/search/SearchExperience.tsx`  | **new** — the client component: field, header, toolbar, list, all states |
| `web/app/components/search/SearchField.tsx`       | **new** — the `⌘ K` field, its shortcut and submit                       |
| `web/app/components/search/VideoResultCard.tsx`   | **new**                                                                  |
| `web/app/components/search/LessonResultCard.tsx`  | **new**                                                                  |
| `web/app/components/search/BrowseCatalogBand.tsx` | **new** — the footer band / empty state                                  |
| `web/app/components/search/SearchSkeleton.tsx`    | **new** — loading cards                                                  |
| `web/app/components/ui/Badge.tsx`                 | two variants (D6)                                                        |
| `web/app/components/ui/Input.tsx`                 | a `"search"` size for the 50px field                                     |
| `web/app/globals.css`                             | the two lesson-badge tokens                                              |
| `web/app/components/home/Hero.tsx`                | the home field navigates to `/search?q=…`                                |
| `web/app/lib/format.ts`                           | **new** `formatTimestamp(seconds)` → `"12:45"` / `"1:02:30"`             |

Not touched: the lesson page, the course page, the catalog, `proxy.ts`, the
Studio schema, the ingestion pipeline.

---

## Requirements

### 1. The Context document sees videos

`GROQ_FILTER` becomes:

```
_type in ["course", "lesson", "instructor", "category", "video"] && !(_id in path("drafts.**"))
```

`INSTRUCTIONS` gains a **Video moments** section, in the delta style the file
already uses:

- A `video` document is joined to a lesson on `lesson.videoUrl == video.url`.
  There is no reference between them.
- A video document is **never a result**. It is a lookup that turns a query into
  a second inside a lesson's video.
- Match `chapters[].label` first — the labels are clean. Only if no chapter
  matches, match `chunks[].text`, which is raw transcript and noisy.
- **Never project `chunks` or `chapters` wholesale.** Filter inside the array
  and take a handful: `chunks[text match "cach*"][0...3]{startSeconds}`.
  Returning a whole transcript overflows the context window (CLAUDE.md §12).
- `startSeconds` is a whole number of seconds from the start of the video. Only
  ever report one that came back in a query result.

The same rules go in the inline system prompt (§12: the model follows it more
reliably; the two must not diverge).

### 2. `VIDEO_MOMENTS_QUERY`

```groq
*[_type == "video" && url in $urls]{
  url,
  durationSeconds,
  "chapters": chapters[startSeconds in $seconds]{startSeconds, label},
  "chunks": chunks[startSeconds in $seconds]{startSeconds}
}
```

Filtered by `$seconds` **inside** the arrays, so a 300-chunk transcript never
crosses the wire. `chunks` needs no `text` — the model already wrote the
description, and the chunk exists here only to prove the second is real.

### 3. The model's output contract

`SearchModelOutputSchema` gains `startSeconds: z.number().int().min(0).optional()`
on each result. The prompt says, in the output section:

- Include `startSeconds` when the query is answered at a _specific moment_ in
  the lesson's video, and you found that second in a chapter or a chunk.
- Omit it when the whole lesson is the answer.
- The same lesson may appear once as a moment and once as a lesson only if both
  are genuinely useful; prefer one.

### 4. Assembly

`buildSearchResults(picks, lessons, moments)`:

1. Walk picks in model order — that order _is_ the ranking.
2. Drop a pick whose lesson id does not resolve, or whose course does not
   resolve, or which is not in its course outline (unchanged rules).
3. If the pick named a `startSeconds`, look up the lesson's `videoUrl` in the
   moments map:
   - a chapter at that second → **video result**, `momentLabel = chapter.label`;
   - else a chunk at that second → **video result**, `momentLabel = null`;
   - else → **lesson result** (D1).
4. Dedupe on `lessonId + startSeconds`, so the same moment cannot be listed
   twice while a lesson and a moment from it can coexist.

`SearchVideoResult` carries: `kind: "video"`, `rank`, the lesson and course
fields the lesson result already carries, plus `startSeconds`, `momentLabel`,
`thumbnailUrl`, and `href = /lessons/<slug>?t=<startSeconds>`.

The response gains `courseCount` — distinct `courseSlug` across results — for
the "across 8 courses" line.

### 5. The page

`/search?q=…`, matching the reference:

- **Header**: `SEARCH RESULTS` pill; `Results for “<query>”` in `font-display`
  with the quoted query in `text-accent`; `Found N results across M courses`.
- **Field**: the 729×50 `⌘ K` field, pre-filled with the current query. Enter
  submits; `⌘/Ctrl + K` focuses it from anywhere on the page; Escape blurs.
- **Toolbar**: `N results` left, the sort select right (Most Relevant, Shortest
  first, Longest first).
- **Video card**: thumbnail with a centred play button and the `mm:ss` pill;
  course tile + course title; `VIDEO` badge; lesson title; two-line description;
  a meta row of `Lesson 5.1 · <module title>` with the file and folder icons;
  and `▶ Watch from 12:45 ›` in accent. The whole card is one link to
  `/lessons/<slug>?t=<seconds>`.
- **Lesson card**: the key-points tile on the left (course icon, up to three
  key points as bullets, the completion check per D-answer 2), `LESSON` badge,
  title, description, `Module N`, and `View lesson ↗ ›`. One link to
  `/lessons/<slug>`.
- **Band**: "Can't find what you're looking for?" with **Browse all courses** →
  `/courses`.
- **States**: no query (field + a one-line hint, no cards); loading (skeletons);
  error (a plain message and a retry button — never the server's error text);
  empty (the band alone, per D8).
- **Responsive** (CLAUDE.md §3): below `sm` the card becomes a column — the
  thumbnail / key-points tile goes full width above the text, the meta row wraps,
  and the CTA sits under it. Desktop is exact.

### 6. Analytics

The route already captures `search_performed` server side. The client adds:

- `search_result_clicked` — `{query, kind, rank, lesson_slug, course_slug,
start_seconds}`.
- `search_sorted` — `{query, sort}`.

Nothing that ships a token or a private key to the browser.

---

## Security considerations

- **The boundary is unchanged.** The browser POSTs a query string to
  `/api/search` and renders JSON. It never sees the MCP URL, the OpenAI key, the
  Sanity read token, or a GROQ query. No new env var, and nothing new is
  `NEXT_PUBLIC_`.
- **`?q=` is untrusted input.** It is length-capped by `SearchRequestSchema`
  server side (1–200 chars) and rendered as text — never as HTML, never
  interpolated into the system prompt. It goes in as the user message, exactly
  as it does today, so a prompt-injection attempt gets no privileged position;
  and under D1 it could not fabricate a result even if it did.
- **`startSeconds` from a model is not a URL parameter until it is verified.**
  It is proven against the video document before it can reach an `href`, and
  `LessonPlayer` re-clamps `?t=` to the lesson's duration on arrival.
- **No new write path.** The page reads; nothing is stored.
- **Rate limiting** on `/api/search` is unchanged and still applies — the page
  submits on Enter, not on every keystroke, so a typing learner cannot burn the
  budget.

---

## Acceptance criteria

1. `/search?q=data%20fetching` renders the reference layout: header, field,
   toolbar, mixed VIDEO and LESSON cards, footer band.
2. A VIDEO card's link is `/lessons/<slug>?t=<seconds>`, and following it opens
   the lesson with the embed already playing from that second.
3. Every `startSeconds` shown corresponds to a real chapter or chunk in that
   lesson's video document — confirmed by spot-checking one card in Vision.
4. A pick whose `startSeconds` does not resolve renders as a LESSON card, not as
   a card with a wrong timestamp.
5. The counts are real: the header's `N` equals the number of cards, and `M` is
   the distinct courses among them.
6. Results are not capped to a handful — a broad query returns the full ranked
   set (§11).
7. Sorting reorders without a re-query, and "Most Relevant" restores the
   server's order.
8. A query with no matches shows the band and no cards; the catalog link works.
9. The completion check does not appear (no progress backend), and the prop that
   drives it exists and is documented.
10. The page is usable at 375px wide: no horizontal scroll, cards stack, the
    field and toolbar wrap.
11. No token, key, MCP URL or GROQ string appears in the page source or in any
    network response the browser can see.
12. `npm run typecheck`, `npm run lint` and `npm run build` pass in `web/`.

## Checks to run

From `studio/`:

```powershell
npm run context:build
npm run context:import
```

From `web/`:

```powershell
npm run typecheck
npm run lint
npm run build      # new route + server module changes
npm run dev
```

Plus a live verification against the MCP endpoint (CLAUDE.md §13) — a real
`POST /api/search` returning at least one video result whose second is proven in
the dataset.

## Manual test steps

1. `cd studio; npm run context:build; npm run context:import`. Confirm the
   document imports and the printed `groqFilter` includes `video`.
2. `cd ..\web; npm run dev`. **Restart is required** — the route caches the
   initial context (§12).
3. `curl.exe -s -X POST http://localhost:3000/api/search -H "content-type: application/json" -d "{\"query\":\"data fetching\"}"`.
   Confirm the JSON has both `"kind":"video"` and `"kind":"lesson"` entries, a
   `resultCount`, and a `courseCount`.
4. Take one video result's `lessonSlug` and `startSeconds`. In Vision:
   `*[_type=="video" && url == <that lesson's videoUrl>]{chapters[startSeconds == <n>], chunks[startSeconds == <n>]}`
   — one of the two must be non-empty.
5. Open `http://localhost:3000/search?q=data+fetching`. Compare against
   `.agents/design/vertex-search.png` side by side: header, field, toolbar,
   both card types, band.
6. Click a VIDEO card. The lesson page opens and the video starts at that
   second — confirm the narration matches the card's description.
7. Back, then click a LESSON card. The lesson page opens at the top, no `?t=`.
8. Change the sort to "Shortest first" and back to "Most Relevant". The order
   changes and returns; no network request fires.
9. Type a new query in the field and press Enter. The URL becomes `?q=…`, the
   skeletons show, then the new results. Press Back — the previous query and its
   results return.
10. Press `⌘K` (or `Ctrl+K`) anywhere on the page — the field focuses.
11. Search for something absurd (`"underwater basket weaving"`). Confirm the
    empty state: no cards, the band, and a `reply` that says nothing was found.
12. Stop the dev server's model access (unset `OPENCODE_API_KEY` and restart) and
    search. Confirm a plain error message with a retry button, and that the
    browser response body contains no provider detail.
13. From the home page, type into the hero field and press Enter — it lands on
    `/search?q=…`.
14. Narrow the window to 375px. Confirm no horizontal scroll and that both card
    types stack sensibly.
15. View source / DevTools network: no `SANITY_API_READ_TOKEN`,
    `OPENAI_API_KEY`, MCP URL, or GROQ string anywhere.
16. `cd web; npm run typecheck; npm run lint; npm run build`.

---

## Implementation notes (written after the build)

Four things the plan did not anticipate, all resolved in code:

1. **`startSeconds` is nullable, not optional.** OpenAI's structured outputs
   reject a schema whose `required` array omits any property
   (`invalid_json_schema`, seen live). "Absent" is therefore spelled `null`, and
   `momentLookupParams` / `buildSearchResults` compare against `null`.

2. **The request is a `use()` promise under Suspense, not an effect.** The
   repo's ESLint config enables `react-hooks/set-state-in-effect`, which
   (correctly) rejects an effect that kicks off a fetch and sets state. The
   result is better than the plan: the skeleton is a render state, and a
   module-level per-query promise cache means Strict Mode's double-invoked
   initializer cannot fire two paid searches, and Back to an earlier query is
   instant instead of re-running the model. A failed request is evicted from the
   cache so "Try again" can actually try again.

3. **The search had to be gated to the browser.** Creating the promise during
   render meant the server ran it too — verified: the first SSR of
   `/search?q=…` fired a `POST /api/search`. On a deployed host that would be a
   paid model call per page render _on top of_ the browser's. A
   `useSyncExternalStore` client gate (`useOnClient`) holds it back until
   hydration without the mismatch a `typeof window` check would cause, and the
   server now renders the pending state — toolbar plus skeletons — for a `?q=`
   URL.

4. **The chapter label has no slot in the design.** The reference's meta row is
   `Lesson 5.1 · <module title>`, per CLAUDE.md §11, so the matched chapter's
   own label enriches the card link's accessible name and tooltip rather than
   being dropped.

### What was verified, and what was not

`buildSearchResults` and `momentLookupParams` were exercised against the live
dataset with a stubbed model answer, covering: a real chapter second, a real
transcript second, a fabricated second, a fabricated lesson id, a duplicate
moment, and a lesson-plus-moment pair. All eight grounding assertions passed —
the hallucinated id is dropped, the invented second degrades to a lesson result,
the chapter keeps its label, the transcript moment has none, the duplicate is
deduped, and every video href carries `?t=`. The moments read came back at 394
bytes for three videos, so the transcript never crosses the wire.

The card components were rendered against real documents through a temporary
fixture route (since deleted): both card types, both badges, the `?t=` links,
the `mm:ss` timestamps, and the key-point bullets all render.

**Not verified: the live model call.** The OpenAI account returns
`429 — You have no credits remaining`, so no end-to-end search has run since
`video` entered the Context filter. The step-3 curl in the manual tests is the
first thing to run once credits are restored. **Not verified: the visual match
against the reference**, which needs a browser this environment does not have.
