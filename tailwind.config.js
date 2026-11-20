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
          darkest: '#1E1F22',
          panel: '#2B2D31',
          elevated: '#313338',
          hover: '#35373C',
          card: '#232428',
          border: '#383A40',
          blurple: '#5865F2',
          'blurple-hover': '#4752C4',
          green: '#23A55A',
          text: '#F2F3F5',
          muted: '#949BA4',
        },
        spotify: {
          black: '#121212',
          dark: '#1E1F22',
          surface: '#2B2D31',
          elevated: '#313338',
          hover: '#35373C',
          green: '#23A55A',
          'green-hover': '#2ECC71',
          text: '#F2F3F5',
          subtext: '#949BA4',
          muted: '#6D737F',
          divider: '#383A40',
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
