import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0e27",
          secondary: "#141b34",
          tertiary: "#1e2746",
        },
        accent: {
          green: "#00ff88",
          red: "#ff4757",
          blue: "#5f72ff",
          purple: "#a855f7",
        },
      },
      fontFamily: {
        sans: ["Inter", "Source Han Sans CN", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
