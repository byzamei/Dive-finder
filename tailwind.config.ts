import type { Config } from "tailwindcss";

// Design tokens for the DiveFinder design system.
// See docs/design-system.md for rationale (abyssal / editorial / cartographic direction).
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: {
          50: "#eef2f6",
          100: "#d7dfe9",
          200: "#aebcd0",
          300: "#8497b3",
          400: "#5a7093",
          500: "#3a4f6e",
          600: "#263650",
          700: "#182437",
          800: "#0e1725",
          900: "#060b13",
          950: "#020408",
        },
        ocean: {
          50: "#e9f4fb",
          100: "#c9e6f5",
          200: "#95cdea",
          300: "#5fb0dc",
          400: "#3492c8",
          500: "#1f75ab",
          600: "#185c88",
          700: "#154968",
          800: "#123a51",
          900: "#0f2e40",
        },
        seaglass: {
          50: "#f0f8f6",
          100: "#dcede9",
          200: "#b8dbd2",
          300: "#8fc4b7",
          400: "#67ab9c",
          500: "#4a8f80",
          600: "#3a7367",
          700: "#2f5c53",
        },
        coral: {
          400: "#ff8a65",
          500: "#f4703f",
          600: "#d9552a",
        },
        sand: {
          50: "#fbf9f4",
          100: "#f5f0e4",
          200: "#ece3cd",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(6,11,19,0.06), 0 8px 24px -12px rgba(6,11,19,0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
