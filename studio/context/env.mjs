/**
 * Resolves the project and dataset the same way seed/scripts/import.mjs does:
 * from the environment, falling back to studio/.env. The Sanity CLI does not
 * read studio/.env for `dataset import`, so these are resolved here and passed
 * on explicitly rather than hardcoded (CLAUDE.md section 14).
 */
import {existsSync, readFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

export const studioRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

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

export function readStudioEnv() {
  const fileEnv = readEnvFile(resolve(studioRoot, '.env'))
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID || fileEnv.SANITY_STUDIO_PROJECT_ID
  const dataset = process.env.SANITY_STUDIO_DATASET || fileEnv.SANITY_STUDIO_DATASET

  if (!projectId || !dataset) {
    console.error('Missing SANITY_STUDIO_PROJECT_ID or SANITY_STUDIO_DATASET (studio/.env).')
    process.exit(1)
  }

  return {projectId, dataset}
}
