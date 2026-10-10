# Implementation prompt: point the search agent at OpenRouter

## Goal

Re-point the model provider behind `POST /api/search` from **OpenCode Zen** to
**OpenRouter**, and replace the credential with an OpenRouter API key.

Nothing else about search changes: not the Context MCP connection, not the
system prompt, not the grounding rules, not the route's tool loop or repair
pass, not the UI. Both gateways speak the same OpenAI-compatible
`/chat/completions` API, so the work is a base URL, three env var names, a
default model id, and the comment block that explains the provider.

This is a small delta on `prompts/vertex-search-opencode-provider.md`.

Confirmed with the user in the question panel:

| Question | Answer |
| --- | --- |
| Where the key comes from | **The user pastes it into `web/.env.local` themselves.** I cannot create an OpenRouter key — it lives behind their account at openrouter.ai/keys. The secret never passes through the conversation. |
| Env var names | **Rename `OPENCODE_*` to `OPENROUTER_*`.** Honest names; the cost is updating the three vars in Vercel too. |
| Default model | **`nvidia/nemotron-3-ultra-550b-a55b:free`** — the same Nemotron 3 Ultra running on Zen today, free, and tool-capable. |

## Live facts established before writing this

Probed directly, no key required:

- `GET https://openrouter.ai/api/v1/models` returns **200**, listing **436 models**.
- `POST https://openrouter.ai/api/v1/chat/completions` with no key returns
  **401** (`{"error":{"message":"No cookie auth credentials found","code":401}}`),
  so the path exists and only auth is missing.
- **21** models are free (prompt and completion priced at `0`), **18** of which
  declare `tools` in `supported_parameters`. Search is an agentic loop over the
  Context MCP, so tool support is not optional.
- `nvidia/nemotron-3-ultra-550b-a55b:free` is in that list: 1,000,000 token
  context, `tools` supported, both prices `0`.
- Model ids on OpenRouter are **prefixed** — `vendor/model[:free]`. This is the
  exact opposite of Zen's rule (`nemotron-3-ultra-free`, unprefixed), and the
  existing comment in `search-model.ts` says so. That comment must be rewritten
  or it will mislead the next reader straight into a 404.

Current state, checked:

- `OPENCODE_` appears in exactly two tracked files — `.env.example` (3 lines)
  and `web/app/lib/search-model.ts` (7 lines) — plus untracked
  `web/.env.local`, which holds a live `OPENCODE_API_KEY`.
- `web/.env.local` is ignored by `web/.gitignore` (`.env*`). No secret is
  committed and none will be.
- `README.md` and the Vercel config do not mention the provider.

## Decisions and assumptions

1. **Keep `@ai-sdk/openai-compatible` and `createOpenAICompatible`.** OpenRouter
   is an OpenAI-compatible gateway; there is no reason to add
   `@openrouter/ai-sdk-provider` and a second way to configure a model. The
   provider `name` changes from `opencode` to `openrouter`.
2. **The https-only guard on the base URL stays exactly as it is**, renamed.
   The reason it exists is unchanged: the API key rides every request as a
   bearer token, so an `http://` override would hand a billed credential to
   anything on the path. Same for the load-time assertion on the key — a missing
   key should stop the server naming the variable, not surface as an opaque 401
   inside a search three minutes later.
3. **`supportsStructuredOutputs: true` stays.** It is load-bearing for the
   route's repair pass, the one place a JSON schema is still sent. OpenRouter
   passes `response_format` through to models that support it.
4. **No `HTTP-Referer` / `X-Title` headers.** OpenRouter uses them only for its
   public leaderboard; they change nothing functional and would be one more
   thing to keep true.
5. **The old `OPENCODE_API_KEY` line in `web/.env.local` is commented out, not
   deleted**, with a note saying it is dead. It keeps an escape hatch if
   OpenRouter disappoints. Flagged for the user to delete once they are happy —
   a live credential should not linger.
6. **Historical prompt files are not rewritten.** `prompts/vertex-search-*.md`
   and `prompts/vertex-vercel-deployment.md` are the record of what was done at
   the time. This new prompt supersedes them; editing them would falsify the
   record. The *live* Vercel env vars still need changing, which is a user
   action, not a code change.
7. **Zen-specific lore is removed, not carried over.** Two comments in
   `search-model.ts` are about Zen and are false for OpenRouter: that the
   gateway routes model families to `/responses` or `/messages` (OpenRouter
   normalises everything to `/chat/completions`), and that upstream failures
   arrive inside a `200` (OpenRouter returns real error statuses; its free-tier
   failure mode is a `429` rate limit instead). The two comments that are still
   true — structured outputs being load-bearing, and the model having to call
   tools unprompted — stay.

## Files I expect to touch

| File | Change |
| --- | --- |
| `web/app/lib/search-model.ts` | Provider name, default base URL, default model id, three env var reads, and the comment block. |
| `.env.example` | Replace the OpenCode Zen block with an OpenRouter one — same shape: required key, optional base URL, optional model with the guidance that matters. |
| `web/.env.local` | `OPENROUTER_API_KEY=` added empty for the user to fill; old `OPENCODE_API_KEY` commented out. **No secret value is written by me.** |

No route, schema, query, or component changes.

## Requirements

1. `search-model.ts` reads `OPENROUTER_API_KEY` (required, asserted at module
   load), `OPENROUTER_BASE_URL` (optional, defaults to
   `https://openrouter.ai/api/v1`, must be `https:`), and `OPENROUTER_MODEL`
   (optional, defaults to `nvidia/nemotron-3-ultra-550b-a55b:free`).
2. `searchModelId` stays exported — PostHog attributes result quality to it, so
   a provider swap must remain visible in analytics.
3. No `OPENCODE_` string survives in `.env.example` or `web/app/lib/`.
4. Comments describe OpenRouter's real behaviour, including that model ids are
   prefixed and that the model must support `tools`.
5. `.env.example` stays the canonical list of every variable the app reads
   (CLAUDE.md section 12).

## Security considerations

- `OPENROUTER_API_KEY` is a billed credential and server-only. It is never
  prefixed `NEXT_PUBLIC_`, and `search-model.ts` keeps its `import "server-only"`
  so any client-component import is a build error. The browser only ever POSTs
  to `/api/search`.
- The https-only base-URL guard is preserved verbatim in behaviour: the key is
  sent as a bearer token on every request.
- No real key is written into any tracked file. `.env.example` gets an empty
  placeholder; `web/.env.local` is gitignored and the user fills it.
- The superseded Zen key is left commented in an ignored file and flagged for
  deletion.

## Acceptance criteria

- `npm run typecheck` and `npm run lint` pass from the repo root.
- `npm run build:web` succeeds — a server module changed (CLAUDE.md section 13).
- With a real key in `web/.env.local`, `npm run dev:web` starts and a search
  from the UI returns grounded results whose cards link to real lessons.
- With the key removed, the server fails at load with
  `Missing environment variable: OPENROUTER_API_KEY`.
- With `OPENROUTER_BASE_URL` set to an `http://` URL, the server fails at load
  naming the variable.

## Checks to run

From the repo root:

```powershell
npm run typecheck
npm run lint
npm run build:web
npm run dev:web
```

The build runs because a server module changed. The dev server plus one real
search is the only check that exercises the live provider and the Context MCP
together — a green build proves nothing about whether the model calls tools.

## Manual test steps

1. Get a key at https://openrouter.ai/keys (sign in, **Create Key**, copy it —
   it is shown once).
2. Open `web/.env.local` and put it on the `OPENROUTER_API_KEY=` line, no quotes.
3. From the repo root: `npm run dev:web`
4. Open http://localhost:3000 and search for something the content really covers
   (for example `data fetching`).
5. Expect a result count, ranked cards, and both result kinds. Click a video
   result and confirm the lesson page opens with the embed starting at the
   matched second.
6. Confirm the results are real — the lesson titles exist in the catalog.
7. If results are empty or the route errors, the first knob is
   `OPENROUTER_MODEL`. `nvidia/nemotron-3-super-120b-a12b:free` and
   `nvidia/nemotron-3.5-lightning:free` are the free tool-capable siblings.
   Free models are rate-limited; a `429` means slow down, not a bad key.
8. Update the three variables in the Vercel project before the next deploy, or
   production search breaks on a missing `OPENROUTER_API_KEY`.

---

## Post-implementation findings

Search still failed after the key was added. Three separate causes, found in
this order against `web/.next/dev/logs/next-development.log` and the live API:

1. **The chosen default model was too slow.** `TimeoutError: The operation was
   aborted due to timeout` appeared four times. Five timed tool-calling requests
   per candidate showed `nvidia/nemotron-3-ultra-550b-a55b:free` averaging
   **42.4s per call**. The route allows twelve steps inside a 90s
   `SEARCH_DEADLINE_MS`, so it dies after two. The default moved to
   `cohere/north-mini-code:free` — 5/5 tool calls at **4.4s**.

2. **Two claims in this prompt were wrong and are corrected in the code.**
   OpenRouter does *not* return real error statuses for upstream failures: it
   returns `{"error":{...,"code":502}}` inside a `200`, padded with whitespace,
   exactly as Zen did. The SDK's retry never fires and it surfaces as
   `AI_APICallError: Invalid JSON response`.

3. **The free tier's daily request cap is the current blocker.**
   `Rate limit exceeded: free-models-per-day. Add 10 credits to unlock 1000 free
   model requests per day`. Accounts under 10 credits get ~50 free model
   requests/day, and the measurement runs above consumed them. This matters
   beyond one afternoon: a single search is up to twelve model calls, so 50/day
   is roughly **four searches**. Free tier cannot support development of this
   feature.

Also observed, and environmental rather than a code fault: outbound HTTPS from
this machine intermittently times out across unrelated hosts (`openrouter.ai`,
`us.i.posthog.com`, `clerk.com`, `api.sanity.io`), flipping between rounds
seconds apart. Node's connect timeout is 10s and the SDK retries three times.

**Verified:** the migration itself works — the server dials openrouter.ai's real
IPs, the key authenticates, and the model returns tool calls. Typecheck, lint,
and build pass. **Not verified:** a complete end-to-end search, blocked on the
daily cap.
