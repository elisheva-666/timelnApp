/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c0cfe0',
          300: '#8fa6c0',
          400: '#607d9a',
          500: '#3d5a7a',
          600: '#2a3f5c',
          700: '#1e2d42',
          800: '#141f30',
          900: '#0d1520',
          950: '#080e18',
        },
        brand: {
          400: '#52c0ff',
          500: '#2aa4ff',
          600: '#1485f5',
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

