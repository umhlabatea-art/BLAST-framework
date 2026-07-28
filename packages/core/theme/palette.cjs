/**
 * CommonJS copy of the raw brand colours so that non-ESM tooling — chiefly the
 * app's `tailwind.config.js` — can consume the same values the ESM theme uses.
 * `theme/index.js` imports from here, so this file is the single source.
 */
const palette = {
  "earth-dark": "#2C1810",
  "earth-brown": "#5C3D2E",
  terracotta: "#B85C38",
  ochre: "#D4A574",
  cream: "#F2E8CF",
  sage: "#8B9556",
  "deep-teal": "#1A535C",
  "burnt-orange": "#FF6B35",
  gold: "#FFB627",
  "vibrant-red": "#E63946",
  "pattern-purple": "#9D4EDD",
};

const semantic = {
  background: palette.cream,
  surface: "#FFFFFF",
  text: palette["earth-dark"],
  muted: palette["earth-brown"],
  primary: palette["burnt-orange"],
  accent: palette.gold,
  onPrimary: "#FFFFFF",
  border: palette.ochre,
  canvasDark: palette["earth-dark"],
  onCanvasDark: palette.cream,
  success: palette.sage,
  danger: palette["vibrant-red"],
};

module.exports = { palette, semantic };
