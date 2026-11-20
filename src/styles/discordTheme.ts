/**
 * Discord & Kasatune Color Palette & Design Tokens
 * Harmonious blend of deep midnight charcoal Discord surfaces with the custom Kasatune Palette:
 * - Cream (#FFEAD3)
 * - Ice Blue (#BFE7EA)
 * - Warm Ochre (#E89B5B)
 * - Deep Rust (#D46743)
 */

export const KASATUNE_PALETTE = {
  // Custom Palette from user specification
  cream: '#FFEAD3',     // Stripe 1: Warm Peach Cream
  ice: '#BFE7EA',       // Stripe 2: Pastel Cyan / Ice Blue (Vibrant Accent)
  ochre: '#E89B5B',     // Stripe 3: Warm Terracotta / Amber Ochre
  rust: '#D46743',      // Stripe 4: Deep Rust / Burnt Sienna

  // Deep Obsidian Dark Surfaces (Darker, sleeker, zero washed-out grays)
  discordDarkest: '#0B0C0E',  // App base backdrop (deepest obsidian)
  discordPanel: '#141619',    // Main container & cards (dark graphite slate)
  discordElevated: '#1C1E22', // Elevated cards & header surfaces
  discordHover: '#24272D',    // Active selection & hover rows
  discordCard: '#111215',     // Sidebar deep background
  discordBorder: '#282B32',   // Refined hairline borders
  discordBlurple: '#5865F2',  // Discord brand accent
  discordGreen: '#23A55A',    // Discord online status green

  // Typography
  textPrimary: '#FFFFFF',     // Crisp pure white
  textSecondary: '#A0A5AD',   // Refined secondary gray
  textMuted: '#656A74',       // Subtle timestamps & inactive lyrics
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
