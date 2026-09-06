import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { auth } from "@clerk/nextjs/server";
import { generateText, isStepCount, Output } from "ai";

import { sanityFetch } from "@/sanity/lib/fetch";
import { LESSONS_BY_IDS_QUERY, VIDEO_MOMENTS_QUERY } from "@/sanity/lib/queries";
import {
  contextMcpHeaders,
  contextMcpUrl,
  fetchInitialContext,
} from "@/sanity/lib/context-mcp";
import { flushPostHog, getPostHogClient } from "../../lib/posthog-server";
import { searchModel, searchModelId } from "../../lib/search-model";
import {
  buildSearchResults,
  countCourses,
  momentLookupParams,
  parseSearchModelOutput,
  SearchModelOutputSchema,
  SearchRequestSchema,
  type SearchResponse,
} from "../../lib/search";
import { buildSearchSystemPrompt } from "../../lib/search-prompt";

/**
 * Intelligent search (CLAUDE.md sections 5 and 11).
 *
 * The whole LLM side of search lives behind this route. The browser holds no
 * token, never reaches the Context MCP or the model, and never queries Sanity —
 * it only ever POSTs a query string here and renders what comes back.
 *
 * The pipeline is deliberately two-stage, and the second stage is what makes
 * the results trustworthy:
 *
 *   1. The model runs an agentic loop over the Context MCP's tools, writing
 *      GROQ against the deployed schema, and returns lesson ids plus one line
 *      of prose each — and, for a video moment, the second it found.
 *   2. Those ids are read back out of the dataset here, every second the model
 *      named is proven against the lesson's video document, and every field a
 *      card shows is taken from those two reads.
 *
 * So "never invent a course, lesson, duration, or timestamp" is not a promise
 * the prompt makes — an invented lesson has no id that resolves, and an
 * invented second has no chapter or chunk behind it. Both are caught in stage 2.
 */

export const runtime = "nodejs";
// The response is per-query and never cached: it is a model call, and Next must
// not serve one learner's results to another.
export const dynamic = "force-dynamic";

/** The provider behind `searchModel`, recorded on the analytics event. */
const PROVIDER = "opencode";

/**
 * Structured output counts as a step, so the cap has to leave room for the tool
 * loop *and* the final answer. Twelve is enough for a broaden-and-retry or two.
 */
const MAX_STEPS = 12;

/**
 * The nudge for the repair pass. It asks only for a change of shape — the
 * lessons were already found, and inventing new ones here would be caught by
 * the same id lookup as anywhere else.
 */
const REPAIR_PROMPT =
  "Return the final answer now as the structured object. Use only lessonIds " +
  "that appeared in a tool result above. Do not run any more queries.";

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

/**
 * A crude per-IP cap, to keep a model-backed public endpoint from being trivial
 * to run up a bill on.
 *
 * In-memory, so it is per server instance and resets on deploy — enough for a
 * single node, not a substitute for a real shared limiter once this runs on
 * more than one.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    // Opportunistic sweep so the map cannot grow without bound.
    if (hits.size > 1000) {
      for (const [id, value] of hits) if (now > value.resetAt) hits.delete(id);
    }
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/* -------------------------------------------------------------------------- */
/* Analytics                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Captured server side because the search itself happens here — the browser
 * cannot know how many results came back or how long the model took. A
 * PostHog failure must never fail a search, so everything here is swallowed.
 */
async function captureSearch(properties: {
  query: string;
  resultCount: number;
  videoResultCount: number;
  durationMs: number;
}): Promise<void> {
  try {
    const { userId } = await auth();
    getPostHogClient().capture({
      distinctId: userId ?? "anonymous",
      event: "search_performed",
      properties: {
        query: properties.query,
        result_count: properties.resultCount,
        video_result_count: properties.videoResultCount,
        duration_ms: properties.durationMs,
        model: searchModelId,
        provider: PROVIDER,
        $process_person_profile: Boolean(userId),
      },
    });
    await flushPostHog();
  } catch {
    // Analytics is not worth a 500.
  }
}

/* -------------------------------------------------------------------------- */
/* Route                                                                      */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request): Promise<Response> {
  if (rateLimited(clientKey(request))) {
    return Response.json(
      { error: "Too many searches. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = SearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    // Deliberately not echoing the input back — it is untrusted, and the
    // constraint is the useful half of the message anyway.
    return Response.json(
      { error: "Expected a `query` of 1 to 200 characters." },
      { status: 400 },
    );
  }

  const { query } = parsed.data;
  const startedAt = Date.now();

  let mcpClient: MCPClient | null = null;

  try {
    const [client, initialContext] = await Promise.all([
      createMCPClient({
        transport: { type: "http", url: contextMcpUrl, headers: contextMcpHeaders },
      }),
      fetchInitialContext(),
    ]);
    mcpClient = client;

    // The initial context is already in the system prompt, so passing the tool
    // that returns it too would only invite a redundant call.
    const tools = Object.fromEntries(
      Object.entries(await mcpClient.tools()).filter(
        ([name]) => name !== "initial_context",
      ),
    );

    const system = buildSearchSystemPrompt(initialContext);

    const research = await generateText({
      model: searchModel,
      system,
      // The learner's words go in as the prompt, never concatenated into the
      // system prompt: an injection attempt gets no privileged position, and
      // cannot fabricate a result it if did (see the module comment).
      prompt: query,
      tools,
      stopWhen: isStepCount(MAX_STEPS),
    });

    // Deliberately *not* `Output.object` on the call above. Forcing a JSON
    // schema on every step leaves a model no way to emit a tool call instead,
    // so it never reaches the MCP and answers from nothing — measured here as
    // zero tool calls and, on one model, four invented lesson ids. The schema
    // is applied to the text afterwards instead, which costs nothing: the Zod
    // parse is the same, and grounding never trusted this output anyway.
    let output = parseSearchModelOutput(research.text);

    if (!output) {
      // A model that used its tools well but wrote its answer badly. Structured
      // output is reliable once it is not competing with tool calling, so the
      // same conversation is replayed with the schema and no tools.
      const repaired = await generateText({
        model: searchModel,
        system,
        messages: [
          { role: "user", content: query },
          ...research.response.messages,
          { role: "user", content: REPAIR_PROMPT },
        ],
        output: Output.object({ schema: SearchModelOutputSchema }),
      });
      output = repaired.output;
    }

    const ids = output.results.map((result) => result.lessonId);
    const lessons = ids.length
      ? await sanityFetch({
          query: LESSONS_BY_IDS_QUERY,
          params: { ids },
          fresh: true,
        })
      : [];

    // Only the picks that named a second cost a second read, and it comes back
    // filtered to those seconds — never a whole transcript (CLAUDE.md §12).
    const lookup = momentLookupParams(output.results, lessons);
    const moments = lookup.urls.length
      ? await sanityFetch({
          query: VIDEO_MOMENTS_QUERY,
          params: lookup,
          fresh: true,
        })
      : [];

    const results = buildSearchResults(output.results, lessons, moments);

    const payload: SearchResponse = {
      query,
      reply: output.reply,
      resultCount: results.length,
      courseCount: countCourses(results),
      results,
    };

    await captureSearch({
      query,
      resultCount: results.length,
      videoResultCount: results.filter((result) => result.kind === "video").length,
      durationMs: Date.now() - startedAt,
    });

    return Response.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    // Logged in full server side; the client gets nothing that could leak the
    // MCP URL, the token, or a provider payload.
    console.error("[api/search] failed", error);
    return Response.json({ error: "Search is unavailable right now." }, { status: 500 });
  } finally {
    // An HTTP MCP client left open leaks a connection per request.
    await mcpClient?.close();
  }
}
