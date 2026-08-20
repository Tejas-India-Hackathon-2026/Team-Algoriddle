/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yatra: {
          terracotta: '#A04000', // Deep Warm Terracotta/Earthy Red
          terracottaLight: '#E59866',
          amber: '#D35400', // Warm orange/sun rise
          gold: '#F39C12', // Warm yellow/gold
          sand: '#FDFEFE', // Very soft warm white
          cream: '#F4F6F7', // Soft background cream
          forest: '#1E8449', // Nature green
          charcoal: '#2C3E50', // Readable gray/dark
          slate: '#7F8C8D'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px -15px rgba(0, 0, 0, 0.1)',
        'premium-hover': '0 20px 40px -20px rgba(160, 64, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
