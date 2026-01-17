/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neubrutalism Pink-based color scheme
        "nb-pink": {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        "nb-yellow": "#ffd93d",
        "nb-blue": "#6BCF7F",
        "nb-purple": "#c084fc",
        "nb-orange": "#fb923c",
      },
      boxShadow: {
        "brutal-sm": "2px 2px 0px 0px rgba(0,0,0,1)",
        brutal: "4px 4px 0px 0px rgba(0,0,0,1)",
        "brutal-md": "6px 6px 0px 0px rgba(0,0,0,1)",
        "brutal-lg": "8px 8px 0px 0px rgba(0,0,0,1)",
        "brutal-pink": "4px 4px 0px 0px rgba(219,39,119,1)",
        "brutal-pink-lg": "8px 8px 0px 0px rgba(219,39,119,1)",
      },
      borderWidth: {
        3: "3px",
      },
    },
  },
  plugins: [],
};
