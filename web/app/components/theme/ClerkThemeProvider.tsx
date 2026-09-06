"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

import { useTheme } from "./ThemeProvider";

/**
 * Clerk renders its own UI — the sign-in modal, the `UserButton` popover — so
 * it needs telling about the theme or it stays light over a dark page.
 *
 * Clerk's `baseTheme` presets live in `@clerk/themes`, which this project does
 * not install. `appearance.variables` gets the same result with no new
 * dependency, and lets Clerk's surfaces use Vertex's own palette rather than a
 * generic dark. The values are the literals from `globals.css`: Clerk's UI is
 * partly in an iframe, so it cannot read our CSS custom properties.
 */
export function ClerkThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <ClerkProvider
      appearance={{
        variables: dark
          ? {
              colorBackground: "#1f1916",
              colorForeground: "#f5f1ee",
              colorMutedForeground: "#a2958d",
              colorInput: "#17120f",
              colorInputForeground: "#f5f1ee",
              colorBorder: "#332a25",
              colorPrimary: "#f0805c",
              colorNeutral: "#f5f1ee",
            }
          : {
              colorBackground: "#fdfcfa",
              colorForeground: "#0f172a",
              colorMutedForeground: "#64748b",
              colorInput: "#ffffff",
              colorInputForeground: "#0f172a",
              colorBorder: "#f3e8e1",
              colorPrimary: "#e46d48",
            },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
