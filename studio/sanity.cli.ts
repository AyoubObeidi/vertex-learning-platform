/**
 * CLI configuration for the standalone Vertex Studio.
 * Also drives TypeGen, which reads the GROQ queries out of the web workspace
 * and writes the generated types back into it.
 * https://www.sanity.io/docs/cli
 */
import {defineCliConfig} from 'sanity/cli'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

export default defineCliConfig({
  api: {projectId, dataset},
  deployment: {autoUpdates: true},
  typegen: {
    enabled: true,
    path: '../web/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../web/sanity.types.ts',
    overloadClientMethods: true,
  },
})
