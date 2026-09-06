# Implementation prompt: point the search agent at OpenCode Zen

## Goal

Re-point the model provider behind `POST /api/search` from NVIDIA NIM to
**OpenCode Zen**. Nothing else about search changes — not the Context MCP
connection, not the system prompt, not the grounding, not the UI, not the
provider *package*.

This is a small delta on `prompts/vertex-search-nim-provider.md`, which landed
an hour ago and was never exercised (no NIM key was ever created). Both
providers speak the same OpenAI-compatible chat-completions API, so the work is
a base URL, three env vars, and a default model id.

Confirmed with the user in the question panel:

| Question | Answer |
| --- | --- |
| Default model | **`nemotron-3-ultra-free`** — free tier, and the Nemotron 3 family whose Super variant is already confirmed to support both function calling and structured output. |

## Live facts established before writing this

Probed directly, no key required:

- `GET https://opencode.ai/zen/v1/models` → **200**, listing **70 models**.
- `POST https://opencode.ai/zen/v1/chat/completions` with no key → **401**, so
  the path exists and only auth is missing.
- Model ids on the raw API are **unprefixed** (`gpt-5.5`, `claude-sonnet-5`,
  `nemotron-3-ultra-free`). The `opencode/<id>` form is for OpenCode's own TUI
  config, not this API.
- Eight free models are served: `big-pickle`, `deepseek-v4-flash-free`,
  `muse-spark-1.3-contributor-free`, `muse-spark-1.2-contributor-free`,
  `mimo-v2.5-free`, `ling-3.0-flash-fin-free`, `nemotron-3-ultra-free`,
  `nemotron-3.5-lightning-free`.
- `nemotron-3-ultra-free` is present in that list.

Current `web/.env.local` state, checked: no `NIM_API_KEY`, no `OPENAI_API_KEY`,
and a stale `OPENAI_MODEL=gpt-5` left behind that nothing reads.

## The one real risk

OpenCode Zen's docs say its endpoints vary by model family — `/responses`,
`/messages`, `/models/{id}`, and `/chat/completions`. `createOpenAICompatible`
speaks **only** `/chat/completions`. So a Claude model on Zen served over
`/messages`, or a GPT model served over `/responses`, would not work through
this provider no matter how correct the key is. That is precisely the trap that
made the original OpenAI code fail against NIM.

`nemotron-3-ultra-free` is an open-weights model, the family least likely to be
routed to a vendor-native endpoint, which is a second reason it is a good
default beyond being free.

Zen's docs do not document tool calling or structured output at all, so neither
capability is confirmed for any model on it. The route needs both **in the same
request**. This stays unproven until a real search runs.

---

## Decisions and assumptions

### D1 — Same provider package, new base URL

`@ai-sdk/openai-compatible` with `supportsStructuredOutputs: true` is unchanged.
Only `baseURL`, the env var names, and the default model id move. No install, no
uninstall, no dependency change.

### D2 — Env vars are renamed, not aliased

`NIM_API_KEY` / `NIM_BASE_URL` / `NIM_MODEL` become `OPENCODE_API_KEY` /
`OPENCODE_BASE_URL` / `OPENCODE_MODEL`. Keeping the NIM names for an OpenCode
endpoint would be a lie in the one file a reader checks first. The user has
never set the NIM names, so nothing breaks.

`OPENCODE_BASE_URL` defaults to `https://opencode.ai/zen/v1`, and stays
overridable for the same reason it was on NIM: a different gateway is then a
config change, not a code change.

### D3 — `search-model.ts` keeps its shape

The module stays exactly as structured — `server-only`, key asserted at load
with a named error, provider built once, `searchModel` and `searchModelId`
exported. Only the constants and comments change. The route is untouched apart
from the `provider` string on the analytics event.

### D4 — The endpoint-family risk is documented where it will be read

The module comment and `.env.example` both say: this provider speaks
`/chat/completions` only, and a model Zen routes to `/responses` or `/messages`
will not work here. That is the non-obvious failure, and it deserves to be
written next to the knob rather than in a prompt file.

### D5 — Grounding is untouched, so integrity is unchanged

Same as the NIM change: a different model writes different GROQ and ranks
differently, so result *quality* varies. Result *integrity* cannot — an invented
lesson id resolves to nothing, an invented second fails the chapter/chunk check
and degrades to a lesson card.

### D6 — The stale `OPENAI_MODEL` goes

It is in `web/.env.local`, nothing reads it, and leaving it invites a future
reader to think the app still talks to OpenAI. The user removes it; I flag it.

### D7 — Still a departure from CLAUDE.md §6

§6 names "the AI SDK with the OpenAI provider". The AI SDK stays, the provider
does not. Flagged again rather than editing the user's document unasked.

---

## Files to touch

| File | Change |
| --- | --- |
| `web/app/lib/search-model.ts` | base URL, default model, env var names, comments |
| `web/app/api/search/route.ts` | `PROVIDER` string only |
| `.env.example` | `NIM_*` → `OPENCODE_*`, with the endpoint-family warning |

No dependency change. Not touched: `search.ts`, `search-prompt.ts`,
`queries.ts`, `context-mcp.ts`, every search component, the Studio, the Context
document.

**The user must add `OPENCODE_API_KEY` to `web/.env.local`.** I cannot, and the
route fails loudly until they do.

## Requirements

1. `search-model.ts`: `OPENCODE_API_KEY` required and asserted by name;
   `OPENCODE_BASE_URL` defaulting to `https://opencode.ai/zen/v1`;
   `OPENCODE_MODEL` defaulting to `nemotron-3-ultra-free`. Comments cover the
   chat-completions-only constraint and the unverified tool-calling/structured
   output support.
2. Route reports `provider: "opencode"` on `search_performed`.
3. `.env.example` documents the three vars in the house style, including how to
   list live models (`curl.exe -s https://opencode.ai/zen/v1/models`, no key
   needed) and the warning that a model routed to `/responses` or `/messages`
   will not work.

## Security considerations

- `OPENCODE_API_KEY` is server-only, read only inside a server route, never
  `NEXT_PUBLIC_`, never logged. Same posture as every provider key before it.
- Route error handling is unchanged and already verified against a real provider
  failure: the browser gets `"Search is unavailable right now."`, with no
  provider payload, URL, or key.
- Swapping providers does not widen what the model can read — the Context MCP's
  `groqFilter` bounds that, and it is untouched.
- The per-IP rate limit still applies, and matters on a free tier.

## Acceptance criteria

1. `POST /api/search` returns a real result set with both result kinds and a
   `courseCount`.
2. The dev log shows traffic to `opencode.ai`, not `integrate.api.nvidia.com`.
3. Starting without `OPENCODE_API_KEY` fails with an error naming that variable.
4. No file references `NIM_` any more.
5. Nothing in the browser contains the key, the base URL, or a provider error.
6. `npm run typecheck`, `npm run lint`, `npm run build` pass in `web/`.

## Checks to run

From `web/`: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run dev`,
plus one live search — the only check that proves the model can do tool calling
and structured output together.

## Manual test steps

1. Put `OPENCODE_API_KEY=…` in `web\.env.local`; delete the stale `OPENAI_MODEL`.
2. `cd web; npm run dev` — restart required, the route caches initial context.
3. `curl.exe -s -X POST http://localhost:3000/api/search -H "content-type: application/json" -d '{\"query\":\"data fetching\"}'`
   → expect `resultCount`, `courseCount`, both result kinds.
4. Read the dev log. A `404` or an unexpected response shape means the model is
   not served over `/chat/completions` — try another id from
   `curl.exe -s https://opencode.ai/zen/v1/models`, preferring open-weights ones.
5. Open `/search?q=data+fetching`, click a VIDEO card, confirm it plays from
   that second.
6. Spot-check that second in Vision against the video document's chapters/chunks.
7. Comment out `OPENCODE_API_KEY`, restart, confirm the named error. Restore.
8. `npm run typecheck; npm run lint; npm run build`.
