/**
 * `responsive` is the nav's size: small enough that a phone bar still fits the
 * menu button, the theme toggle and both auth buttons on one line, and back to
 * `md` from `sm` up. The class overrides the width and height attributes, so
 * `sm` and `md` render exactly as they always have.
 *
 * Under 360px even that does not fit, so the wordmark drops and the mark alone
 * carries the logo — the link keeps its `Vertex home` label either way. The
 * alternative was letting the bar overflow the viewport, which is worse.
 */
const SIZES = {
  sm: { text: "text-xl", mark: 22, markClass: "" },
  md: { text: "text-[25px]", mark: 28, markClass: "" },
  responsive: {
    text: "max-[359px]:hidden text-xl sm:text-[25px]",
    mark: 22,
    markClass: "sm:h-7 sm:w-7",
  },
} as const;

export function Logo({ size = "md" }: { size?: keyof typeof SIZES }) {
  const { text, mark, markClass } = SIZES[size];
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className={`text-accent ${markClass}`}
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
