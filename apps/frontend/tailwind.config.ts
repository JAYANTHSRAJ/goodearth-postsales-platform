import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f7f5',
          100: '#e6ece8',
          200: '#cfdcd4',
          300: '#a7c1b1',
          400: '#799d87',
          500: '#567e65',
          600: '#43644f',
          700: '#385141',
          800: '#2f4236',
          900: '#27372d',
          950: '#151e19',
        },
        accent: {
          50: '#faf8f5',
          100: '#f4ebd8',
          200: '#e7d6b3',
          300: '#d7bc89',
          400: '#c59f61',
          500: '#b78643',
          600: '#a37136',
          700: '#87582c',
          800: '#6f4727',
          900: '#5c3a22',
          950: '#341f10',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Outfit', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
