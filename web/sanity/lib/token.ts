import 'server-only'

/**
 * The dataset is private. This token never reaches the browser: it is not
 * prefixed NEXT_PUBLIC_, and `server-only` turns any client-component import
 * of this module into a build error.
 */
export const readToken = assertValue(
  process.env.SANITY_API_READ_TOKEN,
  'Missing environment variable: SANITY_API_READ_TOKEN',
)

function assertValue<T>(value: T | undefined, errorMessage: string): T {
  if (value === undefined) {
    throw new Error(errorMessage)
  }

  return value
}
