"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applyTheme,
  currentTheme,
  otherTheme,
  readStoredTheme,
  systemTheme,
  writeStoredTheme,
  type Theme,
} from "@/app/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return value;
}

/**
 * Holds the theme for the tree.
 *
 * The `<html>` attribute is already correct by the time this mounts — the
 * inline script in the root layout set it during parsing. This provider owns
 * the theme from then on: it persists changes and, until the learner has picked
 * a side, follows the OS.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // A lazy initialiser reading the same storage key as the inline script, so
  // React's first render agrees with the DOM the script produced.
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window === "undefined" ? "light" : currentTheme(),
  );

  // In development, React Strict Mode remounts once and resets `<html>` to the
  // attributes it manages from JSX, wiping the one the inline script set. This
  // puts it back, before paint. In production it re-writes the value already
  // there. No state is touched: the initialiser above read the same source.
  useLayoutEffect(() => {
    applyTheme(currentTheme());
  }, []);

  // Until the learner picks a side, track the OS if it changes with the tab
  // open. Once a choice is stored, this stops applying.
  useEffect(() => {
    if (readStoredTheme() !== null) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setThemeState(applyTheme(systemTheme()));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    writeStoredTheme(next);
    setThemeState(applyTheme(next));
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(otherTheme(currentTheme())),
    [setTheme],
  );

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
