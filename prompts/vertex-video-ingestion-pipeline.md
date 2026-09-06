# Implementation prompt: the offline video ingestion pipeline

## Goal

Build the `video` document type and the offline tooling that populates it, so
every unique lesson video in the dataset gets one `video` document holding a
table of contents (chapter markers) and its transcript split into short
timestamped chunks (CLAUDE.md sections 8 and 9).

This is the lookup table that intelligent search will later use to resolve a
query to an exact second in a lesson's video. Nothing here runs in the request
path.

Scope:

- A new `video` document type in the Studio, plus its two array member objects
  (`videoChapter`, `videoChunk`), registered in the schema and visible in the
  Studio structure.
- A new offline workspace `studio/videos/` with three commands: fetch (network),
  build (deterministic, offline), import (Sanity CLI session).
- Transcript extraction, cleanup, and chunking for YouTube.
- Chapter extraction from YouTube, with an optional committed override file for
  hand-authored chapters.
- Validation that fails the build rather than importing junk, plus a report.
- TypeGen regeneration so `web/sanity.types.ts` knows the new type.
- A README documenting the pipeline, matching `studio/seed/README.md`.

Out of scope (named so nothing creeps in):

- **Search consuming the video documents.** CLAUDE.md section 11 (video results,
  two-stage timestamp resolution, ranking, merged result kinds) is the next
  task. `web/app/lib/search.ts`, `search-prompt.ts`, and `/api/search` are not
  touched.
- **The Context document's content scope filter.** `studio/context/agent-context.mjs`
  keeps `_type in ["course", "lesson", "instructor", "category"]`. Adding
  `"video"` teaches the agent about a type the system prompt has no output
  contract for, so it lands with the search work. The one change here is the
  stale comment in that file that says ingestion "is not built" — it is now.
- **Any UI.** No web component, route, or query changes. The lesson page already
  honours `?t=<seconds>` via `web/app/lib/video.ts`.
- **Vimeo and Bunny ingestion.** CLAUDE.md section 9: a provider is not
  supported until both ingestion and playback exist. Playback exists for all
  three; ingestion here is YouTube only, and the fetch script reports any
  non-YouTube URL as skipped rather than pretending to handle it.
- **Changing `lesson`.** A lesson does not reference a video document. The join
  is `lesson.videoUrl == video.url` (section 8: "Lessons link to them by video
  URL"), so no lesson field is added.
- **Re-seeding content.** `studio/seed/` is untouched.

## Skills and docs read

- **CLAUDE.md** sections 2, 5, 6, 7, 8, 9, 12, 13, 14.
- **sanity-best-practices** `references/schema.md` — `defineType` / `defineField`
  / `defineArrayMember` are mandatory; every array item carries a `_key` and
  every array projection must include it; documents and objects get an icon.
  Its icon guidance (`import { PlayIcon } from '@sanity/icons/Play'`) targets a
  newer package than the one installed — `node_modules/@sanity/icons/package.json`
  in this repo exports only `"."`, so the subpath import would fail to resolve.
  New schema files follow the existing project style, `import {X} from '@sanity/icons'`,
  which is what every current schema file does and what the deployed Studio builds with.
- **sanity-best-practices** `references/schema.md` §"Document creation and IDs" —
  deterministic, human-readable ids so a re-import replaces in place.

## Code inspected

- `studio/schemaTypes/index.ts` — documents then objects, each imported by name
  from its own file. The new type slots in the same way.
- `studio/schemaTypes/documents/lesson.ts` — the `SUPPORTED_VIDEO_HOSTS`
  allowlist (`youtube.com`, `youtu.be`, `vimeo.com`, `player.vimeo.com`,
  `mediadelivery.net`, `b-cdn.net`), the `defineField` + `groups` style, and the
  `formatDuration` preview helper the video preview mirrors.
- `studio/seed/lib/build.mjs` — the `_id` convention is `type.key`
  (`lesson.<slug>`, `course.<slug>`, `instructor.<key>`). Video ids follow it.
- `studio/seed/lib/text.mjs` — `keyFor()` is an FNV-1a hash producing a stable
   7-char `_key`. Chunk and chapter `_key`s do not need it: `startSeconds` is
  already unique within a document, so `c<seconds>` / `ch<seconds>` is stable
  and readable. `durationToSeconds` and `formatDuration` are reused for reports.
- `studio/seed/scripts/import.mjs` — imports through `npx sanity dataset import`
  with `--replace`, resolving project and dataset from `studio/.env` because the
  CLI does not read it for that command, and authenticating with the CLI's own
  session. **No write token is read or stored.** The video import is a copy of
  this shape, pointed at the new NDJSON.
- `studio/seed/scripts/harvest-videos.mjs` — the existing precedent for offline
  network tooling: polite serial fetches with a delay, resumable (skip what is
  already recorded), `--refresh` to redo everything, and a non-zero exit listing
  what it could not do. The fetch script follows it.
- `studio/seed/videos.json` — 135 lessons, **135 unique video ids**, 107,785
  seconds (~30 hours) of video, all YouTube.
- `studio/sanity.cli.ts` — TypeGen reads GROQ from `../web/**/*.{ts,tsx}` and
  writes `../web/sanity.types.ts` from `schema.json`, so a schema change means
  `npm run typegen` in `studio/`.
- `studio/structure.ts` — a flat `S.documentTypeListItem` list with icons.
- `studio/context/agent-context.mjs` — carries the stale "There is no `video`
  type yet … Add `"video"` here when it lands" comment.
- `web/app/lib/video.ts` — `parseVideoUrl` already normalises YouTube
  (`watch?v=`, `youtu.be/`, `/embed/`, `/v/`, `/shorts/`), Vimeo, and Bunny
  (`<library>/<guid>`) into `{provider, id}`. The ingestion id derivation must
  agree with it, but this is the Studio workspace and cannot import from web —
  the rule is restated in `studio/videos/lib/video-id.mjs` with a comment
  naming its counterpart.
- `.gitignore` — build output is gitignored per workspace
  (`studio/seed/dist/`, `studio/context/dist/`). The new `dist/` and `cache/`
  follow.

## Verified before writing this (live probes, not assumptions)

These decided the design, so they are recorded rather than assumed:

1. **Scraping caption tracks directly no longer works.** Fetching the watch page
   and reading `ytInitialPlayerResponse.captions…captionTracks[].baseUrl` still
   returns the track list, but every fetch of that `baseUrl` returns
   **HTTP 200 with a zero-length body** — plain, `&fmt=json3`, with a Referer,
   with the page's cookies, and with `&c=WEB`. The URL carries no `pot` param;
   YouTube now gates caption bodies on a proof-of-origin token.
2. **The InnerTube player API is closed too.** `POST /youtubei/v1/player` returns
   `UNPLAYABLE` for the WEB client, `ERROR` for TVHTML5, and HTTP 400 for the
   ANDROID and IOS clients. `POST /youtubei/v1/get_transcript` with the watch
   page's own `getTranscriptEndpoint.params`, visitor data, and cookies returns
   `400 FAILED_PRECONDITION`.
3. **Chapters *do* still scrape.** `chapterRenderer` nodes are present in
   `ytInitialData` on the watch page (6 correct chapters for `T-D1OfcDW1M`).
4. **yt-dlp works for both.** Installed into a scratch directory (not onto the
   machine) it pulled real captions — `sub/T-D1OfcDW1M.en.json3`, 92 events,
   clean sentences — and `--dump-single-json` returned `duration`, `chapters[]`
   with `start_time`/`title`/`end_time`, and the per-language subtitle format
   list in one call. It warns that no JS runtime (Deno) is installed and that no
   impersonation target is available; both are warnings and captions downloaded
   anyway.
5. **Coverage across a 10-video sample of the real seed:** English captions
   available for **10/10** (1 author-uploaded, 9 auto-generated); chapters
   present for **7/10**. So the chapter-first / transcript-fallback design in
   CLAUDE.md section 7 is not theoretical — roughly a third of the catalog will
   have to resolve timestamps from transcript alone.
6. **Auto-caption json3 has three quirks** the chunker must handle, confirmed on
   `WKfPctdIDek`: a leading window-definition event with **no `segs`**; rolling
   `"aAppend": 1` events whose only seg is `"\n"`; and real events whose `segs`
   are **word fragments** with `tOffsetMs`, which have to be concatenated.
7. **The Sanity CLI session can query the dataset.**
   `npx sanity documents query "count(*[_type=='lesson'])"` returned `135`. So
   the fetch script can read the video URLs actually in use from the dataset,
   with no token stored anywhere.

## Decisions and assumptions

1. **yt-dlp is the transcript source, as an external offline tool.** Points 1
   and 2 above rule out doing this with `fetch` the way `harvest-videos.mjs`
   does. Re-implementing yt-dlp's player handshake would be a fragile,
   permanently-breaking copy of a maintained tool. CLAUDE.md section 9 makes
   this offline tooling, so an external binary is an acceptable dependency in a
   way it would never be in the request path. It is **not** added to
   `package.json` — it is a Python tool, resolved at runtime.
2. **yt-dlp is located, never installed by the script.** Resolution order:
   `$YT_DLP` (explicit path) → `yt-dlp` on PATH → `python -m yt_dlp`. If none
   answers `--version`, exit non-zero with PowerShell install instructions
   (`python -m pip install --user yt-dlp`, or `winget install yt-dlp`), because
   the user's shell is PowerShell 5.1. The script never runs an installer.
3. **Chapters come from yt-dlp, not the HTML scrape.** yt-dlp already returns
   them in the same `--dump-single-json` call that lists the subtitles, so the
   watch-page scrape (verified working in point 3) is redundant. One tool, one
   call, one failure mode.
4. **Three commands, mirroring the seed's two-phase split.** Network work is
   separated from document construction so the build is deterministic and
   re-runnable offline:
   - `videos:fetch` — hits the network, writes one normalised JSON file per
     video into `cache/`. Resumable: skips what is already cached.
   - `videos:build` — reads `cache/` + `chapters.json`, validates, writes
     `dist/vertex-videos.ndjson`. No network.
   - `videos:import` — `sanity dataset import --replace`.
5. **The list of videos comes from the dataset, not from `seed/videos.json`.**
   Querying `*[_type == "lesson"].videoUrl` (point 7) makes the pipeline correct
   for any authored lesson, not just the seed — which is what section 9 asks
   for ("one per unique video URL"). `--from-seed` stays available as an
   offline fallback that reads `../seed/videos.json`.
6. **`_id` is `video.<provider>-<sanitised id>`.** Section 9: "keyed by an id
   derived from the video URL, stripping any characters the datastore rejects
   in ids". YouTube and Vimeo ids are already safe; Bunny's `<library>/<guid>`
   contains a slash, so every character outside `[A-Za-z0-9._-]` becomes `-`.
   Deterministic, so `--replace` updates in place forever.
7. **The document holds exactly what section 8 specifies, plus provenance.**
   `videoId`, `url`, `chapters[]{startSeconds,label}`, `chunks[]{startSeconds,text}`
   are the mandated shape and are implemented literally — no `endSeconds` on a
   chunk or chapter, since a clip's length is derivable from the next start and
   the duration. The additions are `provider`, `durationSeconds`, `title`,
   `captionSource`, `chapterSource`, and `ingestedAt`. Each earns its place:
   `durationSeconds` bounds a seek, `provider` picks the embed's start
   parameter, `captionSource`/`chapterSource` tell you whether a thin result is
   a bug or just an auto-caption video with no chapters, and `ingestedAt` says
   whether a re-run is due. Nothing else is added.
8. **Chunk target: ~40 seconds, hard-capped at 60s or 600 characters.** Short
   enough that the matched second is a precise seek target, long enough to carry
   a matchable idea. At 30 hours of video this lands near 2,700 chunks total,
   ~20 per document, ~73 for the longest (2,909s) video — far inside Sanity's
   document size limit.
9. **Fewer than two chapters counts as no chapters.** A single "Introduction"
   marker spanning a whole video is not a table of contents; it would win the
   chapter-first stage of section 7's two-stage resolution and return second 0
   for everything. Those videos fall through to transcript matching, which is
   exactly the fallback that stage exists for.
10. **Hand-authored chapters live in a committed `chapters.json`, keyed by
    document id.** Section 9 allows "a source of chapters or authored ones". The
    file ships **empty** — authoring 40-odd tables of contents is content work,
    not this task — but the override path exists and takes precedence over the
    provider's, marked `chapterSource: "authored"`. Authoring them in the Studio
    instead would be wiped by the next `--replace` import, so the README says so.
11. **`cache/` and `dist/` are gitignored.** ~30 hours of raw transcript is
    megabytes of derived data that `videos:fetch` can rebuild. `chapters.json`
    is authored input and *is* committed.
12. **A video with neither chapters nor chunks is skipped, not written.** An
    empty video document is noise the search agent would have to filter. It is
    listed in the report and the build exits non-zero so it cannot pass unnoticed.
13. **Bracketed non-speech cues are dropped.** `[Music]`, `[Applause]`,
    `[Laughter]` and friends are the only content of some cues and match nothing
    a learner would type.
14. **Serial fetches with a delay.** 1.2s between videos plus yt-dlp's
    `--sleep-requests 1`, matching `harvest-videos.mjs`'s politeness. A full run
    over 135 videos takes roughly 10–20 minutes; `--limit` and `--only` exist so
    development does not need a full run.

## Files

New:

```
studio/schemaTypes/documents/video.ts        the video document
studio/schemaTypes/objects/videoChapter.ts   {startSeconds, label}
studio/schemaTypes/objects/videoChunk.ts     {startSeconds, text}
studio/videos/README.md                      how to run it, what it guarantees
studio/videos/chapters.json                  authored chapter overrides (ships {})
studio/videos/lib/ytdlp.mjs                  locate + run yt-dlp
studio/videos/lib/video-id.mjs               URL -> {provider, id, docId}
studio/videos/lib/transcript.mjs             json3 -> cues -> chunks
studio/videos/lib/build.mjs                  cache entries -> video documents
studio/videos/lib/validate.mjs               the invariants
studio/videos/scripts/fetch-transcripts.mjs  network: writes cache/
studio/videos/scripts/build-ndjson.mjs       writes dist/vertex-videos.ndjson
studio/videos/scripts/import.mjs             imports it
```

Changed:

```
studio/schemaTypes/index.ts        register video, videoChapter, videoChunk
studio/structure.ts                add the Videos list item
studio/package.json                videos:fetch / videos:build / videos:import
studio/context/agent-context.mjs   correct the stale "no video type yet" comment
.gitignore                         studio/videos/cache/, studio/videos/dist/
web/sanity.types.ts                regenerated by TypeGen (do not hand-edit)
```

## Requirements

### Schema — `videoChapter`

- Object, `name: 'videoChapter'`, icon.
- `startSeconds`: number, required, integer, `min(0)`.
- `label`: string, required.
- Preview: `label` as title, `formatTimestamp(startSeconds)` (`m:ss` / `h:mm:ss`)
  as subtitle.

### Schema — `videoChunk`

- Object, `name: 'videoChunk'`, icon.
- `startSeconds`: number, required, integer, `min(0)`.
- `text`: text, required, `rows: 3`.
- Preview: the first ~60 characters of `text` as title, the timestamp as subtitle.

### Schema — `video`

- Document, `name: 'video'`, `PlayIcon`, with a description on the type saying
  it is built by `studio/videos/` and that hand edits are overwritten by the
  next import.
- Fields:
  - `videoId` — string, required. The provider-native id.
  - `url` — url, required, `scheme: ['http','https']`, host-allowlist warning
    matching `lesson.ts`.
  - `provider` — string, required, `options.list` of `youtube` / `vimeo` /
    `bunny` (radio layout, per the skill's "boolean vs list" guidance).
  - `title` — string. The source video's own title, for recognising a document.
  - `durationSeconds` — number, integer, positive.
  - `chapters` — array of `videoChapter`.
  - `chunks` — array of `videoChunk`.
  - `captionSource` — string, `options.list`: `manual` / `auto` / `none`.
  - `chapterSource` — string, `options.list`: `provider` / `authored` / `none`.
  - `ingestedAt` — datetime.
- Preview: title (falling back to `videoId`), subtitle
  `"<provider> · <duration> · N chapters · N chunks"`.
- Register in `schemaTypes/index.ts` — `video` with the documents, the two
  objects with the objects.
- `structure.ts` gains `S.documentTypeListItem('video').title('Videos')` with a
  film/play icon, after Categories.

### `lib/video-id.mjs`

- `parseVideoUrl(url)` → `{provider, id}` or `null`, covering the same forms as
  `web/app/lib/video.ts` (YouTube `watch?v=`, `youtu.be/`, `/embed/`, `/v/`,
  `/shorts/`; Vimeo `vimeo.com/<n>` and `player.vimeo.com/video/<n>`; Bunny
  `/embed|play/<library>/<guid>`). A comment names that file as its counterpart.
- `docIdFor({provider, id})` → `video.<provider>-<id with [^A-Za-z0-9._-] → ->`.
- Both pure and synchronous — the build imports them.

### `lib/ytdlp.mjs`

- `resolveYtDlp()` — tries `$YT_DLP`, then `yt-dlp`, then `python -m yt_dlp`,
  each with `--version`; returns `{command, args}` or throws with the PowerShell
  install instructions. Resolve once per run, not per video.
- `probeVideo(runner, url)` — `--skip-download --dump-single-json --no-playlist`,
  returning `{id, title, duration, chapters, subtitleLangs, autoLangs}`.
- `fetchCaptions(runner, url, outDir)` — `--skip-download --write-subs
  --write-auto-subs --sub-langs "en.*,en" --sub-format json3 --no-playlist
  --sleep-requests 1 -o "<outDir>/%(id)s"`, then reads whichever `.json3` landed,
  preferring an author-uploaded track over an auto one and `en` over `en-*`.
- Every invocation goes through `spawnSync` with `shell: true` (Windows), a
  per-video timeout, and stderr captured so a failure names the video.
- On any non-zero exit, return a failure the caller records — one bad video must
  not abort a 135-video run.

### `lib/transcript.mjs`

- `cuesFromJson3(json)`:
  - skip events with no `segs`;
  - skip events where `aAppend` is set (the rolling-window artifacts);
  - concatenate each event's `segs[].utf8`, collapse whitespace, trim;
  - drop cues that are empty or only a `[bracketed]` token;
  - `startSeconds = Math.floor(tStartMs / 1000)`;
  - return cues sorted ascending, de-duplicated on identical
    `startSeconds` + `text`.
- `chunksFromCues(cues, {targetSeconds: 40, maxSeconds: 60, maxChars: 600})`:
  - accumulate cues into a chunk, closing it when adding the next would exceed
    `maxSeconds` from the chunk's start or `maxChars`, and preferring to close at
    or past `targetSeconds`;
  - chunk `startSeconds` is its first cue's; `text` is the cues joined with a
    single space;
  - never emit an empty chunk.
- `normaliseChapters(chapters, durationSeconds)` — `{startSeconds: floor(start_time),
  label: title.trim()}`, sorted, de-duplicated on `startSeconds`, dropping any
  past `durationSeconds` or with an empty label; returns `[]` when fewer than two
  survive (decision 9).
- Pure functions, no I/O — this is the part worth being able to reason about.

### `scripts/fetch-transcripts.mjs`

- Resolve the video URLs: by default query the dataset via
  `npx sanity documents query "array::unique(*[_type == 'lesson' && defined(videoUrl)].videoUrl)"`
  with the project and dataset read from `studio/.env` exactly as
  `seed/scripts/import.mjs` does; with `--from-seed`, read `../seed/videos.json`
  instead. Authentication is the CLI session — **no token is read or stored**.
- Flags: `--from-seed`, `--refresh` (re-fetch cached), `--only <videoId|url>`
  (repeatable), `--limit <n>`, `--keep-raw` (leave the `.json3` files for
  inspection).
- For each unique URL, in order:
  - parse it; a URL that is not YouTube is **skipped and reported** as an
    unsupported provider (Vimeo/Bunny — decision in scope note);
  - skip if `cache/<docId>.json` exists and `--refresh` was not passed;
  - probe, fetch captions, normalise, and write
    `cache/<docId>.json`:
    `{docId, provider, videoId, url, title, durationSeconds, chapters, chunks,
      captionSource, chapterSource, fetchedAt}`;
  - delete the raw `.json3` unless `--keep-raw`;
  - sleep 1.2s.
- Print one line per video: `✓ <videoId> — 18 chapters, 73 chunks (auto)` or the
  failure reason.
- Close with counts: fetched, cached-skip, unsupported, failed. Exit non-zero if
  anything failed, listing each with its reason so a re-run can target it.

### `scripts/build-ndjson.mjs`

- Read every `cache/*.json`, apply `chapters.json` overrides (setting
  `chapterSource: "authored"`), build the documents, validate, and write
  `dist/vertex-videos.ndjson` (one JSON document per line, as the seed does).
- Array members get deterministic `_key`s: `ch<startSeconds>` for chapters,
  `c<startSeconds>` for chunks — unique within a document because starts are.
- Skip and report documents with neither chapters nor chunks (decision 12).
- Report per document: title, duration, chapter count, chunk count, caption
  source. Then totals, and the two lists that matter — videos with no chapters
  (transcript-only) and videos with no captions.
- Exit non-zero on any validation failure or any skipped-empty document.

### `lib/validate.mjs`

Fails the build on any of:

- a duplicate `_id` or a duplicate `url`;
- an `_id` not matching `^video\.[A-Za-z0-9._-]+$`;
- a `url` whose host is off the allowlist, or that re-parses to a different
  `docId` than the document's own;
- `chapters` or `chunks` not sorted strictly ascending by `startSeconds`;
- any `startSeconds` negative, non-integer, or greater than `durationSeconds`;
- any empty chapter label or chunk text, or a chunk over 1,000 characters;
- `captionSource`/`chapterSource`/`provider` outside their vocabularies (mirrored
  from the schema, as `seed/lib/validate.mjs` mirrors its own);
- a document with `chunks.length === 0 && chapters.length === 0`.

### `scripts/import.mjs`

A copy of `seed/scripts/import.mjs` pointed at `dist/vertex-videos.ndjson`:
resolve project and dataset from `studio/.env`, `--replace` by default,
`--missing` supported, CLI session for auth, `shell: true` for Windows.

### `studio/package.json`

```
"videos:fetch":  "node videos/scripts/fetch-transcripts.mjs",
"videos:build":  "node videos/scripts/build-ndjson.mjs",
"videos:import": "node videos/scripts/import.mjs"
```

### `studio/context/agent-context.mjs`

Only the stale comment above `GROQ_FILTER` changes: say that `video` documents
now exist and are deliberately outside the filter until search consumes them
(section 11), and that adding the type is part of that work. `GROQ_FILTER`
itself is unchanged, so no context re-import is needed.

## Security considerations

- **No token anywhere.** Fetch reads the dataset and import writes to it through
  the Sanity CLI's own session, the same as the seed. Nothing here reads
  `SANITY_API_READ_TOKEN`, and no write token is introduced. `.env.example` needs
  no new entry.
- **Nothing runs in the request path.** This is `studio/`-only tooling invoked by
  hand. No web route, server module, or client component is touched, so the
  server/client boundary and the private-token rule are untouched by construction.
- **Whole transcripts never leave the datastore wholesale.** The transcript is
  stored only as short chunks (CLAUDE.md section 8), so a later GROQ filter can
  return a few matched chunks rather than the array. CLAUDE.md section 12's
  context-window trap is a search-side rule, but the storage shape here is what
  makes obeying it possible; the README states it so nobody later adds a
  `fullTranscript` field.
- **yt-dlp is located, never installed, and never fed unvalidated input.** Every
  URL is parsed and provider-checked before it reaches a spawn, arguments are
  passed as an array (no string interpolation into a shell command), and the
  script fails with instructions rather than running an installer.
- **Third-party content.** Transcripts of public videos are stored in a private
  dataset for search only, and are never rendered to a learner as page content —
  a video result links to the moment in the embed, as it already does.
- **Derived data is gitignored.** `cache/` and `dist/` stay out of git;
  `chapters.json` (authored) is committed.

## Acceptance criteria

- `npm run videos:fetch` in `studio/` produces one `cache/*.json` per unique
  lesson video URL in the dataset, and re-running it without `--refresh` fetches
  nothing and reports every video as already cached.
- `npm run videos:build` runs with no network and writes
  `dist/vertex-videos.ndjson`, one document per cached video that has content,
  with a report naming the transcript-only videos.
- `npm run videos:import` creates the `video` documents, and running it a second
  time updates them in place — the document count does not grow.
- Every document has `_id` of the form `video.youtube-<id>`, a `url` equal to the
  lesson's `videoUrl`, chunks in ascending order, and no `startSeconds` past
  `durationSeconds`.
- Videos whose source has a real table of contents carry it as `chapters` with
  `chapterSource: "provider"`; videos with none carry `chapters: []`,
  `chapterSource: "none"`, and still carry chunks.
- A spot-checked chunk's `startSeconds` lands on the words in `text` when the
  video is opened at that second.
- Every lesson's `videoUrl` joins to exactly one video document:
  `count(*[_type == "lesson" && !(videoUrl in *[_type == "video"].url)])` is `0`.
- `web/sanity.types.ts` is regenerated and contains a `Video` type; `npm run
  typecheck` and `npm run lint` in `web/` pass.
- The Studio builds and shows a Videos list.
- Nothing under `web/app/` or `web/sanity/` changed except the generated types.

## Checks to run

From `studio/`:

```powershell
npm run typegen          # schema.json + ../web/sanity.types.ts
npm run videos:fetch     # the real run, ~10-20 min for 135 videos
npm run videos:build
npm run videos:import
npm run build            # the Studio still builds with the new types
npm run deploy           # required before the Context MCP serves the dataset
```

From `web/`:

```powershell
npm run typecheck
npm run lint
```

No `next build` is required — no route, config, or server module changes — but
run it if the regenerated types touch anything that compiles.

## Manual test steps

1. `cd studio`, then `npm run typegen`. Confirm `web/sanity.types.ts` gains
   `Video`, `VideoChapter`, and `VideoChunk`.
2. `npm run videos:fetch -- --limit 3` first. Confirm three `cache/*.json` files,
   each with `chunks` and a `captionSource`, and that the run reports what it did.
3. Re-run the same command. Confirm it fetches nothing and reports all three as
   cached.
4. `npm run videos:fetch` for the full run. Note the failed and unsupported
   counts at the end; re-run to retry failures.
5. `npm run videos:build`. Read the report: total documents, how many are
   transcript-only, how many had no captions.
6. Open `dist/vertex-videos.ndjson` and check one document by eye — `_id`,
   ascending `startSeconds`, sane chunk text, `_key`s present.
7. `npm run videos:import`, then `npm run videos:import` again. In Vision:
   `count(*[_type == "video"])` is the same both times.
8. In Vision, run
   `*[_type == "video"][0]{_id, url, durationSeconds, "chapters": count(chapters), "chunks": count(chunks), captionSource, chapterSource}`.
9. In Vision, run the join check:
   `count(*[_type == "lesson" && !(videoUrl in *[_type == "video"].url)])` → `0`.
10. Pick a video with chapters. Open its `url` on YouTube at a chapter's
    `startSeconds` and confirm the chapter label matches what is being taught.
11. Pick a chunk from a transcript-only video, open the lesson page at
    `/lessons/<slug>?t=<chunk startSeconds>`, and confirm the narration matches
    the chunk's `text` — this is the exact path a future video result will take.
12. `cd web`, `npm run typecheck` and `npm run lint`.
13. `git status` — no `cache/` or `dist/` files staged.
