/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          dark: "#0b0f19",
          darker: "#06090e",
          card: "rgba(18, 24, 38, 0.75)",
          cardHover: "rgba(24, 32, 50, 0.85)",
          border: "rgba(255, 255, 255, 0.08)",
          borderHover: "rgba(0, 229, 255, 0.3)",
          accent: "#00e5ff",
          accentGlow: "rgba(0, 229, 255, 0.15)",
          emerald: "#10b981",
          emeraldGlow: "rgba(16, 185, 129, 0.15)",
          purple: "#a855f7",
          purpleGlow: "rgba(168, 85, 247, 0.15)",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
