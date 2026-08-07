import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Official GoodEarth Logo & Secondary Palettes (Brand Book Pages 27, 29, 30)
        geblue: {
          DEFAULT: '#0053a4',
          50: '#e6f0fa',
          100: '#cce0f5',
          500: '#0053a4',
          600: '#00478c',
          700: '#003870',
        },
        gegreen: {
          DEFAULT: '#a6be4b',
          50: '#f5f9e8',
          100: '#ebf3d1',
          400: '#b8cf5f',
          500: '#a6be4b',
          600: '#8ca239',
        },
        geolive: {
          DEFAULT: '#666b4a',
          50: '#f2f3ee',
          100: '#e4e6dc',
          500: '#666b4a',
          600: '#52563b',
          700: '#3d402c',
        },
        geterracotta: {
          DEFAULT: '#874545',
          50: '#f7eded',
          100: '#efdcdc',
          500: '#874545',
          600: '#703939',
        },
        geochre: {
          DEFAULT: '#ba965e',
          50: '#f8f5ef',
          100: '#f1ecdf',
          500: '#ba965e',
          600: '#9c7c4b',
        },
        gegold: {
          DEFAULT: '#d69100',
          500: '#d69100',
        },
        gesage: {
          DEFAULT: '#859ea6',
          500: '#859ea6',
        },
        gesand: {
          DEFAULT: '#d6d1c4',
          50: '#f9f8f6',
          100: '#f3f0e8',
          200: '#edebe4',
          300: '#d6d1c4',
        },
        // Core System Theme Palette (Earth & Nature-Inspired)
        brand: {
          50: '#f8f6f2',
          100: '#efece4',
          200: '#ded9c9',
          300: '#c5c2ad',
          400: '#a6be4b',
          450: '#7e8e50',
          500: '#666b4a',
          550: '#54583c',
          600: '#484b33',
          700: '#393c29',
          800: '#2b2d1f',
          850: '#212318',
          900: '#181a12',
          950: '#0f110c',
        },
        accent: {
          50: '#fbf8f3',
          100: '#f5ebdb',
          200: '#ebd5b6',
          300: '#deba8d',
          400: '#d69100',
          500: '#ba965e',
          600: '#9e7b46',
          700: '#874545',
          800: '#643232',
          900: '#482323',
          950: '#2b1414',
        },
      },
      fontFamily: {
        // Averia Serif Libre for Headings (Brand Book Page 32)
        serif: ['"Averia Serif Libre"', 'Georgia', 'serif'],
        // Work Sans for Subheadings & Body text (Brand Book Page 33)
        sans: ['"Work Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['"Work Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
