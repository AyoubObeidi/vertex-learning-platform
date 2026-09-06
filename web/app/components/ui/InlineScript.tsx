/**
 * A script that runs while the browser parses the HTML, so it can correct the
 * DOM before the first paint.
 *
 * The `type` switch is the pattern from the Next.js "preventing flash before
 * hydration" guide: React warns in development when a render produces a
 * `<script>` tag, so the tag is live JavaScript on the server and inert
 * `text/plain` on the client. `suppressHydrationWarning` covers the mismatch
 * between the two.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
