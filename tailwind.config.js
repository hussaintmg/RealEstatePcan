/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        dark: {
          900: '#0a0d14',
          800: '#101522',
          700: '#1a2234',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      height: {
        'screen-dvh': '100dvh',
      },
      minHeight: {
        'screen-dvh': '100dvh',
      },
      maxHeight: {
        'screen-dvh': '100dvh',
      },
      zIndex: {
        sticky: '20',
        sidebar: '30',
        topbar: '30',
        dropdown: '40',
        'drawer-backdrop': '45',
        drawer: '50',
        'modal-backdrop': '60',
        modal: '70',
        toast: '80',
        tooltip: '90',
      },
    },
  },
  plugins: [],
};
