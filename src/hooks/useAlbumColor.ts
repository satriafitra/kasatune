/**
 * Custom Hook: useAlbumColor
 * Extracts dominant color and 5-color palette from album cover image using ColorThief.
 * Computes dynamic ambient background radial-gradients and glowing accent shadows.
 */

import { useState, useEffect } from 'react';
import { getColor, getPalette, type Color } from 'colorthief';
import { DISCORD_THEME, hexToRgb } from '../styles/discordTheme';

export interface AlbumColors {
  dominantColor: [number, number, number];
  palette: Array<[number, number, number]>;
  hexDominant: string;
  rgbDominantStr: string;
  ambientGradient: string;
  accentGlow: string;
  isLoading: boolean;
}

const DEFAULT_BLURPLE_RGB = hexToRgb(DISCORD_THEME.blurple);

const DEFAULT_COLORS: AlbumColors = {
  dominantColor: DEFAULT_BLURPLE_RGB,
  palette: [
    DEFAULT_BLURPLE_RGB,
    [71, 82, 196],
    [87, 242, 135],
    [254, 231, 92],
    [235, 69, 158],
  ],
  hexDominant: DISCORD_THEME.blurple,
  rgbDominantStr: `rgb(${DEFAULT_BLURPLE_RGB.join(', ')})`,
  ambientGradient: `radial-gradient(circle at 50% 30%, rgba(88, 101, 242, 0.22) 0%, rgba(30, 31, 34, 0.95) 70%, #1E1F22 100%)`,
  accentGlow: `0 20px 60px -15px rgba(88, 101, 242, 0.45)`,
  isLoading: false,
};

function formatRgbTuple(color: Color | [number, number, number]): [number, number, number] {
  if (Array.isArray(color)) {
    return [Math.round(color[0]), Math.round(color[1]), Math.round(color[2])];
  }
  if (typeof color.array === 'function') {
    return color.array();
  }
  const rgbObj = color.rgb();
  return [Math.round(rgbObj.r), Math.round(rgbObj.g), Math.round(rgbObj.b)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = Math.max(0, Math.min(255, x)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function useAlbumColor(imageUrl: string | null | undefined): AlbumColors {
  const [colors, setColors] = useState<AlbumColors>(DEFAULT_COLORS);

  useEffect(() => {
    if (!imageUrl) {
      setColors(DEFAULT_COLORS);
      return;
    }

    let isCancelled = false;
    setColors((prev) => ({ ...prev, isLoading: true }));

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.referrerPolicy = 'no-referrer';

    const handleSuccess = async () => {
      if (isCancelled) return;

      try {
        const domColorResult = await getColor(img);
        const paletteResult = await getPalette(img, { colorCount: 5 });

        if (isCancelled) return;

        const dominantRgb: [number, number, number] = domColorResult
          ? formatRgbTuple(domColorResult)
          : DEFAULT_BLURPLE_RGB;

        const extractedPalette: Array<[number, number, number]> =
          paletteResult && paletteResult.length > 0
            ? paletteResult.map((c) => formatRgbTuple(c))
            : [dominantRgb, ...DEFAULT_COLORS.palette.slice(1)];

        const hex = rgbToHex(dominantRgb[0], dominantRgb[1], dominantRgb[2]);
        const rgbStr = `rgb(${dominantRgb[0]}, ${dominantRgb[1]}, ${dominantRgb[2]})`;
        const ambientGrad = `radial-gradient(circle at 45% 25%, rgba(${dominantRgb[0]}, ${dominantRgb[1]}, ${dominantRgb[2]}, 0.28) 0%, rgba(30, 31, 34, 0.94) 65%, #1E1F22 100%)`;
        const glow = `0 24px 70px -10px rgba(${dominantRgb[0]}, ${dominantRgb[1]}, ${dominantRgb[2]}, 0.5)`;

        setColors({
          dominantColor: dominantRgb,
          palette: extractedPalette,
          hexDominant: hex,
          rgbDominantStr: rgbStr,
          ambientGradient: ambientGrad,
          accentGlow: glow,
          isLoading: false,
        });
      } catch {
        // In case canvas is tainted or colorthief error, fallback gracefully
        if (!isCancelled) {
          setColors({
            ...DEFAULT_COLORS,
            isLoading: false,
          });
        }
      }
    };

    const handleError = () => {
      if (isCancelled) return;
      setColors({
        ...DEFAULT_COLORS,
        isLoading: false,
      });
    };

    img.onload = handleSuccess;
    img.onerror = handleError;
    img.src = imageUrl;

    return () => {
      isCancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  return colors;
}
