# Implementation prompt: Sanity content model, Studio, and the web read/data layer

## Goal

Two things, in one slice:

1. **Content + Studio.** Model `course`, `module` (embedded object), `lesson`,
   `instructor`, `category` exactly as CLAUDE.md section 8 specifies, and stand
   the Sanity Studio up as its own workspace so authors can create that content.
2. **Server-side read layer.** A server-only Sanity client, a `sanityFetch`
   helper, an image URL builder, and the typed GROQ queries the catalog, course,
   lesson, and instructor pages will read from — plus TypeGen wiring so those
   queries produce types.

Out of scope, deliberately: the `video` documents (section 9), the agent
`context` document (section 10), `progress` (section 7), and rendering any of
this on a page. No page currently wired to placeholder data changes.
`app/lib/placeholder-courses.ts` stays until the catalog slice replaces it.

## Skills and docs read

- **CLAUDE.md** sections 1, 2, 5, 6, 7, 8, 12, 13, 14.
- **sanity-best-practices** (`~/.claude/skills/sanity-best-practices/`):
  `SKILL.md` global rules, `references/schema.md`, `references/project-structure.md`,
  `references/typegen.md`, `references/nextjs.md`, `references/groq.md`,
  `references/image.md`.
- **`node_modules/next/dist/docs/`**: `01-app/01-getting-started/06-fetching-data.md`
  and `08-caching.md` — this project has `cacheComponents` **off**, so the
  Cache Components / `use cache` model does not apply and the previous model
  (`next: { revalidate, tags }` on fetch) is the correct one here.
- `node_modules/next/dist/server/lib/generate-agent-files.js` — read to predict
  what `next dev` writes once the app moves into `web/` (see "The AGENTS.md
  block" below).

## Code inspected before implementing

- `package.json` — Next 16.3.4, React 19.2.8, `sanity` 5.31.2, `@sanity/vision`
  5.31.2, `next-sanity` 13.3.4, `@sanity/image-url` 2.1.1, `@clerk/nextjs`
  7.8.4, `lucide-react`, Tailwind v4 via `@tailwindcss/postcss`. No test runner.
  Scripts: `dev`, `build`, `start`, `lint` (`eslint`, no `typecheck` script).
- Installed transitively and confirmed present: `@sanity/icons` 3.8.0,
  `@portabletext/react` 6.2.0, `groq` 5.31.2, `server-only` 0.0.1,
  `@sanity/client` 7.26.2. `@tailwindcss/typography` is **not** installed.
- `sanity.config.ts` / `sanity.cli.ts` / `sanity/` / `app/studio/[[...tool]]/page.tsx`
  — the untracked output of `npm create sanity` in embedded mode: empty
  `schema.types` array, default `structure.ts`, a CDN `client.ts` with no token,
  `image.ts`, and a `live.ts` calling `defineLive`.
- `app/` — home page, design-system page, Clerk sign-in/sign-up routes,
  `components/ui/*` and `components/home/*`, `lib/placeholder-courses.ts`
  (whose header comment already says "replace with a GROQ query against the
  Sanity course documents once the content model exists").
- `proxy.ts` — Clerk middleware at the Next 16 `proxy.ts` filename.
- `tsconfig.json` — `paths: {"@/*": ["./*"]}`, `include` is repo-root relative.
- `.env.local` — has `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`
  and the Clerk keys. **No `SANITY_API_READ_TOKEN`.**
- `.gitignore` — ignores `.env*` with no `!.env.example` exception; there is no
  `.env.example` in the repo yet, which CLAUDE.md section 12 asks for.
- `prompts/vertex-design-system.md`, `prompts/vertex-home-page.md` — for format.

## Decisions and assumptions

1. **Workspace split (answered by the user).** Restructure to `studio/` + `web/`
   per CLAUDE.md section 5 and `project-structure.md`. The embedded Studio route
   is deleted. This is the largest part of the diff and it moves the whole
   Next.js app.
2. **npm workspaces at the repo root.** Root `package.json` declares
   `workspaces: ["web", "studio"]` plus convenience scripts; one lockfile, one
   `npm install`. The skill says workspace tooling is optional — I am using it
   because the repo already has a single root lockfile and `node_modules`.
   Studio auto-updates are a `sanity.cli.ts` (`autoUpdates`) deploy concern and
   are unaffected by hoisting.
3. **No Live Content API.** I delete `live.ts` rather than port it.
   `defineLive`'s browser token would put a Sanity token in the browser, which
   CLAUDE.md section 5 forbids outright. Caching is tag-based revalidation
   through the `sanityFetch` helper instead. If live preview is wanted later it
   is a separate slice with a server-token-only configuration.
4. **`module` is an embedded object named `courseModule`.** CLAUDE.md section 8
   says a module is not its own document. `courseModule` avoids colliding with
   the JS/TS `module` keyword in generated type names.
5. **Durations are stored as integer seconds** (`durationSeconds`), not as
   `"18h 24m"` strings. Seconds sort, sum, and format; the display strings in
   the design are derived in the frontend. Course duration is **derived** by
   summing its lessons, not stored.
6. **The numbers in the UI are derived, never stored** — "Module 5",
   "Lesson 5.1", module count, lesson count all come from array order and
   `count()`, per CLAUDE.md section 8.
7. **`level` is `options.list` + radio, not free text** (`beginner` /
   `intermediate` / `advanced`), per `schema.md` section 4C.
8. **`popular` and `freePreview` stay booleans** because CLAUDE.md section 8
   names them as flags. This is the one deliberate deviation from
   `schema.md`'s "prefer a list over a boolean" guidance.
9. **The learning-outcome `icon` is a constrained string list**, not free text,
   so the frontend maps a known value to a `lucide-react` icon. Storing a name
   from a fixed vocabulary is data; storing a class name or a colour would be
   presentation.
10. **Rich text is one shared `blockContent` Portable Text type** used by lesson
    notes and instructor bio. No markdown anywhere, per section 7.
11. **`lesson` does not store its parent course.** The course/module/lesson
    labels are resolved with a reverse reference (`*[_type == "course" &&
    references(^._id)]`), per CLAUDE.md section 8.
12. **The read client is server-only.** `import 'server-only'` at the top of
    `web/sanity/lib/client.ts`, the token read from `SANITY_API_READ_TOKEN`
    (never `NEXT_PUBLIC_`), `perspective: 'published'`, `stega: false`.
    `image.ts` stays importable from the browser — it only needs projectId and
    dataset, no token.
13. **TypeGen runs from the Studio** (`studio/sanity.cli.ts`), reading queries
    from `../web/**` and writing `web/sanity.types.ts`. Generated types are
    committed (skill option A) so the app type-checks straight after a clone.
14. **`.env.example` is committed** at the repo root as the canonical key list,
    with a `!.env.example` exception added to `.gitignore`.
15. **Video URL validation** accepts YouTube, Vimeo, and Bunny hosts only —
    the three providers CLAUDE.md section 9 supports — as a `warning`, not an
    `error`, so an author is never hard-blocked by a host we forgot.

## Target file layout

```
/                          # repo root
├── package.json           # NEW: npm workspaces + dev scripts
├── .env.example           # NEW: canonical env key list
├── CLAUDE.md, prompts/, .agents/, .claude/   # unchanged, stay at root
├── studio/                # NEW workspace
│   ├── package.json, sanity.config.ts, sanity.cli.ts, tsconfig.json
│   ├── .env               # SANITY_STUDIO_* (gitignored)
│   ├── structure.ts
│   └── schemaTypes/
│       ├── index.ts
│       ├── documents/{course,lesson,instructor,category}.ts
│       └── objects/{courseModule,learningOutcome,lessonResource,blockContent}.ts
└── web/                   # the Next.js app, moved wholesale
    ├── package.json, next.config.ts, tsconfig.json, postcss.config.mjs,
    │   eslint.config.mjs, proxy.ts, next-env.d.ts, AGENTS.md
    ├── .env.local         # moved from root (gitignored)
    ├── app/, public/
    ├── sanity.types.ts    # generated, committed
    └── sanity/
        ├── env.ts         # public config values
        └── lib/{token.ts,client.ts,fetch.ts,image.ts,queries.ts}
```

Files deleted: root `sanity.config.ts`, root `sanity.cli.ts`, root `sanity/`,
`app/studio/[[...tool]]/page.tsx`, `sanity/lib/live.ts`, root `tsconfig.tsbuildinfo`.

## The content model

### `category` (document, `TagIcon`)
`title` (string, required) · `slug` (slug from title, required) ·
`description` (text, 3 rows).

### `instructor` (document, `UserIcon`)
`name` (string, required) · `slug` (required) · `photo` (image, `hotspot: true`,
with a required-warning `alt` field) · `expertise` (array of string, unique) ·
`bio` (`blockContent`).
Preview: name + first expertise entry, media = photo.

### `lesson` (document, `PlayIcon`)
`title` (string, required) · `slug` (required) · `videoUrl` (url, required,
scheme http/https, warns if the host is not YouTube / Vimeo / Bunny) ·
`poster` (image, hotspot, alt) · `durationSeconds` (number, required, integer,
positive) · `freePreview` (boolean, default `false`) · `studentCount` (number,
integer, min 0) · `notes` (`blockContent`) · `keyPoints` (array of string,
max 6 — the "in this lesson you will" list) · `proTip` (text, optional) ·
`resources` (array of `lessonResource`).
Preview: title + formatted duration, media = poster.

### `course` (document, `BookIcon`)
`title` (string, required) · `slug` (required) · `summary` (text, required,
max 200 warning) · `coverImage` (image, hotspot, alt) · `level` (string, radio
list: beginner / intermediate / advanced, required) · `price` (number, min 0) ·
`popular` (boolean, default `false`) · `studentCount` (number, integer, min 0) ·
`learningOutcomes` (array of `learningOutcome`, max 6) ·
`instructor` (reference → instructor, required) ·
`category` (reference → category, required) ·
`modules` (array of `courseModule`, min 1).
Preview: title + instructor name, media = coverImage.

### `courseModule` (object, `BlockContentIcon`)
`title` (string, required) · `summary` (text) · `lessons` (array of reference →
lesson, min 1). Preview shows the title and the lesson count.

### `learningOutcome` (object)
`icon` (string, radio/dropdown from a fixed vocabulary — `zap`, `layers`,
`shield`, `rocket`, `code`, `database`, `gauge`, `git-branch`) ·
`title` (string, required) · `description` (text, required).

### `lessonResource` (object, `LinkIcon`)
`type` (string list: `article`, `documentation`, `code`, `download`, `video`) ·
`title` (string, required) · `description` (text) · `url` (url, required).

### `blockContent` (object → array of Portable Text)
Standard block type: normal/h2/h3/h4/blockquote styles, bullet + number lists,
strong/em/code decorators, link annotation (url, validated) — plus an inline
`image` member with hotspot and alt.

## The Studio workspace

- `studio/package.json`: `sanity`, `@sanity/vision`, `react`, `react-dom`,
  `styled-components` as dependencies; scripts `dev` (`sanity dev`), `build`,
  `deploy`, `typegen` (`sanity schemas extract --force --enforce-required-fields
  && sanity typegen generate`).
- `studio/sanity.config.ts`: `defineConfig` with `projectId`/`dataset` from
  `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET`, `name: 'vertex'`,
  `title: 'Vertex'`, plugins `structureTool({structure})` and
  `visionTool({defaultApiVersion})`. **No `basePath`** — that was only needed by
  the embedded route.
- `studio/sanity.cli.ts`: `defineCliConfig` with `api`, `autoUpdates: true`,
  and `typegen: { enabled: true, path: '../web/**/*.{ts,tsx}', schema:
  'schema.json', generates: '../web/sanity.types.ts', overloadClientMethods: true }`.
- `studio/structure.ts`: a "Content" list — Courses, Lessons, Instructors,
  Categories — instead of the default auto-list, so the ordering is deliberate.
- `studio/schemaTypes/index.ts` exports `schema.types` with all eight types.
- Icons imported from their own subpaths (`@sanity/icons/Play`), never from the
  package root — root named exports were removed in v5 and fail at bundle time.

## The web data layer

- **`web/sanity/env.ts`** — `projectId`, `dataset`, `apiVersion` (kept at the
  existing `2026-09-02` default), asserted from `NEXT_PUBLIC_*`. Browser-safe.
- **`web/sanity/lib/token.ts`** — `import 'server-only'`; exports the asserted
  `SANITY_API_READ_TOKEN`.
- **`web/sanity/lib/client.ts`** — `import 'server-only'`; `createClient` with
  the token, `useCdn: true`, `perspective: 'published'`, `stega: false`. Also
  exports `freshClient = client.withConfig({ useCdn: false })` for
  `generateStaticParams`, per the nextjs guide.
- **`web/sanity/lib/fetch.ts`** — the `sanityFetch<QueryString>({ query, params,
  tags, revalidate = 60, fresh })` helper from the nextjs guide's manual-caching
  pattern: `next: { revalidate: tags.length ? false : revalidate, tags }`.
  Generic over the query string so TypeGen's `overloadClientMethods` inference
  survives the wrapper.
- **`web/sanity/lib/image.ts`** — unchanged `urlFor`, moved.
- **`web/sanity/lib/queries.ts`** — every query wrapped in `defineQuery` from
  `next-sanity`, uniquely named, with shared fragments for the image and the
  course card. Ordering before slicing; `_key` included in every array
  projection; reference expansion merged rather than repeated:
  - `COURSE_SLUGS_QUERY`, `LESSON_SLUGS_QUERY`, `INSTRUCTOR_SLUGS_QUERY` —
    for `generateStaticParams`.
  - `COURSES_CATALOG_QUERY` — cards: title, slug, summary, cover, level, price,
    popular, studentCount, instructor name/photo, category title, plus derived
    `"moduleCount": count(modules)`, `"lessonCount": count(modules[].lessons[])`
    and `"durationSeconds"` summed over the modules' lessons.
  - `COURSE_BY_SLUG_QUERY` — the full detail page: learning outcomes, instructor,
    category, and `modules[]{ _key, title, summary, lessons[]->{...} }`.
  - `LESSON_BY_SLUG_QUERY` — the lesson plus its notes, key points, pro tip,
    resources, and the reverse-referenced parent course with the module and
    lesson indices needed to render "Lesson 5.1".
  - `INSTRUCTOR_BY_SLUG_QUERY` — instructor plus their courses by reverse
    reference.
  - `CATEGORIES_QUERY` — title, slug, description, and a course count.
- **`web/sanity.types.ts`** — generated by `npm run typegen` in `studio/`, and
  committed. `tsconfig.json`'s existing `**/*.ts` include already picks it up.

## The AGENTS.md block

`next dev` writes the managed "This is NOT the Next.js you know" block into the
Next project directory. Once the app lives in `web/`, that directory is `web/`,
and `writeAgentFiles` scaffolds **both** `web/AGENTS.md` and a `web/CLAUDE.md`
containing `@AGENTS.md` when neither exists. To keep the tree clean I create
`web/AGENTS.md` up front with the block verbatim (matching
`buildAgentRulesBlock()`), which makes `next dev` take the "AGENTS.md exists"
branch and skip `CLAUDE.md` entirely. The root `CLAUDE.md` keeps its own copy of
the block untouched.

## Security considerations

- `SANITY_API_READ_TOKEN` is server-only: no `NEXT_PUBLIC_` prefix, imported
  only through `token.ts`/`client.ts`, both of which start with
  `import 'server-only'` so a client-component import is a build error.
- The dataset is private; every content read is server-side. Nothing in this
  slice adds a client component that touches the Sanity client.
- No write token is introduced. This slice performs no writes.
- `stega: false` and `perspective: 'published'` mean no draft content and no
  invisible stega characters leak into rendered output or metadata.
- `.env.local` moves to `web/` and stays gitignored; `.env.example` carries key
  names and empty values only, never a real key.
- Clerk keys are untouched; `proxy.ts` moves as-is with no matcher change (the
  `/studio` route it used to cover no longer exists in the app).

## Acceptance criteria

1. `studio/` and `web/` are independent workspaces; nothing Sanity-schema-shaped
   remains in `web/`, and `app/studio/` is gone.
2. `npm install` at the root installs both workspaces from one lockfile.
3. All eight schema types are registered, use `defineType` / `defineField` /
   `defineArrayMember`, carry icons and previews, and `sanity schemas extract`
   succeeds.
4. `sanity typegen generate` writes `web/sanity.types.ts` with a result type for
   every query in `queries.ts`, and the file is committed.
5. `web/sanity/lib/client.ts` and `token.ts` both begin with `import 'server-only'`;
   no token appears in any `NEXT_PUBLIC_` variable.
6. `npx tsc --noEmit` and `npm run lint` pass in `web/`.
7. `npm run build` passes in `web/` (routes and server modules changed).
8. The existing home, design-system, and Clerk pages render unchanged from
   `web/` — this slice changes no visual output.
9. `.env.example` lists every key the project reads, and `.gitignore` un-ignores it.

## Checks to run

In `web/`:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev          # smoke: / and /design-system render
```

In `studio/`:

```bash
npm run typegen      # schemas extract --force --enforce-required-fields + typegen generate
npm run build
npm run dev          # smoke: localhost:3333 lists Courses / Lessons / Instructors / Categories
```

`sanity deploy` (the Studio application deploy that CLAUDE.md section 12 says
the Context MCP requires) needs an authenticated CLI session and is a user
action — I will not run it, and I will flag it.

## Manual test steps

1. `npm install` at the repo root.
2. Copy the Sanity values into `studio/.env` as `SANITY_STUDIO_PROJECT_ID` and
   `SANITY_STUDIO_DATASET`, and add `SANITY_API_READ_TOKEN=<viewer token>` to
   `web/.env.local` (create the token at sanity.io/manage → API → Tokens, with
   **Viewer** access).
3. `npm run dev:studio` → open http://localhost:3333. Confirm the Content pane
   lists Courses, Lessons, Instructors, Categories.
4. Create one `instructor`, one `category`, two `lesson` documents (give each a
   real YouTube URL, a duration, key points, and a paragraph of notes), then one
   `course` with a `module` referencing both lessons. Publish all of them.
5. In the Studio's Vision tab, run `COURSES_CATALOG_QUERY` from
   `web/sanity/lib/queries.ts`. Confirm `moduleCount` is 1, `lessonCount` is 2,
   and `durationSeconds` equals the sum of the two lesson durations.
6. Run `LESSON_BY_SLUG_QUERY` with one lesson's slug. Confirm the reverse
   reference resolves the parent course and returns the module and lesson
   indices.
7. In `studio/`, run `npm run typegen`. Confirm `web/sanity.types.ts` changes
   include a `COURSES_CATALOG_QUERYResult` type.
8. `npm run dev:web` → http://localhost:3000 renders the home page exactly as
   before, and http://localhost:3000/studio is now a 404.
9. Confirm no token leaked: `grep -r "sk[A-Za-z0-9]" web/app` returns nothing,
   and the browser Network tab shows no request to `*.api.sanity.io`.

## Needs the user's attention (carried into the final report)

- **`SANITY_API_READ_TOKEN` does not exist yet.** Every query returns 401 until
  it is created and added to `web/.env.local`. I cannot create it.
- **Dataset privacy** — CLAUDE.md requires a private dataset. Verify in
  sanity.io/manage; if it is currently public, switching it is a user action.
- **CORS origins** — add `http://localhost:3000` with credentials
  (`npx sanity cors add http://localhost:3000 --credentials`).
- **`sanity deploy`** must be run by the user before the Context MCP will serve
  this dataset later (section 12). Not needed for this slice.
- The restructure moves every path in the repo. Any bookmarked path, editor
  config, or Vercel project root pointing at the repo root needs to point at
  `web/`.
