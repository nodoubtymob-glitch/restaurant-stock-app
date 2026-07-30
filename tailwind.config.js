/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base charcoal / ember surfaces.
        // Light shades (50-400) are used for text on dark; deep shades (600-950) for surfaces.
        coal: {
          50: '#f8f5f3',
          100: '#f5f0ec',
          200: '#e6ded8',
          300: '#c9bdb4',
          400: '#a89f98',
          500: '#7c726b',
          600: '#3a302b',
          700: '#2b2320',
          800: '#211b18',
          850: '#1a1614',
          900: '#141110',
          950: '#0d0b0a',
        },
        ember: {
          50: '#fff3ed',
          100: '#ffe1d1',
          200: '#ffbf9e',
          300: '#ff9a6b',
          400: '#ff7a45',
          500: '#ff5a1f',
          600: '#f23d0a',
          700: '#c72e08',
          800: '#9c260d',
          900: '#7a220f',
        },
        gold: {
          400: '#ffb547',
          500: '#f59e0b',
        },
      },
      fontFamily: {
        sans: [
          'ui-rounded',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.6)',
        glow: '0 8px 30px -8px rgba(255,90,31,0.5)',
        'glow-sm': '0 4px 16px -4px rgba(255,90,31,0.45)',
      },
      backgroundImage: {
        ember: 'linear-gradient(135deg, #ff7a45 0%, #f23d0a 60%, #c72e08 100%)',
        'ember-soft': 'linear-gradient(135deg, rgba(255,122,69,0.15), rgba(242,61,10,0.05))',
        coal: 'radial-gradient(1200px 600px at 50% -10%, rgba(255,90,31,0.10), transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease both',
        pop: 'pop 0.2s ease both',
      },
    },
  },
  plugins: [],
}
