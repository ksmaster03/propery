/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  important: '#root',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#005b9f',
          dark: '#163f6b',
          mid: '#0f73b8',
          soft: '#e9f2fb',
        },
        accent: {
          DEFAULT: '#d7a94b',
          soft: 'rgba(215,169,75,.15)',
        },
      },
    },
  },
  plugins: [],
};
