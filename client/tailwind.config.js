export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0b1121',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.06)',
        'card-dark': '0 0 0 1px rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.3)',
        'card-dark-hover': '0 0 0 1px rgba(255,255,255,0.08), 0 8px 30px rgba(0,0,0,0.4)',
        'modal': '0 25px 50px -12px rgba(0,0,0,0.15)',
        'modal-dark': '0 0 0 1px rgba(255,255,255,0.05), 0 25px 50px -12px rgba(0,0,0,0.5)',
        'kpi': '0 1px 2px rgba(0,0,0,0.04)',
        'kpi-dark': '0 0 0 1px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
