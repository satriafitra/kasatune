/**
 * VisualizerCanvas Component (Spotify Desktop Canvas Mode)
 * Interactive 60 FPS Canvas rendering audio reactive spectrums,
 * mathematically synchronized with the song's BPM tempo and beat phase.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Waves, Disc3, BarChart2 } from 'lucide-react';
import type { VisualizerData } from '../hooks/useAudioVisualizer';
import type { AlbumColors } from '../hooks/useAlbumColor';

interface VisualizerCanvasProps {
  visualizerData: VisualizerData;
  albumColors: AlbumColors;
  isPlaying: boolean;
  bpm: number;
}

type VisualizerMode = 'waves' | 'orb' | 'bars';

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  visualizerData,
  albumColors,
  isPlaying,
  bpm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('waves');

  const smoothBassRef = useRef(0);
  const smoothMidRef = useRef(0);
  const smoothTrebleRef = useRef(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      smoothBassRef.current += (visualizerData.bass - smoothBassRef.current) * 0.25;
      smoothMidRef.current += (visualizerData.mid - smoothMidRef.current) * 0.2;
      smoothTrebleRef.current += (visualizerData.treble - smoothTrebleRef.current) * 0.2;

      const bass = smoothBassRef.current;
      const mid = smoothMidRef.current;
      const beatPulse = visualizerData.beatPulse;

      const dom = albumColors.dominantColor;
      const pal = albumColors.palette;
      const c1 = pal[0] || dom;
      const c2 = pal[1] || [29, 185, 84]; // Spotify green fallback

      const tempoSpeed = (bpm / 92) * 0.04;
      phaseRef.current += isPlaying ? tempoSpeed : 0.008;
      const phase = phaseRef.current;

      if (mode === 'waves') {
        const waveCount = 3;
        const cy = height * 0.62;

        for (let w = 0; w < waveCount; w++) {
          const wNorm = w / waveCount;
          const amplitude = (26 + bass * 75 + beatPulse * 30 + mid * 25) * (1 - wNorm * 0.25);
          const freq = 0.013 + w * 0.005;

          const color = pal[w % pal.length] || dom;
          const alpha = 0.32 + (1 - wNorm) * 0.45;

          ctx.beginPath();
          ctx.moveTo(0, height);

          for (let x = 0; x <= width; x += 3) {
            const binIndex = Math.min(127, Math.floor((x / width) * 64));
            const binVal = (visualizerData.frequencyData[binIndex] || 0) / 255;

            const yWave =
              Math.sin(x * freq + phase * (1 + w * 0.4)) * amplitude +
              Math.cos(x * freq * 0.5 - phase * 0.7) * (amplitude * 0.35) +
              (binVal * 40 * (1 - wNorm));

            const y = cy + yWave + (w * 14 - 14);
            ctx.lineTo(x, y);
          }

          ctx.lineTo(width, height);
          ctx.closePath();

          const grad = ctx.createLinearGradient(0, cy - amplitude, 0, height);
          grad.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`);
          grad.addColorStop(1, `rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, 0.02)`);

          ctx.fillStyle = grad;
          ctx.fill();

          ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha + 0.35})`;
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
      } else if (mode === 'orb') {
        const cx = width / 2;
        const cy = height / 2;
        const baseRadius = Math.min(width, height) * 0.18;
        const activeRadius = baseRadius + bass * 40 + beatPulse * 35;

        for (let r = 1; r <= 3; r++) {
          const rippleRadius = activeRadius + r * (24 + beatPulse * 28) + ((phase * 18 * r) % 45);
          const rippleAlpha = Math.max(0, 0.4 - r * 0.12 - (rippleRadius / (width * 0.55)));

          ctx.beginPath();
          ctx.arc(cx, cy, rippleRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${c2[0]}, ${c2[1]}, ${c2[2]}, ${rippleAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, activeRadius);
        orbGrad.addColorStop(0, '#FFFFFF');
        orbGrad.addColorStop(0.3, `rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, 0.9)`);
        orbGrad.addColorStop(0.75, `rgba(${c2[0]}, ${c2[1]}, ${c2[2]}, 0.4)`);
        orbGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(cx, cy, activeRadius, 0, Math.PI * 2);
        ctx.fillStyle = orbGrad;
        ctx.fill();
      } else if (mode === 'bars') {
        const barCount = 48;
        const gap = 3;
        const barWidth = Math.max(2, (width - barCount * gap) / barCount);
        const cy = height * 0.8;

        for (let i = 0; i < barCount; i++) {
          const binIndex = Math.floor((i / barCount) * 75);
          const rawVal = (visualizerData.frequencyData[binIndex] || 0) / 255;
          const beatContribution = (1 - (i / barCount)) * beatPulse * 25;
          const barHeight = Math.max(4, rawVal * (height * 0.55) + bass * 15 + beatContribution);

          const x = i * (barWidth + gap) + gap;
          const y = cy - barHeight;
          const col = pal[i % pal.length] || dom;

          const barGrad = ctx.createLinearGradient(0, y, 0, cy);
          barGrad.addColorStop(0, `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.95)`);
          barGrad.addColorStop(1, `rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, 0.2)`);

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [visualizerData, albumColors, isPlaying, bpm, mode]);

  return (
    <div className="relative w-full h-[220px] rounded-lg overflow-hidden bg-[#181818] select-none">
      {/* Mode Switcher */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-full">
        <button
          onClick={() => setMode('waves')}
          className={`p-1.5 rounded-full transition-all ${
            mode === 'waves'
              ? 'bg-[#1DB954] text-black shadow-sm'
              : 'text-[#B3B3B3] hover:text-white'
          }`}
          title="Waveform"
        >
          <Waves className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setMode('orb')}
          className={`p-1.5 rounded-full transition-all ${
            mode === 'orb'
              ? 'bg-[#1DB954] text-black shadow-sm'
              : 'text-[#B3B3B3] hover:text-white'
          }`}
          title="Beat Orb"
        >
          <Disc3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setMode('bars')}
          className={`p-1.5 rounded-full transition-all ${
            mode === 'bars'
              ? 'bg-[#1DB954] text-black shadow-sm'
              : 'text-[#B3B3B3] hover:text-white'
          }`}
          title="Spectrum Bars"
        >
          <BarChart2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
