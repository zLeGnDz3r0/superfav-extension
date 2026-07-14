/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sf: {
          bg: '#0E0E10',
          surface: '#18181B',
          surface2: '#1F1F23',
          accent: '#9146FF',
          accent2: '#A970FF',
          text: '#EFEFF1',
          muted: '#ADADB8',
        },
      },
    },
  },
  plugins: [],
};
