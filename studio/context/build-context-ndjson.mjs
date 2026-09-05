/**
 * Writes dist/vertex-agent-context.ndjson — the one Sanity Context document the
 * search agent's MCP endpoint is configured by.
 *
 *   node context/build-context-ndjson.mjs
 *
 * Also prints the fallback URL (CLAUDE.md section 12 / the D3 fallback in
 * prompts/vertex-intelligent-search.md): if the import is rejected because
 * `sanity.agentContext` is a reserved type, the same filter and instructions
 * ride on the base MCP URL as query params instead, and nothing else changes.
 */
import {mkdir, writeFile} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {GROQ_FILTER, INSTRUCTIONS, SLUG} from './agent-context.mjs'
import {readStudioEnv} from './env.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const outputPath = resolve(here, 'dist/vertex-agent-context.ndjson')

const API_VERSION = 'v2026-03-03'

const document = {
  _id: `sanity.agentContext.${SLUG}`,
  _type: 'sanity.agentContext',
  name: 'Vertex search',
  slug: {_type: 'slug', current: SLUG},
  groqFilter: GROQ_FILTER,
  instructions: INSTRUCTIONS,
}

const {projectId, dataset} = readStudioEnv()

await mkdir(dirname(outputPath), {recursive: true})
await writeFile(outputPath, `${JSON.stringify(document)}\n`)

const base = `https://api.sanity.io/${API_VERSION}/context/mcp/${projectId}/${dataset}`

console.log(`Wrote ${outputPath}`)
console.log(`\nDocument URL (after a successful import):\n  ${base}/${SLUG}`)
console.log(
  '\nFallback URL (same config, no document — use if the import is rejected):\n  ' +
    `${base}?groqFilter=${encodeURIComponent(GROQ_FILTER)}` +
    `&instructions=${encodeURIComponent(INSTRUCTIONS)}`,
)
console.log('\nSet the one you use as SANITY_CONTEXT_MCP_URL in web/.env.local.')
