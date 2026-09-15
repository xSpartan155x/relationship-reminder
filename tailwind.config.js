/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        ui: ['"Segoe UI"', 'system-ui', 'sans-serif'],
        emoji: ['"Segoe UI Emoji"', 'sans-serif'],
      },
      colors: {
        ink: '#4A3540',
        'ink-soft': '#8A7480',
        accent: '#E84A7F',
        'accent-dark': '#D12D66',
        blush: '#FFE1EC',
        'blush-line': '#F6C9DA',
        heart: '#F7B7CE',
        off: '#DDD0D8',
      },
      boxShadow: {
        card: '0 18px 45px -12px rgba(209, 45, 102, 0.35)',
      },
      keyframes: {
        'float-up': {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(-140px)', opacity: '0' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
