/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sf: {
          bg: '#18181B',
          surface: '#1F1F23',
          surface2: '#26262C',
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
