import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { generateText, isStepCount, Output } from "ai";

import { sanityFetch } from "@/sanity/lib/fetch";
import { LESSONS_BY_IDS_QUERY } from "@/sanity/lib/queries";
import {
  contextMcpHeaders,
  contextMcpUrl,
  fetchInitialContext,
} from "@/sanity/lib/context-mcp";
import { flushPostHog, getPostHogClient } from "../../lib/posthog-server";
import {
  buildSearchResults,
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
 *      of prose each.
 *   2. Those ids are read back out of the dataset here, and every field a card
 *      shows is taken from that read.
 *
 * So "never invent a course, lesson, or duration" is not a promise the prompt
 * makes — an invented lesson has no id that resolves and is dropped in stage 2.
 */

export const runtime = "nodejs";
// The response is per-query and never cached: it is a model call, and Next must
// not serve one learner's results to another.
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "gpt-5";

/**
 * Structured output counts as a step, so the cap has to leave room for the tool
 * loop *and* the final answer. Twelve is enough for a broaden-and-retry or two.
 */
const MAX_STEPS = 12;

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
  durationMs: number;
  model: string;
}): Promise<void> {
  try {
    const { userId } = await auth();
    getPostHogClient().capture({
      distinctId: userId ?? "anonymous",
      event: "search_performed",
      properties: {
        query: properties.query,
        result_count: properties.resultCount,
        duration_ms: properties.durationMs,
        model: properties.model,
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
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
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

    const { output } = await generateText({
      model: openai(model),
      system: buildSearchSystemPrompt(initialContext),
      // The learner's words go in as the prompt, never concatenated into the
      // system prompt: an injection attempt gets no privileged position, and
      // cannot fabricate a result it if did (see the module comment).
      prompt: query,
      tools,
      output: Output.object({ schema: SearchModelOutputSchema }),
      stopWhen: isStepCount(MAX_STEPS),
    });

    const ids = output.results.map((result) => result.lessonId);
    const lessons = ids.length
      ? await sanityFetch({
          query: LESSONS_BY_IDS_QUERY,
          params: { ids },
          fresh: true,
        })
      : [];

    const results = buildSearchResults(output.results, lessons);

    const payload: SearchResponse = {
      query,
      reply: output.reply,
      resultCount: results.length,
      results,
    };

    await captureSearch({
      query,
      resultCount: results.length,
      durationMs: Date.now() - startedAt,
      model,
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
