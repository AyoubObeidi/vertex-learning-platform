# Implementation prompt: Vertex home page

## Goal

Build the Vertex home page exactly as shown in `.agents/design/vertex-home.png`:
site header, hero (eyebrow pill, display headline, subhead, primary CTA, large
search field), an "All Courses" section with three course cards, a "New courses
and lessons added every week" divider row, and the decorative orange bar-chart
band at the foot of the page. Responsive down to mobile, desktop pixel-faithful.

Presentational only — no Sanity, no Clerk, no search backend. Those are separate,
not-yet-approved slices in CLAUDE.md sections 5–11.

## Skills read

- CLAUDE.md sections 1–3 (scope, working loop, UI rules: reference image is the
  source of truth, reuse existing components/Tailwind patterns, responsive down
  to mobile).
- `node_modules/next/dist/docs/` index + `01-app` structure — this slice is a
  single static App Router server component, no routing/data-fetching decisions
  beyond adding one route folder, so no further doc pages were needed.
- No `.claude/skills` / `agent/skills` entry applies (they cover Sanity,
  Portable Text, content modeling, migration, SEO, experimentation). None of
  those are in play for a static presentational page.

## Code inspected before implementing

- `package.json` — Next 16.3.4 (App Router), React 19.2.8, Tailwind v4 via
  `@tailwindcss/postcss`, `lucide-react`, TypeScript, ESLint. No test runner.
- `app/layout.tsx` — Playfair Display (`--font-playfair`) + Inter
  (`--font-inter`) via `next/font/google`; body is `bg-neutral-50`.
- `app/globals.css` — Tailwind v4 `@theme inline` tokens: `primary-100..500`,
  `neutral-0..900`, radius `xs..full`, shadows `sm..xl`, `font-display`,
  `font-sans`.
- `app/page.tsx` — currently the design-system showcase page (14 sections)
  built in the previous slice.
- `app/components/ui/*` — `Button`, `TextInput`/`Select`, `Badge`,
  `StatusIndicator`, `ProgressBar`, `CourseCard`/`LessonCard`/`ResourceCard`,
  `TopNav`/`Breadcrumbs`/`Pagination`, `Logo`.
- `.agents/design/vertex-designsystem.png` — cross-checked the logo mark and
  the course card anatomy against the home reference.
- Measured the reference PNG numerically (colors, element boxes, type metrics)
  rather than eyeballing; the numbers below come from that.

## Measurements taken from the reference

Artboard is 960px wide (x 33–993 in the 1024px export); everything below is in
those px.

- Header: height 96, 1px bottom border, horizontal padding 38–40. Logo mark +
  "Vertex" at left; "Courses" / "My Learning" at x 245 / 346; bell icon at
  x 869 (22px); avatar circle 50px ending at x 961.
- Hero: eyebrow pill x 407–615 (208×38), rounded-full, 1px border, ~12px
  uppercase orange text with wide tracking. H1 two lines, Playfair ~68px /
  73px line-height, centered. Subhead two lines, ~19px / 33px line-height.
  CTA button 226×62, radius ~10, white 17px label + right arrow.
  Search field 746×84, radius ~14, 24px search icon at x 163, placeholder at
  x 207, ⌘K chip 63×42 at x 797.
- Section divider hairline at y 742 (full bleed).
- Content column x 82–938 (856 wide, centered). "All Courses" Playfair ~28px;
  "View all courses →" right-aligned, orange, ~14px.
- Course cards: 3 columns, 856 wide with 16px gaps (≈275 each), y 854–1227
  (373 tall), 1px border, radius ~12, padding ~26–32. Icon tile 74×74,
  radius ~16. Title Playfair ~21px. Description ~15px / 25px. Hairline at
  y 1156, meta row at y ~1184 with 14px icons and ~12px text.
- Footer row: hairline left and right of a 21px orange outline star + 16px
  label, at y ~1302.
- Bar band: 14 bars flush to the page bottom, vertical gradient from ~40%
  orange at the base fading to transparent. Measured (left offset, width,
  height) from the container's left edge: (0,72,88) (72,56,122) (128,48,152)
  (176,54,185) (230,90,133) (320,48,97) — 104px gap — (472,32,64) (504,80,84)
  (584,80,115) (664,48,152) (712,64,185) (776,56,94) (832,32,132) (864,96,170).

Colors sampled from the reference (medians of flat areas):

| Role | Reference | Nearest existing token |
| --- | --- | --- |
| Page / header background | `#FBF8F5` | `neutral-50` `#FAFAFC` (cooler) |
| Card / field / pill surface | `#FDFCFA` | `neutral-0` `#FFFFFF` |
| Borders and hairlines | `#F3E8E1` | `neutral-200` `#E2E8F0` (cooler, darker) |
| Accent (logo, CTA, links, star, bars) | `#E46D48` | `primary-500` `#F97316` |

## Decisions / assumptions

1. **Add four warm tokens.** The home reference is measurably warmer than the
   design-system palette — the accent is `#E46D48`, not `#F97316`, and the
   ground is `#FBF8F5`, not `#FAFAFC`. CLAUDE.md section 3 makes the reference
   image the source of truth, so I add `--color-canvas`, `--color-surface`,
   `--color-line`, `--color-accent` to `@theme` and use them on this page.
   Existing `primary-*` / `neutral-*` tokens stay untouched, so the design-system
   page is unaffected. **Flagging this for you** — if the intent was one single
   orange, say so and I will drop `--color-accent` and use `primary-500`.
2. **Move the design-system showcase to `/design-system`** so `/` becomes the
   real home page. No content change to that page.
3. **Update `Logo` to the reference mark** — both reference images show an
   orange outlined triangle with a solid inner chevron, not the current orange
   rounded square with a white V. Inline SVG, no asset.
4. **Update `TopNav` to the reference header** (canvas background, 96px tall,
   logo + Courses/My Learning + bell + avatar) and use it on both pages, rather
   than adding a second header component.
5. **Extend `CourseCard`** with an optional `icon` node (falling back to the
   current initial tile) and add the hairline above the meta row, so the home
   cards and the design-system card stay one component.
6. **Extend `TextInput`** with a `size` prop (`"md"` default, `"lg"` for the
   hero field) instead of adding a second input component.
7. **Course brand marks are inline SVG** in a new `CourseMark` component:
   Next.js (black tile, "N"), TypeScript (`#3178C6` tile, "TS"), Docker (blue
   whale + container stack). The Docker whale is a hand-drawn approximation —
   no brand-icon package is installed and I am not adding a dependency for one
   placeholder logo. It reads correctly at 74px; swap in the official asset
   when real course data lands.
8. **Placeholder content and links.** The three courses are a typed static
   array in `app/lib/placeholder-courses.ts`, clearly marked as placeholder
   until the Sanity model exists. Nav links, "View all courses", "Explore
   Courses" and the card links point to `#` because `/courses`, `/my-learning`
   and course detail routes do not exist yet — linking them now would 404.
   The header avatar is a neutral circle with a user glyph (no auth, no photo
   asset yet). The search field is presentational: it renders, focuses, and
   shows the ⌘K chip, but submits nothing — search is a separate slice.
9. **Bar band heights come from the measurement table above.** The reference is
   cropped at the page bottom, so the band is implemented at 190px tall (the
   tallest measured bar) with bars flush to its base.
10. **Responsive rules** (no mobile reference, per CLAUDE.md section 3): header
    keeps logo + bell + avatar and drops the two nav links below `sm`; hero type
    scales down (H1 68 → 40px, forced line break released); CTA and search go
    full width within the padding; the course grid becomes 1 column below `md`
    and 2 at `md`; the star row's hairlines collapse on narrow screens; the bar
    band stays full-bleed and clips. Desktop (≥1024) renders exactly as measured.

## Files to touch

- `app/globals.css` — add canvas/surface/line/accent tokens.
- `app/layout.tsx` — page metadata (title/description) for the real home page;
  body background switched to the canvas token.
- `app/page.tsx` — new home page (replaces the showcase).
- `app/design-system/page.tsx` — the previous `app/page.tsx`, moved verbatim
  (imports repathed).
- `app/components/ui/Logo.tsx` — reference logo mark.
- `app/components/ui/Navigation.tsx` — `TopNav` rebuilt to the reference.
- `app/components/ui/Cards.tsx` — `CourseCard` icon prop + hairline.
- `app/components/ui/Input.tsx` — `TextInput` size prop.
- `app/components/home/Hero.tsx` — eyebrow, headline, subhead, CTA, search.
- `app/components/home/CourseMark.tsx` — Next.js / Docker / TypeScript marks.
- `app/components/home/BarBand.tsx` — decorative footer bars.
- `app/lib/placeholder-courses.ts` — placeholder course data.

## Requirements

- Match the reference exactly at desktop: layout, spacing, type, color, borders.
- All new UI is server components; no `"use client"` is needed anywhere in this
  slice (nothing is interactive beyond native input focus).
- No data access, no secrets, no env vars, no network calls — section 5's
  server/client boundary rules are untouched.
- Decorative elements (bar band, star row hairlines) are `aria-hidden`; the
  search input has a real label for screen readers; icon-only controls (bell,
  avatar) get accessible names.
- Reuse existing tokens and components; add new ones only where listed above.

## Security considerations

None. Static presentational markup, no user input handling, no secrets, no
third-party script, no data fetching. The search field does not submit anywhere.

## Acceptance criteria

- `/` renders the home page and visually matches `.agents/design/vertex-home.png`
  section by section at a 1024px-wide viewport.
- `/design-system` still renders the previous showcase unchanged.
- Below `md`, the page has no horizontal scroll and the layout stacks per the
  responsive rules above.
- `npx tsc --noEmit` passes.
- `npx eslint app` passes with no errors.
- `npm run build` succeeds (routes changed: a new `/design-system` route).
- Dev server renders `/` with no browser console errors.

## Checks I will run

1. `npx tsc --noEmit`
2. `npx eslint app`
3. `npm run build`
4. `npm run dev` and load `/` and `/design-system`

Note: no Playwright/Puppeteer is installed locally and no browser automation
tool is available in this session, so I cannot diff a screenshot against the
reference myself. Fidelity comes from the measured values above; the visual
sign-off is step 2 of your manual test.

## Manual test steps for you

1. `npm run dev`, open `http://localhost:3000`.
2. Put `.agents/design/vertex-home.png` side by side with the browser at a
   ~1024px-wide window and compare: header, eyebrow pill, headline line breaks,
   subhead, CTA, search field + ⌘K chip, "All Courses" row, the three cards
   (tile, title, description, hairline, meta icons), the star divider row, and
   the orange bar band.
3. Narrow the window to ~375px: check the nav collapses, the hero fits, cards
   stack to one column, and nothing scrolls horizontally.
4. Open `http://localhost:3000/design-system` and confirm it is unchanged apart
   from the new logo mark and header.
