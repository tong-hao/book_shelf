/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bookshelf: {
          bg: "#f5f5f7",
          sidebar: "#e8e8ed",
          card: "#ffffff",
          accent: "#0071e3",
          "accent-hover": "#0077ed",
          text: "#1d1d1f",
          "text-secondary": "#86868b",
          border: "#d2d2d7",
        },
      },
    },
  },
  plugins: [],
};
