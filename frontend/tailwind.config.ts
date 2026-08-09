import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F7F7F5",
        card: "#FFFFFF",
        primary: "#111111",
        accent: "#D97706",
        "accent-tint": "#FDF3E7",
        success: "#16A34A",
        border: "#E5E5E5",
        muted: "#6B7280",
        faint: "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
export default config;
