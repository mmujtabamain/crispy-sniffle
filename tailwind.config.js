/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#8E51D0",
        secondary: "#6C63FF",
        surface: "#111827",
        card: "#1F2937",
        muted: "#6B7280",
      },
      fontFamily: {
        sans: ["Quicksand", "sans-serif"],
      },
      screens: { xs: "320px" },
    },
  },
  plugins: [],
}
