# Implementation prompt — Course detail page

## Goal

Build the course detail page at `/courses/[slug]`, reproducing
`.agents/design/vertex-course.png` exactly on desktop and adapting sensibly down
to mobile, wired to the seeded Sanity content through the existing server-only
read layer.

## Skills and docs read

- `CLAUDE.md` (sections 3, 5, 7, 8, 12, 13, 14) — UI is reproduced from the
  reference, pages are read-only, no client-side token, numbers derived not
  stored.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`
  — `params` is a Promise and must be awaited; type it with the
  `PageProps<'/courses/[slug]'>` helper rather than a hand-written type.
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`
  — remote images need `images.remotePatterns` in `next.config.ts`.
- `sanity-best-practices` is not re-read for this task: the query layer it
  governs already exists and this change only consumes it.

## Code inspected

- `web/sanity/lib/queries.ts` — `COURSE_BY_SLUG_QUERY` and `COURSE_SLUGS_QUERY`
  already return everything this page needs: card fields, `moduleCount`,
  `lessonCount`, `durationSeconds`, `learningOutcomes[]`, instructor, and
  `modules[]` with each module's `durationSeconds` and dereferenced lessons.
  **No query changes are needed.**
- `web/sanity.types.ts` — `COURSE_BY_SLUG_QUERY_RESULT` is already generated, so
  the page is typed without running TypeGen again.
- `web/sanity/lib/fetch.ts` / `client.ts` — `sanityFetch` is the single read
  entry point; `server-only`, token stays server side.
- `web/app/globals.css` — the warm palette (`canvas`, `surface`, `line`,
  `accent`), radii, shadows, and the `font-display` / `font-sans` tokens the
  design uses.
- `web/app/components/ui/*` — `TopNav`, `Badge`, `Button`, `ProgressBar`,
  `Breadcrumbs` exist and are reused. `web/app/page.tsx` for the page shell and
  container conventions (`mx-auto w-full max-w-[904px] px-5`).
- `studio/schemaTypes/objects/learningOutcome.ts` — `icon` is a fixed
  vocabulary: `zap | layers | shield | rocket | code | database | gauge |
  git-branch`. The frontend maps these to lucide icons.
- Live dataset check: `count(*[_type=="course"])` returns **10**, so the seeded
  content is importable and readable with the current token.

## Decisions and assumptions

1. **Route**: `app/courses/[slug]/page.tsx`, a server component.
   `generateStaticParams` reads `COURSE_SLUGS_QUERY` with `fresh: true` (the
   existing convention for must-be-current reads). Unknown slug → `notFound()`.
2. **Cover art**: the design shows a black tile with an "N" monogram; the seeded
   courses carry a real `coverImage`. Content wins for the *content*, design
   wins for the *frame*: render the Sanity `coverImage` inside the same
   ~280×330 rounded tile, and fall back to a monogram tile on the same black
   ground when a course has no cover image. Needs `cdn.sanity.io` added to
   `images.remotePatterns` in `next.config.ts`.
3. **Derived numbers**: level label, `18h 24m` duration, `12 modules`,
   `2.1k students` are all formatted from query results by small pure helpers in
   `web/app/lib/format.ts` (`formatDuration`, `formatCount`, `formatLevel`).
   Nothing is invented; a missing value drops its chip rather than showing a
   placeholder.
4. **Progress bar** (user decision): the sticky bottom bar is built exactly as
   designed but presentational, driven by a `percent` prop that is `0` for now.
   At 0% the label reads `Not started` and the CTA reads `Start Learning`;
   above 0% it reads `<n>% complete` / `Continue Learning`. When real progress
   lands it is one prop to wire. No fabricated 35%.
5. **CTA targets**: primary CTA and every lesson row link to
   `/lessons/<lesson slug>`. That route does not exist yet — flagged under
   "Needs your attention", not worked around, so the links are correct the day
   the lesson page lands.
6. **Bookmark** button is presentational (CLAUDE.md section 7 keeps such
   surfaces backend-free). It is a real `<button>` with an accessible label and
   no handler.
7. **Accordion**: `Course Content` rows expand to reveal that module's lessons.
   Interactivity is confined to one small client component
   (`CourseContent.tsx`); the page itself stays a server component. The first
   six modules render expanded-collapsed as in the design, with a
   `Show all N modules` toggle below when there are more than six. Uses native
   `<details>`-free React state so the chevron and lesson list stay controlled
   and keyboard accessible (`aria-expanded`, `aria-controls`).
8. **Breadcrumb**: `All Courses` links to `/` (the catalog lives on the home
   page today; there is no `/courses` index route and adding one is out of
   scope). The existing `Breadcrumbs` component takes plain strings, so this
   page renders its own two-item crumb with a link rather than widening that
   component's API for one caller.
9. **Instructor** is not shown in the reference image, so it is not added.
10. **Responsive**: below `lg` the hero stacks (cover above the text block), the
    learning-outcome grid collapses to one column, and the sticky bar stacks its
    label above the CTA. Desktop metrics are untouched.

## Files expected to change

New:

- `web/app/courses/[slug]/page.tsx` — the route, data fetch, metadata, layout.
- `web/app/components/course/CourseHero.tsx` — badge, title, summary, meta
  chips, CTAs, cover tile.
- `web/app/components/course/LearningOutcomes.tsx` — "What you'll learn" card
  with the icon vocabulary map.
- `web/app/components/course/CourseContent.tsx` — `"use client"` accordion.
- `web/app/components/course/CourseProgressBar.tsx` — sticky bottom bar.
- `web/app/lib/format.ts` — duration, count, and level formatters.

Modified:

- `web/next.config.ts` — add `images.remotePatterns` for `cdn.sanity.io`.
- `web/AGENTS.md` — only if `next dev` rewrites its managed block.

Not touched: `web/sanity/**` (queries and types already suffice),
`web/app/page.tsx`, the design-system page.

## Requirements

- Server component page; all Sanity reads through `sanityFetch`.
- `generateMetadata` sets the title and description from the course.
- Every derived number comes from the query result; no hardcoded course data.
- Match the reference for layout, spacing, type scale, colour, and states:
  serif display face for the H1 and section headings, `text-neutral-700` body,
  `bg-surface` cards on `bg-canvas` with `border-line`, accent CTA at
  `--color-accent`.
- Learning-outcome icons come from the schema vocabulary via an explicit map
  with a sane default; an unknown value must not crash the page.
- Accordion rows are buttons with correct `aria-expanded` / `aria-controls`;
  chevron rotates on expand.
- Page is responsive to 375px with no horizontal scroll.

## Security considerations

- The read token stays server side: only the page (a server component) calls
  `sanityFetch`. The client accordion receives already-fetched, plain-serialisable
  props and performs no fetching.
- No write path is introduced. Bookmark and the progress bar are presentational,
  so no token, no mutation, no client-side Sanity client.
- `urlFor` is safe in either environment — it needs only the public project id
  and dataset.
- The slug from `params` is passed to GROQ as a bound parameter (`$slug`), never
  interpolated into the query string.

## Acceptance criteria

1. `/courses/nextjs-for-production` renders the seeded course: real title,
   summary, level, duration, module count, student count, four learning
   outcomes with icons, and all modules in order with per-module durations.
2. The other nine seeded slugs render without error.
3. An unknown slug returns the 404 page.
4. The page visually matches `.agents/design/vertex-course.png` at desktop width.
5. No fabricated content: every string and number on the page traces to Sanity
   or to a derived count, except the presentational progress bar at 0%.
6. `npm run typecheck`, `npm run lint`, and `npm run build` pass in `web`.

## Checks to run

From `web/`:

- `npm run typecheck`
- `npm run lint`
- `npm run build` (routes and config changed)
- `npm run dev` for the manual pass

## Manual test steps

1. `cd web && npm run dev`.
2. Open `http://localhost:3000/courses/nextjs-for-production`. Compare against
   `.agents/design/vertex-course.png` at ~1024px wide.
3. Confirm the meta chips read a real level, duration, module count, and student
   count, and that the four learning outcomes match the seeded course.
4. Expand and collapse several modules; confirm lessons appear in order with
   their durations and that the chevron rotates.
5. If the course has more than six modules, click `Show all N modules` and
   confirm the rest appear.
6. Tab through the page: breadcrumb link, both CTAs, bookmark, every accordion
   header, and the sticky CTA are reachable and show focus.
7. Narrow the window to 375px: the hero stacks, outcomes go single column,
   nothing scrolls horizontally.
8. Visit `/courses/does-not-exist` and confirm the 404 page.
