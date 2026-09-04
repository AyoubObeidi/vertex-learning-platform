# Implementation prompt — Home "All Courses" from Sanity

## Goal

Replace the hardcoded `placeholderCourses` on the home page with the seeded
Sanity catalog, keeping the approved home design intact and making each card
link to its course page.

## Skills and docs read

- `CLAUDE.md` sections 3, 5, 7, 13 — reproduce the design, pages are read-only,
  reads go through the server-only Sanity client, numbers are derived.
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`
  — remote images need `images.remotePatterns` (already configured for
  `cdn.sanity.io` by the course-page work).

## Code inspected

- `web/app/page.tsx` — currently a sync server component mapping
  `placeholderCourses` through a `marks` record keyed by placeholder id.
- `web/app/components/ui/Cards.tsx` — `CourseCard` already accepts either an
  `icon` node or an `initial` string, plus `title`, `description`, `level`,
  `duration`, `modules` as pre-formatted strings. It is not a link today.
- `web/sanity/lib/queries.ts` — `COURSES_CATALOG_QUERY` already returns exactly
  what the card needs (`slug`, `summary`, `level`, `coverImage`, `moduleCount`,
  `durationSeconds`), ordered `popular desc, title asc`. **No query change.**
- `web/sanity.types.ts` — `COURSES_CATALOG_QUERY_RESULT` is already generated.
- `web/app/lib/format.ts` — `formatDuration`, `formatLevel`, `pluralize` from
  the course-page work; reused here rather than duplicated.
- `web/app/components/home/CourseMark.tsx` — the three placeholder brand marks.

## Decisions and assumptions

1. **Data**: `app/page.tsx` becomes an `async` server component reading
   `COURSES_CATALOG_QUERY` through `sanityFetch` with a `courses` cache tag.
   No client-side fetching, no token in the browser.
2. **Card tile** (user decision): render the course's Sanity `coverImage` in the
   74×74 rounded tile, falling back to a monogram on the black ground the design
   already uses. This makes every one of the ten courses work and matches the
   course-page hero. The bespoke `CourseMark` components are no longer
   referenced by the home page.
3. **Cards link**: each card wraps in a `Link` to `/courses/<slug>`. The design
   shows no visible affordance change, so only hover/focus states are added
   (the existing `hover:shadow-md`, plus a focus ring for keyboard users).
4. **Card API**: `CourseCard` gains an optional `href` and an optional
   `coverImage`, and keeps its existing `icon` / `initial` props so the
   design-system page keeps working unchanged.
5. **How many**: all courses the query returns are rendered. There is no
   `/courses` index route to send people to, so the section shows the whole
   catalog rather than an arbitrary slice. The grid already wraps at 3 per row.
6. **"View all courses" link** stays as it is — the catalog index route is out
   of scope for this change.
7. **Formatting**: level, duration, and module count are derived per card with
   the shared formatters. A course missing a duration drops that chip rather
   than showing a placeholder.
8. **Empty state**: if the query returns nothing, the section renders a short
   line instead of an empty grid, so a misconfigured dataset is visible rather
   than silent.
9. `placeholderCourses` is deleted once nothing imports it. The design-system
   page is checked first; if it uses the module, it is left in place.

## Files expected to change

- `web/app/page.tsx` — async, reads Sanity, maps real courses.
- `web/app/components/ui/Cards.tsx` — `CourseCard` gains `href` and
  `coverImage`.
- `web/app/lib/placeholder-courses.ts` — deleted if unreferenced.
- `web/app/components/home/CourseMark.tsx` — kept only if still referenced
  (design-system page); otherwise deleted.

Not touched: `web/sanity/**`, `next.config.ts` (already allows `cdn.sanity.io`),
the course page.

## Requirements

- Every string and number on a card comes from Sanity or is derived from it.
- The card's visual design is unchanged: same padding, radii, type scale,
  divider, and meta row from the approved home design.
- Cards are keyboard reachable with a visible focus state.
- Cover images use `next/image` with a `sizes` hint and the asset's LQIP for the
  blur placeholder.
- Page stays a server component; no `"use client"` is introduced.

## Security considerations

- The read stays server-side through `sanityFetch`; the browser gets rendered
  HTML and public image URLs only, never the read token.
- `urlFor` needs only the public project id and dataset.
- No user input reaches the query — the catalog read takes no parameters.

## Acceptance criteria

1. The home "All Courses" section lists the seeded courses, popular first, with
   real titles, summaries, levels, durations, and module counts.
2. Clicking a card opens that course's page at `/courses/<slug>`.
3. No placeholder course data remains in the rendered output.
4. `npm run typecheck`, `npm run lint`, and `npm run build` pass in `web`.
5. The card layout still matches the approved home design at desktop width and
   stays responsive to 375px.

## Checks to run

From `web/`: `npm run typecheck`, `npm run lint`, `npm run build`, plus a dev
pass with a screenshot compared against the home design.

## Manual test steps

1. `cd web && npm run dev`, open `http://localhost:3000`.
2. Confirm the section shows the seeded courses rather than the three
   placeholders, with real levels, durations, and module counts.
3. Click a card and land on the matching `/courses/<slug>` page.
4. Tab to a card and confirm a visible focus ring.
5. Narrow to 375px and confirm the grid collapses with no horizontal scroll.
