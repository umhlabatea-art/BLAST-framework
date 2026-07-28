// Tailwind theme for the app, sourced from the shared brand tokens so the
// native UI and any web export share one palette.
const { palette, semantic } = require("@umhlabatea/core/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ...palette,
        background: semantic.background,
        surface: semantic.surface,
        primary: semantic.primary,
        accent: semantic.accent,
        canvas: semantic.canvasDark,
        muted: semantic.muted,
      },
      fontFamily: {
        display: ["BebasNeue"],
        body: ["Ubuntu"],
      },
    },
  },
  plugins: [],
};
