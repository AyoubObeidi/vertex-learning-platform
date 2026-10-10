# Implementation prompt: point the search agent at the Google Gemini API

## Goal

Replace OpenRouter with the **Google Gemini API, called directly**, as the model
behind `POST /api/search`, and use the Gemini key the user supplied.

Nothing else about search changes: not the Context MCP connection, the system
prompt, the grounding rules, the tool loop, the repair pass, or the UI.

This supersedes `prompts/vertex-search-openrouter-provider.md` (written, never
committed). That prompt's `.env.example` and `search-model.ts` edits are still
uncommitted in the working tree and are overwritten by this one.

Confirmed with the user in the question panel:

| Question | Answer |
| --- | --- |
| Integration path | **Direct Google Gemini API**, not Gemini routed through OpenRouter. |
| Key source | **Google AI Studio / Gemini API key.** Its `AQ.` prefix differs from the classic `AIza…` shape, so the first check after wiring is a live call that proves Google accepts it. |

## Skills and docs read

- `CLAUDE.md` sections 5, 6, 12 (server-only secrets, env in `.env.example`).
- No project skill covers model providers. CLAUDE.md says to follow the AI SDK
  package docs and existing patterns, so this mirrors the existing
  `search-model.ts` structure.

## Code inspected

- `web/app/lib/search-model.ts`: builds `searchModel` with
  `createOpenAICompatible` against OpenRouter, asserts the key at module load,
  enforces an https-only base URL, exports `searchModelId` for analytics.
- `web/app/api/search/route.ts`: the only consumer. Calls `generateText` twice
  (an unforced tool loop, then a repair pass with `Output.object`). Records
  `PROVIDER = "opencode"` on the analytics event, which is already stale.
- `web/package.json`: `ai@7.0.92` (provider spec v4). `@ai-sdk/google@4.x`
  depends on `@ai-sdk/provider@4`, so it is the matching major. `3.x` is not.
- `web/.env.local` holds a live `OPENROUTER_API_KEY`. `web/.gitignore` ignores
  `.env*`, so nothing written there is committed.

## Decisions and assumptions

1. **Add `@ai-sdk/google@^4` and use `createGoogleGenerativeAI`.** Google's
   OpenAI-compatible endpoint exists, but the native provider handles Gemini's
   tool calling and structured output natively, which this loop depends on.
2. **Remove `@ai-sdk/openai-compatible`** once nothing imports it. One way to
   configure a model.
3. **Env var names:** `GEMINI_API_KEY` (required, asserted at module load),
   `GEMINI_MODEL` (optional). The key is passed explicitly as `apiKey`, so the
   SDK's implicit `GOOGLE_GENERATIVE_AI_API_KEY` lookup is never relied on.
4. **No base URL override.** The SDK's default is Google's https endpoint. With
   no override there is no plaintext path to guard, so the https check goes away
   along with `OPENROUTER_BASE_URL`.
5. **Default model `gemini-2.5-flash`**: fast, tool-capable, structured output.
   Before finalising, list the models the key can see
   (`GET https://generativelanguage.googleapis.com/v1beta/models`, key in the
   `x-goog-api-key` header) and pick a newer flash model only if it is served.
6. **Route:** `PROVIDER` becomes `"google"`. No other route change.
7. **Secrets:** I write the key into `web/.env.local` as `GEMINI_API_KEY`. The
   old `OPENROUTER_API_KEY` and `OPENCODE_API_KEY` lines are commented out with a
   note, not deleted, and flagged for removal.
8. **Rewrite the module comment.** The OpenRouter lore (prefixed ids, 200-wrapped
   upstream errors, the free-tier latency table) is false for Gemini and must go.
   The two rules that still hold stay: the model must call tools unprompted,
   and nothing in this module may reach the browser.

## Files I expect to touch

| File | Change |
| --- | --- |
| `web/app/lib/search-model.ts` | Gemini provider, env reads, default model, comment block. |
| `web/app/api/search/route.ts` | `PROVIDER` label only. |
| `web/package.json` + lockfile | Add `@ai-sdk/google`, remove `@ai-sdk/openai-compatible`. |
| `.env.example` | Replace the OpenRouter block with a Gemini block. No values. |
| `web/.env.local` | Add `GEMINI_API_KEY`, comment out the old keys. Not committed. |

## Security considerations

- The key is server-only: never `NEXT_PUBLIC_`, read only inside a
  `server-only` module, never logged.
- It is written only to the git-ignored `web/.env.local`. It is not written to
  `.env.example`, a prompt, or a commit.
- The key was pasted into a chat. If that is a concern, rotate it in AI Studio
  and paste the new value into `web/.env.local`.

## Acceptance criteria

- No `OPENROUTER_` or `OPENCODE_` reference remains in tracked code or
  `.env.example`. Historical prompt files are left as they are.
- A missing `GEMINI_API_KEY` stops the server with that name in the message.
- A live search returns grounded result cards through Gemini.

## Checks

- In `web`: `npm run typecheck`, `npm run lint`, `npm run build`.
- Live: the models listing call above returns 200 with the key, and one real
  search through `/api/search` returns results.

## Manual test steps

1. In `web`, run `npm run dev`.
2. Open `http://localhost:3000/search?q=caching` and confirm result cards appear.
3. Remove `GEMINI_API_KEY` from `web/.env.local`, restart, and confirm the
   server names the missing variable. Put it back.
4. In Vercel, add `GEMINI_API_KEY` (and `GEMINI_MODEL` if set), remove the
   `OPENROUTER_*` vars, and redeploy.

## Outcome (recorded after implementation)

- **Key works.** `GET /v1beta/models` returned 200 with it.
- **Default model is `gemini-3.5-flash`, not the planned `gemini-2.5-flash`.**
  `gemini-2.5-flash` returns 404 for new users. `gemini-3.8-flash` called tools
  but took 54-177s per call, even at `thinkingLevel: low`, which times out every
  search. `gemini-3.5-flash` took 2-5s per call. The timings are in
  `search-model.ts`.
- **Version alignment.** `@ai-sdk/google@4` needs `@ai-sdk/provider@4.0.26`.
  `ai` and `@ai-sdk/mcp` were bumped within their majors so one copy of the
  provider types is shared. Otherwise typecheck fails on duplicate types.
- **Checks:** typecheck, lint and build pass.
- **Live search, three runs:** one 200 in 79s, one Google 503 ("high demand"),
  one 429. The 429 is the free tier's limit of 20 generate requests per day,
  used up by this testing. A search is several model calls, so this key's free
  tier allows only a handful of searches a day. Raising it means enabling
  billing on the Google AI Studio project.
