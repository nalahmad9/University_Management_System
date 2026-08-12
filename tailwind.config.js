/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe',
          300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1',
          600: '#4f46e5', 700: '#4338ca', 800: '#3730a3',
          900: '#312e81', 950: '#1e1b4b',
        },
        surface: {
          DEFAULT: '#f7f5f0',
          card: '#ffffff',
          hover: '#f0ede8',
          border: '#e8e4e0',
        },
        ink: {
          DEFAULT: '#1a1a2e',
          muted: '#6b6580',
          faint: '#9b94a8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(26,26,46,0.06), 0 1px 2px rgba(26,26,46,0.04)',
        'card-hover': '0 4px 12px rgba(26,26,46,0.08), 0 2px 4px rgba(26,26,46,0.04)',
        'elevated': '0 8px 24px rgba(26,26,46,0.10), 0 2px 8px rgba(26,26,46,0.04)',
        'modal': '0 20px 60px rgba(26,26,46,0.14), 0 8px 24px rgba(26,26,46,0.06)',
        'glow-sm': '0 0 20px -4px rgba(99,102,241,0.15)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(5px) rotate(-1deg)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20px, -15px) scale(1.05)' },
        },
        'gradient-drift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'slide-in': 'slide-in 0.25s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'gradient-drift': 'gradient-drift 8s ease infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
