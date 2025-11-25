/** Tailwind config extended for Clankers brand */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/routes/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#912338', // main brand
        primaryHover: '#A93A4F', // hover state
        primaryActive: '#701A29', // active/darker
        accentSunny: '#FFC94D', // playful sunny accent
        accentMint: '#2CB5B3', // mint accent
        accentLavender: '#B28DFF', // soft playful purple
      },
      boxShadow: {
        card: '0 2px 4px -1px rgba(0,0,0,0.08), 0 4px 10px -2px rgba(0,0,0,0.06)',
        soft: '0 1px 2px 0 rgba(0,0,0,0.08)',
      },
      borderRadius: {
        xl2: '1.15rem',
      },
    },
  },
  plugins: [],
}
