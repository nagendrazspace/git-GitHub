/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8f4fd',
          100: '#c5e3fa',
          200: '#9fd0f7',
          300: '#74baf3',
          400: '#4fa8f0',
          500: '#2196ed',
          600: '#0d7fd8',
          700: '#0a65b0',
          800: '#084d88',
          900: '#053360',
        },
        surface: {
          900: '#0b0f17',
          800: '#131925',
          700: '#1a2235',
          600: '#232e45',
          500: '#2d3a55',
        },
      },
    },
  },
  plugins: [],
}

