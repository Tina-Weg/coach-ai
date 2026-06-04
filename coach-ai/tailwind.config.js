export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0c0c0c',
        card: '#161616',
        accent: '#e8f74a',
        success: '#4ade80',
        warning: '#fb923c',
        error: '#f87171',
        purple: '#a78bfa',
        cyan: '#2dd4bf',
      },
      fontFamily: {
        bebas: ['Bebas Neue', 'cursive'],
        sans: ['Noto Sans TC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
