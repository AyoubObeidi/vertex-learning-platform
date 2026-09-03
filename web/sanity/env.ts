/**
 * Client-safe Sanity configuration. These values are public by design: the
 * read token lives in `lib/token.ts`, which is server-only.
 */
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-09-02'

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET',
)

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID',
)

function assertValue<T>(value: T | undefined, errorMessage: string): T {
  if (value === undefined) {
    throw new Error(errorMessage)
  }

  return value
}
