/**
 * Discord & Kasatune Color Palette & Design Tokens
 * Harmonious blend of Discord Dark Theme surfaces with the custom Kasatune 4-Color Palette:
 * - Cream (#FFEAD3)
 * - Ice Blue (#BFE7EA)
 * - Warm Ochre (#E89B5B)
 * - Deep Rust (#D46743)
 */

export const KASATUNE_PALETTE = {
  // Custom Palette from user specification
  cream: '#FFEAD3',     // Stripe 1: Warm Peach Cream (Lyrics active highlight & Drop shadows)
  ice: '#BFE7EA',       // Stripe 2: Pastel Cyan / Ice Blue (Active indicators, hover scrubber, accents)
  ochre: '#E89B5B',     // Stripe 3: Warm Terracotta / Amber Ochre (Buttons, prominent badges)
  rust: '#D46743',      // Stripe 4: Deep Rust / Burnt Sienna (Ambient header gradient & warm shadows)

  // Discord Official Dark Mode Surfaces
  discordDarkest: '#1E1F22',  // App base backdrop
  discordPanel: '#2B2D31',    // Main container & cards
  discordElevated: '#313338', // Elevated cards & hover items
  discordHover: '#35373C',    // Active selection & hover rows
  discordCard: '#232428',     // Sidebar deep background
  discordBorder: '#383A40',   // Subtle divider lines
  discordBlurple: '#5865F2',  // Discord brand accent
  discordGreen: '#23A55A',    // Discord online status green

  // Typography
  textPrimary: '#F2F3F5',     // Crisp white
  textSecondary: '#949BA4',   // Discord muted gray
  textMuted: '#6D737F',       // Inactive subtitles & timestamps
} as const;

export const DISCORD_THEME = {
  base: KASATUNE_PALETTE.discordDarkest,
  card: KASATUNE_PALETTE.discordPanel,
  elevated: KASATUNE_PALETTE.discordElevated,
  blurple: KASATUNE_PALETTE.discordBlurple,
  blurpleHover: '#4752C4',
  green: KASATUNE_PALETTE.discordGreen,
  red: '#ED4245',
  yellow: '#FEE75C',
  textPrimary: KASATUNE_PALETTE.textPrimary,
  textSecondary: KASATUNE_PALETTE.textSecondary,
  textMuted: KASATUNE_PALETTE.textMuted,
  border: KASATUNE_PALETTE.discordBorder,
} as const;

/**
 * Helper to convert hex to RGB values
 */
export function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

/**
 * Generate CSS rgba string from RGB tuple and alpha
 */
export function rgba(rgb: [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}
