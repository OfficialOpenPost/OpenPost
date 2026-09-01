import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FEA611",
          hover: "#E8950B",
          light: "#FFF8ED",
        },
        navy: {
          DEFAULT: "#0F172A",
          light: "#1E293B",
          dark: "#020617",
        },
      },
    },
  },
  plugins: [],
};

export default config;
