/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Prompt', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      keyframes: {
        'slide-up': { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
      },
      animation: {
        'slide-up': 'slide-up .35s ease-out both',
        'fade-in': 'fade-in .25s ease-out both',
      },
    },
  },
  plugins: [],
};
