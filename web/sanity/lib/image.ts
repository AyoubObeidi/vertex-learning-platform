import {createImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'

import {dataset, projectId} from '../env'

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({projectId, dataset})

/**
 * Builds an image URL. Browser-safe: it only needs the public project id and
 * dataset, never a token. Hotspot and crop data are applied automatically.
 */
export const urlFor = (source: SanityImageSource) => {
  return builder.image(source)
}
