/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Prompt', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      keyframes: {
        'slide-up': { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        float: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(30px,-40px) scale(1.08)' } },
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        shine: { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
      animation: {
        'slide-up': 'slide-up .3s ease-out both',
        'fade-in': 'fade-in .2s ease-out both',
        float: 'float 14s ease-in-out infinite',
        'float-slow': 'float 20s ease-in-out infinite reverse',
        bob: 'bob 5s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        shine: 'shine 6s linear infinite',
      },
    },
  },
  plugins: [],
};
