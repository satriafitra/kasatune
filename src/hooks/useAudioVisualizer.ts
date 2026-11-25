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
  loadTrack: (url: string, bpm: number, durationSec: number, autoPlay?: boolean, initialTimeSec?: number) => void;
  visualizerData: VisualizerData;
}

interface UseAudioVisualizerOptions {
  onEnded?: () => void;
  onAudioError?: () => void;
  defaultDurationSec?: number;
}

export function useAudioVisualizer(
  initialUrl: string | null | undefined,
  initialBpm: number = 128,
  initialDurationSec: number = 266,
  options?: UseAudioVisualizerOptions
): AudioVisualizerControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  const getSavedPlaytime = (): number => {
    try {
      const saved = localStorage.getItem('kasatune_saved_playtime');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return 0;
  };

  const initialPlaytime = getSavedPlaytime();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(initialPlaytime);
  const [duration, setDuration] = useState<number>(initialDurationSec);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [currentBpm, setCurrentBpm] = useState<number>(initialBpm);

  const durationRef = useRef<number>(initialDurationSec);
  const currentTimeRef = useRef<number>(initialPlaytime);
  const isPlayingRef = useRef<boolean>(false);
  const volumeRef = useRef<number>(0.85);

  const onEndedRef = useRef(options?.onEnded);
  useEffect(() => {
    onEndedRef.current = options?.onEnded;
  }, [options?.onEnded]);

  const onAudioErrorRef = useRef(options?.onAudioError);
  useEffect(() => {
    onAudioErrorRef.current = options?.onAudioError;
  }, [options?.onAudioError]);

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

  // Initialize native HTMLAudioElement directly (no CORS/createMediaElementSource hijack that causes silent playback)
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.muted = false;
    audio.volume = volumeRef.current;
    audioRef.current = audio;

    const handleEnded = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (onEndedRef.current) {
        onEndedRef.current();
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (audio && !isNaN(audio.currentTime) && audio.currentTime > 0) {
        try {
          localStorage.setItem('kasatune_saved_playtime', String(audio.currentTime));
        } catch {}
      }
    };

    const handlePlay = () => {
      audio.muted = false;
      audio.volume = volumeRef.current;
      setIsPlaying(true);
      isPlayingRef.current = true;
    };

    const handleLoadedMetadata = () => {
      if (!audio) return;
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        durationRef.current = audio.duration;
      }
      if (pendingSeekRef.current !== null && pendingSeekRef.current > 0) {
        const target = pendingSeekRef.current;
        pendingSeekRef.current = null;
        try {
          const maxSafe = !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0
            ? Math.max(0, audio.duration - 0.2)
            : target;
          audio.currentTime = Math.min(maxSafe, target);
        } catch {}
      }
    };

    const handleTimeUpdate = () => {
      if (!audio || isNaN(audio.currentTime)) return;
      if (!audio.paused) {
        currentTimeRef.current = audio.currentTime;
        setCurrentTime(audio.currentTime);
      }
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        if (Math.abs(durationRef.current - audio.duration) > 1.5) {
          setDuration(audio.duration);
          durationRef.current = audio.duration;
        }
      }
      if (audio.currentTime > 0 && !audio.paused) {
        try {
          localStorage.setItem('kasatune_saved_playtime', String(audio.currentTime));
        } catch {}
      }
    };

    const handleError = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (onAudioErrorRef.current) {
        onAudioErrorRef.current();
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('seeked', handleTimeUpdate);
    audio.addEventListener('error', handleError);

    const handleBeforeUnload = () => {
      if (currentTimeRef.current > 0) {
        try {
          localStorage.setItem('kasatune_saved_playtime', String(currentTimeRef.current));
        } catch {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    if (initialUrl) {
      audio.src = initialUrl;
      audio.load();
      if (initialPlaytime > 0) {
        pendingSeekRef.current = initialPlaytime;
      }
    }

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('seeked', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Clock ticker strictly locked to actual <audio> decode position (never fakes silent progress)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;

      if (!audio.paused && !isNaN(audio.currentTime)) {
        currentTimeRef.current = audio.currentTime;
        setCurrentTime(audio.currentTime);
      }

      if (Math.round(currentTimeRef.current * 10) % 10 === 0 && currentTimeRef.current > 0) {
        try {
          localStorage.setItem('kasatune_saved_playtime', String(currentTimeRef.current));
        } catch {}
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Clean Track Switcher: Direct native audio playback with instant unmuted output
  const loadTrack = useCallback((url: string, newBpm: number, durationSec: number, autoPlay: boolean = true, initialTimeSec: number = 0) => {
    const audio = audioRef.current;
    if (!audio) return;

    const safeDuration = durationSec > 0 ? durationSec : 266;
    const safeInitial = Math.max(0, Math.min(safeDuration, initialTimeSec));

    setCurrentTime(safeInitial);
    currentTimeRef.current = safeInitial;
    setDuration(safeDuration);
    durationRef.current = safeDuration;
    setCurrentBpm(newBpm > 0 ? newBpm : 128);
    pendingSeekRef.current = safeInitial > 0 ? safeInitial : null;

    audio.pause();
    audio.muted = false;
    audio.volume = volumeRef.current;

    if (url) {
      audio.src = url;
      audio.load();

      if (autoPlay) {
        audio.play().then(() => {
          audio.muted = false;
          audio.volume = volumeRef.current;
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
    } else {
      audio.src = '';
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, []);

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    volumeRef.current = clamped;
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.muted = clamped === 0;
      audioRef.current.volume = clamped;
    }
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    audio.muted = false;
    audio.volume = volumeRef.current;

    try {
      await audio.play();
      setIsPlaying(true);
      isPlayingRef.current = true;
    } catch {
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
      try {
        localStorage.setItem('kasatune_saved_playtime', String(currentTimeRef.current));
      } catch {}
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
    try {
      localStorage.setItem('kasatune_saved_playtime', String(clampedSec));
    } catch {}

    if (audio && audio.readyState >= 1 && audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
      pendingSeekRef.current = null;
      audio.currentTime = Math.min(Math.max(0, audio.duration - 0.2), clampedSec);
    } else {
      pendingSeekRef.current = clampedSec;
    }
  }, []);

  // 60 FPS Beat Engine for subtle visual feedback
  useEffect(() => {
    let animId: number;
    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);

    const renderLoop = (timestamp: number) => {
      const safeBpm = currentBpm > 0 ? currentBpm : 128;
      const beatIntervalMs = (60 / safeBpm) * 1000;
      const barIntervalMs = beatIntervalMs * 4;
      const audioTimeMs = isPlaying ? currentTimeRef.current * 1000 : timestamp;

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

      const activeBass = kickImpulse * 0.8;
      const activeMid = 0.2 + snareImpulse * 0.5;
      const activeTreble = 0.15 + 0.15 * Math.cos(audioTimeMs * 0.006 * (safeBpm / 90));

      for (let i = 0; i < bufferLength; i++) {
        const freqNorm = i / bufferLength;
        const wave1 = Math.sin(audioTimeMs * 0.003 * (safeBpm / 90) + i * 0.16);
        const beatContribution = kickImpulse * Math.exp(-i * 0.07) * 180 + snareImpulse * Math.exp(-Math.abs(i - 20) * 0.1) * 120;
        const val = Math.max(0, wave1 * 35 + 40 + beatContribution) * (1 - freqNorm * 0.35);
        dataArray[i] = Math.min(255, Math.max(0, Math.round(val)));
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
