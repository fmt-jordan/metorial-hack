/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(0, 74, 173, 0.3), 0 0 40px rgba(0, 74, 173, 0.1)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(0, 74, 173, 0.5), 0 0 60px rgba(0, 74, 173, 0.2)',
          },
        },
      },
    },
  },
  plugins: [],
};
