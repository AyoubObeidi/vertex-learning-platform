# Seed content

Sample catalog content for the Vertex dataset: 5 categories, 6 instructors,
10 courses, and the lessons those courses are built from. It exists so the
catalog, course, lesson, and instructor pages — and cross-course search — have
real content to work against.

Everything here is fictional. Instructor names, bios, prices, and student
counts are invented. Video URLs point at real, public third-party videos and are
only ever embedded.

## Running it

From `studio/`:

```sh
npm run seed:build     # validate the content and write dist/vertex-seed.ndjson
npm run seed:import    # import that file into the dataset
```

`seed:import` uses the Sanity CLI's own session (`npx sanity login`) and the
project and dataset from `studio/.env`. No write token is stored anywhere.

The import runs with `--replace`, so document ids are stable and re-running it
updates the existing documents rather than creating a second catalog.

## Videos

Each lesson has its own real, on-topic YouTube video, with that video's real
duration. The mapping is harvested once and committed to `videos.json`, so the
build itself is deterministic and needs no network:

```sh
npm run seed:videos              # fill in any lesson missing from videos.json
node seed/scripts/harvest-videos.mjs --refresh   # re-harvest everything
```

The harvester searches YouTube, takes the first result that is public, of a
sensible length, and not already claimed by another lesson, and records its id,
title, and duration. Relevance is best-effort — the video title is stored next
to each entry precisely so a human can skim the mapping and replace anything
obviously wrong by editing `videos.json` directly.

## What the build guarantees

`seed:build` fails rather than importing inconsistent content. It checks that:

- every lesson is referenced by exactly one module of exactly one course — no
  orphans and no lessons shared between courses, since the lesson page resolves
  its course by reverse reference;
- every reference resolves to a document in the same file;
- every video URL is unique and on the schema's host allowlist, with a positive
  integer duration;
- ids and slugs are unique, and course, module, and lesson titles are distinct;
- enum fields match the Studio schema vocabularies;
- lesson student counts decrease through a course and never exceed the course's
  own count, and each course has exactly one free-preview lesson;
- every remote image URL is reachable.

Module and course durations and counts are never stored — they are summed in
GROQ from the lessons (see `web/sanity/lib/queries.ts`). The build prints the
same rollup so you can compare it against what the site renders.

## Layout

```
content/
  categories.mjs        the 5 categories
  instructors.mjs       the 6 instructors
  courses.mjs           aggregates courses/
  courses/*.mjs         one file per course: modules, lessons, notes, resources
lib/
  text.mjs              slugs, stable keys, plain text → Portable Text
  build.mjs             specs → Sanity documents
  validate.mjs          the consistency invariants
scripts/
  harvest-videos.mjs    writes videos.json (one-off, hits the network)
  build-ndjson.mjs      writes dist/vertex-seed.ndjson
videos.json             committed lesson → video mapping
dist/                   build output, gitignored
```

## Authoring notes

Lesson `notes` are authored as plain strings and converted to Portable Text by
`lib/text.mjs`. A leading marker picks the block style: `## `, `### `, `> `,
`- `, or `1. `. Inline marks are not supported on purpose — content in Vertex is
structured, not markdown (CLAUDE.md section 7).
