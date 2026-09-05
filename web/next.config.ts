import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  images: {
    // Course covers, lesson posters, and instructor photos are served from the
    // Sanity asset CDN. The URL carries no credentials — the read token stays
    // server side.
    // Object form, not `new URL()`: the URL form pins `search` to the empty
    // string, and every image-url-builder URL carries a query string.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
      // Lesson video stills. Seeded lessons carry no poster of their own, so the
      // player frame falls back to the provider's thumbnail. Scoped to `/vi/**`
      // so the image optimiser cannot be pointed at anything else on the host.
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },
};

export default nextConfig;
