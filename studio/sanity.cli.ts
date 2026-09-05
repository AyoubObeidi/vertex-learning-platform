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
  // Committed rather than prompted for, so `sanity deploy` is reproducible.
  // The Context MCP only serves a dataset that has a deployed Studio
  // application (CLAUDE.md section 12), so this deploy is a prerequisite for
  // search, not just a convenience.
  studioHost: 'vertex-courses',
  // Pinned so a deploy never prompts for the application id.
  deployment: {appId: 'fyynfmf5467udptwtfnyz8yv', autoUpdates: true},
  typegen: {
    enabled: true,
    path: '../web/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../web/sanity.types.ts',
    overloadClientMethods: true,
  },
})
