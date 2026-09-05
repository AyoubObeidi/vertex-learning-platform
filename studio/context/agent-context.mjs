/**
 * The Vertex search configuration (CLAUDE.md section 10).
 *
 * This is the single source of truth for the two values the Sanity Context MCP
 * applies to every request the search agent makes: what content it can see, and
 * what it needs to know about that content beyond what the schema says.
 *
 * It lives here rather than being authored in the Studio because the
 * `@sanity/context` Studio plugin cannot be installed: v2 peer-depends on
 * `sanity@^6` and this Studio is on 5.x (CLAUDE.md section 12). Without the
 * plugin the Studio does not register the `sanity.agentContext` type, so the
 * document is created by import instead — and if the API rejects the reserved
 * `sanity.` type prefix, the same two values go on the base MCP URL as
 * `?groqFilter=` and `?instructions=` query params. See README.md.
 *
 * Edits reach the agent on the next request, but the route caches the initial
 * context, so a dev server restart is needed to see them locally.
 */

export const SLUG = 'vertex-search'

/**
 * What the agent can see. Content types only: the read-only documents the pages
 * render. Drafts are excluded because search must only ever surface what a
 * learner can actually open.
 *
 * There is no `video` type yet — transcript and chapter ingestion (CLAUDE.md
 * section 9) is not built, so search matches lessons on their own topic only.
 * Add `"video"` here when it lands.
 *
 * Progress records and any other per-learner app state are deliberately absent:
 * the agent is a content search, not a window into somebody's account.
 */
export const GROQ_FILTER =
  '_type in ["course", "lesson", "instructor", "category"] && !(_id in path("drafts.**"))'

/**
 * Pure deltas. Everything here is something the auto-generated schema does not
 * make obvious — counter-intuitive relationships, required query techniques,
 * and the things that will silently produce junk if the agent guesses.
 *
 * The critical rules are duplicated in the inline system prompt at
 * `web/app/lib/search-prompt.ts`, because the model follows the system prompt
 * more reliably (CLAUDE.md section 12). If you change one, change both.
 */
export const INSTRUCTIONS = `Vertex is a learning platform. A course contains ordered modules; each module holds an ordered list of lesson references. Lessons are where the teaching is.

## Relationships the schema does not connect

- A lesson does not store its course. Resolve it in reverse: \`*[_type == "course" && references(^._id)][0]\`.
- \`modules\` is an embedded array on the course, not its own document type. A module's lessons are \`modules[].lessons[]->\`.
- "Module 5" and "Lesson 5.1" are not stored anywhere. They are array positions in \`course.modules[]\` and \`modules[].lessons[]\`. Never invent or report them — the application derives them from order.

## Matching text

- Text match is token based. Wildcard every keyword and OR them together: \`(title match "cach*" || title match "revalidat*")\`. Never match a multi-word phrase as a single pattern — it will not match.
- \`notes\` is Portable Text and cannot be matched directly. Match its plain-text projection: \`pt::text(notes) match "cach*"\`.
- Do not use \`text::semanticSimilarity()\`. Embeddings are not enabled on this dataset and it will error.
- Rank by specificity: a \`title\` hit beats a \`keyPoints\` hit, which beats a \`pt::text(notes)\` hit.

## Projections

- Always project \`_id\` on lessons. It is the only field the caller uses to resolve a hit.
- Never return the \`notes\` array itself. It is long-form Portable Text and returning it wholesale overflows the context window. Project \`pt::text(notes)\` and only when you actually need it.
- \`durationSeconds\` is a whole number of seconds, not minutes.
- \`studentCount\`, \`price\` and \`popular\` are authored display values. They are not derived from real enrolments or sales, so never present them as statistics.
- \`freePreview\` is a label only. It does not grant or restrict access to anything.`
