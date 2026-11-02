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
          bg: '#FAF8F5',
          surface: '#FFFFFF',
          primary: '#166534',
          primaryDark: '#14532D',
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
          border: '#E8ECEF',
          sidebar: '#FFFFFF',
          success: '#15803D',
          warning: '#B45309',
          error: '#B91C1C',
          rose: '#BE185D',
        },
      },
      boxShadow: {
        'card': '0 1px 4px rgba(17,24,39,0.04), 0 2px 8px rgba(20,83,45,0.03)',
        'card-hover': '0 8px 24px rgba(26,107,74,0.08), 0 2px 6px rgba(17,24,39,0.04)',
        'sidebar': '2px 0 16px rgba(17,24,39,0.04)',
        'header': '0 2px 8px rgba(17,24,39,0.04)',
        'nav': '0 -2px 16px rgba(17,24,39,0.05)',
        'pill': '0 2px 6px rgba(26,107,74,0.14)',
      },
      borderRadius: {
        'lg': '8px',
        'xl': '8px',
        '2xl': '8px',
        '3xl': '8px',
        '4xl': '8px',
      },
      backgroundImage: {
        'hero-green': 'linear-gradient(135deg, #166534 0%, #14532D 55%, #0F4230 100%)',
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
