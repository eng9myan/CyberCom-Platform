import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // CyberCom Design Tokens (ADR-0032)
        brand: {
          50: "hsl(220, 100%, 97%)",
          100: "hsl(220, 96%, 93%)",
          200: "hsl(220, 95%, 85%)",
          300: "hsl(220, 92%, 73%)",
          400: "hsl(220, 90%, 61%)",
          500: "hsl(220, 85%, 50%)",
          600: "hsl(220, 82%, 40%)",
          700: "hsl(220, 80%, 32%)",
          800: "hsl(220, 75%, 24%)",
          900: "hsl(220, 70%, 16%)",
        },
        clinical: {
          DEFAULT: "hsl(210, 80%, 22%)",
          light: "hsl(210, 70%, 35%)",
        },
        surface: {
          DEFAULT: "hsl(220, 20%, 10%)",
          raised: "hsl(220, 18%, 14%)",
          overlay: "hsl(220, 16%, 18%)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        arabic: ["var(--font-ibm-plex-arabic)", "sans-serif"],
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
