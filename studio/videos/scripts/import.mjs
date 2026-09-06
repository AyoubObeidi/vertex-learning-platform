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
import {existsSync, readFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const studioRoot = resolve(here, '../..')
const ndjson = resolve(here, '../dist/vertex-videos.ndjson')

/** Minimal KEY=value reader — enough for the two values we need. */
function readEnvFile(path) {
  if (!existsSync(path)) return {}
  const values = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (!match) continue
    values[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
  }
  return values
}

const fileEnv = readEnvFile(resolve(studioRoot, '.env'))
const dataset = process.env.SANITY_STUDIO_DATASET || fileEnv.SANITY_STUDIO_DATASET
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || fileEnv.SANITY_STUDIO_PROJECT_ID

if (!dataset || !projectId) {
  console.error('Missing SANITY_STUDIO_DATASET or SANITY_STUDIO_PROJECT_ID (studio/.env).')
  process.exit(1)
}
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
