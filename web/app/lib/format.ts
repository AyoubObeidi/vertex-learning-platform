/**
 * Display formatters for values the UI derives rather than stores. Every one of
 * them takes a possibly-missing value and returns `null` when there is nothing
 * real to show, so a caller can drop the chip instead of rendering a placeholder.
 */

/** `66240` → `"18h 24m"`, `2700` → `"45m"`. */
export function formatDuration(seconds: number | null | undefined): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** `18420` → `"18.4k"`, `2100` → `"2.1k"`, `840` → `"840"`. */
export function formatCount(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  if (value < 1000) return String(value);
  const thousands = value / 1000;
  const rounded = thousands < 100 ? thousands.toFixed(1) : String(Math.round(thousands));
  return `${rounded.replace(/\.0$/, "")}k`;
}

/** `"intermediate"` → `"Intermediate"`. */
export function formatLevel(level: string | null | undefined): string | null {
  if (!level) return null;
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/** `"12 modules"`, `"1 module"`. */
export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
