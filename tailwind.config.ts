import type { Config } from 'tailwindcss'

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        display: ["Fraunces", "serif"],
      },
      screens: { xs: "320px" },
    },
  },
  plugins: [],
}

export default config
