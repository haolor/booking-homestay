/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf9",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        ink: "#0f172a",
      },
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 22px 50px -12px rgba(15, 118, 110, 0.12)",
        card: "0 4px 24px rgba(15, 23, 42, 0.06)",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(ellipse 110% 80% at 10% -10%, rgba(20, 184, 166, 0.22), transparent 55%), radial-gradient(ellipse 90% 70% at 100% 0%, rgba(13, 148, 136, 0.12), transparent 50%)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.375rem",
      },
    },
  },
  plugins: [],
};
