# Implementation prompt: let the search agent use its tools

## Goal

Make `POST /api/search` actually return results. It has never once succeeded —
not on OpenAI, not on NIM, not on OpenCode Zen — and the reason turns out to
have nothing to do with any of those providers.

The route forces structured output (`Output.object`) on **every** step of the
agentic loop. A model that must emit schema-shaped JSON on its first token
cannot emit a tool call instead, so it never reaches the Context MCP, never
writes GROQ, and answers from nothing.

The fix is to stop forcing the schema during the tool loop and shape the answer
afterwards.

## Evidence

All measured against the live MCP and the live dataset today, with the real
system prompt and the real tool set (`groq_query`, `schema_explorer`,
`array_field_reader`).

**The current code, `nemotron-3-ultra-free`:**

```
finishReason: stop   outputTokens: 99   toolCalls: 0
{
{
"reply": "Searching for lessons on data fetching across the catalog..."
, "results": []
}
```

Zero tool calls, an empty result set, and a stray duplicated `{` that fails
`JSON.parse` — which is the `AI_NoObjectGeneratedError: could not parse the
response` in the dev log, and the "Search is unavailable right now." on screen.

**The current code, other free models:**

| Model | Tool calls | Result |
| --- | --- | --- |
| `nemotron-3-ultra-free` | 0 | invalid JSON |
| `nemotron-3.5-lightning-free` | 0 | valid JSON, empty results |
| `mimo-v2.5-free` | 0 | valid JSON, **4 fabricated lesson ids** |

The `mimo` run is the important one. With no tool call it invented ids like
`cdde6a394f1a5db7be511b4cd31c1e18`; real ids in this dataset look like
`lesson.fetching-data-in-server-components`. The existing grounding would have
dropped all four, which is the design working — but the search would still have
returned nothing.

**The proposed shape, `nemotron-3.5-lightning-free`:** tool loop first with no
forced schema, then a shaping call.

```
phase1: toolCalls=1 (groq_query)
phase2: valid structured output, 4 results
```

All four ids verified present in the dataset:

```
lesson.dataframes-and-series               "DataFrames and Series"
lesson.fetching-data-in-server-components  "Fetching data in Server Components"
lesson.request-memoization-and-the-data-cache
lesson.volumes-and-persistent-data
```

Also established, and not the problem:

- `OPENCODE_API_KEY` is present in `web/.env.local` and valid.
- `POST /zen/v1/chat/completions` → 200 for plain chat, for tool calling, and
  for `response_format: json_schema` individually. The provider wiring is fine.
- `/initial-context` → 200, 5384 bytes.

## Decisions and assumptions

### D1 — The tool loop runs unforced; the schema is applied to the text

`generateText` keeps `tools` and `stopWhen`, and loses `output`. The model is
then free to call tools, and ends by writing its answer as text.

That text is parsed with `SearchModelOutputSchema` — the same Zod schema, the
same guarantees. Nothing about grounding changes: ids are still read back out
of the dataset, seconds are still proven against a video document.

### D2 — Parsing is tolerant, because the API no longer constrains the output

Without `response_format`, models wrap JSON in ``` fences or precede it with a
sentence. A new `parseSearchModelOutput(text)` in `search.ts` strips fences,
takes the outermost `{…}`, `JSON.parse`s it, and `safeParse`s the result.
Returns `null` on failure rather than throwing.

In the run above phase 1's own text was already valid JSON, so this is the
normal path, not a rescue.

### D3 — One repair pass when parsing fails

If `parseSearchModelOutput` returns `null`, a second `generateText` runs with
`Output.object`, **no tools**, seeded with the first call's messages, asking
only for the final object. Structured output works reliably when it is not
competing with tool calling — that is exactly the phase 2 measured above.

If the repair also fails, the route 500s as it does now.

### D4 — The system prompt states the output contract

The schema is no longer enforced by the API, so the prompt has to carry it.
Add to `search-prompt.ts`: end with the JSON object and nothing else, no fences,
no prose around it, and the exact key names.

Also fix a real defect the measurement exposed: the shaping call set
`startSeconds: 0` on all four results, having read no chapter or chunk at all.
Zero is a legitimate second, so grounding cannot catch it — a lesson whose video
happens to have a chapter at 0:00 would render as a video card pointing at the
opening frame. The prompt must say: `startSeconds` is `null` unless you read the
number out of a `chapters[]` or `chunks[]` entry; `0` is not a default.

### D5 — Default model becomes `nemotron-3.5-lightning-free`

It is the model proven above to call `groq_query` and come back with four real
lesson ids. `nemotron-3-ultra-free` returned `[502] Upstream error from Nvidia:
Service temporarily overloaded` on every attempt during this session, so it
cannot be the default on evidence.

Still an env var, still overridable.

### D6 — Zen reports upstream failures inside a 200

```
HTTP 200
{"error":{"type":"server_error","message":"Upstream request failed: [502] …"}}
```

The AI SDK's retry never sees a retryable status, so it surfaces as
`AI_APICallError: Invalid JSON response`. Documented in the module comment, not
worked around — a retry policy for a free tier is a bigger change than this one,
and the route already fails safely.

### D7 — Out of scope

Result quality and ranking. This change is about the loop reaching the dataset
at all. The four results above are plausible but unjudged; `dataframes-and-series`
for "data fetching" is a loose match. Tune the prompt once search runs.

## Files to touch

| File | Change |
| --- | --- |
| `web/app/api/search/route.ts` | drop `output` from the tool call; parse; repair pass |
| `web/app/lib/search.ts` | add `parseSearchModelOutput` |
| `web/app/lib/search-prompt.ts` | JSON contract; the `startSeconds` null rule |
| `web/app/lib/search-model.ts` | default model; the 200-wrapped-error note |

Not touched: the UI, the Studio, the Context document, `queries.ts`,
`context-mcp.ts`, the provider package, `.env.example` (var names unchanged).

## Requirements

1. The tool-loop `generateText` call passes `tools` and `stopWhen`, not `output`.
2. `parseSearchModelOutput` handles fenced JSON, leading prose, and returns
   `null` rather than throwing.
3. On `null`, one no-tools `Output.object` repair pass; on its failure, 500.
4. The system prompt states the JSON contract and forbids `0` as a stand-in for
   "no moment".
5. Grounding is untouched — every field still read back from the dataset.
6. The browser still receives only `"Search is unavailable right now."` on error.

## Security considerations

- No change to what the model can read: the Context MCP's `groqFilter` bounds it.
- The learner's query stays in the `prompt`, never concatenated into the system
  prompt.
- Model output is *less* constrained now, which is exactly why every displayed
  field keeps coming from the dataset rather than from the model.
- The repair pass sends the same conversation to the same provider — no new
  destination, no new data.
- `OPENCODE_API_KEY` stays server-only; errors are logged server-side only.

## Acceptance criteria

1. `POST /api/search` returns a non-empty `results` array with real lesson ids.
2. The dev log shows at least one `groq_query` tool call per search.
3. A result with a moment carries a second that exists in that video's
   `chapters[]` or `chunks[]`; results without one carry no timestamp.
4. `npm run typecheck`, `npm run lint`, `npm run build` pass in `web/`.

## Checks to run

From `web/`: `npm run typecheck`, `npm run lint`, `npm run build`, and a live
search against the running dev server.

## Manual test steps

1. `cd web; npm run dev` — restart is required, the route caches initial context.
2. `curl.exe -s -X POST http://localhost:3000/api/search -H "content-type: application/json" -d '{\"query\":\"data fetching\"}'`
   → expect `resultCount` > 0 and ids of the form `lesson.*`.
3. Open `/search?q=data+fetching`. Expect cards, not the unavailable state.
4. Click a VIDEO card; confirm the video starts at the stated second.
5. Spot-check that second in Vision against the video document's chapters.

---

## Implementation notes (written after the build)

Four things learned while building this that the prompt above did not anticipate.

### Search works

Measured on a production build (`next build` + `next start -p 3100`), query
"caching": **8 results across 4 courses**, both kinds, with working deep links.

```
lesson  lesson.cost-caching-and-token-budgets          4.2
video   lesson.layer-caching-and-build-speed           2.2  t=166
lesson  lesson.request-memoization-and-the-data-cache  2.2
video   lesson.building-images-in-ci                   4.2  t=399
video   lesson.revalidation-time-based-and-on-demand   2.3  t=90
…
```

Every second checked against the dataset and found to be a real chapter marker,
with a label that matches the query:

| Second | Chapter label |
| --- | --- |
| 90 | "Cache revalidation" |
| 166 | "Watching the cache work - 17s becomes 0s" |
| 399 | "Leveraging HTTP caching for CI/CD acceleration" |

The model recovered from its own GROQ error mid-loop, too — a `FuncCall`
property-key mistake on step 2, corrected on step 3.

### The dev server was serving stale code, which nearly caused a misdiagnosis

After the fix, `localhost:3000` kept returning `resultCount: 0` with a canned
"No lessons found matching …", while a standalone script running the identical
prompt and tools against the identical model returned real results every time.
The running dev server had been started long before the edits and never picked
them up.

A production build on a fresh port settled it immediately. Worth reaching for
sooner next time a route behaves differently from a script that does the same
thing.

### Latency is the open problem

| Run | Time |
| --- | --- |
| standalone, "data fetching" | 139s |
| standalone, "caching" | 118s |
| production route, "caching" | **6m35s** |

Seven to nine tool calls, each a full round trip to a free-tier model that is
also rate-limited and periodically overloaded. This is a model-tier problem, not
a code one — the loop is doing exactly what it should — but no learner waits six
minutes, so the search page cannot ship on this model.

### `0` is still appearing as a stand-in for "no moment"

The prompt now says plainly that `0` is a real second and not a way of writing
"no moment", and the model still wrote `startSeconds: 0` on lesson-shaped
results in two of three runs. Grounding contains the damage — the second has to
exist as a chapter or chunk before it becomes a timestamp — but a video whose
chapter list starts at `0` would produce a card pointing at its opening frame.

Two options if it persists, neither taken here because both exceed this change:
drop `startSeconds: 0` in `buildSearchResults` unless a *chapter* (not a chunk)
sits there, or have the model omit the key entirely, which the lenient parser
already handles.

### Default model reverted to `nemotron-3-ultra-free` (user's call)

D5 above chose `nemotron-3.5-lightning-free`. The user asked to go back, and the
reasoning behind D5 no longer holds: `ultra`'s unparseable JSON only ever
happened while a schema was forced on the tool loop, which this change removes,
and the NVIDIA 502s were capacity, not the model.

Re-measured on a clean production build, query "caching":

```
10 results across 5 courses
video  lesson.layer-caching-and-build-speed          t=166
video  lesson.revalidation-time-based-and-on-demand  t=90
video  lesson.building-images-in-ci                  t=399
+ 7 lesson results, all startSeconds null
```

Better than the `lightning` run it replaces (8 results / 4 courses), and with no
spurious `startSeconds: 0`. Latency unchanged at 4m43s.

One process note: the first attempt at this measurement was invalid. A test
server from the previous run still held port 3100, so `next start` silently
failed and the search hit the old build. Kill the port and confirm `Ready`
before trusting a number from it.
