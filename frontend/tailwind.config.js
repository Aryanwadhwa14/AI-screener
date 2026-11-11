/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#020203",
        surface: {
          DEFAULT: "#0d0d11",
          subtle: "#14141a",
          border: "#1f1f28",
        },
        brand: {
          orange: "#FF5729",
          orangeHover: "#E0481D",
        },
        muted: {
          DEFAULT: "#8B8D98",
          foreground: "#B0B3BE",
        },
      },
    },
  },
  plugins: [],
};

