import {heroui} from "@heroui/react"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        'primary': "#2CAFBF",
        'secondary': "#bd8c13",
        // Add more custom colors as needed
      },
    },
    
  
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              50: '#f0f9fa',  // Lightest teal shade
              100: '#d9f1f4',
              200: '#b4e4e9',
              300: '#8ed6de',
              400: '#68c8d3',
              500: '#2CAFBF', // Your main teal color
              600: '#248c99',
              700: '#1d6973',
              800: '#15464c',
              900: '#0e2326',  // Darkest teal shade
              DEFAULT: '#2CAFBF',
              foreground: '#FFFFFF'
            },
            background: "#FFFFFF",
            foreground: "#11181C",
            // ... rest of the colors
          },
        },
        dark: {
          colors: {
            primary: {
              50: '#f0f9fa',
              100: '#d9f1f4',
              200: '#b4e4e9',
              300: '#8ed6de',
              400: '#68c8d3',
              500: '#2CAFBF',
              600: '#248c99',
              700: '#1d6973',
              800: '#15464c',
              900: '#0e2326',
              DEFAULT: '#2CAFBF',
              foreground: '#FFFFFF'
            },
            background: "#000000",
            foreground: "#ECEDEE",
            // ... rest of the colors
          },
        },
      },
    }),
  ],
};

module.exports = config;