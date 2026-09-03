# Implementation prompt: seed sample content into Sanity

## Goal

Fill the empty `production` dataset with a coherent, realistic catalog so the
catalog, course, lesson, and instructor pages — and, later, cross-course search —
have real data to work against.

Scope:

- 6 instructors, 5 categories, 10 courses.
- Each course: 3–4 modules, each module 3–4 lessons. ~110 lessons total.
- Every lesson gets a **unique, real, topic-relevant YouTube video**, harvested
  and validated, with the video's **real duration**.
- Course cover images and instructor photos only. No lesson posters.

Out of scope: `video` documents and the transcript/chapter ingestion (section 9),
the agent `context` document (section 10), `progress` (section 7), any schema
change, and any page or component change. `app/lib/placeholder-courses.ts` is
untouched — the catalog slice replaces it later.

## Skills and docs read

- **CLAUDE.md** sections 2, 5, 7, 8, 12, 13, 14.
- **sanity-best-practices** `references/migration.md` (import identity rules,
  image handling), `references/schema.md`, `references/portable-text.md`.
- **sanity-migration** SKILL.md (import/validation workflow).

## Code inspected

- `studio/schemaTypes/` — every field name, `list` vocabulary, and validation
  rule the seed must satisfy: `course` (incl. `learningOutcome.icon` enum),
  `lesson` (`videoUrl` host allowlist, `durationSeconds` required positive int,
  `keyPoints` max 6 unique, `resources`), `courseModule`, `instructor`,
  `category`, `blockContent`, `lessonResource` (`type` enum).
- `web/sanity/lib/queries.ts` — confirms which numbers are **derived**, not
  stored: `moduleCount`, `lessonCount`, course/module `durationSeconds`
  (`math::sum(modules[].lessons[]->durationSeconds)`), and the "Lesson 5.1"
  label (module index + lesson index). The seed stores none of them.
- `studio/sanity.cli.ts`, `studio/.env` — project id from env, dataset
  `production`; the Sanity CLI is already authenticated (`~/.config/sanity`).
- Dataset currently holds zero `course`/`lesson`/`instructor`/`category` docs.

## Decisions and assumptions

1. **Import path is `sanity dataset import` with NDJSON**, run from `studio/`.
   This is the path CLAUDE.md section 13 names, uses the CLI's own auth, and
   needs no write token in env. The Sanity MCP server is unauthenticated in this
   session and is not used.

2. **Deterministic, human-readable `_id`s** (`instructor.maya-oduya`,
   `course.nextjs-for-production`, `lesson.nextjs-app-router-basics`). This
   knowingly departs from the migration skill's "let Sanity generate `_id`s"
   rule, which addresses legacy-system migrations. For seed data it is required
   and correct: references inside a single NDJSON file must point at ids that
   exist in that file, and stable ids make `--replace` re-runnable rather than
   duplicating the catalog on every run.

3. **Plain `.mjs` scripts, no new dependencies.** The studio workspace has no TS
   runner, so the seed tooling is ESM JavaScript with JSDoc types that `node`
   runs directly. Nothing is added to `dependencies`.

4. **Videos are harvested, then frozen.** A one-off script queries YouTube's
   public search results page per lesson title, pulls the top result's
   `videoId`, `title`, and `lengthText` out of `ytInitialData`, validates it
   through the public oEmbed endpoint, and de-duplicates across the whole seed
   (if the top hit is already taken it walks down the result list). The outcome
   is committed to `studio/seed/videos.json`, so the seed build itself is
   deterministic and offline. Consequences accepted:
   - `durationSeconds` is the **real** length of the real video, so course and
     module durations add up to something truthful.
   - Relevance is best-effort. The script records the video title next to each
     lesson so a human can eyeball the mapping; any lesson the harvest cannot
     satisfy is reported by name and filled from a small curated fallback list
     rather than silently skipped.

5. **Images via the import's remote-asset fetch** — `_sanityAsset:
   "image@<url>"` on `coverImage` and `photo`, 16 uploads total. Every URL is
   HEAD-checked by the build script before the NDJSON is written, so a dead link
   fails the build instead of the import. Lessons carry no `poster`; the course
   cover is the sensible frontend fallback and that is flagged in the report.

6. **Content is authored as structured specs, not raw documents.** A content
   file holds each lesson's title, key points, note paragraphs, pro tip, and
   resources as plain data; a builder turns note text into `blockContent`
   Portable Text blocks with stable `_key`s. Notes are real prose about the real
   topic — the search corpus is only as good as this text.

7. **Consistency invariants**, enforced by the build script (it exits non-zero
   on any violation), which is what "a module equals the sum of its lessons and
   a course equals the sum of its modules" means here:
   - Every lesson is referenced by **exactly one** module of **exactly one**
     course. No orphans, no lessons shared across courses — the lesson page
     resolves its course by reverse reference, which is ambiguous otherwise.
   - Every `_ref` resolves to a document present in the same NDJSON file.
   - Module and course durations are never stored; they are the sum of the
     lesson `durationSeconds` by construction.
   - Every video URL is unique across the seed and on the schema's host
     allowlist.
   - Slugs are unique per document type; `_id`s are unique overall.
   - `studentCount` degrades monotonically down a course's lessons and never
     exceeds the course's own `studentCount`.
   - Every lesson title, module title, and course title is distinct.
   - Field values match the schema enums (`level`, `learningOutcome.icon`,
     `lessonResource.type`) and the `keyPoints` max-6-unique rule.

8. **Module→lesson coherence is a content requirement.** A module's lessons
   genuinely teach that module's topic (CLAUDE.md section 7), because incoherent
   modules make search return junk.

## The catalog being authored

Categories: Web Development, Programming Languages, AI & Machine Learning,
DevOps & Cloud, Data & Backend.

Instructors: 6, each with expertise tags and a Portable Text bio, each owning
1–2 courses.

Courses (category, level):

1. Next.js for Production — Web Development, intermediate
2. React Performance Engineering — Web Development, advanced
3. TypeScript Deep Dive — Programming Languages, intermediate
4. Python Foundations for Data Work — Programming Languages, beginner
5. Building LLM Applications — AI & Machine Learning, intermediate
6. Retrieval-Augmented Generation in Practice — AI & Machine Learning, advanced
7. Docker Essentials — DevOps & Cloud, beginner
8. Kubernetes for Application Developers — DevOps & Cloud, intermediate
9. PostgreSQL for Application Developers — Data & Backend, intermediate
10. API Design with Node.js — Data & Backend, beginner

Three courses carry `popular: true`. The first lesson of each course's first
module is the `freePreview` one — a label only, not access control.

## Files

New, all under `studio/seed/`:

- `content/categories.mjs` — the 5 category specs.
- `content/instructors.mjs` — the 6 instructor specs, incl. bio paragraphs and
  photo URL.
- `content/courses.mjs` — the 10 course specs: marketing fields, learning
  outcomes, and the full module → lesson tree with each lesson's key points,
  note paragraphs, pro tip, and resources.
- `lib/text.mjs` — slugify, and plain text → `blockContent` Portable Text with
  stable `_key`s.
- `lib/build.mjs` — specs + `videos.json` → the document array.
- `lib/validate.mjs` — every consistency check in decision 7, readable on its own.
- `scripts/harvest-videos.mjs` — one-off, writes `videos.json`.
- `scripts/build-ndjson.mjs` — writes `dist/vertex-seed.ndjson`.
- `videos.json` — committed harvest output.
- `README.md` — how to re-run harvest, build, and import.
- `dist/` — gitignored build output.

Changed:

- `studio/package.json` — `seed:videos`, `seed:build`, `seed:import` scripts.
- `.gitignore` — ignore `studio/seed/dist/`.

Nothing in `web/` changes.

## Security considerations

- No token is added anywhere. The import authenticates through the existing
  Sanity CLI session; the dataset stays private.
- The harvest script only reads public YouTube pages and writes a local JSON
  file. It runs offline of the request path and is never imported by the app.
- Seed content is fictional: invented instructor names and bios, invented
  student counts and prices. No real person is represented. Video URLs point at
  third-party public videos and are embedded, never rehosted.
- No secret, project id, or dataset name is hardcoded into a committed file —
  the CLI reads them from `studio/.env`.

## Acceptance criteria

- `npm run seed:build --workspace studio` writes an NDJSON of ~121 documents
  (6 instructors + 5 categories + 10 courses + 100–120 lessons) and prints the
  per-course module/lesson/duration rollup, with every invariant passing.
- The import completes with no validation errors.
- In Sanity: 10 courses, each opening in the Studio with no validation warnings,
  every module listing its lessons, every lesson resolving.
- `COURSES_CATALOG_QUERY` returns 10 courses with non-null `moduleCount`,
  `lessonCount`, and `durationSeconds`, and each course's `durationSeconds`
  equals the sum of its modules'.
- Every lesson has a distinct `videoUrl` on the host allowlist.
- Re-running the import changes nothing (no duplicates).

## Checks to run

From `studio/`:
- `npm run seed:build` — invariants and rollup.
- `npm run seed:import` — the actual import.
- `npx sanity documents query` against the dataset to verify counts, the
  duration rollup, orphan lessons (must be zero), and duplicate video URLs
  (must be zero).

From `web/` (nothing there changes, but the schema-derived types are shared):
- `npm run typecheck`
- `npm run lint`

No production build — no route, config, or server module changes.

## Manual test steps

1. `npm run dev:studio`, open the Studio, and confirm the Course list shows 10
   courses.
2. Open **Next.js for Production**: cover image renders, instructor and category
   resolve, the Curriculum tab lists its modules, and each module preview shows
   its lesson count.
3. Open a lesson from that module: title, key points, Portable Text notes, pro
   tip, and resources are populated, and `videoUrl` opens a real, on-topic video.
4. Open the Instructor list: 6 instructors, each with a photo and bio.
5. In Vision, run
   `*[_type=="course"]{title,"m":count(modules),"l":count(modules[].lessons[]),"d":math::sum(modules[].lessons[]->durationSeconds)}`
   and confirm 10 rows with sensible totals.
6. In Vision, run `*[_type=="lesson" && count(*[_type=="course" && references(^._id)])!=1]`
   and confirm it returns nothing.
