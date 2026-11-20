/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kasatune: {
          cream: '#FFEAD3',
          ice: '#BFE7EA',
          ochre: '#E89B5B',
          rust: '#D46743',
        },
        discord: {
          darkest: '#0B0C0E',
          panel: '#141619',
          elevated: '#1C1E22',
          hover: '#24272D',
          card: '#111215',
          border: '#282B32',
          blurple: '#5865F2',
          'blurple-hover': '#4752C4',
          green: '#23A55A',
          text: '#FFFFFF',
          muted: '#A0A5AD',
        },
      },
      fontFamily: {
        sans: ['gg sans', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
};
