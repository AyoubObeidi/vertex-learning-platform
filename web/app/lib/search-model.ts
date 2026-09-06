import "server-only";

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * The model behind intelligent search (CLAUDE.md section 5).
 *
 * OpenCode Zen, an AI gateway reached through its OpenAI-compatible API.
 * Provider wiring lives here rather than in the route so that "which model
 * answers a search" has one answer in the codebase, and so the route stays
 * about search.
 *
 * Nothing here may reach the browser: `OPENCODE_API_KEY` is a billed
 * credential, and `server-only` turns any client-component import of this
 * module into a build error.
 *
 * Three things about this setup are easy to get wrong:
 *
 * - **This provider speaks `/chat/completions`, and only that.** Zen routes
 *   different model families to different endpoints — `/chat/completions`,
 *   `/responses`, and `/messages` — so a model served over a vendor-native
 *   endpoint cannot be reached from here no matter how correct the key is.
 *   That is exactly what broke the original OpenAI wiring: `@ai-sdk/openai`
 *   targets `/responses` by default. If a model id 404s or returns a shape the
 *   SDK cannot read, that is this problem, and the fix is a different model.
 *
 * - **`supportsStructuredOutputs` is load-bearing** — for the route's repair
 *   pass, which is the one place a JSON schema is still sent. Without it the SDK
 *   omits the schema and that pass cannot do its job.
 *
 * - **The model must call tools, and it must be asked to do so on its own.**
 *   Search is an agentic loop over the Context MCP, and every model tried here
 *   stopped calling tools entirely the moment a JSON schema was forced on the
 *   same request. The route no longer does that; see its comment. What is still
 *   per-model is whether the model calls tools *well*, which is why the id is an
 *   env var rather than a constant.
 *
 * - **Zen reports upstream failures inside a `200`.** A body of
 *   `{"error":{"message":"Upstream request failed: [502] …"}}` arrives with a
 *   success status, so the SDK's retry never fires and it surfaces as
 *   `AI_APICallError: Invalid JSON response`. On the free tier this is common
 *   enough to expect. The route fails safely; the fix is to retry the search.
 */

const DEFAULT_BASE_URL = "https://opencode.ai/zen/v1";

/**
 * Free on Zen's tier, and the larger of the two Nemotron models it serves.
 *
 * Its earlier failures both had other causes: it returned unparseable JSON only
 * while a schema was being forced on the tool loop, which the route no longer
 * does, and "Upstream error from Nvidia: Service temporarily overloaded" is a
 * capacity condition rather than anything about the model. Its sibling,
 * `nemotron-3.5-lightning-free`, is the fallback if this one is unavailable.
 *
 * Being open-weights is the second reason: those are the models least likely to
 * be routed to a vendor-native endpoint this provider cannot speak to (see the
 * module comment).
 *
 * `curl.exe -s https://opencode.ai/zen/v1/models` lists what is served and needs
 * no API key, so checking a candidate exists costs nothing.
 */
const DEFAULT_MODEL = "nemotron-3-ultra-free";

function assertValue<T>(value: T | undefined, errorMessage: string): T {
  if (value === undefined) {
    throw new Error(errorMessage);
  }
  return value;
}

/**
 * Asserted at module load, not at request time: a missing key should stop the
 * server with the variable's name in the message, rather than surfacing as an
 * opaque 401 inside a search three minutes later.
 */
const apiKey = assertValue(
  process.env.OPENCODE_API_KEY,
  "Missing environment variable: OPENCODE_API_KEY",
);

const opencode = createOpenAICompatible({
  name: "opencode",
  baseURL: process.env.OPENCODE_BASE_URL || DEFAULT_BASE_URL,
  apiKey,
  supportsStructuredOutputs: true,
});

/** The model id, exported for analytics so a result-quality change is attributable. */
export const searchModelId = process.env.OPENCODE_MODEL || DEFAULT_MODEL;

export const searchModel = opencode.chatModel(searchModelId);
