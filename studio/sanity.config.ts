import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schema} from './schemaTypes'
import {structure} from './structure'

// https://www.sanity.io/docs/api-versioning
export const apiVersion = process.env.SANITY_STUDIO_API_VERSION || '2026-09-02'

const projectId = assertValue(
  process.env.SANITY_STUDIO_PROJECT_ID,
  'Missing environment variable: SANITY_STUDIO_PROJECT_ID',
)

const dataset = assertValue(
  process.env.SANITY_STUDIO_DATASET,
  'Missing environment variable: SANITY_STUDIO_DATASET',
)

export default defineConfig({
  name: 'vertex',
  title: 'Vertex',
  projectId,
  dataset,
  schema,
  plugins: [structureTool({structure}), visionTool({defaultApiVersion: apiVersion})],
})

function assertValue<T>(value: T | undefined, errorMessage: string): T {
  if (value === undefined) {
    throw new Error(errorMessage)
  }

  return value
}
