# Implementation prompt — All Courses page

## Goal

Turn `/courses` from the bare list it is today into a finished catalog page,
staying simple: no filters, no sorting control, no pagination.

## Skills and docs read

- `CLAUDE.md` sections 3, 5, 7, 13 — no new design language is invented, pages
  are read-only server components, numbers are derived, run the checks.
- The approved home design (`.agents/design/vertex-home.png`) and course design
  (`.agents/design/vertex-course.png`) as the source of visual truth for the
  patterns this page reuses. There is no design image for `/courses` itself.

## Code inspected

- `web/app/courses/page.tsx` — currently a heading, a count, and the grid.
- `web/app/page.tsx` — the home section chrome: `max-w-[904px]` container,
  display-serif heading, the closing rule with the star line, and `BarBand`.
- `web/app/components/home/CourseGrid.tsx` — the shared card grid.
- `web/app/courses/[slug]/page.tsx` — the breadcrumb pattern and hero heading
  scale this page should echo.
- `web/sanity/lib/queries.ts` — `COURSES_CATALOG_QUERY` already returns
  everything needed, ordered popular first then by title. **No query change.**

## Decisions and assumptions

1. **Simple means simple.** No category filter, no sort control, no pagination,
   no search box. The page is a header and one grid.
2. **Header block** mirrors the course page's proportions rather than inventing
   a new one: a breadcrumb (`Home / All Courses`), the display-serif `All
   Courses` heading at the course-page hero scale, one line of supporting copy,
   and a derived count line ("10 courses · 4 categories" style, built only from
   values the query returns).
3. The supporting sentence is static UI copy, not content — one short line
   describing the catalog. It carries no course facts, so nothing can go stale
   or contradict Sanity.
4. **Grid** stays `CourseGrid` unchanged, so the cards match the home page
   exactly.
5. **Closing** reuses the home page's divider line and `BarBand` so the page
   ends the way the rest of the site does instead of stopping dead after the
   last card.
6. **Empty state** already exists in `CourseGrid`; the count line and closing
   rule still render, so a misconfigured dataset looks deliberate rather than
   broken.
7. The nav's "Courses" link is pointed at `/courses` — it is `href="#"` today,
   and this is the page it always meant.
8. Category count comes from the courses already fetched (unique
   `category.slug`), not a second query.

## Files expected to change

- `web/app/courses/page.tsx` — the header block and closing.
- `web/app/components/ui/Navigation.tsx` — "Courses" nav link target.

Not touched: `web/sanity/**`, `CourseGrid`, the card, the course detail page.

## Requirements

- Server component; the read goes through `sanityFetch` with the `courses` tag.
- Every number on the page is derived from the query result.
- Heading, spacing, type scale, and colours come from the existing tokens and
  the patterns already approved on the home and course pages.
- Breadcrumb and cards are keyboard reachable with visible focus.
- Responsive to 375px with no horizontal scroll.

## Security considerations

- Read stays server-side; no token reaches the browser; the query takes no user
  input.

## Acceptance criteria

1. `/courses` shows the header block, an accurate count, all published courses,
   and the closing band.
2. Cards link to the right detail pages; the breadcrumb returns home.
3. The top-nav "Courses" link opens `/courses`.
4. `npm run typecheck`, `npm run lint`, `npm run build` pass in `web`.

## Checks to run

From `web/`: `npm run typecheck`, `npm run lint`, `npm run build`, plus a dev
pass with a desktop screenshot and a 375px overflow check.

## Manual test steps

1. `cd web && npm run dev`, open `http://localhost:3000/courses`.
2. Confirm the header block, the count matching the number of cards, and the
   closing band.
3. Click "Courses" in the top nav from any page and land on `/courses`.
4. Follow the breadcrumb back to the home page.
5. Narrow to 375px and confirm no horizontal scroll.
