/**
 * Imports videos/dist/vertex-videos.ndjson into the dataset configured in
 * studio/.env.
 *
 * The same shape as seed/scripts/import.mjs: the Sanity CLI does not read
 * studio/.env for `dataset import`, so the dataset is resolved here rather than
 * hardcoded (CLAUDE.md section 14) and passed on explicitly. Authentication
 * comes from the CLI's own session — no write token is read, stored, or
 * required.
 *
 *   node videos/scripts/import.mjs            # --replace, the default
 *   node videos/scripts/import.mjs --missing  # only create what is absent
 *
 * Document ids are deterministic, so --replace updates the existing video
 * documents in place rather than creating a second set.
 */
import {spawnSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {readStudioEnv, studioRoot} from '../../context/env.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const ndjson = resolve(here, '../dist/vertex-videos.ndjson')

const {projectId, dataset} = readStudioEnv()

if (!existsSync(ndjson)) {
  console.error('Missing dist/vertex-videos.ndjson. Run: npm run videos:build')
  process.exit(1)
}

const mode = process.argv.includes('--missing') ? '--missing' : '--replace'
console.log(`Importing video documents into dataset "${dataset}" with ${mode}\n`)

// shell: true so this resolves npx the same way on Windows and POSIX.
const result = spawnSync(
  'npx',
  ['sanity', 'dataset', 'import', JSON.stringify(ndjson), '--dataset', dataset, mode],
  {
    cwd: studioRoot,
    stdio: 'inherit',
    shell: true,
    env: {...process.env, SANITY_STUDIO_PROJECT_ID: projectId},
  },
)

process.exit(result.status ?? 1)
