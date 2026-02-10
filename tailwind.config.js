// tailwind.config.js
module.exports = {
  // DİKKAT: "./src/**/*.{js,jsx,ts,tsx}" kısmını ekledik.
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f97316',
      }
    },
  },
  plugins: [],
}