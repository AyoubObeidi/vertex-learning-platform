# Video ingestion

Offline tooling that builds one `video` document per unique lesson video, each
holding that video's table of contents and its transcript in short timestamped
pieces (CLAUDE.md sections 8 and 9).

These documents are the lookup table behind intelligent search: they are what
lets a query resolve to an exact second inside a lesson's video. They are never
shown to a learner and never returned as a result on their own — a video moment
is always presented as the lesson that uses that video.

**Nothing here runs in the request path.** It is invoked by hand, it reads and
writes the dataset through the Sanity CLI's own session, and it stores no token.

## Requirements

`yt-dlp` must be on PATH:

```powershell
python -m pip install --user yt-dlp
# or
winget install yt-dlp.yt-dlp
```

If it lives somewhere else, point at it: `$env:YT_DLP = "C:\path\to\yt-dlp.exe"`.
Failing that, the scripts fall back to `python -m yt_dlp`.

Why an external tool, when `seed/scripts/harvest-videos.mjs` scrapes YouTube
with plain `fetch`: caption bodies are no longer served to an unauthenticated
request. Every caption URL taken from the watch page returns `200` with an empty
body, and the InnerTube `player` and `get_transcript` endpoints answer
`UNPLAYABLE` and `FAILED_PRECONDITION`. Chapters still scrape; transcripts do
not. yt-dlp is the maintained thing that keeps working, and this is offline
tooling, so depending on it here is fine in a way it never would be in the
request path.

## Running it

From `studio/`:

```powershell
npm run videos:fetch     # network: writes cache/, one file per video
npm run videos:build     # offline: validates and writes dist/vertex-videos.ndjson
npm run videos:import    # imports that file into the dataset
```

The split exists so the build is deterministic and needs no network, exactly as
the seed's does. `videos:import` runs with `--replace` and document ids are
derived from the video URL, so re-running updates the same documents rather than
creating a second set.

### Fetch options

```powershell
npm run videos:fetch -- --limit 3          # try a few first
npm run videos:fetch -- --only <videoId>   # one video; repeatable
npm run videos:fetch -- --refresh          # re-fetch what is already cached
npm run videos:fetch -- --from-seed        # read seed/videos.json, skip the dataset
npm run videos:fetch -- --keep-raw         # keep the downloaded .json3 files
```

The run is **resumable**: a video already in `cache/` is skipped unless
`--refresh`. One bad video never aborts the run — failures are collected,
listed at the end, and the process exits non-zero so a plain re-run picks up
exactly what is missing. A full pass over the seeded catalog takes roughly
10–20 minutes.

YouTube rate-limits a run this size. A `429` is treated as "slow down", not as a
broken video: the script waits 20s, then 60s, before giving up on that video and
moving on.

By default the list of videos comes from the **dataset** — every distinct
`lesson.videoUrl` — so it covers authored lessons, not only seeded ones.
`--from-seed` reads the committed `seed/videos.json` instead, for when you have
no CLI session.

## What gets stored

One `video` document per unique video URL, id `video.youtube-<videoId>`:

| Field | Notes |
| --- | --- |
| `videoId`, `url`, `provider` | The join key: a lesson links by `videoUrl`, not by reference |
| `title`, `durationSeconds` | From the source, for recognising the document and bounding a seek |
| `chapters[]` | `{startSeconds, label}` — the table of contents |
| `chunks[]` | `{startSeconds, text}` — the transcript, in ~40s pieces |
| `captionSource` | `manual` (author-uploaded), `auto` (generated), or `none` |
| `chapterSource` | `provider`, `authored`, or `none` |
| `ingestedAt` | When the pipeline last rebuilt it |

The transcript is **only ever stored in chunks**. There is deliberately no field
holding a whole transcript: a query has to be able to return the few pieces that
matched, and returning a whole one would overflow the model's context window
(CLAUDE.md section 12). Do not add one.

Chunks target ~40 seconds and are capped at 60 seconds or 600 characters —
short enough that `startSeconds` is a precise place to start playing, long
enough to carry an idea somebody might search for.

## Chapters, and what happens without them

Timestamps resolve in two stages (CLAUDE.md section 7): match the chapters
first, and fall back to the transcript only when no chapter fits. Chapter labels
are clean; transcript text is the noisier backstop.

Not every video has chapters — expect roughly a third of the catalog not to.
Those documents carry `chapters: []` and `chapterSource: "none"`, and search
reaches them through their chunks. That is the fallback working, not a fault.

A video with **fewer than two** chapters is treated as having none. A single
marker spanning a whole video is not a table of contents, and it would win the
chapter-first stage and answer second 0 for every query.

### Authoring chapters by hand

Put them in `chapters.json`, keyed by document id:

```json
{
  "video.youtube-T-D1OfcDW1M": [
    {"startSeconds": 0, "label": "Introduction"},
    {"startSeconds": 18, "label": "What RAG is"}
  ]
}
```

An entry there replaces whatever the provider published and marks the document
`chapterSource: "authored"`. Author them here rather than in the Studio — the
import runs with `--replace`, so a Studio edit survives only until the next run.

## What the build guarantees

`videos:build` fails rather than importing a lookup table that would send a
learner to the wrong second. It checks that:

- ids are unique, well-formed, and round-trip from the document's own `url`, so
  a lesson's `videoUrl` cannot join to the wrong document;
- no two documents claim the same video URL;
- chapters and chunks are in strictly ascending order — which also catches two
  entries sharing a second, since those would collide on `_key`;
- no timestamp is negative, fractional, or past the video's duration;
- no chapter label or chunk text is empty, and no chunk is over 1,000 characters;
- `provider`, `captionSource`, and `chapterSource` match the Studio schema's
  vocabularies, and each source field agrees with what the document actually
  holds.

A video that ends up with neither chapters nor a transcript is **skipped and
reported**, and the build exits non-zero. An empty video document is noise every
query would have to filter past.

## Providers

YouTube only, for now. Playback works for Vimeo and Bunny
(`web/app/lib/video.ts`), but ingestion does not, and CLAUDE.md section 9 is
explicit that a provider is not supported until both exist. A non-YouTube URL is
reported as unsupported and skipped rather than half-handled. Adding one means a
way to turn its captions into chunks and a source of chapters.

## Layout

```
lib/
  video-id.mjs        URL -> provider, id, document id
  ytdlp.mjs           locating and running yt-dlp
  transcript.mjs      json3 -> cues -> chunks; chapter normalisation
  build.mjs           cache entries -> video documents
  validate.mjs        the invariants
scripts/
  fetch-transcripts.mjs   writes cache/ (the only step that hits the network)
  build-ndjson.mjs        writes dist/vertex-videos.ndjson
  import.mjs              imports it
chapters.json         authored chapter overrides (committed)
cache/                fetched transcripts, gitignored
dist/                 build output, gitignored
```

`lib/video-id.mjs` is the Studio-side counterpart of `web/app/lib/video.ts`. The
two workspaces are standalone and cannot import from each other, so the URL
forms are restated in both. If you add a URL form to one, add it to the other.
