# Implementation prompt: Vertex design system

## Goal

Implement the Vertex design system (colors, typography, spacing, radius/shadows,
icons, buttons, inputs, badges, status indicators, progress bar, cards,
navigation, principles) from the reference sheet at
`.agents/design/vertex-designsystem.png`, as reusable Tailwind v4 tokens and
React components in the `web` (root) workspace, so later course/lesson/catalog
pages in section 5-8 of CLAUDE.md can be built on top of them without
re-deriving styling.

## Skills read

- No project skill in `.claude/skills/` or `agent/skills/` covers design
  tokens/component libraries specifically (available: sanity-best-practices,
  sanity-migration, portable-text-*, content-modeling/experimentation,
  seo-aeo). None apply to this slice of work — it's pure Tailwind/React,
  no Sanity schema, auth, or search involved.
- `node_modules/next/dist/docs/` — not needed for this slice (no routing/data
  fetching decisions beyond a single static page).

## Code inspected before implementing

- `package.json` — Next.js 16 (App Router), React 19, Tailwind v4 via
  `@tailwindcss/postcss`, TypeScript, ESLint. No component library, no
  icon package, no font package installed yet.
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css` — default
  `create-next-app` scaffold (Geist fonts, generic hero page). Nothing
  pre-existing to reuse.
- No `app/components/` directory existed yet.
- Confirmed no git history (`git log` empty, everything untracked) — this is
  the first substantive commit to the repo.

## Decisions / assumptions

- Added `lucide-react` for the outline/filled icon set shown in section 06 of
  the reference (bell, search, play, bar-chart, bookmark, clock, user,
  chevron) — the closest match to the reference's icon style available
  without shipping custom SVGs one-by-one.
- Mapped the reference's exact hex values to Tailwind v4 `@theme` tokens
  (`primary-100..500`, `neutral-50..900`) rather than hardcoding hex classes,
  so future pages reference `bg-primary-500` etc. and stay in sync if the
  palette changes.
- Playfair Display for display/heading type, Inter for body — loaded via
  `next/font/google` as `--font-display` / `--font-sans`, replacing the
  scaffold's Geist fonts.
- Built one showcase/documentation page (`app/page.tsx`) that renders all 14
  sections of the reference sheet, both as a visual acceptance check against
  the image and as living documentation of the component API. This is meant
  to be replaced by the real catalog/course pages once those are scoped —
  flagging this explicitly since CLAUDE.md scopes "the catalog, course detail
  page, lesson page..." as separate, not-yet-approved work.
- Component set covers exactly what's in the reference image: Button
  (primary/secondary/tertiary/text × default/hover/disabled), TextInput,
  Select, Badge (video/lesson/popular), StatusIndicator (in-progress/
  completed/now-playing/locked), ProgressBar, CourseCard/LessonCard/
  ResourceCard, TopNav/Breadcrumbs/Pagination, Logo. Nothing beyond that was
  added (no modal, no toast, no tabs, etc. — not in the reference).

## Files touched

- `app/globals.css` — theme tokens (color, radius, shadow, font vars)
- `app/layout.tsx` — Playfair Display + Inter font loading
- `app/page.tsx` — full design-system showcase page
- `app/components/ui/Button.tsx`
- `app/components/ui/Input.tsx` (TextInput, Select)
- `app/components/ui/Badge.tsx`
- `app/components/ui/StatusIndicator.tsx`
- `app/components/ui/ProgressBar.tsx`
- `app/components/ui/Cards.tsx` (CourseCard, LessonCard, ResourceCard)
- `app/components/ui/Navigation.tsx` (TopNav, Breadcrumbs, Pagination)
- `app/components/ui/Logo.tsx`
- `package.json` — added `lucide-react`

## Requirements

- Match the reference image's layout, spacing, typography, and color exactly
  per CLAUDE.md section 3 (desktop reference is source of truth).
- No client-server boundary concerns — this slice is pure presentational UI,
  no data fetching, no auth, no writes. Nothing in section 5's boundary rules
  applies yet.
- Reusable, typed components other pages can import.

## Security considerations

None — static presentational components, no external input, no secrets, no
data access.

## Acceptance criteria

- Design system page visually matches `.agents/design/vertex-designsystem.png`
  section-by-section (colors, type scale, spacing, radius/shadows, icons,
  buttons incl. disabled state, inputs, badges, status, progress bar, cards,
  nav/breadcrumbs/pagination, principles).
- `tsc --noEmit` passes.
- `eslint` passes with no errors.
- Dev server renders the page with zero browser console errors.

## Checks run (already completed, results below)

- `npx tsc --noEmit` — passed, no output.
- `npx eslint app` — passed after fixing one `no-empty-object-type` error in
  `Input.tsx` (removed a redundant empty interface).
- `npm run dev` + Playwright screenshot (via system Edge, since the sandbox
  has no network access to download a Playwright-managed browser) — page
  rendered, `console --errors` equivalent (page + console listeners) returned
  zero errors. Screenshot compared visually against the reference and matches.

## Manual test steps for you

1. `npm run dev`, open `http://localhost:3000`.
2. Compare against `.agents/design/vertex-designsystem.png` section by
   section (numbered 01–14 in both).
3. Check button disabled states, badge colors, status indicator icons/colors,
   and the progress bar fill (35%) match the reference.
4. Resize the window narrower — note this page is NOT yet made responsive
   (CLAUDE.md section 3's mobile-adaptation requirement applies to the real
   app pages that consume these components, not necessarily this internal
   documentation page — flagging for your call, see below).

## Open question for you

CLAUDE.md section 3 requires every page to be responsive down to mobile.
The showcase page above is a documentation/reference page, not one of the
five app pages listed in section 1. Should I also make *this* page
responsive, or leave it desktop-only since it's scaffolding rather than a
shipped user-facing page, and apply the mobile requirement when I build the
actual catalog/course/lesson pages against these components?
