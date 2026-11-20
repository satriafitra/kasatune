/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          black: '#000000',
          dark: '#121212',
          surface: '#181818',
          elevated: '#242424',
          hover: '#2A2A2A',
          green: '#1DB954',
          'green-hover': '#1ED760',
          text: '#FFFFFF',
          subtext: '#B3B3B3',
          muted: '#727272',
          divider: '#282828',
        },
      },
      fontFamily: {
        sans: ['CircularSp', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
};
