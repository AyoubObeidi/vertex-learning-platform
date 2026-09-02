export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const text = size === "sm" ? "text-lg" : "text-xl";
  const box = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex ${box} items-center justify-center rounded-md bg-primary-500 text-white`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path d="M3 4h4l5 14 5-14h4L13 20H9L3 4z" fill="currentColor" />
        </svg>
      </div>
      <span className={`font-display font-semibold ${text} text-neutral-900`}>Vertex</span>
    </div>
  );
}
