import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        surface: "#0F172A",
        "surface-hover": "#111827",
        primary: "#2563EB",
        "text-primary": "#F8FAFC",
        "text-secondary": "#94A3B8",
        border: "rgba(255, 255, 255, 0.05)",
      },
      borderRadius: {
        "2xl": "1.5rem",
      },
      boxShadow: {
        premium: "0 0 15px rgba(37, 99, 235, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
