/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Inverted scale: higher numbers = lighter (for light theme)
        dark: {
          50:  '#0f172a',  // near-black (headings)
          100: '#1e293b',  // very dark text
          200: '#334155',  // dark body text
          300: '#475569',  // medium text (labels, sidebar)
          400: '#64748b',  // secondary text
          500: '#94a3b8',  // muted / placeholder
          600: '#cbd5e1',  // light borders
          700: '#e2e8f0',  // dividers / light hover bg
          800: '#ffffff',  // card / white background
          900: '#f1f5f9',  // sidebar / panel bg
          950: '#f8fafc',  // page background
        },
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
