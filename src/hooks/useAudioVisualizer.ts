/**
 * Custom Hook: useAudioVisualizer
 * High-performance Web Audio API Visualizer Engine.
 * Features:
 * - Direct audible sound delivery: unmuted, resilient fallback against CORS and autoplay restrictions
 * - Continuous playback engine: loops audio preview seamlessly across full track duration (e.g. 266s)
 * - Mathematically locked Rhythmic Beat Engine (4/4 time signature) for both active playback and idle tempo
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface VisualizerData {
  frequencyData: Uint8Array;
  bass: number;        // 0..1 (Sub-bass & Kick)
  mid: number;         // 0..1 (Vocals & Snare)
  treble: number;      // 0..1 (Hi-hats & Shimmer)
  beatPulse: number;   // 0..1 (Kick impulse locked to BPM)
  snarePulse: number;  // 0..1 (Snare accent on beats 2 & 4)
  beatPhase: number;   // 0..1 (Linear progress within the quarter-note beat)
  barPhase: number;    // 0..1 (Linear progress across the 4-beat measure)
  bpm: number;
}

export interface AudioVisualizerControls {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentTime: number;      // in seconds
  duration: number;         // in seconds
  progressRatio: number;    // 0..1
  volume: number;
  setVolume: (v: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  seekToSeconds: (seconds: number) => void;
  loadTrack: (url: string, bpm: number, durationSec: number, autoPlay?: boolean) => void;
  visualizerData: VisualizerData;
}

interface UseAudioVisualizerOptions {
  onEnded?: () => void;
  defaultDurationSec?: number;
}

export function useAudioVisualizer(
  initialUrl: string | null | undefined,
  initialBpm: number = 128,
  initialDurationSec: number = 266,
  options?: UseAudioVisualizerOptions
): AudioVisualizerControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(initialDurationSec);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [currentBpm, setCurrentBpm] = useState<number>(initialBpm);

  const durationRef = useRef<number>(initialDurationSec);
  const currentTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  const onEndedRef = useRef(options?.onEnded);
  useEffect(() => {
    onEndedRef.current = options?.onEnded;
  }, [options?.onEnded]);

  const [visualizerData, setVisualizerData] = useState<VisualizerData>({
    frequencyData: new Uint8Array(128),
    bass: 0,
    mid: 0,
    treble: 0,
    beatPulse: 0,
    snarePulse: 0,
    beatPhase: 0,
    barPhase: 0,
    bpm: initialBpm,
  });

  // Setup Web Audio API Context and AnalyserNode
  const setupWebAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;

        try {
          const source = ctx.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(ctx.destination);
          sourceNodeRef.current = source;
        } catch {
          // Fallback if media element already bound
        }

        audioContextRef.current = ctx;
        analyserRef.current = analyser;
      }

      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    } catch {
      // Direct audio element fallback
    }
  }, []);

  // Unlock audio context on any user interaction
  useEffect(() => {
    const unlockAudio = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Initialize HTMLAudioElement
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleEnded = () => {
      // If full song duration hasn't been reached, loop audio seamlessly so it doesn't stop!
      if (currentTimeRef.current < durationRef.current - 1 && isPlayingRef.current) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setCurrentTime(0);
        currentTimeRef.current = 0;
        if (onEndedRef.current) {
          onEndedRef.current();
        }
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
    };

    const handlePlay = () => {
      setIsPlaying(true);
      isPlayingRef.current = true;
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    if (initialUrl) {
      audio.src = initialUrl;
      audio.load();
    }

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.pause();
      audio.src = '';
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // High-precision clock ticker (ticks every 50ms)
  useEffect(() => {
    if (!isPlaying) return;

    let lastTick = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const deltaSec = (now - lastTick) / 1000;
      lastTick = now;

      currentTimeRef.current = Math.min(
        durationRef.current,
        currentTimeRef.current + deltaSec
      );
      setCurrentTime(currentTimeRef.current);

      if (currentTimeRef.current >= durationRef.current) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        if (onEndedRef.current) onEndedRef.current();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Clean Track Switcher: Guarantees 100% synchronization on track skip
  const loadTrack = useCallback((url: string, newBpm: number, durationSec: number, autoPlay: boolean = true) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset clock
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setDuration(durationSec > 0 ? durationSec : 266);
    durationRef.current = durationSec > 0 ? durationSec : 266;
    setCurrentBpm(newBpm > 0 ? newBpm : 128);

    audio.pause();
    audio.currentTime = 0;
    audio.src = url;
    audio.load();

    setupWebAudio();

    if (autoPlay) {
      audio.play().then(() => {
        setIsPlaying(true);
        isPlayingRef.current = true;
      }).catch(() => {
        setIsPlaying(false);
        isPlayingRef.current = false;
      });
    } else {
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, [setupWebAudio]);

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    setupWebAudio();

    try {
      await audio.play();
      setIsPlaying(true);
      isPlayingRef.current = true;
    } catch {
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, [setupWebAudio]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, []);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  const seekToSeconds = useCallback((seconds: number) => {
    const audio = audioRef.current;
    const clampedSec = Math.max(0, Math.min(durationRef.current, seconds));
    currentTimeRef.current = clampedSec;
    setCurrentTime(clampedSec);

    if (audio && audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
      // Map to audio element duration cleanly
      audio.currentTime = clampedSec % audio.duration;
    }
  }, []);

  // 60 FPS Beat Engine & Spectrum Analyser Loop
  useEffect(() => {
    let animId: number;
    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);

    const renderLoop = (timestamp: number) => {
      const safeBpm = currentBpm > 0 ? currentBpm : 128;
      const beatIntervalSec = 60 / safeBpm;
      const beatIntervalMs = beatIntervalSec * 1000;
      const barIntervalMs = beatIntervalMs * 4;

      const audioTimeMs = isPlaying
        ? currentTimeRef.current * 1000
        : timestamp;

      const beatPhase = (audioTimeMs % beatIntervalMs) / beatIntervalMs;
      const barPhase = (audioTimeMs % barIntervalMs) / barIntervalMs;
      const beatNumber = Math.floor((audioTimeMs % barIntervalMs) / beatIntervalMs);

      const isKickBeat = beatNumber === 0 || beatNumber === 2;
      const kickWeight = beatNumber === 0 ? 1.0 : 0.85;
      const kickImpulse = isKickBeat
        ? Math.pow(Math.max(0, 1 - beatPhase * 1.6), 2.5) * kickWeight
        : Math.pow(Math.max(0, 1 - beatPhase * 2.0), 3.0) * 0.35;

      const isSnareBeat = beatNumber === 1 || beatNumber === 3;
      const snareImpulse = isSnareBeat
        ? Math.pow(Math.max(0, 1 - beatPhase * 1.8), 2.4) * 0.9
        : 0;

      let activeBass = 0;
      let activeMid = 0;
      let activeTreble = 0;

      if (isPlaying && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);

        let bassSum = 0;
        for (let i = 1; i <= 10; i++) bassSum += dataArray[i];
        activeBass = bassSum / (10 * 255);

        let midSum = 0;
        for (let i = 11; i <= 35; i++) midSum += dataArray[i];
        activeMid = midSum / (25 * 255);

        let trebleSum = 0;
        for (let i = 36; i <= 80; i++) trebleSum += dataArray[i];
        activeTreble = trebleSum / (45 * 255);

        activeBass = Math.min(1, activeBass * 0.8 + kickImpulse * 0.35);
        activeMid = Math.min(1, activeMid * 0.8 + snareImpulse * 0.25);
      } else {
        activeBass = kickImpulse * 0.8;
        activeMid = 0.2 + snareImpulse * 0.5;
        activeTreble = 0.15 + 0.15 * Math.cos(audioTimeMs * 0.006 * (safeBpm / 90));

        for (let i = 0; i < bufferLength; i++) {
          const freqNorm = i / bufferLength;
          const wave1 = Math.sin(audioTimeMs * 0.003 * (safeBpm / 90) + i * 0.16);
          const beatContribution = kickImpulse * Math.exp(-i * 0.07) * 180 + snareImpulse * Math.exp(-Math.abs(i - 20) * 0.1) * 120;
          const val = Math.max(0, wave1 * 35 + 40 + beatContribution) * (1 - freqNorm * 0.35);
          dataArray[i] = Math.min(255, Math.max(0, Math.round(val)));
        }
      }

      setVisualizerData({
        frequencyData: dataArray,
        bass: Math.min(1, activeBass),
        mid: Math.min(1, activeMid),
        treble: Math.min(1, activeTreble),
        beatPulse: Math.min(1, kickImpulse),
        snarePulse: Math.min(1, snareImpulse),
        beatPhase,
        barPhase,
        bpm: safeBpm,
      });

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentBpm]);

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    progressRatio,
    volume,
    setVolume,
    play,
    pause,
    togglePlay,
    seekToSeconds,
    loadTrack,
    visualizerData,
  };
}
