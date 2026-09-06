# Implementation prompt: move the search agent from OpenAI to NVIDIA NIM

## Goal

Swap the model provider behind `POST /api/search` from OpenAI to NVIDIA NIM, so
intelligent search works again. Nothing else about search changes — not the
Context MCP connection, not the system prompt, not the grounding, not the UI.

The trigger: the OpenAI account returns `429 — "You have no credits remaining"`
on every request. Verified from the dev log; the rest of the pipeline is healthy
(the MCP `/initial-context` returns 200 with the `video` type and the "Video
moments" instructions in it).

Confirmed with the user in the question panel:

| Question | Answer |
| --- | --- |
| Shape of the change | **Replace OpenAI with NIM.** One provider, not an env-driven switch. `OPENAI_*` is retired. |
| Package | **Add `@ai-sdk/openai-compatible`**, the route the AI SDK documents for NIM. |

---

## What was read

- **CLAUDE.md** §5 (the LLM lives behind the server route; the browser never
  reaches it), §6 (the stack names "the Vercel AI SDK with the OpenAI provider"
  — this prompt is the user's decision to change that; see D6), §12 (the route
  caches initial context, so provider changes need a dev restart), §13 (checks).
- **AI SDK — NVIDIA NIM provider** (`ai-sdk.dev/v7/providers/openai-compatible-providers/nim`):
  `createOpenAICompatible({name, baseURL: 'https://integrate.api.nvidia.com/v1', headers})`,
  and the warning that "model support for tool calls and structured output
  varies", with `meta/llama-3.3-70b-instruct` named as one that supports
  structured output.
- **AI SDK — OpenAI Compatible provider**: the factory takes `name`, `apiKey`,
  `baseURL`, `headers`, `queryParams`, and **`supportsStructuredOutputs`**,
  which is what turns on JSON-schema-constrained generation.
- **NVIDIA NIM for LLMs, API Reference**: the inference endpoints are
  `/v1/chat/completions`, `/v1/completions`, `/v1/models`, `/v1/embeddings`.
  **There is no `/v1/responses`.**
- `web/app/api/search/route.ts`, `web/app/lib/search-prompt.ts`,
  `web/sanity/lib/context-mcp.ts` (for its `assertValue` env pattern and its
  `server-only` posture), `web/package.json`, `.env.example`.

## Live facts established before writing this

- The current failure really is billing, not code: `statusCode: 429`,
  `"You have no credits remaining"`, on five consecutive attempts.
- The current call goes to **`https://api.openai.com/v1/responses`** — proved by
  the URL in the logged error. `@ai-sdk/openai` v4's `openai(id)` defaults to
  the Responses API, which NIM does not implement. This is why a bare key/base
  URL swap could never have worked.
- No `NIM_API_KEY` exists in `web/.env.local` yet.
- Version compatibility is clean: `@ai-sdk/openai-compatible@3.0.44` depends on
  `@ai-sdk/provider@4.0.10` and `@ai-sdk/provider-utils@5.0.36` — byte-identical
  to what the installed `@ai-sdk/openai@4.0.58` depends on, against `ai@7.0.92`.

---

## Decisions and assumptions

### D1 — `createOpenAICompatible`, with `supportsStructuredOutputs: true`

NIM speaks chat completions, so the provider must be a chat-completions one.
`supportsStructuredOutputs` is the flag that lets `Output.object` keep working;
without it the SDK would not send the JSON schema and the route's Zod parse
would start failing on free-form text.

### D2 — The model and base URL are env-driven; only the provider is hardcoded

`NIM_MODEL` defaults to `meta/llama-3.3-70b-instruct` — the model the AI SDK's
own NIM page names for structured output. It is a default and not a constant on
purpose: NIM's capabilities vary per model, this pipeline needs an unusually
demanding combination (see the risk below), and swapping models must be an
`.env.local` edit and a restart, not a code change.

`NIM_BASE_URL` defaults to `https://integrate.api.nvidia.com/v1` so the hosted
endpoint needs no configuration, while a self-hosted NIM container is one env
var away.

### D3 — Provider construction moves into its own server-only module

`web/app/lib/search-model.ts`, `import 'server-only'`, mirroring
`web/sanity/lib/context-mcp.ts`: it reads and asserts the env, builds the
provider once at module scope, and exports the model plus its id. The route goes
back to being about search rather than about provider wiring, and "which model
does search use" has exactly one answer in the codebase.

A missing `NIM_API_KEY` fails loudly with a named error, the way
`SANITY_CONTEXT_MCP_URL` already does — not silently at request time with an
opaque 401.

### D4 — `@ai-sdk/openai` is removed

The user chose replacement over a switch. Leaving the package installed would
leave a second, unreachable provider in the tree and an `OPENAI_API_KEY` in
`.env.example` that nothing reads. `OPENAI_API_KEY` and `OPENAI_MODEL` are
retired from `.env.example`, and the user should delete them from
`web/.env.local` (they are inert either way).

### D5 — The structured-output fallback is documented, not built

The real risk in this change is that the model must do **tool calling and
schema-constrained output in the same request** — an agentic MCP loop of up to
12 steps that ends in a typed answer. That is the combination most likely to be
weak on an open-weights model behind vLLM.

If it proves unreliable, the fix is small and already half-built: drop
`Output.object`, ask the prompt for raw JSON, and parse it through the
`SearchModelOutputSchema` that already exists. That is *not* built now — building
an unused fallback for a failure that may not happen is the overbuilding
CLAUDE.md §14 warns about. It is written down here so the next person does not
have to rediscover it.

### D6 — This departs from CLAUDE.md §6, deliberately

§6 names "the Vercel AI SDK with the OpenAI provider". The AI SDK stays; the
provider changes, on the user's explicit instruction. Worth a line in CLAUDE.md
§6 eventually — flagged to the user rather than edited unasked, since CLAUDE.md
is the user's document.

### D7 — Grounding is untouched, and it is what makes this safe

A different model writes different GROQ and ranks differently, so result
*quality* will change. Result *integrity* cannot: an invented lesson id resolves
to nothing and is dropped, and an invented second fails the chapter/chunk check
and degrades to a lesson card. A weaker model means fewer or less relevant
results, never a fabricated course, lesson, or timestamp.

### D8 — Analytics keeps reporting what actually answered

`search_performed` already carries a `model` property. It gains `provider: "nim"`
alongside it, so a drop in result counts after this change is attributable in
PostHog rather than mysterious.

---

## Files to touch

| File | Change |
| --- | --- |
| `web/package.json` | add `@ai-sdk/openai-compatible@^3.0.44`, remove `@ai-sdk/openai` |
| `web/app/lib/search-model.ts` | **new** — server-only provider, env assertions, exported model + id |
| `web/app/api/search/route.ts` | use it; drop the OpenAI import and `DEFAULT_MODEL`; add `provider` to the capture |
| `.env.example` | add `NIM_API_KEY`, `NIM_MODEL`, `NIM_BASE_URL`; remove `OPENAI_API_KEY`, `OPENAI_MODEL` |

Not touched: `search.ts`, `search-prompt.ts`, `queries.ts`, `context-mcp.ts`,
every component under `app/components/search/`, `app/search/page.tsx`, the
Studio, and the Context document. The provider is the only moving part.

**The user must add `NIM_API_KEY` to `web/.env.local`** from build.nvidia.com. I
cannot, and the route will fail loudly until they do.

---

## Requirements

1. `web/app/lib/search-model.ts`:
   - `import 'server-only'`.
   - `createOpenAICompatible({ name: 'nim', baseURL, apiKey, supportsStructuredOutputs: true })`.
   - `NIM_API_KEY` required, asserted with a named error at module load.
   - `NIM_BASE_URL` optional, default `https://integrate.api.nvidia.com/v1`.
   - `NIM_MODEL` optional, default `meta/llama-3.3-70b-instruct`.
   - Exports `searchModel` (the chat model) and `searchModelId` (for analytics).
   - A module comment covering: why chat completions and not the Responses API,
     why `supportsStructuredOutputs` matters here, and that the model must do
     tool calling *and* structured output because of the agentic loop.
2. The route calls `generateText({ model: searchModel, … })` with everything else
   — system prompt, MCP tools, `Output.object`, `stopWhen` — unchanged.
3. `captureSearch` reports `model: searchModelId` and `provider: "nim"`.
4. `.env.example` documents the three NIM vars in the existing house style: what
   each is, that the key is server-only and must never be `NEXT_PUBLIC_`, and a
   note that model support for tool calling plus structured output varies, so
   `NIM_MODEL` is the knob to turn if search starts failing.

## Security considerations

- `NIM_API_KEY` is server-only, read solely inside a server route, never
  prefixed `NEXT_PUBLIC_`, never logged. Same posture the OpenAI key had.
- The route's error handling is unchanged and already correct: the provider's
  response is logged server-side and the browser gets
  `"Search is unavailable right now."` — no provider payload, no URL, no key.
  This was confirmed in practice against the 429.
- The learner's query still goes to the model as the user message, never
  concatenated into the system prompt.
- Swapping providers does not widen what the model can read: the Context MCP's
  `groqFilter` is what bounds that, and it is untouched.
- The in-memory rate limit on `/api/search` still applies and matters more, not
  less, on a free tier with its own quota.

## Acceptance criteria

1. `POST /api/search` returns a real result set, with both `"kind":"video"` and
   `"kind":"lesson"` entries and a `courseCount`.
2. The dev log shows the request going to `integrate.api.nvidia.com`, not
   `api.openai.com`.
3. `/search?q=data+fetching` renders cards; a VIDEO card opens the lesson with
   the embed playing from that second.
4. Every timestamp still resolves to a real chapter or chunk — the grounding is
   unchanged, so a spot-check in Vision must still match.
5. Starting the server with `NIM_API_KEY` unset fails with a named error naming
   that variable, not an opaque 401 at request time.
6. `@ai-sdk/openai` is gone from `package.json` and no file imports it.
7. Nothing in the browser's network traffic or page source contains
   `NIM_API_KEY`, the base URL, or a provider error body.
8. `npm run typecheck`, `npm run lint`, `npm run build` pass in `web/`.

## Checks to run

From `web/`:

```powershell
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

Plus a live search against the real MCP endpoint, which is the only check that
proves the chosen model can do tool calling and structured output together.

## Manual test steps

1. Get a key from build.nvidia.com and put `NIM_API_KEY=…` in `web/.env.local`.
   Delete `OPENAI_API_KEY` and `OPENAI_MODEL` from it.
2. `cd web; npm install`, then `npm run dev`. **A restart is required** — the
   route caches the initial context (CLAUDE.md §12).
3. `curl.exe -s -X POST http://localhost:3000/api/search -H "content-type: application/json" -d "{\"query\":\"data fetching\"}"`.
   Expect a `resultCount`, a `courseCount`, and both result kinds.
4. Read the dev server output. Confirm no 4xx from `integrate.api.nvidia.com`,
   and confirm the tool loop ran rather than the model answering from nothing.
5. **If it fails on tools or structured output**, that is the D5 risk arriving.
   Set a different `NIM_MODEL` in `.env.local` and restart — try
   `nvidia/llama-3.3-nemotron-super-49b-v1` or another model whose card on
   build.nvidia.com lists function calling. Only if several models fail is the
   D5 fallback worth building.
6. Open `/search?q=data+fetching`. Confirm cards render and the count line is
   real.
7. Click a VIDEO card; confirm the lesson opens and plays from that second.
8. In Vision, confirm that second exists:
   `*[_type=="video" && url == <the lesson's videoUrl>]{chapters[startSeconds == <n>], chunks[startSeconds == <n>]}`.
9. Comment out `NIM_API_KEY` and restart. Confirm the error names the variable.
   Restore it.
10. Search something absurd; confirm the empty state.
11. DevTools → Network and view-source: no key, no base URL, no provider error.
12. `npm run typecheck; npm run lint; npm run build`.

---

## Implementation notes (written after the build)

**The default model in D2 was wrong, and probing the endpoint caught it.**
`meta/llama-3.3-70b-instruct` — the model the AI SDK's NIM page still names —
reached end of life on **2026-08-26**. A request for it returns:

```
410 Gone — "The model 'meta/llama-3.3-70b-instruct' has reached its end of life
            on 2026-08-26T09:00:00Z and is no longer available."
```

`GET /v1/models` needs no API key, which made it possible to pick a replacement
from what is actually served (81 models) rather than from documentation.

**The new default is `nvidia/nemotron-3-super-120b-a12b`**, whose model card
lists both `Function Calling: Supported` and `Structured Output: Supported` —
the combination D5 identified as the risk. That pairing is genuinely scarce:
`mistralai/mistral-nemotron`, the model most often recommended for agentic tool
use, has structured output marked **unsupported** on its card, so it would have
run the whole MCP loop and then failed on the typed answer.

Confirmed live: an unauthenticated request for the new default returns `401`
(auth missing) rather than `410` (model retired), and it appears in
`/v1/models`. The env documentation now tells the reader to check both
capabilities *and* liveness before setting `NIM_MODEL`.

### What was verified, and what was not

- Build passes with the key present; `npm run typecheck` and `npm run lint` are
  clean; no file imports `@ai-sdk/openai` and the package is uninstalled.
- The missing-key path fails exactly as specified: the build stops with
  `Error: Missing environment variable: NIM_API_KEY`.
- The base URL is right and reachable: `GET /v1/models` → 200,
  `POST /v1/chat/completions` for the default model → 401 without a key.

**Not verified: any actual search.** That needs a `NIM_API_KEY`, which only the
user can create. Until then it remains unproven that this model does tool
calling and structured output *together* through the AI SDK, in a 12-step MCP
loop — the card says it can, but a card is not a test. Step 3 of the manual
tests is the real check.
