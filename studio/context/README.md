# Search config

The Sanity Context document that configures the search agent's MCP endpoint
(CLAUDE.md section 10). It carries two things:

- **`groqFilter`** — the content scope. Which documents the agent can see.
- **`instructions`** — the query guidance. Only what the auto-generated schema
  does not already make obvious.

Both live in [`agent-context.mjs`](agent-context.mjs), which is the single source
of truth. Edit that file, rebuild, re-import.

## Running it

From `studio/`:

```sh
npm run context:build    # write dist/vertex-agent-context.ndjson, print both URLs
npm run context:import   # import it into the dataset
```

`context:import` uses the Sanity CLI's own session (`npx sanity login`) and the
project and dataset from `studio/.env`. No write token is stored anywhere. The
import runs with `--replace`, so the document id is stable and re-running updates
the existing configuration rather than creating a second one.

The web app reads whichever URL you set as `SANITY_CONTEXT_MCP_URL`:

```
https://api.sanity.io/v2026-03-03/context/mcp/<projectId>/<dataset>/vertex-search
```

## Why this is not authored in the Studio

The `@sanity/context` Studio plugin would register a `sanity.agentContext` type
and give this document a form. It cannot be installed here: v2 peer-depends on
`sanity@^6` and this Studio is on 5.x (CLAUDE.md section 12). So the document is
created by import instead, and Conversation Insights stays unavailable until the
plugin catches up.

## If the import is rejected

`sanity.` is a reserved type prefix. It works today, but if a future API version
refuses it, nothing about the app has to change — `context:build` also prints a
**base** MCP URL with the same filter and instructions baked in as
`?groqFilter=` and `?instructions=` query params. Set that as
`SANITY_CONTEXT_MCP_URL` and the agent is configured identically, just without a
document behind it.

`web/sanity/lib/context-mcp.ts` appends `/initial-context` to the URL's *path*
specifically so a query string on that fallback URL survives.

## Prerequisites

The Context MCP only serves a dataset that has a **deployed Studio application**
— a schema-only deploy is not enough (CLAUDE.md section 12):

```sh
npx sanity deploy        # studioHost and appId are pinned in sanity.cli.ts
```

Verify the endpoint is live and serving this config:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File studio\context\verify.ps1
```

It reads the URL and token from `web/.env.local` and checks both things:

```
Endpoint: https://api.sanity.io/v2026-03-03/context/mcp/<projectId>/<dataset>/vertex-search
Tools: initial_context, groq_query, schema_explorer, array_field_reader
Initial context: 3955 bytes
Search config is applied.
```

The script exists because in PowerShell `curl` is an alias for
`Invoke-WebRequest`, which does not accept curl's `-H` or `-d` — the bash form
below fails with a parameter-binding error if you paste it into a PowerShell
prompt. Reach for `curl.exe` to run the bash form verbatim on Windows.

<details>
<summary>The same two checks in bash</summary>

```sh
set -a && . ./web/.env.local && set +a

curl -X POST "$SANITY_CONTEXT_MCP_URL" \
  -H "Authorization: Bearer $SANITY_API_READ_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

curl "$SANITY_CONTEXT_MCP_URL/initial-context" \
  -H "Authorization: Bearer $SANITY_API_READ_TOKEN"
```

The variables are not exported by default — they live in `web/.env.local`, so
the `set -a` line is what puts them in the environment.

</details>

`/initial-context` returns exactly what the search route injects into the system
prompt, so it is the fastest way to confirm an edit to `agent-context.mjs`
actually landed.

## Keeping the two prompts in step

The critical query and ranking rules are duplicated in the inline system prompt
at `web/app/lib/search-prompt.ts`, because the model follows the system prompt
more reliably than the injected instructions (CLAUDE.md section 12). **Change one,
change the other.**

Note that the search route caches the initial context, so an edit here reaches
the agent on the next request in production but needs a dev server restart to
show up locally.
