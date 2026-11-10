/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          50: '#fbf9f5',
          100: '#f6f1e8',
          200: '#ebe1ce',
          300: '#decbae',
          400: '#cbb084',
          500: '#b8945a',
          600: '#a37e47',
          700: '#856338',
          800: '#6d4f31',
          900: '#5c422c',
        },
        gold: {
          DEFAULT: '#c5a059',
          light: '#dfbe7e',
          dark: '#9d7c38',
          metallic: 'linear-gradient(135deg, #dfbe7e 0%, #c5a059 50%, #9d7c38 100%)',
        },
        emerald: {
          950: '#041713',
          900: '#07241e',
          800: '#0c382f',
          700: '#114d41',
          600: '#186757',
        },
        obsidian: {
          DEFAULT: '#0b0e0e',
          surface: '#121716',
          card: '#161d1b',
          border: '#222b29',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Playfair Display', 'serif'],
        display: ['"Cinzel"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 15px rgba(197, 160, 89, 0.1)',
        'luxury-hover': '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 25px rgba(197, 160, 89, 0.25)',
        'gold-glow': '0 0 25px rgba(197, 160, 89, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

