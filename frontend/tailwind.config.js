/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        aqi: {
          good: '#10B981',        // Green (0-50)
          satisfactory: '#84CC16',// Light green (51-100)
          moderate: '#EAB308',    // Yellow (101-200)
          poor: '#F97316',        // Orange (201-300)
          verypoor: '#EF4444',    // Red (301-400)
          severe: '#7F1D1D',      // Maroon (401-500)
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
