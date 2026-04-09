import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0A0A0A",
        obsidian: "#111111",
        carbon: "#1A1A1A",
        ignition: "#F97316",
        redline: "#EF4444",
        border: "#2A2A2A",
        muted: "#888888",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        sub: ["var(--font-sub)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        hero: ["88px", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        display: ["56px", { lineHeight: "1", letterSpacing: "0" }],
        label: ["11px", { lineHeight: "1", letterSpacing: "0.12em" }],
      },
    },
  },
  plugins: [],
};

export default config;
