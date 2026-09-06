import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { ClerkThemeProvider } from "./components/theme/ClerkThemeProvider";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { InlineScript } from "./components/ui/InlineScript";
import { THEME_SCRIPT } from "./lib/theme";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vertex — Search your learning in plain English",
  description:
    "Vertex understands what you want to learn and finds the exact lessons across all your courses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script below rewrites the theme attributes on this element
    // before React hydrates, so React has to accept the DOM over its own output.
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs while the browser parses the HTML — before the first paint —
            so a reader on dark never sees a light frame. */}
        <InlineScript html={THEME_SCRIPT} />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-neutral-900">
        <ThemeProvider>
          <ClerkThemeProvider>
            {children}
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
