# Implementation prompt: the lesson page

## Goal

Build `/lessons/[slug]` to match `.agents/design/vertex-lesson.png` exactly on
desktop, wired end to end to the seeded Sanity content, with the lesson's video
playing inside the page through the provider's own embed.

Scope:

- A new route `web/app/lessons/[slug]/page.tsx` (server component, prerendered).
- The left course sidebar: back link, course tile + progress, the module list
  with the current module expanded and the current lesson marked.
- The lesson header: breadcrumb, `LESSON 5.1` badge, title, description, meta
  chips, bookmark button.
- The video frame: poster still + play affordance that swaps to the provider
  embed, honouring a `?t=<seconds>` start parameter.
- The `Lesson Content` / `Notes` tabs, with Overview (Portable Text notes),
  "In this lesson you will", the Pro Tip box, and the Resources grid.
- The sticky Previous / Next lesson footer bar.
- One GROQ query extension + TypeGen regeneration.
- PostHog events for the engagement moments this page owns.
- Responsive down to mobile: the sidebar collapses, everything else stacks.

Out of scope (named so nothing creeps in):

- **Learner progress persistence.** CLAUDE.md section 7 puts progress in its own
  `progress` record written through a server route keyed by the Clerk user id.
  None of that exists yet. The sidebar renders the progress affordances in their
  zero state, exactly as `CourseProgressBar` already ships `percent={0}` on the
  course page.
- **Notes tab persistence.** CLAUDE.md section 7 lists the lesson Notes tab as
  presentational only.
- **Bookmark persistence.** Same reason — the course page's Bookmark button is
  already a PostHog event and nothing more.
- The `video` documents and transcript/chapter ingestion (section 9), the agent
  `context` document (section 10), and search (section 11).
- Any Studio schema change or content re-seed.

## Skills and docs read

- **CLAUDE.md** sections 1, 2, 3, 5, 6, 7, 8, 9, 12, 13, 14.
- **sanity-best-practices** `references/portable-text.md` — the `PortableText`
  component, the typed `PortableTextComponents` object, and the block / type /
  mark component categories.
- **`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`**
  — confirms `params` and `searchParams` are promises, and that reading
  `searchParams` in the page **opts the route into dynamic rendering at request
  time**. That single line drives decision 4 below.

## Code inspected

- `web/sanity/lib/queries.ts` — `LESSON_BY_SLUG_QUERY` already exists and
  already resolves the parent course by reverse reference. Its `modules[]`
  projection returns only `{_key, title, lessonIds}`, which is not enough for
  the design's sidebar (it needs every module's lesson titles, slugs, and
  durations, plus module durations). This query is extended, not replaced.
- `web/sanity.types.ts` — `LESSON_BY_SLUG_QUERY_RESULT` confirms the fields
  available today: `videoUrl`, `durationSeconds`, `freePreview`, `studentCount`,
  `keyPoints`, `notes` (`BlockContent`), `proTip`, `poster` (nullable),
  `resources[]{type,title,description,url}`.
- `studio/schemaTypes/documents/lesson.ts` — no `summary` field on a lesson, and
  `poster` is optional. `videoUrl` is validated against a YouTube / Vimeo /
  Bunny host allowlist.
- `studio/schemaTypes/objects/blockContent.ts` — the styles a renderer must
  cover: `normal`, `h2`, `h3`, `h4`, `blockquote`; lists `bullet` and `number`;
  marks `strong`, `em`, `code`, and a `link` annotation with `href`; plus an
  `image` member.
- `studio/seed/lib/build.mjs` and `seed/lib/text.mjs` — seeded lessons carry
  **no `poster`**, and their `notes` always open with an `h2` block followed by
  normal paragraphs. Inline marks are never produced by the seed, but the
  renderer still covers them because an author can add them in the Studio.
- `studio/seed/videos.json` — every seeded `videoUrl` is a real
  `https://www.youtube.com/watch?v=<id>` link with the video's real duration.
- `web/app/courses/[slug]/page.tsx`, `components/course/*` — the patterns to
  reuse: `sanityFetch` with a `tags` key, `generateStaticParams` with
  `fresh: true`, `generateMetadata`, `notFound()`, the breadcrumb markup, the
  numbered-circle + timeline module row, chip rows, and the PostHog call style.
- `web/app/globals.css` — the token set (`canvas`, `surface`, `line`, `accent`,
  `primary-100`, the `neutral-*` ramp, radii, shadows, `font-display`).
- `web/app/lib/format.ts` — `formatDuration`, `formatCount`, `formatLevel`,
  `pluralize` already exist and cover every number this page shows.
- `web/next.config.ts` — `remotePatterns` currently allows `cdn.sanity.io` only.
- `web/proxy.ts` — `clerkMiddleware()` with no route protection, so
  `/lessons/[slug]` is public. Correct per CLAUDE.md section 7 ("keep browsing
  public").
- `studio/sanity.cli.ts` — TypeGen reads `../web/**/*.{ts,tsx}` and writes
  `../web/sanity.types.ts`; run with `npm run typegen` from the repo root.

## Decisions and assumptions

1. **The sidebar rows are modules, not lessons.** The design's numbered rows
   ("Module 5 of 12", rows 1–12 titled *Introduction to Next.js*, *Data Fetching
   & Caching*, …) with a nested indented list under row 5 map onto
   `course.modules[]` with `modules[].lessons[]` nested. Every number in it —
   "Module 5 of 12", "Lesson 5.1", module durations — is derived from array
   order and `math::sum`, never stored, per CLAUDE.md section 8.

2. **The lesson description under the title is derived from the first paragraph
   of `notes`.** A lesson has no `summary` field, and adding one would mean a
   schema change plus re-authoring ~110 lessons — out of scope for "wired to the
   seeded content". The design itself shows the sub-line as a condensed restatement
   of the Overview's opening sentence, so deriving it is faithful rather than
   invented: take the plain-text projection of the first `normal` block of
   `notes`, trim to the first sentence, and cap at ~180 characters on a word
   boundary. If `notes` is empty the line is dropped entirely rather than filled
   with a placeholder.

3. **The Overview body is the lesson's `notes` Portable Text, rendered under a
   fixed "Overview" heading**, matching the design's label. Seeded notes open
   with their own `h2`, which renders beneath that label as a sub-heading —
   styled a step down so the hierarchy reads correctly rather than as two
   competing headings.

4. **`?t=<seconds>` is read in the client player, not in the page.** The Next
   docs are explicit that touching `searchParams` in the server page opts the
   whole route into dynamic rendering. The lesson page should prerender like the
   course page does, so the player is a client component that reads the value
   with `useSearchParams()` inside a `<Suspense>` boundary. This is the exact
   parameter CLAUDE.md section 7 reserves for search results linking into a
   video moment, so it is built now even though search is not.

5. **Playback is a poster facade in front of the provider's own player**, not a
   custom player (CLAUDE.md section 7 forbids one) and not a bare iframe on
   every page view. The frame renders a still with a play button; activating it
   mounts the provider `<iframe>` with `autoplay` and the start second. Arriving
   with a valid `?t=` skips the facade and mounts the iframe straight away. The
   controls are always the provider's. This buys three things: the design's dark
   still frame, no third-party player loaded until the learner asks for it, and
   an honest `lesson_video_played` moment for PostHog (section 7's "a video
   play"). *"How far it is watched"* needs the provider's player API and stays
   with the analytics work, not here.

6. **The still comes from the lesson `poster` when present, else the provider
   thumbnail, else a monogram tile on black.** Seeded lessons have no `poster`,
   so in practice this is YouTube's `https://i.ytimg.com/vi/<id>/hqdefault.jpg`
   — chosen over `maxresdefault.jpg` because that one 404s for any source below
   720p and `next/image` has no fallback for a dead remote URL. `hqdefault` is
   4:3 and always exists; `object-cover` in the 16:9 frame crops the letterbox
   bars away. This adds one `remotePatterns` entry for `i.ytimg.com`.

7. **All three providers get a playback case; only YouTube gets a thumbnail.**
   `web/app/lib/video.ts` parses a `videoUrl` into `{provider, id, embedUrl(),
   thumbnailUrl()}` for YouTube (`youtube.com/watch`, `youtu.be`,
   `youtube.com/embed`), Vimeo (`vimeo.com/<id>`, `player.vimeo.com/video/<id>`)
   and Bunny (`iframe.mediadelivery.net/embed/<lib>/<guid>`), matching the
   schema's host allowlist. Section 9's "not supported until ingestion and
   playback both exist" is about ingestion, which is a separate feature; adding
   the two extra playback cases now costs a few lines and stops the page from
   rendering a dead frame if an author pastes a Vimeo link. An unrecognised URL
   degrades to the poster frame with a "video unavailable" state, never a crash.

8. **Progress renders in its zero state.** No completion checkmarks are filled,
   the course tile reads "Not started" with a 0% bar, and only the current lesson
   carries the "Now playing" marker — which is derived from the URL, not from
   stored progress. The component takes `completedLessonIds: string[]` and
   `percentComplete: number` as props so wiring real progress later is a matter
   of passing real values, exactly as `CourseProgressBar` is set up.

9. **YouTube embeds use `youtube-nocookie.com`.** Same player, no cookie until
   playback, and it keeps the page from setting third-party tracking cookies on
   a view that never played anything.

10. **`?t=` is validated, not trusted.** Parsed as an integer, rejected unless
    finite and `>= 0`, and clamped to the lesson's `durationSeconds`. A dynamic
    segment or query value is user input; it is interpolated into an embed URL,
    so it is coerced to a number before it goes anywhere near one.

11. **The page is public.** `proxy.ts` protects nothing today and CLAUDE.md
    section 7 says keep browsing public. The `freePreview` flag is rendered as a
    label only — it grants and restricts nothing.

## Files

New:

- `web/app/lessons/[slug]/page.tsx` — server page: `generateStaticParams`,
  `generateMetadata`, the fetch, the derived position/prev/next, the layout.
- `web/app/lib/video.ts` — provider parsing, embed URL and thumbnail builders.
- `web/app/lib/lesson.ts` — derives the lesson's `{moduleIndex, lessonIndex,
  label, module, previous, next}` from the course's modules, and the
  first-paragraph description from `notes`.
- `web/app/components/lesson/LessonSidebar.tsx` — client (collapsible modules,
  responsive disclosure).
- `web/app/components/lesson/LessonPlayer.tsx` — client (facade → iframe,
  `useSearchParams`, `lesson_video_played`).
- `web/app/components/lesson/LessonTabs.tsx` — client (tab state; renders the
  Lesson Content panel it is handed and the presentational Notes panel).
- `web/app/components/lesson/LessonResources.tsx` — the resource card grid.
- `web/app/components/lesson/LessonFooterNav.tsx` — client (prev/next bar).
- `web/app/components/lesson/LessonViewTracker.tsx` — client (`lesson_viewed`).
- `web/app/components/portable-text/PortableTextBody.tsx` — the shared typed
  `PortableTextComponents` renderer, reusable for instructor bios later.

Changed:

- `web/sanity/lib/queries.ts` — extend `LESSON_BY_SLUG_QUERY`'s course
  projection (see below).
- `web/sanity.types.ts` — regenerated, not hand-edited.
- `web/next.config.ts` — add the `i.ytimg.com` remote pattern.
- `web/AGENTS.md` — if `next dev` re-adds the agent-rules block, it is committed
  with the work rather than reverted (CLAUDE.md's standing note).

Untouched: every existing component, the Studio schema, the seed, `proxy.ts`.

## Requirements

### Query

Extend only the `course` projection inside `LESSON_BY_SLUG_QUERY`, replacing
`"lessonIds": lessons[]._ref` with resolved lessons and adding `level`:

```groq
"course": *[_type == "course" && references(^._id)][0]{
  _id,
  title,
  "slug": slug.current,
  level,
  coverImage{ ...imageFragment },
  instructor->{ _id, name, "slug": slug.current, photo{...} },
  modules[]{
    _key,
    title,
    "durationSeconds": math::sum(lessons[]->durationSeconds),
    lessons[]->{ _id, title, "slug": slug.current, durationSeconds, freePreview }
  }
}
```

The comment above the query explaining the `lessonIds` index-of trick is updated
to describe the new shape. The caller still finds the current lesson by matching
`_id` against `course.modules[].lessons[]._id`.

### Page

- `generateStaticParams` uses `LESSON_SLUGS_QUERY` with `fresh: true`.
- The fetch is tagged `lesson:<slug>`.
- `notFound()` when the lesson is missing **or** when no course references it —
  a lesson with no parent has no breadcrumb, no sidebar, and no prev/next, so it
  is not a renderable page.
- `generateMetadata` returns `"<lesson title> — <course title> — Vertex"` and
  the derived description.
- Layout shell: `TopNav`, then a `flex` row — `<aside>` fixed at 278px with
  `border-r border-line`, sticky under the header and independently scrollable;
  `<main>` taking the rest with the content column capped at ~610px. Below `lg`
  the aside becomes a full-width collapsible disclosure above the content. The
  footer nav bar is sticky to the viewport bottom, full width, `border-t`.

### Sidebar

- "← Back to course" → `/courses/<course slug>`, accent, hover darkens.
- Course tile: 60px rounded tile — cover image via `urlFor`, else the title's
  first letter in `font-display` on `bg-neutral-900`. Title 15px semibold.
  Beneath it the progress line and a 3px `bg-neutral-200` track with an
  `bg-accent` fill, `role="progressbar"` with the aria value attributes.
- Header row: `Module <n> of <total>` with a chevron that collapses the list.
- Module rows: numbered circle (current module = filled `bg-accent` white text;
  completed = `border-line` with an accent check; otherwise `border-line`
  neutral), title 14px medium, duration under it 13px `neutral-500`, right-hand
  `ChevronDown` that rotates when expanded. The connecting timeline line reuses
  the absolute-positioned rule from `CourseContent`.
- The current module starts expanded and is tinted; any module can be expanded
  by clicking. Expanding a module captures `module_expanded` for consistency
  with the course page.
- Lesson rows inside an expanded module: a small marker dot (filled accent for
  the current lesson, hollow `border-neutral-300` otherwise), the title, the
  duration under it, and for the current lesson the accent "Now playing" label
  plus the filled accent play button on the right. Every other lesson is a
  `Link` to its own lesson page. The current lesson gets `aria-current="page"`.

### Header

- Breadcrumb `All Courses / <course> / <module> / <lesson>`, same markup and
  sizes as the course page, with the course and All Courses segments linked and
  the lesson segment `aria-current="page"`.
- `LESSON <m>.<l>` badge: `bg-primary-100 text-accent`, 11px semibold, uppercase,
  `tracking-[0.12em]`, `rounded-md`.
- `h1` in `font-display`, ~46px desktop, scaling down on small screens.
- The derived description, 17px `neutral-700`, `max-w-[520px]`.
- Meta chips reusing the course page's chip shape: `Clock` + `formatDuration`,
  `BarChart3` + `formatLevel(course.level)`, `Users` +
  `formatCount(studentCount)` + " students". Each chip drops when its value is
  null. A `Free preview` badge renders when `freePreview` is set.
- Bookmark button: 44px square, `border-line bg-surface rounded-[10px]`,
  `Bookmark` icon, `aria-label="Bookmark this lesson"`, captures
  `lesson_bookmarked`.

### Player

- `aspect-video w-full rounded-xl overflow-hidden bg-neutral-900`.
- Facade: the still under a subtle dark scrim, a centred play button, and the
  lesson title as the `img` alt. The whole facade is one `<button>` with an
  accessible name of `Play <lesson title>`.
- Activating it (or a valid `?t=`) renders the iframe with `title`, `allow`
  covering `autoplay; encrypted-media; picture-in-picture; fullscreen`,
  `allowFullScreen`, `referrerPolicy="strict-origin-when-cross-origin"`, and
  `loading="lazy"`.
- No custom controls, no progress bar, no scrubber — the design's control strip
  is the provider's chrome and is not reimplemented.
- Unparseable `videoUrl`: the frame renders with a short "This video cannot be
  played here" line and a link out; it never throws.

### Tabs and content

- Two tabs with correct roles: `role="tablist"`, `role="tab"` with
  `aria-selected` and `aria-controls`, `role="tabpanel"`. Selected tab is accent
  with a 2px accent underline; the other is `neutral-500`. A `border-b
  border-line` runs the full width beneath them.
- **Lesson Content** panel, in order:
  - `Overview` heading (`font-display`, 20px semibold) + the `notes` Portable
    Text through `PortableTextBody`.
  - A hairline rule.
  - `In this lesson you will:` + `keyPoints` as a list, each with an accent
    `CheckCircle2`, 15px `neutral-700`. The whole block is skipped when
    `keyPoints` is empty.
  - The Pro Tip panel: `bg-primary-100`-toned surface, `rounded-lg`, a
    `Lightbulb` icon in accent, "Pro Tip" 14px semibold, the text 14px
    `neutral-700`. Skipped when `proTip` is null.
  - A hairline rule, then `Resources`: a 3-column grid (2 at `sm`, 1 on mobile)
    of cards — `border-line bg-surface rounded-lg`, an icon chosen from the
    resource `type` (`documentation`/`article` → `FileText`, `code` → `Github`
    fallback `Code2`, `download` → `Download`, `video` → `PlayCircle`), the
    title 13px semibold, the description 12px `neutral-500`, and an
    `ExternalLink` glyph. Each card is an `<a target="_blank" rel="noreferrer
    noopener">` capturing `lesson_resource_clicked`. Skipped when empty.
- **Notes** panel: presentational per CLAUDE.md section 7 — a labelled textarea
  with placeholder copy and an explicit "Notes are not saved yet" line, so it
  never looks like it persisted something it did not.

### Portable Text renderer

A typed `PortableTextComponents` object covering every style `blockContent`
allows — `normal`, `h2`, `h3`, `h4`, `blockquote`, `bullet`, `number`, `strong`,
`em`, `code`, the `link` annotation (external links get `rel="noreferrer
noopener"` and `target="_blank"`), and the `image` member rendered through
`next/image` + `urlFor` with its `alt`. Styling matches the design's prose:
17px/1.75 `neutral-700` body, accent-free headings in `font-display`.

### Footer nav

Sticky bottom bar, `bg-surface border-t border-line`. Left: an outlined
"← Previous Lesson" `Link` plus the previous lesson's title and duration.
Right: the next lesson's title and duration plus an accent "Next Lesson →"
`Link`. Prev/next cross module boundaries — the course's lessons flattened in
module order. At either end the corresponding side is omitted (not a disabled
button that goes nowhere). Both capture `lesson_nav_clicked` with a `direction`.
On mobile the two sides stack and the titles are truncated.

### Analytics

Reusing the existing naming style (`course_started`, `lesson_clicked`,
`module_expanded`):

| Event | When | Properties |
| --- | --- | --- |
| `lesson_viewed` | page mount | lesson slug/title, course slug/title, module index, lesson label, duration |
| `lesson_video_played` | facade activated or `?t=` autostart | lesson slug, provider, `start_seconds`, `autostarted` |
| `lesson_tab_changed` | tab click | `tab`, lesson slug |
| `lesson_resource_clicked` | resource card click | resource title, type, url host, lesson slug |
| `lesson_nav_clicked` | prev/next click | `direction`, from/to lesson slug |
| `lesson_bookmarked` | bookmark click | lesson slug/title, course slug |
| `module_expanded` | sidebar module expanded | matches the course page's payload |

## Security considerations

- Content is read server side through `sanityFetch`; the read token stays in
  `sanity/lib/token.ts` behind `server-only`. No client component fetches Sanity
  and the browser never sees a token.
- Nothing on this page writes. No progress, note, or bookmark is persisted, so
  no write token is introduced and no server route is added.
- `?t=` is coerced to an integer, rejected if negative or non-finite, and
  clamped to the lesson duration before it is put in an embed URL.
- The `[slug]` param is only ever used as a GROQ query parameter, never
  interpolated into the query string.
- Every outbound link (`resources[].url`, the provider fallback link) uses
  `target="_blank" rel="noreferrer noopener"`.
- The iframe is a third-party embed with a narrow `allow` list, no
  `allow-same-origin` needs, `youtube-nocookie.com` for YouTube, and a
  `strict-origin-when-cross-origin` referrer policy.
- `i.ytimg.com` is added to `remotePatterns` scoped to `pathname: "/vi/**"` so
  the image optimiser cannot be pointed at arbitrary paths on that host.
- The page stays public; no Clerk gating is added and `proxy.ts` is untouched.

## Acceptance criteria

1. `/lessons/<any seeded lesson slug>` renders with real seeded data: real
   title, real duration, real student count, real notes, real key points, real
   pro tip, real resources.
2. Desktop matches the reference image: sidebar widths, the numbered module
   list with the current module expanded and the current lesson marked "Now
   playing", the badge, the serif title, the meta chip row, the 16:9 video
   frame, the two tabs, Overview / key points / Pro Tip / Resources, and the
   sticky prev/next bar.
3. Clicking the video plays it **on the page** in the provider's player. The
   learner is never sent to YouTube.
4. `/lessons/<slug>?t=125` starts the video at 2:05 without a click.
5. "Lesson 5.1", "Module 5 of 12", every duration, and every count are derived —
   `grep` finds no such value stored in the schema or the seed.
6. Sidebar lesson links, breadcrumb links, back-to-course, and prev/next all
   navigate correctly, including across module boundaries.
7. The first lesson of a course shows no Previous side; the last shows no Next.
8. At 375px wide the page is usable: nothing overflows horizontally, the sidebar
   is a collapsed disclosure, the footer bar stacks.
9. Keyboard: every control is reachable and has a visible focus ring; the tabs
   expose the correct ARIA roles; the play facade announces the lesson title.
10. No token, no Sanity client, and no MCP call reaches the browser bundle.

## Checks to run

From the repo root:

1. `npm run typegen` — regenerates `web/sanity.types.ts` for the extended query.
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build:web` — routes, config, and server modules all changed, so the
   production build is required (CLAUDE.md section 13).
5. `npm run dev:web` for the manual pass below.

No Studio deploy or import is needed: no schema and no content changed.

## Manual test steps

1. `npm run dev:web`, open `http://localhost:3000/courses/nextjs-for-production`.
2. Click any lesson in an expanded module. The lesson page opens with that
   lesson's real title and its module's name in the breadcrumb.
3. Confirm the badge reads `LESSON <module>.<lesson>` matching the sidebar
   position, and the sidebar header reads `Module <n> of <total>` with that
   module expanded and this lesson marked "Now playing".
4. Click the video still. It plays inline in the YouTube player; the tab does
   not navigate away.
5. Reload with `?t=125` appended. The video mounts already playing at 2:05.
6. Reload with `?t=-5` and `?t=abc`. Both fall back to the facade at 0s with no
   error.
7. Read the Overview, key points, Pro Tip, and Resources against the same
   lesson in the Studio — every value matches, nothing is invented.
8. Click a resource card. It opens in a new tab.
9. Switch to Notes. It shows the placeholder and states that notes are not
   saved.
10. Use the footer bar to walk from the course's first lesson to its last.
    Previous is absent on the first, Next absent on the last, and the transition
    between module 1's last lesson and module 2's first works.
11. Click "Back to course" — lands on the course page.
12. Narrow the window to 375px. The sidebar collapses to a disclosure, the video
    stays 16:9, the resource grid becomes one column, the footer stacks, and
    there is no horizontal scrollbar.
13. Tab through the page from the top: nav, back link, sidebar rows, bookmark,
    play, tabs, resources, footer buttons — all focusable with a visible ring.
14. In PostHog's live events, confirm `lesson_viewed` on load and
    `lesson_video_played` on play.

---

## Correction after the first pass: design scale

The first implementation was built to measurements read straight off
`vertex-lesson.png` at its pixel size. That was wrong, and the page came out
about 15% too narrow everywhere.

The PNG is 1024px wide but is a **downscaled export of a 1200px artboard**
(factor 0.853), with ~48px of artboard bleed on the left. Calibrated against
body-copy line pitch: 23px in the PNG ÷ 0.853 = 27px, which is the CSS
line-height the design intends.

The real page is therefore a **1115px viewport**, and every measurement below is
the PNG value ÷ 0.853, with the page origin at PNG x=48:

| | PNG px | Real px |
| --- | --- | --- |
| Page width | 960 | **1115** |
| Sidebar (to its right border) | 267 | **315** |
| Content column | 608 | **712** |
| Content padding, each side | 37 | **44** |
| Header height | 85 | **100** |
| Sidebar marker column centre | 34 | **40** |
| Sidebar title column | 63 | **74** |
| Module row pitch | 66 | **78** |

Changes this drove:

- Sidebar `lg:w-[315px]` (was 278px).
- Content column `max-w-[800px] px-11`, left-aligned in the main area, giving a
  712px measure at 1115px with symmetric 44px gutters.
- `TopNav` gained a `width="full"` variant: the lesson page is a full-bleed app
  shell, so its nav runs the whole width with `px-8` and a 100px bar, instead of
  the 890px centred column and 96px bar the catalog and course pages use. The
  default `width="column"` is byte-for-byte the old markup, so those pages are
  untouched.
- The sidebar's module and lesson rows now share one grid — `pl-6` + a 32px
  marker box + an 18px gap — so markers sit on the 40px timeline and every
  title, module or lesson, starts at 74px. Lesson rows were previously indented
  past the module titles.
- Module/lesson durations 12px → 13px; module titles all semibold; the lesson
  description 16px/29 → 16px/31.
- Sidebar and footer backgrounds `surface` → `canvas`: the design has one
  uniform ground with hairline borders, not tinted panels.

Verified by rendering at 1115px in headless Chrome and overlaying against the
design upscaled to the same scale. Breadcrumb, badge, h1, description, meta
chips, video frame edges, bookmark button, sidebar border, timeline, markers,
titles, resource cards and footer all land on the design's positions.

## Follow-up: centring the content column

At the design's 1115px the content column exactly fills the space beside the
315px sidebar, so nothing revealed this — but on a wider screen the column stayed
left-aligned and the video sat hard against the sidebar with a large empty
gutter on the right.

The content wrapper and the footer nav's inner row both gained `mx-auto` (the
footer also gained the same `max-w-[800px]` cap), so the lesson column — video
included — centres in the main area at any width, and the Previous/Next controls
stay aligned under it instead of drifting to the screen edges.

At 1115px this is a no-op: an 800px box centred inside an 800px container does
not move. Verified pixel-identical above the sticky footer; at 1920px the video
frame centres on x=1117 against a main-area centre of x=1118.
