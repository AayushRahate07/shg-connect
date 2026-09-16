/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shg: {
          green: "#065f46",
          lightGreen: "#d1fae5",
          orange: "#c2410c",
          gold: "#b45309",
          navy: "#1e3a8a",
          paper: "#fefce8",
          ink: "#0f172a"
        }
      }
    },
  },
  plugins: [],
}
