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

/**
 * The write token, used by one caller only: the progress route, which records
 * learner state (CLAUDE.md section 12). Same rules as the read token, and one
 * more — it can change the dataset, so nothing outside a server route handler
 * may import the client built on it.
 *
 * Read lazily, unlike the read token. Every page needs the read token, so a
 * missing one should stop the build; only one route needs this one, and
 * asserting it at import time would make a build fail on a machine that will
 * never write. A missing token surfaces as a failed save instead.
 */
export function getWriteToken(): string {
  return assertValue(
    process.env.SANITY_API_WRITE_TOKEN,
    'Missing environment variable: SANITY_API_WRITE_TOKEN',
  )
}

function assertValue<T>(value: T | undefined, errorMessage: string): T {
  if (value === undefined) {
    throw new Error(errorMessage)
  }

  return value
}
