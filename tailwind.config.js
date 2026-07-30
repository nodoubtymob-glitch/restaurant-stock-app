/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // NOTE: token names kept as `coal`/`ember` for continuity, but the
        // palette is now a LIGHT theme: `coal` = neutral surfaces + dark text,
        // `ember` = lime/chartreuse accent.
        coal: {
          50: '#0a0a0c', // darkest ink
          100: '#141417', // primary text (near-black)
          200: '#33333a', // strong secondary text
          300: '#55555e', // secondary text
          400: '#7a7a84', // muted text
          500: '#9a9aa4', // faint text
          600: '#c7c7ce', // borders / placeholder
          700: '#dedee3', // dividers
          800: '#e9e9ed', // hover / chip bg
          850: '#f0f0f3', // input bg
          900: '#ffffff', // card bg
          950: '#f4f4f6', // page bg
        },
        ember: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#517b0a', // accent TEXT (readable on light)
          400: '#a3e635', // bright lime (accent on dark)
          500: '#c4f230', // PRIMARY lime
          600: '#a4d81c',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314',
        },
        ink: {
          900: '#141417',
          800: '#1e1e22',
          700: '#2a2a30',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'var(--font-display)',
          'ui-rounded',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,16,20,0.04), 0 14px 34px -16px rgba(16,16,20,0.16)',
        soft: '0 2px 10px -4px rgba(16,16,20,0.10)',
        glow: '0 12px 30px -8px rgba(196,242,48,0.55)',
        'glow-sm': '0 6px 18px -6px rgba(196,242,48,0.5)',
        ink: '0 14px 34px -16px rgba(16,16,20,0.45)',
      },
      backgroundImage: {
        ember: 'linear-gradient(135deg,#d4fb5a 0%, #c4f230 55%, #a9d81f 100%)',
        'ember-soft': 'linear-gradient(135deg, rgba(196,242,48,0.20), rgba(196,242,48,0.06))',
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
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease both',
        pop: 'pop 0.2s ease both',
      },
    },
  },
  plugins: [],
}
