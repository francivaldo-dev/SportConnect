/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#121212',
          surface: '#1E1E1E',
          primary: '#005BBB',
          success: '#2E7D32',
          warning: '#F57C00',
        }
      }
    },
  },
  presets: [require("nativewind/preset")],
  plugins: [],
}
