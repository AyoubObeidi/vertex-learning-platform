/**
 * Imports dist/vertex-agent-context.ndjson into the dataset configured in
 * studio/.env, using the CLI's own session — no write token is read or stored.
 *
 *   node context/import-context.mjs
 *
 * `--replace` so the document id is stable and re-running updates the existing
 * configuration rather than creating a second one.
 *
 * If this fails because `sanity.agentContext` is a reserved type, that is the
 * expected fallback path: use the URL that `context:build` printed, which
 * carries the same filter and instructions as query params. See README.md.
 */
import {spawnSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {readStudioEnv, studioRoot} from './env.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const ndjson = resolve(here, 'dist/vertex-agent-context.ndjson')

if (!existsSync(ndjson)) {
  console.error('Missing context/dist/vertex-agent-context.ndjson. Run: npm run context:build')
  process.exit(1)
}

const {projectId, dataset} = readStudioEnv()

console.log(`Importing the search config into dataset "${dataset}"\n`)

// shell: true so this resolves npx the same way on Windows and POSIX.
const result = spawnSync(
  'npx',
  ['sanity', 'dataset', 'import', JSON.stringify(ndjson), '--dataset', dataset, '--replace'],
  {
    cwd: studioRoot,
    stdio: 'inherit',
    shell: true,
    env: {...process.env, SANITY_STUDIO_PROJECT_ID: projectId},
  },
)

process.exit(result.status ?? 1)
