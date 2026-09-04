import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        // flushAt 1 + flushInterval 0 ensures events are sent before
        // short-lived route handlers/serverless functions exit.
        flushAt: 1,
        flushInterval: 0,
      },
    );
    posthogClient.debug(process.env.NODE_ENV === "development");
  }
  return posthogClient;
}

export async function flushPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.flush();
  }
}
