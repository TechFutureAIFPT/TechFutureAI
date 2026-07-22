/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        "background-soft": "#121212",
        surface: "#1E1E1E",
        "surface-raised": "#252525",
        "surface-soft": "#121212",
        "line-soft": "#2A2A2A",
        "line-strong": "#3A3A3A",
        heading: "#F5F5F5",
        body: "#FFFFFF",
        muted: "#AAAAAA",
        disabled: "#71717A",
        champagne: "#F1E0C5",
        "champagne-strong": "#E6C99F",
        "champagne-soft": "rgba(241,224,197,0.14)",
        success: "#00C853",
        warning: "#F59E0B",
        danger: "#D32F2F",
        info: "#F1E0C5"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        glow: "0 0 20px rgba(245,214,187,0.22)"
      }
    }
  },
  plugins: []
};
