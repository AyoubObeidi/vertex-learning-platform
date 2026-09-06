import 'server-only'

import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from '../env'
import {getWriteToken} from './token'

/**
 * The only client in the app that can change the dataset. It exists for learner
 * progress and nothing else (CLAUDE.md sections 5 and 7): pages are read-only,
 * and every write goes through a server route holding this token.
 *
 * `useCdn: false` because a write is almost always followed by a read-back of
 * the same document, and the CDN would serve the version from before it.
 *
 * Built on demand rather than at import, so a missing write token fails the one
 * request that needs it instead of the whole build.
 */
let cached: ReturnType<typeof createClient> | null = null

export function getWriteClient() {
  if (!cached) {
    cached = createClient({
      projectId,
      dataset,
      apiVersion,
      token: getWriteToken(),
      useCdn: false,
      perspective: 'published',
      stega: false,
    })
  }
  return cached
}
