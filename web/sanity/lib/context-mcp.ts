import 'server-only'

/**
 * The search agent's connection to the Sanity Context MCP (CLAUDE.md section 5).
 *
 * Nothing here may reach the browser: the MCP URL is an authenticated read path
 * into a private dataset, and the bearer token is the same server-only viewer
 * token the pages read with. `server-only` turns any client-component import of
 * this module into a build error.
 *
 * The endpoint only serves a dataset that has a deployed Studio application
 * (CLAUDE.md section 12) — a schema-only deploy is not enough. If this starts
 * returning "Only datasets with deployed Studio applications are supported",
 * run `npx sanity deploy` from studio/.
 */

import {readToken} from './token'

export const contextMcpUrl = assertValue(
  process.env.SANITY_CONTEXT_MCP_URL,
  'Missing environment variable: SANITY_CONTEXT_MCP_URL',
)

/**
 * Viewer role covers everything the agent does — it only ever reads. There is
 * deliberately no separate token: a second credential with the same scope would
 * be one more thing to leak.
 */
export const contextMcpToken = readToken

export const contextMcpHeaders = {Authorization: `Bearer ${contextMcpToken}`}

/**
 * `/initial-context` is appended to the *path*, so any query string on the URL
 * survives. That matters because the fallback configuration (when the
 * `sanity.agentContext` document cannot be used) carries the content filter and
 * instructions as query params — see studio/context/README.md.
 */
function initialContextUrl(): string {
  const url = new URL(contextMcpUrl)
  url.pathname = `${url.pathname.replace(/\/$/, '')}/initial-context`
  return url.toString()
}

/**
 * The compressed schema overview plus the Context document's instructions,
 * injected into the system prompt so the model knows the content model without
 * spending a tool call on it.
 *
 * Cached for the life of the server process, with a TTL. That is the tradeoff
 * CLAUDE.md section 12 calls out: it is what makes the first search fast, and
 * it is why an edit to the Context document's instructions needs a dev server
 * restart to show up locally.
 *
 * Returns `null` rather than throwing. A cold or unreachable MCP should degrade
 * to the model calling `schema_explorer` itself, not to a failed search.
 */
const CACHE_TTL_MS = 5 * 60 * 1000

let cached: string | null = null
let cachedAt = 0

export async function fetchInitialContext(): Promise<string | null> {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached

  try {
    const response = await fetch(initialContextUrl(), {
      headers: contextMcpHeaders,
      cache: 'no-store',
    })
    if (!response.ok) return cached
    cached = await response.text()
    cachedAt = Date.now()
  } catch {
    // Keep serving the last good copy if there is one.
  }

  return cached
}

function assertValue<T>(value: T | undefined, errorMessage: string): T {
  if (value === undefined) {
    throw new Error(errorMessage)
  }

  return value
}
