// Tailwind theme for the app, sourced from the shared brand tokens so the
// native UI and any web export share one palette. Minimalist system: paper
// background, ink text, hairline lines, a single accent, IBM Plex Mono.
const { palette, semantic } = require("@umhlabatea/core/theme/palette.cjs");

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
        ink: palette.ink,
        muted: semantic.muted,
        primary: semantic.primary,
        accent: semantic.accent,
        line: semantic.border,
      },
      fontFamily: {
        display: ["IBMPlexMono_600SemiBold"],
        body: ["IBMPlexMono_400Regular"],
        medium: ["IBMPlexMono_500Medium"],
      },
    },
  },
  plugins: [],
};
