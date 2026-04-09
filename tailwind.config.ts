import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Background layers
        background: {
          DEFAULT: "#0B0F14",
          secondary: "#121821",
          tertiary: "#1A2230",
        },
        // Borders
        border: {
          DEFAULT: "#2A3442",
          strong: "#3A4758",
        },
        // Text
        "text-primary": "#E6EDF3",
        "text-secondary": "#9FB0C3",
        "text-tertiary": "#6B7C93",
        "text-disabled": "#4A5568",
        // Status colors
        status: {
          "on-track": "#22C55E",
          "at-risk": "#F59E0B",
          blocked: "#F97316",
          "off-track": "#EF4444",
          complete: "#3B82F6",
          "not-started": "#6B7280",
        },
        // Accent / Interaction
        accent: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          focus: "#60A5FA",
        },
        // Low confidence
        "low-confidence": "#E11D48",
      },
      backgroundColor: {
        "status-on-track": "rgba(34,197,94,0.1)",
        "status-at-risk": "rgba(245,158,11,0.1)",
        "status-blocked": "rgba(249,115,22,0.1)",
        "status-off-track": "rgba(239,68,68,0.1)",
        "status-complete": "rgba(59,130,246,0.1)",
        "selection": "rgba(59,130,246,0.2)",
        "row-selected": "rgba(59,130,246,0.15)",
      },
      borderRadius: {
        card: "12px",
      },
      transitionDuration: {
        "hover": "150ms",
      },
    },
  },
  plugins: [],
};
export default config;
