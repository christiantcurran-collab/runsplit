import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core surfaces
        "bg-dark": "#09090B",
        "bg-page": "#FAFAFA",
        "bg-card": "#FFFFFF",
        "bg-subtle": "#F4F4F5",
        // Brand
        brand: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
          glow: "rgba(249, 115, 22, 0.15)",
        },
        // Semantic
        success: "#22C55E",
        warning: "#EAB308",
        danger: "#EF4444",
        // Text
        "text-primary": "#09090B",
        "text-secondary": "#71717A",
        "text-on-dark": "#FAFAFA",
        "text-muted": "#A1A1AA",
        // Legacy aliases (for backward compat in auth pages)
        "brand-black": "#09090B",
        "brand-orange": "#F97316",
        "brand-orange-hover": "#EA580C",
        "brand-green": "#22C55E",
        "cool-grey": "#71717A",
        "near-black": "#09090B",
        "pure-white": "#FAFAFA",
        "success-green": "#22C55E",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        heading: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(249, 115, 22, 0.15)",
      },
      animation: {
        "count-up": "countUp 600ms ease-out",
        "fade-up": "fadeUp 400ms ease-out",
        "slide-in": "slideIn 300ms ease-out",
      },
      keyframes: {
        countUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
