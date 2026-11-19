/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#e8eef5',
          100: '#c5d4e6',
          200: '#9eb8d5',
          300: '#779bc4',
          400: '#5985b8',
          500: '#3c6fac',
          600: '#2d5a93',
          700: '#1e3a5f',
          800: '#162d4a',
          900: '#0e1f35',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
