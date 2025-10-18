/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/routes/**/*.{html,js}",
    "./src/routes/**/**/*.{html,js}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui"),
  ],
  daisyui: {
    themes: ["light", "dark"],
  },
}
