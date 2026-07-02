import type { Config } from "tailwindcss";

/**
 * Palette is derived from the rating scale itself (docs/SCORING.md):
 * five signal colours, one ink, one paper. No decorative colours.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2733",
        line: "#D8DEE4",
        paper: "#FFFFFF",
        field: "#F4F6F8",
        steel: "#2F5D8A",
        rating: {
          critical: "#A11E2D",
          high: "#D97C1E",
          medium: "#C9A227",
          low: "#4C8A4F",
          verylow: "#7C8B99",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
