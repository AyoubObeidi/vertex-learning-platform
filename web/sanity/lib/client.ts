import 'server-only'

import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from '../env'
import {readToken} from './token'

/**
 * The read-only content client. Server-side only — pages render stored content,
 * the browser never holds a token and never queries Sanity directly.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token: readToken,
  useCdn: true,
  perspective: 'published',
  stega: false,
})

/**
 * Bypasses the CDN for reads that must be current: `generateStaticParams`,
 * webhook handlers, and anything that would otherwise build against stale data.
 */
export const freshClient = client.withConfig({useCdn: false})
