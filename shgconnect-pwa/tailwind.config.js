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
          green: "#14532D",
          lightGreen: "#DCFCE7",
          orange: "#C2410C",
          gold: "#B45309",
          navy: "#1E3A8A",
          parchment: "#FDFBF7",
          parchmentDark: "#F7F4EC",
          inkBorder: "#E2DDD3",
          inkText: "#1C1917"
        }
      }
    },
  },
  plugins: [],
}
