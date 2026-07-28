/**
 * CommonJS copy of the raw brand colours so that non-ESM tooling — chiefly the
 * app's `tailwind.config.js` — can consume the same values the ESM theme uses.
 * `theme/index.js` imports from here, so this file is the single source.
 *
 * The system is intentionally restrained: a soft paper background, near-black
 * ink for text, hairline borders, and a SINGLE warm accent used sparingly.
 * The heritage hues are kept for the rare moment that earns colour.
 */
const palette = {
  // Neutrals — the backbone of the minimalist system.
  paper: "#FAF8F4", // app background
  surface: "#FFFFFF", // cards / sheets
  ink: "#1C1917", // primary text (warm near-black)
  "ink-soft": "#78716C", // secondary text
  line: "#EBE6DE", // hairline borders

  // Single accent + a couple of restrained supporting hues.
  accent: "#E4572E", // warm terracotta-orange (used sparingly)
  "accent-soft": "#FBEAE2", // accent tint for chips/fills
  sage: "#7C8A5A",
  "deep-teal": "#1A535C",
  gold: "#C98A2B",

  // Retained heritage names (rarely used now, kept for continuity).
  "earth-dark": "#1C1917",
  "earth-brown": "#5C3D2E",
  terracotta: "#B85C38",
  ochre: "#D4A574",
  cream: "#FAF8F4",
  "burnt-orange": "#E4572E",
  "vibrant-red": "#E63946",
  "pattern-purple": "#9D4EDD",
};

const semantic = {
  background: palette.paper,
  surface: palette.surface,
  text: palette.ink,
  muted: palette["ink-soft"],
  primary: palette.ink, // primary actions are calm near-black
  accent: palette.accent, // reserved for the key CTA / active state
  onPrimary: "#FFFFFF",
  border: palette.line,
  canvasDark: palette.ink,
  onCanvasDark: palette.paper,
  success: palette.sage,
  danger: palette["vibrant-red"],
};

module.exports = { palette, semantic };
