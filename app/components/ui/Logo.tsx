/**
 * The Vertex brand logo with a geometric triangle icon and wordmark.
 *
 * @param size - Logo size variant (sm or md)
 */
export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const text = size === "sm" ? "text-xl" : "text-[25px]";
  const mark = size === "sm" ? 22 : 28;
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className="text-accent"
      >
        <path
          d="M3.4 4.6h21.2L14 24.2 3.4 4.6z"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinejoin="round"
        />
        <path d="M9.2 8.6h9.6L14 17.6 9.2 8.6z" fill="currentColor" />
      </svg>
      <span className={`font-sans font-bold tracking-tight ${text} text-neutral-900`}>
        Vertex
      </span>
    </div>
  );
}
