import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // <--- WICHTIG: Erlaubt das Umschalten über die .dark Klasse
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
