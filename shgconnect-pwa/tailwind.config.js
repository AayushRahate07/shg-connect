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
        geologica: ['Geologica', 'sans-serif'],
        devanagari: ['Mukta', 'Noto Sans Devanagari', 'sans-serif'],
        english: ['Geologica', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: '#F4F6FA',
          surface: '#FFFFFF',
          primary: '#1A6B4A',
          primaryDark: '#145739',
          primaryLight: '#E6F4EE',
          saffron: '#E8720C',
          saffronDark: '#C55E08',
          saffronLight: '#FFF0E5',
          violet: '#6D28D9',
          violetLight: '#EDE9FE',
          blue: '#1D5FA8',
          blueLight: '#EBF3FF',
          text: '#111827',
          muted: '#6B7280',
          border: '#E4E8EF',
          sidebar: '#FFFFFF',
          success: '#15803D',
          warning: '#B45309',
          error: '#B91C1C',
          rose: '#BE185D',
        },
      },
      boxShadow: {
        'card': '0 1px 4px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)',
        'card-hover': '0 8px 24px rgba(26,107,74,0.10), 0 2px 6px rgba(17,24,39,0.06)',
        'sidebar': '2px 0 16px rgba(17,24,39,0.06)',
        'header': '0 2px 8px rgba(17,24,39,0.06)',
        'nav': '0 -2px 16px rgba(17,24,39,0.07)',
        'pill': '0 2px 6px rgba(26,107,74,0.18)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      backgroundImage: {
        'hero-green': 'linear-gradient(135deg, #1A6B4A 0%, #145739 50%, #0F4230 100%)',
        'hero-saffron': 'linear-gradient(135deg, #E8720C 0%, #C55E08 100%)',
        'mesh-green': 'radial-gradient(at 20% 20%, #2D9B6A22 0px, transparent 50%), radial-gradient(at 80% 80%, #1A6B4A11 0px, transparent 50%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        popIn: 'popIn 0.2s ease-out',
      }
    },
  },
  plugins: [],
}
