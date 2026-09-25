import type { Metadata } from "next";
import { Crimson_Pro, Atkinson_Hyperlegible, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AccessibilityProvider } from "@/lib/accessibility";

const sans = Atkinson_Hyperlegible({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const serif = Crimson_Pro({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Socratia — Learn by thinking",
  description: "The AI tutor that refuses to give you the answer. Socratia guides you to it with questions, so you actually learn.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${serif.variable} h-full antialiased font-system`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <div
          id="a11y-live-region"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        <AccessibilityProvider>{children}</AccessibilityProvider>
      </body>
    </html>
  );
}