/**
 * Displays a progress bar indicating completion percentage.
 *
 * @param value - Progress percentage (0-100)
 * @param showLabel - Whether to display the percentage label
 */
export function ProgressBar({
  value,
  showLabel = true,
}: {
  value: number;
  showLabel?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-primary-500 transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="whitespace-nowrap text-sm text-neutral-500">
          {clamped}% complete
        </span>
      )}
    </div>
  );
}
