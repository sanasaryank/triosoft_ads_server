/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f8f5ff',
          100: '#f0eaff',
          200: '#e0d1ff',
          300: '#c8b0ff',
          400: '#b596ff',
          500: '#9977ff',
          600: '#7d57ee',
          700: '#4c2ea0',
          800: '#2e1c6e',
          900: '#180d3c',
        },
      },
    },
  },
  plugins: [],
};
