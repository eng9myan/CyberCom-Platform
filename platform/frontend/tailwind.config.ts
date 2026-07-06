import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // CyMed/CyShop unified Design Tokens (ADR-0032)
        brand: {
          50: "#fff4ea",
          100: "#ffe4c7",
          200: "#ffc98c",
          300: "#ffa94d",
          400: "#ff8a2a",
          500: "#ed6c00",
          600: "#c25900",
          700: "#9a4700",
          800: "#723500",
          900: "#4a2300",
        },
        accent: {
          DEFAULT: "#59c3e1",
          light: "#7dd3ea",
          dark: "#0e7c9b",
        },
        clinical: {
          DEFAULT: "hsl(210, 80%, 22%)",
          light: "hsl(210, 70%, 35%)",
        },
        surface: {
          DEFAULT: "#0a0a0f",
          raised: "#0f0f1a",
          overlay: "#1e293b",
          elevated: "#263449",
        },
      },
      fontFamily: {
        sans: ["var(--font-family-latin)", "system-ui", "sans-serif"],
        heading: ["var(--font-family-heading)", "system-ui", "sans-serif"],
        arabic: ["var(--font-family-arabic)", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
