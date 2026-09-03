import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
