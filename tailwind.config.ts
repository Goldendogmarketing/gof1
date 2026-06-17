import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1340px"
      }
    },
    extend: {
      colors: {
        cream: "#f7f0df",
        parchment: "#fbf7ed",
        olive: {
          50: "#f4f4e8",
          100: "#e5e6cb",
          300: "#abb36c",
          500: "#68753c",
          700: "#30401f",
          900: "#172214"
        },
        gold: {
          400: "#c8a85a",
          600: "#98752f"
        },
        stonewarm: "#d7c6aa",
        terracotta: "#aa5e38",
        ink: "#162013"
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Avenir Next", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 80px rgba(22, 32, 19, 0.12)",
        glow: "0 30px 120px rgba(200, 168, 90, 0.28)"
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 1px 1px, rgba(22, 32, 19, 0.08) 1px, transparent 0)"
      },
      animation: {
        "float-slow": "float 8s ease-in-out infinite",
        "marquee": "marquee 34s linear infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(-2deg)" },
          "50%": { transform: "translateY(-16px) rotate(3deg)" }
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
