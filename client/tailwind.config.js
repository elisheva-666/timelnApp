/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
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
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
        },
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)',
        'card-lg': '0 4px 6px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)',
        'btn':     '0 1px 2px rgba(37,99,235,0.15), 0 4px 12px rgba(37,99,235,0.12)',
        'btn-lg':  '0 2px 4px rgba(37,99,235,0.25), 0 8px 20px rgba(37,99,235,0.18)',
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
        snug: '-0.01em',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
