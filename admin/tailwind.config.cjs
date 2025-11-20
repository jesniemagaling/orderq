/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#820D17",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui"],
        secondary: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
