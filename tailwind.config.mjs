/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'void-black': '#020408',
        'deep-navy': '#0B1121',
        'paper-white': '#F8FAFC',
        'liquid-gold': {
          DEFAULT: '#D4AF37',
          light: '#F6E27A',
          dark: '#D4AF37',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.7)' },
          '50%': { opacity: '0.9', boxShadow: '0 0 0 10px rgba(212, 175, 55, 0)' },
        },
      },
    },
  },
  plugins: [],
};




