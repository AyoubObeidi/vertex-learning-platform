# Vertex: wire learner progress end to end

## Goal

The learning progress bar never moves. It is not a rendering bug — progress has
no backend at all. Build the missing feature so the bar reflects what the
learner has actually done:

- A `progress` record per learner per course, keyed by the Clerk user id.
- A server route that writes it. The browser never writes Sanity directly.
- Completion: auto at ~90% watched, plus a manual **Mark as complete** toggle.
- Resume: the last playback second per lesson, surfaced as a resume affordance.
- Real numbers fed to the three places the bar already renders, and completion
  marks in the lesson outline.

## Skills and docs read

- `CLAUDE.md` sections 5 (boundaries), 7 (progress + analytics decisions),
  8 (the progress record), 12 (private dataset, server-only tokens), 13 (checks).
- `node_modules/next/dist/docs/` — route handlers, dynamic rendering, and the
  `proxy.ts` middleware convention this Next version uses.
- No Sanity skill beyond existing patterns is needed; the schema addition
  follows the shapes already in `studio/schemaTypes/documents/`.

## Code inspected

- [web/app/components/course/CourseProgressBar.tsx](../web/app/components/course/CourseProgressBar.tsx) — renders correctly, but the course page passes `percent={0}` literally.
- [web/app/components/lesson/LessonSidebar.tsx](../web/app/components/lesson/LessonSidebar.tsx) — already accepts `completedLessonIds` and `percentComplete`; the lesson page hardcodes `[]` and `0`.
- [web/app/components/ui/ProgressBar.tsx](../web/app/components/ui/ProgressBar.tsx) — the reusable bar, currently only used by the design system page.
- [web/app/components/lesson/LessonPlayer.tsx](../web/app/components/lesson/LessonPlayer.tsx) — plain provider iframes, activated on click or on a `?t=` deep link. No playback reporting of any kind.
- [web/app/lib/video.ts](../web/app/lib/video.ts) — `parseVideoUrl` / `embedUrl` for youtube, vimeo, bunny. YouTube embeds do **not** currently set `enablejsapi`.
- [web/app/components/lesson/LessonFooterNav.tsx](../web/app/components/lesson/LessonFooterNav.tsx) — the sticky prev/next bar, where the manual toggle will live.
- [web/sanity/lib/client.ts](../web/sanity/lib/client.ts), [fetch.ts](../web/sanity/lib/fetch.ts), [token.ts](../web/sanity/lib/token.ts) — read-only, `server-only`, read token. There is no write client and no write token anywhere in the repo.
- [web/proxy.ts](../web/proxy.ts) — `clerkMiddleware()` with a broad matcher. This Next version names middleware `proxy.ts`.
- [studio/schemaTypes/index.ts](../studio/schemaTypes/index.ts) — course, lesson, instructor, category, video. No progress type.
- [studio/context/agent-context.mjs](../studio/context/agent-context.mjs) — the `groqFilter` is a type **allowlist**, so a new `progress` type is invisible to search with no change. Confirmed against `studio/context/dist/vertex-agent-context.ndjson`.
- `.env.example` — has `SANITY_API_READ_TOKEN`, no write token.

## Decisions and assumptions

**One document per learner per course**, not one per learner. Keeps
`completedLessons` bounded, and the course page reads exactly one document.
Deterministic id `progress.<userId>.<courseDocId>` so every write is an
idempotent `createIfNotExists` plus `patch`, with no lookup query first. Clerk
ids (`user_2ab...`) and Sanity ids share the same safe character set; the id
builder still strips anything outside `[A-Za-z0-9._-]`, per CLAUDE.md section 9's
rule about characters the datastore rejects.

**The user id comes from Clerk on the server, never from the request body.**
The route reads `auth()`. A body-supplied user id would let any signed-in
learner write another learner's record.

**The route verifies the lesson really belongs to the course** before recording
it. Without that check a client could POST arbitrary lesson ids to inflate its
own percentage, and worse, poison the denominator.

**Percent is derived, never stored.** The intersection of `completedLessons`
with the course's own lessons, over the course's total lesson count, computed at
read time. Storing it would drift the moment an author adds a lesson.

**Playback position comes from the providers' own postMessage protocols**, not a
custom player (CLAUDE.md section 7 forbids one) and not a wall-clock timer (a
paused video would keep "watching"). All three providers speak postMessage with
no SDK download: YouTube's `infoDelivery` (needs `enablejsapi=1` and `origin` on
the embed URL), Vimeo's `timeupdate`, and Bunny's player.js `timeupdate`. If no
provider ever posts a message the feature degrades to the manual button rather
than breaking — that is the reason the button exists.

**The course and lesson routes become dynamic** for the progress read. Progress
is per-user and must never be cached or prerendered. `generateStaticParams`
stays: harmless, and still useful if PPR is enabled later. This is a real
tradeoff and gets called out in the report.

**90% is the completion threshold**, and completion is sticky — passing the
threshold marks complete, but rewinding does not un-complete. Only the manual
toggle can un-complete.

**No new visual language.** Reuse `ProgressBar`, the existing accent bar markup
in `CourseProgressBar` and `LessonSidebar`, `StatusIndicator`'s `completed`
state, and the footer nav's existing button styles. Nothing is restyled.

## Files expected to change

**Studio**

- `studio/schemaTypes/documents/progress.ts` (new)
- `studio/schemaTypes/index.ts` (register it)
- `studio/structure.ts` (list it as app state, alongside Videos)

**Web — server**

- `web/sanity/lib/token.ts` (add `writeToken`, still `server-only`)
- `web/sanity/lib/write-client.ts` (new; `useCdn: false`, write token)
- `web/sanity/lib/queries.ts` (progress reads, and a lesson-belongs-to-course check)
- `web/app/api/progress/route.ts` (new; POST, Clerk-authed, Zod-validated)
- `web/app/lib/progress.ts` (new; id builder, percent maths, shared types)
- `.env.example` (`SANITY_API_WRITE_TOKEN`, documented as server-only)

**Web — pages and components**

- `web/app/courses/[slug]/page.tsx` (read progress, pass real percent and resume href)
- `web/app/lessons/[slug]/page.tsx` (read progress, pass real completed ids, percent, resume second)
- `web/app/courses/page.tsx` and `web/app/components/home/CourseGrid.tsx` (per-course bar on catalog cards, signed in only)
- `web/app/components/lesson/LessonPlayer.tsx` (report position; accept a resume second)
- `web/app/components/lesson/LessonFooterNav.tsx` (host the complete toggle)
- `web/app/components/lesson/LessonCompleteButton.tsx` (new)
- `web/app/lib/video.ts` (`enablejsapi` and `origin` on the YouTube embed)

## Requirements

1. `progress` schema: `userId` (string, required), `course` (reference, required),
   `completedLessons` (array of lesson references), `lastLesson` (reference),
   `lastPositionSeconds` (number), `updatedAt` (datetime). Not authored by hand —
   describe it in the schema as app state written by the server route.
2. `POST /api/progress` accepts `{ courseId, lessonId, action, positionSeconds? }`
   where `action` is `complete | uncomplete | position`. It returns the updated
   `{ completedLessonIds, percent, lastPositionSeconds }` so the client updates
   without a refetch.
3. Unauthenticated requests get 401. Invalid bodies get 400 with no detail leak.
   A lesson that is not in the named course gets 400.
4. `positionSeconds` is clamped to `[0, lesson.durationSeconds]` server-side.
   Reaching 90% or more of duration sets completion in the same write.
5. Position saves are throttled to at most one every 15 seconds, plus one final
   save on `pagehide` / `visibilitychange` so closing the tab does not lose it.
6. Course page: real percent; the CTA reads **Continue Learning** and points at
   the last lesson with `?t=<lastPositionSeconds>` when there is one, otherwise
   the first unfinished lesson, otherwise the first lesson.
7. Lesson page: the outline shows real check marks and real percent; the player
   starts at the saved second when there is no `?t=` in the URL. An explicit
   `?t=` from a search result always wins.
8. Catalog: a slim `ProgressBar` on a course card the learner has started.
   Nothing renders for signed-out visitors or unstarted courses.
9. PostHog: `lesson_completed` (with `source: "auto" | "manual"`), and
   `lesson_video_progress` at the 25/50/75 milestones, fired once each per
   activation. This satisfies CLAUDE.md section 7's "how far it is watched".
10. Signed-out learners see exactly today's UI: "Not started", 0%, no toggle.
    Nothing throws, and nothing 401s in the console.

## Security considerations

- `SANITY_API_WRITE_TOKEN` is server-only, read through the `server-only`-guarded
  `token.ts`, never prefixed `NEXT_PUBLIC_`, and used only inside the route
  handler. The browser holds no token and never writes Sanity.
- The Clerk user id is taken from `auth()` on the server. It is never accepted
  from the request body, a header, or a query param.
- Lesson and course ids in the body are untrusted: validated as Sanity id strings
  by Zod, then checked against the real course before anything is written.
- `positionSeconds` is untrusted: coerced to a finite integer and clamped to the
  lesson's stored duration, exactly as `toStartSeconds` already does for `?t=`.
- Progress reads are uncached and scoped by user id, so one learner's record can
  never be served to another out of Next's Data Cache.
- The Context MCP `groqFilter` is a type allowlist, so `progress` is invisible to
  the search agent with no change. Verify this rather than assume it — a leak
  here would put learner ids into search results.
- The write client uses `useCdn: false`; a CDN read-back would serve a stale
  record straight after a write.

## Acceptance criteria

- Signed in, opening a lesson and watching past 90% marks it complete; the
  sidebar check appears and the percent rises without a manual refresh.
- **Mark as complete** toggles both ways and survives a reload.
- Leaving a lesson part-way and returning resumes at roughly that second.
- The course page CTA says **Continue Learning** with a real percentage.
- A search result's `?t=` still wins over the saved resume second.
- Signed out, every surface renders its zero state and no request is made.
- A POST with another user's id in the body cannot affect that user's record.
- A POST naming a lesson outside the course is rejected.

## Checks to run

In `web/`: `npx tsc --noEmit`, `npm run lint`, and `npm run build` — routes,
config and server modules all change, so the build is required, not optional.
In `studio/`: deploy the schema so the new type is live. No Studio app redeploy
is needed for the Context MCP, since the content scope is unchanged.

## Manual test steps

1. Create a Sanity write token (Editor role) and add `SANITY_API_WRITE_TOKEN` to
   `web/.env.local`. Deploy the studio schema.
2. `npm run dev` in `web/`. Sign in.
3. Open a course. The bar reads **Not started**, the CTA reads **Start Learning**.
4. Open its first lesson, press play, let it run past 90% of the duration (or
   scrub near the end). The sidebar check appears and the percent rises.
5. Reload. The check and the percent persist.
6. Click **Mark as complete** on a second lesson, then click it again to
   un-complete. The percent moves both ways.
7. Go back to the course. The CTA now reads **Continue Learning** with a real
   percentage and links to the next unfinished lesson.
8. Start a third lesson, watch about 30s, navigate away, come back. Playback
   resumes near 30s.
9. Open a search result deep link with `?t=120` on that same lesson. It starts
   at 120s, not at the saved position.
10. Visit `/courses`. Started courses show a slim bar; the rest show none.
11. Sign out. Every page renders the zero state, with no console errors.
12. In PostHog, confirm `lesson_completed` and `lesson_video_progress` arrive.
13. From the dev tools console, POST `/api/progress` with a `lessonId` from a
    different course and confirm a 400.
