import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * The model behind intelligent search (CLAUDE.md section 5).
 *
 * The Google Gemini API, called directly through the AI SDK's native Google
 * provider. Provider wiring lives here rather than in the route so that "which
 * model answers a search" has one answer in the codebase, and so the route stays
 * about search.
 *
 * Nothing here may reach the browser: `GEMINI_API_KEY` is a billed credential,
 * and `server-only` turns any client-component import of this module into a
 * build error.
 *
 * Two things about this setup are easy to get wrong:
 *
 * - **Model ids are bare** — `gemini-3.5-flash`, not `google/gemini-3.5-flash`
 *   (that is OpenRouter's form) and not `models/gemini-3.5-flash` (that is the
 *   REST resource name). To see what the key can use:
 *   `GET https://generativelanguage.googleapis.com/v1beta/models` with the key
 *   in an `x-goog-api-key` header.
 *
 * - **The model must be left to call tools on its own.** Search is an agentic
 *   loop over the Context MCP, and a model that answers without calling a tool
 *   returns an empty result set, not an error. Forcing a JSON schema on the same
 *   request as the tools stopped every model tried so far from calling them, so
 *   the route sends a schema only on its separate repair pass. See its comment.
 *   Whether a model calls tools *well* is still per-model, which is why the id
 *   is an env var rather than a constant.
 */

/**
 * Fast, tool-capable, and served to this key — chosen by measurement, not by
 * version number. One tool-calling request per model, timed:
 *
 * | model | called the tool | latency |
 * | --- | --- | --- |
 * | `gemini-3.5-flash` | 4/4 | **2-5s** |
 * | `gemini-3.8-flash` | 3/3 | 54-177s, even at `thinkingLevel: low` |
 * | `gemini-flash-latest` | 1/1 | 87s |
 * | `gemini-2.5-flash` | — | 404, retired for new users |
 *
 * The route fits up to twelve model calls inside a 90s deadline, so a model
 * that takes a minute per call times out every search, however well it reasons.
 * Re-measure before switching to a newer id.
 */
const DEFAULT_MODEL = "gemini-3.5-flash";

function assertValue<T>(value: T | undefined, errorMessage: string): T {
  if (value === undefined || value === "") {
    throw new Error(errorMessage);
  }
  return value;
}

/**
 * Asserted at module load, not at request time: a missing key should stop the
 * server with the variable's name in the message, rather than surfacing as an
 * opaque 400 inside a search three minutes later.
 *
 * Passed explicitly, so the SDK's implicit `GOOGLE_GENERATIVE_AI_API_KEY`
 * lookup is never what decides which credential is used. No base URL override
 * is offered: the SDK's default is Google's own https endpoint.
 */
const google = createGoogleGenerativeAI({
  apiKey: assertValue(
    process.env.GEMINI_API_KEY?.trim(),
    "Missing environment variable: GEMINI_API_KEY",
  ),
});

/** The model id, exported for analytics so a result-quality change is attributable. */
export const searchModelId = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

export const searchModel = google(searchModelId);
