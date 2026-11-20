/**
 * Discord Dark Theme Color Palette & Design Tokens
 * Spec-accurate colors matching the official Discord Dark Mode UI
 */

export const DISCORD_THEME = {
  // Backgrounds & Surfaces
  base: '#1E1F22',      // Darkest main background
  card: '#2B2D31',      // Card / container surface
  elevated: '#313338',  // Elevated / hover / interactive surface

  // Brand Accents
  blurple: '#5865F2',        // Discord Blurple primary accent
  blurpleHover: '#4752C4',   // Blurple hover state
  green: '#57F287',          // Active/Online indicator
  red: '#ED4245',            // Error / Disconnect indicator
  yellow: '#FEE75C',         // Warning / Idle indicator

  // Typography
  textPrimary: '#F2F3F5',    // Pure white for song titles & active lyrics
  textSecondary: '#B5BAC1',  // Light grey for artist names & metadata
  textMuted: '#80848E',      // Muted grey for inactive lyrics & duration

  // Borders & Dividers
  border: '#3F4147',         // Subtle container border & divider
} as const;

export type DiscordThemeColor = keyof typeof DISCORD_THEME;

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
