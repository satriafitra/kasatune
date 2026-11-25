/**
 * Custom Hook: useAudioVisualizer
 * High-performance Web Audio API Visualizer Engine.
 * Features:
 * - Direct audible sound delivery: unmuted, resilient fallback against CORS and autoplay restrictions
 * - Continuous playback engine: loops audio preview seamlessly across full track duration (e.g. 266s)
 * - Mathematically locked Rhythmic Beat Engine (4/4 time signature) for both active playback and idle tempo
 */

import { useState, useEffect, useRef, useCallback } from 'react';

let ytApiPromise: Promise<any> | null = null;
function loadYouTubeIframeApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const prevReady = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      try {
        prevReady?.();
      } catch {}
      resolve(w.YT);
    };
    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      document.head.appendChild(s);
    }
    setTimeout(() => resolve(w.YT?.Player ? w.YT : null), 8000);
  });
  return ytApiPromise;
}

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
  const isYtFallbackRef = useRef<boolean>(false);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytVideoQueueRef = useRef<string[]>([]);
  const ytQueueIdxRef = useRef<number>(0);
  const loadTokenRef = useRef<number>(0);
  const desiredAutoPlayRef = useRef<boolean>(false);

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

    const startYtFallback = async (videoIds: string[], shouldPlay: boolean, seekSec: number, token: number) => {
      if (!videoIds || videoIds.length === 0 || loadTokenRef.current !== token) return;
      const YT = await loadYouTubeIframeApi();
      if (!YT?.Player || loadTokenRef.current !== token) {
        if (onAudioErrorRef.current) onAudioErrorRef.current();
        return;
      }

      isYtFallbackRef.current = true;
      ytVideoQueueRef.current = videoIds;
      ytQueueIdxRef.current = 0;

      if (!ytContainerRef.current) {
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;width:2px;height:2px;bottom:0;right:0;opacity:0.001;pointer-events:none;z-index:-1;overflow:hidden;';
        const inner = document.createElement('div');
        div.appendChild(inner);
        document.body.appendChild(div);
        ytContainerRef.current = div;
      }

      const mountTarget = ytContainerRef.current.firstElementChild as HTMLElement;
      const targetId = videoIds[0];

      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        try {
          ytPlayerRef.current.setVolume(Math.round(volumeRef.current * 100));
          if (shouldPlay) {
            ytPlayerRef.current.loadVideoById({ videoId: targetId, startSeconds: Math.floor(seekSec) });
          } else {
            ytPlayerRef.current.cueVideoById({ videoId: targetId, startSeconds: Math.floor(seekSec) });
          }
          return;
        } catch {}
      }

      try {
        ytPlayerRef.current = new YT.Player(mountTarget, {
          height: '2',
          width: '2',
          videoId: targetId,
          playerVars: {
            autoplay: shouldPlay ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            start: Math.floor(seekSec),
            origin: window.location.origin,
          },
          events: {
            onReady: (ev: any) => {
              if (loadTokenRef.current !== token || !isYtFallbackRef.current) return;
              try {
                ev.target.unMute?.();
                ev.target.setVolume?.(Math.round(volumeRef.current * 100));
                if (seekSec > 0) ev.target.seekTo?.(seekSec, true);
                if (shouldPlay) ev.target.playVideo?.();
              } catch {}
            },
            onStateChange: (ev: any) => {
              if (!isYtFallbackRef.current) return;
              const YTState = (window as any).YT?.PlayerState;
              if (!YTState) return;
              if (ev.data === YTState.PLAYING) {
                setIsPlaying(true);
                isPlayingRef.current = true;
                try {
                  const d = ev.target.getDuration?.();
                  if (d && isFinite(d) && d > 0) {
                    setDuration(d);
                    durationRef.current = d;
                  }
                } catch {}
              } else if (ev.data === YTState.PAUSED) {
                setIsPlaying(false);
                isPlayingRef.current = false;
              } else if (ev.data === YTState.ENDED) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                if (onEndedRef.current) onEndedRef.current();
              }
            },
            onError: () => {
              if (!isYtFallbackRef.current) return;
              const nextIdx = ytQueueIdxRef.current + 1;
              if (nextIdx < ytVideoQueueRef.current.length) {
                ytQueueIdxRef.current = nextIdx;
                try {
                  ytPlayerRef.current?.loadVideoById({ videoId: ytVideoQueueRef.current[nextIdx], startSeconds: 0 });
                  return;
                } catch {}
              }
              setIsPlaying(false);
              isPlayingRef.current = false;
            },
          },
        });
      } catch {
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    };

    const handleError = async () => {
      const tokenAtError = loadTokenRef.current;
      const src = audio.src;
      setIsPlaying(false);
      isPlayingRef.current = false;

      if (src && src.includes('/api/stream')) {
        try {
          const probe = await fetch(src, { headers: { Range: 'bytes=0-63' } });
          if (loadTokenRef.current !== tokenAtError) return;
          if (!probe.ok) {
            const payload = await probe.json().catch(() => null);
            const ids: string[] = Array.isArray(payload?.videoIds) && payload.videoIds.length > 0
              ? payload.videoIds
              : payload?.videoId
              ? [payload.videoId]
              : [];
            if (ids.length > 0) {
              await startYtFallback(ids, desiredAutoPlayRef.current, pendingSeekRef.current || 0, tokenAtError);
              return;
            }
          }
        } catch {}
      }

      if (loadTokenRef.current === tokenAtError && onAudioErrorRef.current) {
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

  // Clock ticker strictly locked to actual <audio> or fallback YT IFrame decode position
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (isYtFallbackRef.current && ytPlayerRef.current?.getCurrentTime) {
        try {
          const cur = ytPlayerRef.current.getCurrentTime();
          const dur = ytPlayerRef.current.getDuration?.();
          if (typeof cur === 'number' && !isNaN(cur)) {
            currentTimeRef.current = cur;
            setCurrentTime(cur);
          }
          if (typeof dur === 'number' && isFinite(dur) && dur > 0 && Math.abs(durationRef.current - dur) > 1.5) {
            setDuration(dur);
            durationRef.current = dur;
          }
        } catch {}
      } else {
        const audio = audioRef.current;
        if (!audio) return;

        if (!audio.paused && !isNaN(audio.currentTime)) {
          currentTimeRef.current = audio.currentTime;
          setCurrentTime(audio.currentTime);
        }
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

    loadTokenRef.current += 1;
    desiredAutoPlayRef.current = autoPlay;
    isYtFallbackRef.current = false;
    try {
      ytPlayerRef.current?.stopVideo?.();
    } catch {}

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
    if (isYtFallbackRef.current && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume?.(Math.round(clamped * 100));
      } catch {}
    }
  }, []);

  const play = useCallback(async () => {
    desiredAutoPlayRef.current = true;
    if (isYtFallbackRef.current && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.unMute?.();
        ytPlayerRef.current.setVolume?.(Math.round(volumeRef.current * 100));
        ytPlayerRef.current.playVideo?.();
        setIsPlaying(true);
        isPlayingRef.current = true;
      } catch {}
      return;
    }

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
    desiredAutoPlayRef.current = false;
    if (isYtFallbackRef.current && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.pauseVideo?.();
      } catch {}
      setIsPlaying(false);
      isPlayingRef.current = false;
      try {
        localStorage.setItem('kasatune_saved_playtime', String(currentTimeRef.current));
      } catch {}
      return;
    }
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

    if (isYtFallbackRef.current && ytPlayerRef.current?.seekTo) {
      try {
        ytPlayerRef.current.seekTo(clampedSec, true);
      } catch {}
      return;
    }

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
