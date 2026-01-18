/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00A3FF',
          dark: '#0077CC',
          50: '#E6F5FF',
          100: '#CCEBFF',
          200: '#99D7FF',
          300: '#66C3FF',
          400: '#33AFFF',
          500: '#00A3FF',
          600: '#0077CC',
          700: '#005A99',
          800: '#003D66',
          900: '#002033',
        },
        secondary: {
          DEFAULT: '#0B1E3B',
          50: '#E6EBF0',
          100: '#CCD7E1',
          200: '#99AFC3',
          300: '#6687A5',
          400: '#335F87',
          500: '#0B1E3B',
          600: '#08172F',
          700: '#061023',
          800: '#040A17',
          900: '#02050B',
        },
        accent: {
          DEFAULT: '#22C55E',
          50: '#E8FCF0',
          100: '#D1F9E1',
          200: '#A3F3C3',
          300: '#75EDA5',
          400: '#47E787',
          500: '#22C55E',
          600: '#1A9D4A',
          700: '#137536',
          800: '#0D4E23',
          900: '#062710',
        },
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
        'glass-blue': 'rgba(0, 163, 255, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}




