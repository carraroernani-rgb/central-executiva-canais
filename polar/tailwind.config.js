export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        bg:     '#F7F4EF',
        card:   '#FFFFFF',
        card2:  '#F4F1EC',
        accent: '#7C9E87',
        blue:   '#8FB8C9',
        warm:   '#E8A87C',
        danger: '#D97C7C',
        text:   '#2D2D2D',
        text2:  '#6B6B6B',
        text3:  '#A0A0A0',
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [],
}
