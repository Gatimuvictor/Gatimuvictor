// Shared design tokens for every SVG on the profile.
// Edit colours here, then run: node scripts/build-static.mjs && node scripts/generate-cards.mjs

export const FONT_SANS =
  "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Ubuntu, 'Noto Sans', Arial, sans-serif";
export const FONT_MONO =
  "ui-monospace, SFMono-Regular, 'Cascadia Code', Consolas, 'Liberation Mono', Menlo, monospace";

export const THEMES = {
  dark: {
    name: 'dark',
    bg: '#0d1117',
    bgDeep: '#090c13',
    card: '#111824',
    cardEdge: '#1f2a3a',
    grid: '#1c2533',
    text: '#e6edf3',
    muted: '#8b949e',
    faint: '#4b5563',
    blue: '#58a6ff',
    violet: '#a371f7',
    green: '#3fb950',
    coral: '#ff7b72',
    amber: '#e3b341',
    codeBg: '#0b111b',
    codeString: '#a5d6ff',
    codeKey: '#ff7b72',
    codeVar: '#d2a8ff',
    codePunct: '#8b949e',
  },
  light: {
    name: 'light',
    bg: '#ffffff',
    bgDeep: '#f6f8fa',
    card: '#ffffff',
    cardEdge: '#d0d7de',
    grid: '#e6eaef',
    text: '#1f2328',
    muted: '#59636e',
    faint: '#aab3bd',
    blue: '#0969da',
    violet: '#8250df',
    green: '#1a7f37',
    coral: '#cf222e',
    amber: '#9a6700',
    codeBg: '#f6f8fa',
    codeString: '#0a3069',
    codeKey: '#cf222e',
    codeVar: '#8250df',
    codePunct: '#59636e',
  },
};

export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Rough text width for layout. SVGs rendered through <img> cannot measure text,
// so chips and legends are sized from an average glyph width.
export function textWidth(text, size, { mono = false, bold = false } = {}) {
  const factor = mono ? 0.6 : bold ? 0.58 : 0.53;
  return String(text).length * size * factor;
}

export function svgOpen(width, height, title, extraStyle = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>
  .sans { font-family: ${FONT_SANS}; }
  .mono { font-family: ${FONT_MONO}; }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  ${extraStyle}
</style>`;
}
