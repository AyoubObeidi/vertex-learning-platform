"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "./ThemeProvider";

/**
 * The nav's theme button: light and dark, one click between them.
 *
 * Both icons are rendered, and `globals.css` reveals the one matching the
 * `data-theme` attribute that the inline script puts on `<html>` before first
 * paint. Nothing here reads the theme during render, so the server and the
 * browser produce identical markup — no hydration mismatch, and no flash of the
 * wrong icon on a hard load.
 *
 * The button's accessible name comes from whichever screen-reader label is
 * visible, so it always announces the current theme and what the click does.
 */
export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-sm text-neutral-900 outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
    >
      <span className="theme-choice theme-choice-light">
        <Sun size={22} strokeWidth={1.75} aria-hidden="true" />
        <span className="sr-only">Light theme. Switch to dark.</span>
      </span>
      <span className="theme-choice theme-choice-dark">
        <Moon size={22} strokeWidth={1.75} aria-hidden="true" />
        <span className="sr-only">Dark theme. Switch to light.</span>
      </span>
    </button>
  );
}
