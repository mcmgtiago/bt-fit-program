/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#e53e3e',
          orange: '#dd6b20',
          dark: '#0a0a0a',
          card: '#111111',
          border: '#1f1f1f',
          muted: '#6b7280',
          subtle: '#374151',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
