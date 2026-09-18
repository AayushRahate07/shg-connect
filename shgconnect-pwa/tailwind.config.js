/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geologica', 'Mukta', 'system-ui', 'sans-serif'],
        devanagari: ['Mukta', 'Noto Sans Devanagari', 'sans-serif'],
        english: ['Geologica', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(15, 118, 110, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
      },
      colors: {
        brand: {
          bg: "#FAFAF9",
          surface: "#FFFFFF",
          primary: "#0F766E",
          primaryHover: "#0D9488",
          primarySoft: "#CCFBF1",
          accent: "#F97316",
          accentHover: "#EA580C",
          accentSoft: "#FFEDD5",
          text: "#1C1917",
          muted: "#78716C",
          border: "#E7E5E4",
          sidebar: "#F5F5F4",
          success: "#16A34A",
          warning: "#D97706",
          error: "#DC2626"
        },
        shg: {
          green: "#0F766E",
          lightGreen: "#CCFBF1",
          orange: "#F97316",
          gold: "#D97706",
          navy: "#1C1917",
          parchment: "#FAFAF9",
          parchmentDark: "#E7E5E4",
          inkBorder: "#E7E5E4",
          inkText: "#1C1917"
        }
      }
    },
  },
  plugins: [],
}
