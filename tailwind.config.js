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
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        main: {
          DEFAULT: '#4c3c8d',
          50: '#f5f4f9',
          100: '#e9e7f2',
          200: '#d3cfe5',
          300: '#b5aed3',
          400: '#9388bc',
          500: '#7a6ba8',
          600: '#4c3c8d',
          700: '#3d3073',
          800: '#342a5f',
          900: '#2d2550',
        },
      },
    },
  },
  plugins: [],
}


