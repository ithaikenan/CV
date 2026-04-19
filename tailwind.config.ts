import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Playoff Monkey dark-blue palette
        ink: {
          950: "#05091a",
          900: "#0a1230",
          800: "#0f1a4a",
          700: "#16256b",
          600: "#1f3394",
          500: "#2a46c8",
        },
        banana: { 400: "#ffd84d", 500: "#f5c518" },
        rim: "#ff6b3d",
        court: "#c38a58",
      },
      fontFamily: {
        display: ["ui-rounded", "Nunito", "system-ui", "sans-serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(245,197,24,0.55)",
      },
      backgroundImage: {
        court:
          "radial-gradient(circle at 20% 10%, rgba(42,70,200,.35), transparent 45%), radial-gradient(circle at 80% 90%, rgba(255,107,61,.2), transparent 45%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
