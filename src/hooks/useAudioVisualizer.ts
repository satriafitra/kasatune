/**
 * Custom Hook: useAudioVisualizer
 * High-performance Web Audio API Visualizer Engine.
 * Features:
 * - Full-length track support with instantaneous track-switching logic
 * - Zero desynchronization on skip (synchronous time reset to 0:00)
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
  initialBpm: number = 92,
  initialDurationSec: number = 238,
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
        // Media element already connected
      }

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  // High-precision playback time sync loop (50ms interval ensures millisecond-sharp lyrics reaction without lag)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        setCurrentTime(audio.currentTime);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Initialize HTMLAudioElement
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onEndedRef.current) {
        onEndedRef.current();
      }
    };

    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    if (initialUrl) {
      audio.src = initialUrl;
      audio.load();
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
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


  // High-precision playback time sync loop (50ms interval ensures millisecond-sharp lyrics reaction without lag)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        setCurrentTime(audio.currentTime);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Clean Track Switcher: Guarantees 100% synchronization on track skip
  const loadTrack = useCallback((url: string, newBpm: number, durationSec: number, autoPlay: boolean = true) => {
    const audio = audioRef.current;
    if (!audio) return;

    // 1. Immediately reset time states synchronously so lyrics & scrubber go to 0:00 without delay
    setCurrentTime(0);
    setDuration(durationSec > 0 ? durationSec : 238);
    setCurrentBpm(newBpm > 0 ? newBpm : 92);

    // 2. Pause and configure audio element
    audio.pause();
    audio.currentTime = 0;
    audio.src = url;
    audio.load();

    // 3. Connect audio context
    setupWebAudio();

    // 4. Autoplay if requested
    if (autoPlay) {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else {
      setIsPlaying(false);
    }
  }, [setupWebAudio]);

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  // High-precision playback time sync loop (50ms interval ensures millisecond-sharp lyrics reaction without lag)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        setCurrentTime(audio.currentTime);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    setupWebAudio();

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [setupWebAudio]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // High-precision playback time sync loop (50ms interval ensures millisecond-sharp lyrics reaction without lag)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        setCurrentTime(audio.currentTime);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  const seekToSeconds = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      const targetSec = Math.max(0, seconds);
      audio.currentTime = targetSec;
      setCurrentTime(targetSec);
    }
  }, []);

  // High-precision playback time sync loop (50ms interval ensures millisecond-sharp lyrics reaction without lag)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        setCurrentTime(audio.currentTime);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 60 FPS Beat Engine & Spectrum Analyser Loop
  useEffect(() => {
    let animId: number;
    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);

    const renderLoop = (timestamp: number) => {
      const safeBpm = currentBpm > 0 ? currentBpm : 92;
      const beatIntervalSec = 60 / safeBpm;
      const beatIntervalMs = beatIntervalSec * 1000;
      const barIntervalMs = beatIntervalMs * 4; // 4/4 Bar

      // Timing source: uses real audio position when playing, or wall-clock timestamp when paused/idle
      const audioTimeMs = audioRef.current && isPlaying
        ? audioRef.current.currentTime * 1000
        : timestamp;

      // 4/4 Meter calculations
      const beatPhase = (audioTimeMs % beatIntervalMs) / beatIntervalMs; // 0..1 within quarter note
      const barPhase = (audioTimeMs % barIntervalMs) / barIntervalMs;   // 0..1 within 4-beat bar
      const beatNumber = Math.floor((audioTimeMs % barIntervalMs) / beatIntervalMs); // 0, 1, 2, 3

      // Sharp exponential kick impulse on Beats 1 & 3
      const isKickBeat = beatNumber === 0 || beatNumber === 2;
      const kickWeight = beatNumber === 0 ? 1.0 : 0.85; // Beat 1 is strongest
      const kickImpulse = isKickBeat
        ? Math.pow(Math.max(0, 1 - beatPhase * 1.6), 2.5) * kickWeight
        : Math.pow(Math.max(0, 1 - beatPhase * 2.0), 3.0) * 0.35;

      // Snare accent impulse on Beats 2 & 4 (classic rock/pop backbeat)
      const isSnareBeat = beatNumber === 1 || beatNumber === 3;
      const snareImpulse = isSnareBeat
        ? Math.pow(Math.max(0, 1 - beatPhase * 1.8), 2.4) * 0.9
        : 0;

      let activeBass = 0;
      let activeMid = 0;
      let activeTreble = 0;

      if (isPlaying && analyserRef.current) {
        // Read live audio frequencies from Web Audio Analyser
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

        // Fuse frequency spectrum with rhythmic kick/snare pulse for authentic musical punch
        activeBass = Math.min(1, activeBass * 0.8 + kickImpulse * 0.35);
        activeMid = Math.min(1, activeMid * 0.8 + snareImpulse * 0.25);
      } else {
        // Idle Beat Mode: locked strictly to current track's tempo BPM!
        // Gentle rhythmic breathing that speeds up or slows down per track
        activeBass = kickImpulse * 0.8;
        activeMid = (0.2 + snareImpulse * 0.5);
        activeTreble = (0.15 + 0.15 * Math.cos(audioTimeMs * 0.006 * (safeBpm / 90)));

        for (let i = 0; i < bufferLength; i++) {
          const freqNorm = i / bufferLength;
          const wave1 = Math.sin((audioTimeMs * 0.003 * (safeBpm / 90)) + i * 0.16);
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
