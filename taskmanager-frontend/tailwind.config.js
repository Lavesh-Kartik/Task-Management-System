/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fd',
          300: '#a4bcfb',
          400: '#7b98f8',
          500: '#5b75f3',
          600: '#4353e7',
          700: '#3741cc',
          800: '#2f37a4',
          900: '#2c3382',
          950: '#1a1f4f',
        },
        dark: {
          50: '#f8f9fc',
          100: '#f1f3f9',
          200: '#e2e6f0',
          300: '#c8cfdf',
          400: '#9aa5be',
          500: '#6b7a9a',
          600: '#4f5e80',
          700: '#3d4a66',
          800: '#2a3248',
          900: '#1a2035',
          950: '#0d1221',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
