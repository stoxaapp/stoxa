import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // WICHTIG für den class-basierten Dark Mode Toggle
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
