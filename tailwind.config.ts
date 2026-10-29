import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // Das aktiviert die Steuerung über die .dark Klasse am HTML-Tag
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
