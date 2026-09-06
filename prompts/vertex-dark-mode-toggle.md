# Vertex: a dark mode toggle

## Goal

Give the learner a theme control in the top nav that switches between
**Light and Dark** — two icons, one click between them — and a dark palette
for the whole site. Light mode must stay pixel-identical to today. Nothing
about the theme reaches the server, Sanity, or the LLM — it is a per-browser
display preference.

## Scope note

Dark mode is not in CLAUDE.md section 1's build list, and section 3 says the
user supplies the design. You asked for it explicitly and chose the palette
approach, so this is built as a **token remap**, not a new visual language:
the design language, spacing, type, and component shapes are untouched, and
only the values behind the existing CSS variables change.

## Skills and docs read

- `CLAUDE.md` sections 3 (reuse existing components and Tailwind patterns;
  responsive down to mobile), 5 (server/client boundaries), 7 (presentational
  surfaces need no backend), 13 (checks).
- `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`
  — the official Next.js guide for exactly this. It supplies four things this
  prompt follows verbatim: the `<head>` inline script that sets `data-theme`
  on `<html>` **during HTML parsing, before first paint**; `suppressHydrationWarning`
  on `<html>`; the `InlineScript` helper that renders `type="text/javascript"`
  on the server and `text/plain` on the client so React does not warn about
  script tags; and the `useLayoutEffect` re-apply, because React Strict Mode's
  dev remount resets `<html>` to only the attributes it manages from JSX and
  wipes the one the script set. No `next-themes`, no new dependency.

## Code inspected

- [web/app/globals.css](../web/app/globals.css) — the whole design system is
  CSS custom properties on `:root`, re-exported through `@theme inline`. This
  is why dark mode is a ~40-line CSS change rather than `dark:` variants
  across 43 files.
- [web/app/layout.tsx](../web/app/layout.tsx) — `<html>` carries the font
  variables; `<body>` carries `bg-canvas text-neutral-900`; `ClerkProvider`
  wraps the children. There is no `<head>` today.
- [web/app/components/ui/Navigation.tsx](../web/app/components/ui/Navigation.tsx)
  — `TopNav` is a server component. The bell button on the right is the exact
  shape the toggle should copy: bare `<button>`, `text-neutral-900`,
  `hover:text-accent`, a 22px lucide icon at `strokeWidth={1.75}`, in a
  `gap-5` row.
- `TopNav` renders on all seven pages ([page.tsx](../web/app/page.tsx),
  [courses/page.tsx](../web/app/courses/page.tsx),
  [courses/[slug]](../web/app/courses/[slug]/page.tsx),
  [lessons/[slug]](../web/app/lessons/[slug]/page.tsx),
  [search](../web/app/search/page.tsx),
  [my-learning](../web/app/my-learning/page.tsx),
  [design-system](../web/app/design-system/page.tsx)), so one toggle covers
  the site.
- Token audit across `web/app/**/*.tsx`: 253 `neutral-*` uses, and every
  page/panel already on `bg-canvas` / `bg-surface` / `border-line`. Raw hex
  appears **only** in the design-system swatch labels. `@tailwindcss/typography`
  is not installed and
  [PortableTextBody.tsx](../web/app/components/portable-text/PortableTextBody.tsx)
  styles every block with explicit token classes, so lesson notes flip too.
- The 14 `bg-white` and 24 `text-white` uses — these are Tailwind built-ins,
  **not** theme tokens, so they will not flip on their own. Triaged below.

## Decisions and assumptions

**Tokens flip; components do not change.** Dark mode is a `[data-theme="dark"]`
block in `globals.css` that redefines the same variables, plus a
`prefers-color-scheme: dark` block guarded with `:root:not([data-theme="light"])`
so an explicit Light choice always wins over the OS. No component gets a
`dark:` variant. The `@theme inline` block stays exactly as it is.

**The neutral scale inverts.** `--color-neutral-900` becomes near-white in
dark mode. This reads backwards as a *name*, but it is what makes 253 existing
class uses correct for free, and the alternative — renaming the scale to
semantic tokens across every file — is a much larger, riskier diff for the
same pixels. A comment in `globals.css` will say so.

**The palette (warm dark, per your choice).** Derived from the existing warm
light surfaces (`#fbf8f5` / `#fdfcfa` / `#f3e8e1`) rather than the cool slate
neutrals, so the product keeps its character:

| token | light | dark |
| --- | --- | --- |
| `--color-canvas` | `#fbf8f5` | `#17120f` |
| `--color-surface` | `#fdfcfa` | `#1f1916` |
| `--color-line` | `#f3e8e1` | `#332a25` |
| `--color-accent` | `#e46d48` | `#f0805c` |
| `--color-neutral-900` | `#0f172a` | `#f5f1ee` |
| `--color-neutral-700` | `#33415c` | `#d6cec8` |
| `--color-neutral-500` | `#64748b` | `#a2958d` |
| `--color-neutral-300` | `#cbd5e1` | `#4a3f39` |
| `--color-neutral-200` | `#e2e8f0` | `#392f2a` |
| `--color-neutral-100` | `#f1f5f9` | `#292220` |
| `--color-neutral-50` | `#fafafc` | `#201a17` |
| `--color-neutral-0` | `#ffffff` | `#1f1916` |
| `--color-primary-500` | `#f97316` | `#fb8b3c` |
| `--color-primary-400` | `#fb923c` | `#fda45f` |
| `--color-primary-300` | `#fdba74` | `#c9752f` |
| `--color-primary-200` | `#fed7aa` | `#5c382b` |
| `--color-primary-100` | `#ffeee5` | `#3a241c` |
| `--color-lesson-100` | `#efedfa` | `#26224a` |
| `--color-lesson-500` | `#5b4fd6` | `#a99cf5` |
| `--color-success` | `#22c55e` | `#4ade80` |

The 100–300 tints invert direction because they are used as *fills behind*
text (badge and hover backgrounds), not as text. Every body and secondary text
pair must clear WCAG AA (4.5:1) against its surface; check `neutral-500` on
`canvas` and on `surface` specifically and nudge lighter if it misses.

**Shadows get their own dark values.** They are `rgba(15,23,42,…)` at 0.05–0.12
alpha — invisible on a dark canvas. Dark mode redefines all four with
`rgba(0,0,0,…)` at roughly triple the alpha, so cards still separate from the
page.

**`color-scheme` is set per theme** (`light` / `dark` on `:root`), so native
scrollbars, the `<select>` dropdown list in
[Input.tsx](../web/app/components/ui/Input.tsx), and form controls follow.

**The `bg-white` / `text-white` triage** — these are literal Tailwind colors:

- *Change to `bg-neutral-0`*: [Cards.tsx](../web/app/components/ui/Cards.tsx)
  L20, [Input.tsx](../web/app/components/ui/Input.tsx) L15/L24/L80,
  [BrowseCatalogBand.tsx](../web/app/components/search/BrowseCatalogBand.tsx)
  L32, and the design-system page's own panels. These are product surfaces and
  must flip. `neutral-0` rather than `surface`, because `neutral-0` is `#ffffff`
  in light mode and `surface` is `#fdfcfa` — only the former leaves light mode
  untouched.
- *Leave literal*: `bg-white/95` in
  [LessonPlayer.tsx](../web/app/components/lesson/LessonPlayer.tsx) L211 and
  `bg-white/90` in
  [VideoResultCard.tsx](../web/app/components/search/VideoResultCard.tsx) L62.
  Both are play-button scrims sitting on video artwork, which is the same
  image in either theme.
- *Leave literal*: all 24 `text-white`, which sit on the orange accent or
  primary fills. White on orange stays correct in both modes.

**A new `--color-ink` token, fixed at `#0f172a` in both themes**, for the marks
painted *onto* video artwork: the play glyphs, the `bg-neutral-900/35` scrim in
[LessonPlayer.tsx](../web/app/components/lesson/LessonPlayer.tsx), and the
timestamp pill in
[VideoResultCard.tsx](../web/app/components/search/VideoResultCard.tsx). A
thumbnail is the same picture in either theme, so these must not follow the
neutral inversion — otherwise the play triangle goes white on a white scrim.
`ink` is deliberately absent from the dark block.

**Two states, stored as `"light" | "dark"`** under the `localStorage` key
`vertex-theme`. There is no System state in the UI, but the OS still decides
the *first* visit: with nothing stored, the inline script resolves
`prefers-color-scheme`, and a `matchMedia` listener keeps following the OS
until the learner picks a side. From the first click on, their choice is stored
and the OS no longer has a say.

**The icon is chosen in CSS from the `data-theme` attribute, not from React
state.** The theme exists only in the browser, so rendering it would be a
guaranteed hydration mismatch and a flash of the wrong icon. Both icons are in
the markup and `globals.css` reveals one, so the server and client render
identically. With two states the choice and the resolved theme are the same
value, so one attribute serves both the colours and the icon.

**`localStorage`, not a cookie.** The Next.js guide notes a cookie read in the
root layout opts the whole app out of static prerendering. Every page here is
already server-rendered from Sanity, but the theme is a per-browser display
preference with no server consumer, so there is no reason to put it on every
request.

**A small client context, not prop drilling.** `ThemeProvider` (client) holds
the current choice and exposes `useTheme()`. `TopNav` stays a server component
and simply renders `<ThemeToggle />`, a client leaf. The provider goes in the
root layout so the choice is shared if a second control is ever added.

**Clerk's own UI is checked, not assumed.** Clerk v7.8.4's `appearance` prop
is already used in `TopNav`. During implementation, verify whether
`appearance={{ baseTheme: "dark" }}` is supported without adding
`@clerk/themes`. If it is, drive it from the theme context through a thin
client wrapper around `ClerkProvider`. **If it needs a new dependency, do not
add one** — leave Clerk's modal and `UserButton` popover in their default look
and flag it in the report as an open item for you to decide.

**Analytics: no new event.** CLAUDE.md section 7 lists the PostHog events to
instrument and a theme change is not one of them. Not added.

**Nothing crosses a boundary.** No Sanity schema, no query, no API route, no
token, no server code. `middleware` and the progress write path are untouched.

## Files expected to change

New:

- `web/app/components/ui/InlineScript.tsx` — the guide's server/client
  `type` switcher.
- `web/app/components/theme/ThemeProvider.tsx` — `"use client"`; context,
  `localStorage` read/write, `matchMedia` listener, and the `useLayoutEffect`
  dev re-apply.
- `web/app/components/theme/ThemeToggle.tsx` — `"use client"`; the nav button.
- `web/app/lib/theme.ts` — the storage key, the `Theme` type, the
  `applyTheme` DOM helper, and the inline-script source string, so the script
  and the React state read the same constants and cannot drift.

Modified:

- `web/app/globals.css` — the dark blocks and `color-scheme`.
- `web/app/layout.tsx` — `suppressHydrationWarning` on `<html>`, the `<head>`
  inline script, `ThemeProvider` around the tree.
- `web/app/components/ui/Navigation.tsx` — `<ThemeToggle />` beside the bell.
- `web/app/components/ui/Cards.tsx`,
  `web/app/components/ui/Input.tsx`,
  `web/app/components/search/BrowseCatalogBand.tsx`,
  `web/app/design-system/page.tsx` — `bg-white` → `bg-neutral-0`, and the
  video-artwork marks → `ink`.

## Requirements

1. **No flash.** On a hard load with dark selected, no light frame paints —
   the inline script runs in `<head>` during parsing.
2. **No hydration error** in the console, in dev or in a production build.
3. **Explicit beats system.** Choosing Light on a dark-OS machine gives light,
   and survives a reload.
4. **Every page works in dark**: home, catalog, course, lesson (player,
   sidebar, tabs, notes, resources, footer nav), search results (both card
   kinds, empty state, skeleton), My Learning, design system.
5. **Light mode is unchanged.** Diff the light rendering against the reference
   images; the only permitted light-mode change is the new nav button.
6. Responsive: the toggle sits in the row that is visible at mobile widths
   (the bell / auth cluster, not the `sm:`-hidden links).
7. Accessible: a real `<button>` whose accessible name reflects the current
   state (e.g. "Dark theme. Switch to light."), keyboard reachable, with the
   same `focus-visible` ring pattern used elsewhere in the nav.
8. `localStorage` access is wrapped in `try/catch` in both the inline script
   and the provider — private-mode browsers must still render.
9. AA contrast for text in dark mode, checked, not assumed.

## Security considerations

- The inline script is a fixed literal from `web/app/lib/theme.ts`. **No
  user input, no request data, and no template interpolation is ever
  concatenated into it** — it reads `localStorage` and writes one attribute.
- No secret, token, or env value goes near this feature. Nothing is sent to
  Sanity, the MCP, the LLM, or PostHog.
- No new dependency, so no new supply-chain surface.
- Note for the future: `dangerouslySetInnerHTML` in `<head>` needs a nonce if
  a strict CSP is ever added. There is no CSP in the project today.

## Acceptance criteria

- The nav shows a theme button on all seven pages; clicking switches between
  Light and Dark and the icon tracks the state.
- Reloading keeps the choice. Before any choice is made, the page follows the
  OS, including a change made while it is open.
- No flash and no hydration warning on a hard reload in either theme.
- Light mode is visually identical to the current build apart from the new
  button.
- `npm run typecheck`, `npm run lint`, and `npm run build` all pass in `web`.

## Checks to run

From `web`:

```powershell
npm run typecheck
npm run lint
npm run build
npm run dev
```

Studio is untouched — no schema deploy, no import, no MCP verification.

## Manual test steps

1. `npm run dev` in `web`, open `http://localhost:3000`.
2. Click the theme button to reach **Dark**. The page goes warm-dark, cards
   separate from the canvas, and all text stays readable.
3. Hard reload (Ctrl+Shift+R). The page paints dark immediately — **watch for
   a white frame; there must not be one.** Console shows no hydration error.
4. Click again to reach **Light**, then switch Windows to dark
   (Settings → Personalization → Colors). The page stays light — the explicit
   choice wins over the OS.
5. Clear `localStorage` for the site and reload with Windows on dark. The page
   should open dark, and follow a switch back to light without a reload —
   the first-visit behaviour.
6. In dark, walk every surface: `/courses`, a course page, a lesson page
   (play a video, open Notes and Resources, use the sidebar and footer nav),
   `/search` with a query (both card kinds), an empty-result query,
   `/my-learning`, and `/design-system`.
7. Narrow the window to ~375px on the lesson page. The toggle is still
   visible and tappable, and dark mode holds in the stacked layout.
8. Open the Clerk sign-in modal and the `UserButton` menu in dark. Note in the
   report whether they are themed or still light.
9. Switch back to Light and compare `/`, `/courses`, and a lesson page against
   the reference images — nothing but the new button should differ.
