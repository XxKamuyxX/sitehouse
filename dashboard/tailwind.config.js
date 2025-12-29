/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F172A',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        gold: {
          DEFAULT: '#C5A059',
          50: '#FDF9F0',
          100: '#FAF3E0',
          200: '#F5E6C0',
          300: '#F0D9A0',
          400: '#E5C580',
          500: '#C5A059',
          600: '#A8894B',
          700: '#8B723D',
          800: '#6E5B2F',
          900: '#514421',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}




