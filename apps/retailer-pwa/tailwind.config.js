/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAF6F0', surface: '#FFFFFF', ink: '#1E1E1E', inkSoft: '#8C857B',
        charcoal1: '#2C2A29', charcoal2: '#1A1918',
        sunset1: '#FF8C42', sunset2: '#FF5E7E', sunset3: '#B57BFF',
        cpink: '#FFC9D6', lavender: '#CFC2FF', mint: '#A8E3C2', sky: '#B0D6FF', gold: '#FFDD8A',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '28px', tile: '12px' },
      boxShadow: {
        soft: '0 8px 30px rgba(44,42,41,0.06)',
        lift: '0 14px 40px rgba(44,42,41,0.10)',
        sunset: '0 10px 30px rgba(255,94,126,0.28)',
      },
      backgroundImage: {
        sunset: 'linear-gradient(135deg,#FF8C42 0%,#FF5E7E 50%,#B57BFF 100%)',
        charcoal: 'linear-gradient(160deg,#2C2A29 0%,#1A1918 100%)',
      },
      keyframes: {
        sheetUp: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        pop: { '0%': { transform: 'scale(0.6)', opacity: '0' }, '60%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: {
        sheetUp: 'sheetUp 0.28s cubic-bezier(0.22,1,0.36,1)',
        pop: 'pop 0.4s cubic-bezier(0.22,1,0.36,1)',
        fade: 'fade 0.2s ease',
      },
    },
  },
  plugins: [],
};
