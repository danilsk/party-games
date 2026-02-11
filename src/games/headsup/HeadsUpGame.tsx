import { useState, useEffect, useRef, useCallback } from 'react';
import { useWakeLock } from '../../lib/useWakeLock';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { fetchHeadsUpWords, type HeadsUpSettings } from './api';

const QUEUE_THRESHOLD = 5;
const INITIAL_FETCH = 20;
const TILT_COOLDOWN_MS = 1500;
const Z_DELTA_THRESHOLD = 4; // m/s² change needed to trigger (~25° deliberate tilt)
const Z_WINDOW_MS = 500; // detect change within this time window

type Phase = 'loading' | 'waiting' | 'countdown' | 'playing' | 'results';

interface WordResult {
  word: string;
  passed: boolean;
}

// --- Audio helpers using Web Audio API ---

function getAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  endFreq?: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (endFreq) {
    osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
  }
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playPassSound(ctx: AudioContext) {
  playTone(ctx, 200, 0.3, 'square');
}

function playFailSound(ctx: AudioContext) {
  playTone(ctx, 400, 0.4, 'sawtooth', 200);
}

function playCorrectBeep(ctx: AudioContext) {
  playTone(ctx, 800, 0.15, 'sine');
}

function playCountdownTick(ctx: AudioContext) {
  playTone(ctx, 600, 0.1, 'sine');
}

function playTimerEnd(ctx: AudioContext) {
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.2 + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.2);
    osc.stop(ctx.currentTime + i * 0.2 + 0.15);
  }
}

// Shared tilt detection logic: reads z-acceleration samples over a sliding window
// and returns the delta if it exceeds threshold, or null otherwise.
function detectTilt(
  samples: { t: number; z: number }[],
  z: number,
  now: number,
): number | null {
  samples.push({ t: now, z });
  while (samples.length > 0 && now - samples[0].t > Z_WINDOW_MS) {
    samples.shift();
  }
  if (samples.length < 2) return null;
  const delta = z - samples[0].z;
  if (Math.abs(delta) >= Z_DELTA_THRESHOLD) return delta;
  return null;
}

export function HeadsUpGame({
  settings,
  onEnd,
}: {
  settings: Record<string, unknown>;
  onEnd: () => void;
}) {
  const s = settings as unknown as HeadsUpSettings;
  const [phase, setPhase] = useState<Phase>('loading');
  const [queue, setQueue] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(s.timerSeconds);
  const [results, setResults] = useState<WordResult[]>([]);
  const [error, setError] = useState('');

  const fetchingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTiltTimeRef = useRef(0);
  const zSamplesRef = useRef<{ t: number; z: number }[]>([]);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const queueRef = useRef(queue);
  queueRef.current = queue;

  useWakeLock();

  // Initialize audio context on first user interaction
  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = getAudioContext();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Fetch words
  const fetchMore = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const words = await fetchHeadsUpWords(s, INITIAL_FETCH);
      setQueue((prev) => [...prev, ...words]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch words');
    } finally {
      fetchingRef.current = false;
    }
  }, [s]);

  // Initial fetch
  useEffect(() => {
    fetchMore().then(() => setPhase('waiting'));
  }, []);

  // Refetch when queue is low
  useEffect(() => {
    if (queue.length > 0 && queue.length <= QUEUE_THRESHOLD && phase === 'playing') {
      fetchMore();
    }
  }, [queue.length, phase]);

  // Show next word from queue
  const showNextWord = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [next, ...rest] = prev;
      setCurrentWord(next);
      return rest;
    });
    const ctx = audioCtxRef.current;
    if (ctx) playCorrectBeep(ctx);
  }, []);

  // Handle tilt answer
  const handleAnswer = useCallback(
    (passed: boolean) => {
      const now = Date.now();
      if (now - lastTiltTimeRef.current < TILT_COOLDOWN_MS) return;
      lastTiltTimeRef.current = now;

      const ctx = audioCtxRef.current;
      if (ctx) {
        if (passed) playPassSound(ctx);
        else playFailSound(ctx);
      }

      setResults((prev) => [...prev, { word: currentWord, passed }]);
      showNextWord();
    },
    [currentWord, showNextWord],
  );

  // Auto-request motion permission when entering waiting phase
  useEffect(() => {
    if (phase !== 'waiting') return;
    const DME = DeviceMotionEvent as any;
    if (typeof DME.requestPermission === 'function') {
      DME.requestPermission().catch(() => {});
    }
    ensureAudio();
  }, [phase, ensureAudio]);

  // Wait for forward tilt to start the game
  useEffect(() => {
    if (phase !== 'waiting') return;
    zSamplesRef.current = [];

    const handler = (e: DeviceMotionEvent) => {
      if (phaseRef.current !== 'waiting') return;
      const z = e.accelerationIncludingGravity?.z;
      if (z == null) return;

      const delta = detectTilt(zSamplesRef.current, z, Date.now());
      if (delta !== null && delta < 0) {
        zSamplesRef.current = [];
        setPhase('countdown');
        setCountdown(3);
      }
    };

    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [phase]);

  // Device motion listener — gesture-based tilt detection during play
  useEffect(() => {
    if (phase !== 'playing') return;
    zSamplesRef.current = [];

    const handler = (e: DeviceMotionEvent) => {
      if (phaseRef.current !== 'playing') return;
      const z = e.accelerationIncludingGravity?.z;
      if (z == null) return;

      const delta = detectTilt(zSamplesRef.current, z, Date.now());
      if (delta === null) return;

      if (delta < 0) {
        handleAnswer(true);
        zSamplesRef.current = [];
      } else {
        handleAnswer(false);
        zSamplesRef.current = [];
      }
    };

    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [phase, handleAnswer]);

  // Countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return;

    const ctx = audioCtxRef.current;
    if (ctx) playCountdownTick(ctx);

    if (countdown <= 0) {
      setPhase('playing');
      showNextWord();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => {
        const next = c - 1;
        if (next > 0 && ctx) playCountdownTick(ctx);
        return next;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdown, showNextWord]);

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') return;

    if (timeLeft <= 0) {
      const ctx = audioCtxRef.current;
      if (ctx) playTimerEnd(ctx);
      setPhase('results');
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  // --- Render phases ---

  if (error && queue.length === 0 && phase === 'loading') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-red-400 text-center">{error}</p>
        <button onClick={onEnd} className="px-6 py-2 bg-white/10 rounded-lg">
          Back
        </button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <LoadingSpinner text="Generating words..." />
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 gap-8 bg-linear-to-b from-purple-900/50 to-black">
        <div className="text-center space-y-4">
          <div className="text-6xl">📱</div>
          <h2 className="text-2xl font-bold">Place phone on forehead</h2>
          <p className="text-gray-400 max-w-xs">
            Tilt <span className="text-green-400 font-semibold">forward</span> to pass,{' '}
            tilt <span className="text-red-400 font-semibold">backward</span> if wrong
          </p>
          <p className="text-purple-400 text-lg mt-4 animate-pulse">Tilt forward to start</p>
        </div>
        {error && <p className="text-yellow-400 text-sm text-center">{error}</p>}
        <button
          onClick={onEnd}
          className="px-4 py-2 text-gray-500 hover:text-gray-300 text-sm"
        >
          ← Back
        </button>
      </div>
    );
  }

  if (phase === 'countdown') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-linear-to-b from-purple-900/50 to-black">
        <span className="text-9xl font-bold animate-pulse">{countdown || 'GO!'}</span>
      </div>
    );
  }

  if (phase === 'results') {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    return (
      <div className="min-h-dvh flex flex-col p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Results</h2>

        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400">{passed}</div>
            <div className="text-sm text-gray-400">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-400">{failed}</div>
            <div className="text-sm text-gray-400">Failed</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-6">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-2 rounded-lg ${
                r.passed ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'
              }`}
            >
              <span>{r.word}</span>
              <span>{r.passed ? '✓' : '✗'}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              setResults([]);
              setTimeLeft(s.timerSeconds);
              setPhase('waiting');
              setError('');
            }}
            className="w-full py-3 bg-linear-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Play Again
          </button>
          <button
            onClick={onEnd}
            className="w-full py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Playing phase - large display for forehead viewing
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-linear-to-b from-blue-900/30 to-black select-none">
      <div className="absolute top-6 right-6 font-mono text-2xl font-bold tabular-nums text-white/80">
        {timeLeft}
      </div>

      <div className="text-center px-8">
        <span className="text-5xl sm:text-7xl font-bold wrap-break-word leading-tight">
          {currentWord}
        </span>
      </div>

      <button
        onClick={() => setPhase('results')}
        className="absolute top-6 left-6 px-3 py-1.5 bg-white/10 rounded-lg text-sm text-gray-400 hover:bg-white/20"
      >
        ✕ End
      </button>

      <div className="absolute bottom-8 flex gap-6 text-sm text-gray-500">
        <span className="text-green-500/60">↓ Forward = Pass</span>
        <span className="text-red-500/60">↑ Back = Wrong</span>
      </div>
    </div>
  );
}
