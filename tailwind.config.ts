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
        background: {
          DEFAULT: "#060B12",
          secondary: "#0D1521",
          tertiary: "#121C2B",
          quaternary: "#1A2638",
        },
        border: {
          DEFAULT: "#1C2940",
          strong: "#2A3B57",
        },
        "text-primary": "#F3F7FB",
        "text-secondary": "#A7B6C8",
        "text-tertiary": "#718197",
        "text-disabled": "#49576C",
        status: {
          "on-track": "#39D98A",
          "at-risk": "#F7B267",
          blocked: "#FF8A5B",
          "off-track": "#FF6B7D",
          complete: "#7AA2FF",
          "not-started": "#7D8DA6",
        },
        accent: {
          DEFAULT: "#7AA2FF",
          hover: "#9AB7FF",
          focus: "#A7BEFF",
        },
        "low-confidence": "#FF7C92",
      },
      backgroundColor: {
        "status-on-track": "rgba(57,217,138,0.12)",
        "status-at-risk": "rgba(247,178,103,0.14)",
        "status-blocked": "rgba(255,138,91,0.14)",
        "status-off-track": "rgba(255,107,125,0.14)",
        "status-complete": "rgba(122,162,255,0.14)",
        "selection": "rgba(122,162,255,0.18)",
        "row-selected": "rgba(122,162,255,0.12)",
      },
      borderRadius: {
        card: "22px",
      },
      transitionDuration: {
        "hover": "150ms",
      },
    },
  },
  plugins: [],
};
export default config;
