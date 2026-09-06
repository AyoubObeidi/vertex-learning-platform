# Vertex: link the nav logo home and Explore Courses to the catalog

## Goal

Two navigation fixes reported by the user:

1. Clicking the Vertex logo in the top nav goes to the home page (`/`).
2. Clicking the **Explore Courses** button in the home hero goes to the all-courses page (`/courses`).

Nothing else changes: no restyling, no new components, no layout shifts.

## Skills and docs read

- `CLAUDE.md` (sections 2, 3, 5, 13) — prompt-first loop, no UI redesign, server/client boundaries.
- No Sanity/Clerk/MCP skill applies; this is presentational routing only.

## Code inspected

- [web/app/components/ui/Navigation.tsx](web/app/components/ui/Navigation.tsx) — `TopNav` renders `<Logo />` bare, with `Link` already imported and used for the "Courses" item.
- [web/app/components/ui/Logo.tsx](web/app/components/ui/Logo.tsx) — presentational mark + wordmark, no link. Also used by [web/app/design-system/page.tsx](web/app/design-system/page.tsx) where a link would be wrong.
- [web/app/components/home/Hero.tsx](web/app/components/home/Hero.tsx) — client component; `Explore Courses` is a `<Button variant="accent" size="lg">` that only fires `posthog.capture("explore_courses_clicked")` and navigates nowhere.
- [web/app/components/ui/Button.tsx](web/app/components/ui/Button.tsx) — renders a real `<button>`; no `as`/`href` support.
- [web/app/courses/page.tsx](web/app/courses/page.tsx) — the catalog route already exists at `/courses`.
- [web/app/page.tsx](web/app/page.tsx) — the home route.

## Decisions and assumptions

- **Keep `Logo` presentational.** Wrap it in a `next/link` `Link` inside `TopNav` only, so the design-system showcase still renders a plain mark. The link gets `aria-label="Vertex home"` and a focus ring consistent with the other nav links.
- **Do not add an `href`/polymorphic `as` prop to `Button`.** That is a wider refactor than this fix needs. Instead the hero renders a `Link` styled with the same accent/lg classes the button uses, so the visual result is pixel-identical to the current design reference. The `posthog.capture("explore_courses_clicked")` call stays on click, before navigation.
- The hero stays a client component (it already is, for the search field and PostHog).
- No PostHog event is added for the logo click — section 7 lists the engagement moments to instrument and a logo click is not one.

## Files expected to change

- `web/app/components/ui/Navigation.tsx`
- `web/app/components/home/Hero.tsx`

## Requirements

- Logo in `TopNav` is a link to `/`; it renders identically (same size, spacing, colours) and is keyboard reachable with a visible focus state.
- `Explore Courses` navigates to `/courses` via client-side routing, keeps its exact appearance (accent background, 62px height, arrow icon, hover brightness), and still captures `explore_courses_clicked`.
- No change to `Logo.tsx`, `Button.tsx`, or the design-system page.
- Responsive behaviour of the nav and hero is unchanged.

## Security considerations

None beyond the existing rules: both changes are presentational client-side navigation. No tokens, no new data access, no server routes touched.

## Acceptance criteria

- From any page with the top nav, clicking the Vertex logo lands on `/`.
- From the home page, clicking `Explore Courses` lands on `/courses`.
- Both are real links: middle-click / cmd-click opens a new tab, and the browser shows the target URL on hover.
- `Explore Courses` and the logo look exactly as they do today.

## Checks to run

In `web/`: type check, lint, and the dev server (no routes, config, or server modules change, so a production build is optional — run it anyway if lint/typecheck surprise us).

## Manual test steps

1. `npm run dev` in `web/`.
2. Open `http://localhost:3000`. Hover the Vertex logo — the status bar shows `/`. Click it from `/courses` and from a lesson page; each returns home.
3. On the home page, hover `Explore Courses` — status bar shows `/courses`. Click it; the catalog renders.
4. Tab through the nav: the logo takes focus with a visible ring before the "Courses" link.
5. With the PostHog debug toolbar (or network tab), confirm `explore_courses_clicked` still fires on the button click.
