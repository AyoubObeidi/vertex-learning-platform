import 'server-only'

import type {QueryParams} from 'next-sanity'

import {client, freshClient} from './client'

type SanityFetchOptions<QueryString extends string> = {
  query: QueryString
  params?: QueryParams
  /**
   * Cache tags to revalidate this read by. When any tag is given, time-based
   * revalidation is turned off and the read is invalidated by tag instead.
   */
  tags?: string[]
  revalidate?: number | false
  /**
   * Read uncached: skips both the Sanity CDN and Next's Data Cache. For
   * `generateStaticParams` and other must-be-current reads. `tags` and
   * `revalidate` do not apply and are ignored.
   */
  fresh?: boolean
}

/**
 * The single entry point for reading content. Generic over the query string so
 * TypeGen's `overloadClientMethods` inference survives the wrapper: pass a
 * `defineQuery` result and the return type is the generated one.
 */
export async function sanityFetch<const QueryString extends string>({
  query,
  params = {},
  tags = [],
  revalidate = 60,
  fresh = false,
}: SanityFetchOptions<QueryString>) {
  if (fresh) {
    // `useCdn: false` only bypasses Sanity's CDN — Next's Data Cache would
    // still serve a stored response, and a tagged one is stored indefinitely.
    // `cache: 'no-store'` opts out of it, and `next` must be omitted: the two
    // options conflict.
    return freshClient.fetch(query, params, {cache: 'no-store'})
  }

  return client.fetch(query, params, {
    next: {
      revalidate: tags.length ? false : revalidate,
      tags,
    },
  })
}
