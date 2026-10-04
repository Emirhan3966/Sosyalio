import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17152f",
        muted: "#6d6a82",
        primary: "#6c4cf6",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(46, 36, 110, 0.10)",
        card: "0 12px 35px rgba(39, 31, 86, 0.08)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.05)" },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        "float-slow": "float 7s ease-in-out 1s infinite",
        "pulse-soft": "pulseSoft 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
