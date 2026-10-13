/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bookshelf: {
          bg: "rgb(var(--bs-bg) / <alpha-value>)",
          sidebar: "rgb(var(--bs-sidebar) / <alpha-value>)",
          card: "rgb(var(--bs-card) / <alpha-value>)",
          accent: "rgb(var(--bs-accent) / <alpha-value>)",
          "accent-hover": "rgb(var(--bs-accent-hover) / <alpha-value>)",
          text: "rgb(var(--bs-text) / <alpha-value>)",
          "text-secondary": "rgb(var(--bs-text-secondary) / <alpha-value>)",
          border: "rgb(var(--bs-border) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
