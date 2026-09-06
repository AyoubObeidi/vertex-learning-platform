# Responsive nav on mobile, and light as the default theme

## Goal

Two fixes, both reported from a phone screenshot of the lesson page:

1. The top nav overflows on mobile. "Sign in" wraps onto two lines, and
   `Courses` / `My Learning` are hidden below `sm` with nothing replacing them,
   so a phone has no route to either page.
2. Dark mode currently wins on a first visit whenever the OS asks for dark.
   Light should be the default instead; dark stays one tap away on the toggle.

Desktop must not change. CLAUDE.md section 3: the reference design is the source
of truth, there is no mobile reference, so mobile adapts sensibly while the
desktop layout stays exact.

## What I read

- `web/app/components/ui/Navigation.tsx` — one shared `TopNav`, used by every
  page (`/`, `/courses`, `/courses/[slug]`, `/lessons/[slug]`, `/my-learning`,
  `/search`, `/design-system`), in a `column` and a `full` width variant. It is a
  server component; `ThemeToggle` and the Clerk buttons are the client islands.
- `web/app/components/ui/Logo.tsx` — `size` is `"sm" | "md"`; `"sm"` is used on
  the design-system page, so the prop has to keep working.
- `web/app/components/theme/ThemeProvider.tsx`, `ThemeToggle.tsx`,
  `web/app/lib/theme.ts` — the theme is a `localStorage` value plus a
  `data-theme` attribute written by an inline script before first paint.
- `web/app/globals.css` — dark values live behind `[data-theme="dark"]`, with two
  `@media (prefers-color-scheme: dark)` blocks as the no-JavaScript fallback
  (the palette at lines ~203-242, the toggle icons at lines ~266-272).

## Why the nav overflows

Measured at a 390px viewport, the bar needs roughly:

| part | width |
| --- | --- |
| `px-5` padding, both sides | 40px |
| logo (28px mark + 10px gap + "Vertex" at 25px bold) | ~116px |
| theme toggle, bell, Sign in, Sign up + three `gap-5` gaps | ~236px |
| **total** | **~392px** |

That is over the viewport, so the flex row wraps the narrowest text child —
"Sign in". The gaps and the bell are the affordable savings.

## Decisions and assumptions

Confirmed with the user:

1. **Mobile nav pattern** — a hamburger holds `Courses` and `My Learning`; the
   auth buttons stay visible in the bar so signing in is still one tap. The bell
   moves into the menu, since notifications are presentational only (CLAUDE.md
   section 7) and it is the cheapest 34px to reclaim.

Assumptions:

2. "Light is the default" means the OS preference no longer has a say. A stored
   choice still wins, so a learner who picks dark keeps dark across visits.
   `systemTheme()` becomes dead code and goes with it.
3. The two `prefers-color-scheme` fallback blocks in `globals.css` go too. They
   are what makes a no-JavaScript visitor on a dark OS get dark, which is exactly
   the behaviour being removed. Without them the no-JS default is light, matching
   the JS default.
4. Breakpoint stays `sm` (640px), the one the nav already uses. No new breakpoint.
5. Target down to 320px. Below `sm` the bar tightens to `gap-2`, the logo drops to
   its small size, and the Sign up button drops to `h-9 px-3` — about 316px of
   content at 320px, so nothing wraps.
6. The menu is a disclosure below the bar, not a full-screen overlay. It is two
   links and a bell; an overlay would be more machinery than the content needs.

## Files I expect to touch

- `web/app/components/ui/MobileNavMenu.tsx` — **new**, a client component: the
  hamburger button and its panel. Client because it holds open/closed state, the
  same reason `ThemeToggle` is one.
- `web/app/components/ui/Navigation.tsx` — responsive gaps and sizes, the bell
  hidden below `sm`, `whitespace-nowrap` on "Sign in", the menu mounted `sm:hidden`.
- `web/app/components/ui/Logo.tsx` — add a `"responsive"` size that is small below
  `sm` and today's `md` at `sm` and up. `"sm"` and `"md"` keep their exact current
  output so the design-system page is untouched.
- `web/app/lib/theme.ts` — `currentTheme()` falls back to `"light"`;
  `THEME_SCRIPT` drops its `matchMedia` branch; `systemTheme()` removed.
- `web/app/components/theme/ThemeProvider.tsx` — drop the effect that follows the
  OS while no choice is stored.
- `web/app/globals.css` — remove the two `prefers-color-scheme` fallback blocks
  and correct the comments that describe the old behaviour.

## Requirements

1. At `sm` and above, the rendered nav is unchanged: same heights (`h-20`,
   `sm:h-24` / `sm:h-25`), same `gap-11` links, same `gap-5` right cluster, same
   logo, same bell, same button sizes.
2. Below `sm`: nothing wraps and nothing overflows at 320, 360, 390 and 430px.
3. `Courses` and `My Learning` are reachable on a phone.
4. The hamburger is a real button: `aria-expanded`, `aria-controls`, an accessible
   name, closes on Escape and on navigation, and is keyboard operable.
5. First visit on a dark-OS machine renders light, with no flash of dark.
6. The toggle still switches to dark, and the choice survives a reload.
7. No hydration mismatch: the server and client markup stay identical, which is
   why the toggle keeps choosing its icon in CSS rather than from React state.

## Security considerations

- Client-only presentation. No new data fetching, no new route, no token, no
  write path — the server/client boundary in CLAUDE.md section 5 is untouched.
- `THEME_SCRIPT` stays a fixed literal with no interpolated request data. It gets
  shorter, not more dynamic.
- The theme preference stays in `localStorage`, never a cookie, so it still never
  reaches the server, Sanity, the MCP or PostHog, and the app stays prerenderable.
- The menu renders a fixed pair of internal links. Nothing is built from user
  input or from content.

## Acceptance criteria

- No horizontal overflow or wrapped nav text at 320/360/390/430px on every page
  that renders `TopNav`, in both nav widths.
- Desktop nav is visually identical to before at 640px and above.
- The hamburger opens and closes by mouse and keyboard, closes on Escape, and its
  links navigate.
- A browser set to dark OS, with no stored choice, loads light — including on a
  hard reload with an empty `localStorage`.
- Toggling to dark still works and persists.
- Disabling JavaScript renders light rather than dark.
- Typecheck, lint and build all pass.

## Checks to run

- `npm run typecheck --workspace web`
- `npm run lint --workspace web`
- `npm run build --workspace web` (a new component and a changed inline script)
- Dev server, checked at the four widths above.

## Manual test steps (for the user)

1. Open any page at a phone width. Nothing wraps; the bar is one line.
2. Tap the hamburger, confirm `Courses`, `My Learning` and the bell, and that a
   link navigates and the panel closes.
3. Press Escape with the panel open; it closes.
4. Resize to desktop and confirm the nav looks exactly as it did.
5. Set the OS to dark, clear site data, hard reload: the site is light.
6. Toggle to dark, reload: still dark.

## Out of scope

- The `Previous Lesson` / `Next Lesson` footer buttons in the screenshot sit
  oddly at that width. Not part of either request; flagged, not changed.
- Search remains broken for the upstream reason recorded in the deployment prompt.
