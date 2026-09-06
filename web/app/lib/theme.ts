/**
 * The theme preference: a per-browser display choice, nothing more.
 *
 * It never reaches the server, Sanity, the MCP, or PostHog — which is why it
 * lives in `localStorage` rather than a cookie. A cookie would ride along on
 * every request and, read in the root layout, would opt the whole app out of
 * static prerendering for a value no server code consumes.
 *
 * Everything the inline script and the React provider both need lives here, so
 * the two cannot drift apart and disagree about what the page is showing.
 */

/** The two states the toggle moves between. */
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "vertex-theme";

/**
 * The theme the CSS colours by, and the theme the toggle labels itself by —
 * one attribute for both, since there are only two states.
 *
 * The button's icon is chosen from this attribute in CSS rather than from React
 * state. The choice exists only in the browser, so rendering it would be a
 * guaranteed hydration mismatch and a flash of the wrong icon.
 */
export const THEME_ATTRIBUTE = "data-theme";

export function otherTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * The theme the OS asks for. Used only until the learner picks one: after that
 * their choice is stored and the OS no longer has a say.
 */
export function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * The stored choice, or `null` if the learner has not made one yet.
 *
 * Private-mode browsers throw on `localStorage`, so a failure here has to fall
 * back rather than break the render.
 */
export function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** The stored choice if there is one, otherwise whatever the OS is set to. */
export function currentTheme(): Theme {
  return readStoredTheme() ?? systemTheme();
}

export function writeStoredTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // A browser that refuses storage still gets the theme for this page view.
  }
}

/** Put the theme on `<html>`, which is all the CSS and the toggle read. */
export function applyTheme(theme: Theme): Theme {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  return theme;
}

/**
 * The source of the `<head>` script, which runs synchronously while the browser
 * parses the HTML — before React exists and before the first paint, so a dark
 * reader never sees a light frame.
 *
 * This is a fixed literal. No request data, user input, or interpolated value
 * ever goes into it: it reads one storage key and writes one attribute.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="light"&&t!=="dark")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute(${JSON.stringify(
  THEME_ATTRIBUTE,
)},t)}catch(e){}})()`;
