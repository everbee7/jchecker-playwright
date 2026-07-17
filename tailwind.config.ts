import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#f1f5f9",
        muted: "#94a3b8",
        slate: {
          50: "#182137",
          100: "#202a44",
          200: "#34415f",
          300: "#4a5979",
          400: "#7e8aa7",
          500: "#9aa6c0",
          600: "#b7c1d7",
          700: "#d2d9e8",
          800: "#e8edf6",
          900: "#f8fafc",
        },
        brand: {
          50: "#302539",
          100: "#56301e",
          300: "#ffc45c",
          500: "#ff9800",
          600: "#f57c00",
          700: "#ffb52e",
          800: "#ffd180",
          900: "#fff0cc",
        },
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,.025), 0 12px 28px rgba(5,8,20,.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;
