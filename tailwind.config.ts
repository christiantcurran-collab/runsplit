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
        // Core surfaces — Option C: Split Contrast
        "bg-dark": "#0C0C0F",
        "bg-dark-card": "#16161A",
        "bg-dark-input": "#1C1C22",
        "bg-dark-border": "#2A2A32",
        "bg-page": "#F8F8FA",
        "bg-card": "#FFFFFF",
        "bg-subtle": "#F0F0F4",
        // Brand — blue
        brand: {
          DEFAULT: "#3B82F6",
          hover: "#60A5FA",
          glow: "rgba(59, 130, 246, 0.12)",
          dim: "rgba(59, 130, 246, 0.06)",
        },
        // Semantic
        success: "#34D399",
        warning: "#EAB308",
        danger: "#EF4444",
        // Text — dark backgrounds
        "text-on-dark": "#F8F8FA",
        "text-dark-sec": "#9898A6",
        "text-dark-muted": "#5C5C6A",
        // Text — light backgrounds
        "text-primary": "#0C0C0F",
        "text-secondary": "#6E6E7A",
        "text-muted": "#A0A0AC",
        // Legacy aliases (backward compat)
        "brand-black": "#0C0C0F",
        "brand-orange": "#3B82F6",
        "brand-orange-hover": "#60A5FA",
        "brand-green": "#34D399",
        "cool-grey": "#6E6E7A",
        "near-black": "#0C0C0F",
        "pure-white": "#F8F8FA",
        "success-green": "#34D399",
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
        heading: ["'Sora'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.15)",
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
