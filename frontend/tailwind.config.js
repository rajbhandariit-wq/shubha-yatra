export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#fff1f1',100:'#ffe1e1',200:'#ffc8c8',300:'#ffa0a0',400:'#ff6b6b',500:'#DC143C',600:'#c01035',700:'#a00d2c',800:'#840e27',900:'#6f1025' },
        nepal: { blue:'#003893', red:'#DC143C', white:'#FFFFFF', gold:'#FFD700', saffron:'#FF8C00' }
      },
      fontFamily: { nepali: ['Noto Sans Devanagari', 'sans-serif'] },
      backgroundImage: {
        'mountains': "url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920&q=80')",
        'swayambhu': "url('https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=1920&q=80')",
        'lumbini': "url('https://images.unsplash.com/photo-1571988887866-44e4383f91dd?w=1920&q=80')",
        'annapurna': "url('https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=1920&q=80')"
      }
    }
  },
  plugins: []
}
