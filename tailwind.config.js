/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#97BD11',
        bgInputError: '#e0d4d4',
        disabled: '#747474',
        error: '#C32F2F',
        info: '#2196F3',
        success: '#429254',
        text1: '#1D1C1C',
        text2: '#4d4d4d',
        warning: '#E78B49',
      },
    },
  },
  plugins: [],
};
