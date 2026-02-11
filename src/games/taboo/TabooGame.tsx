import { useState, useEffect, useRef, useCallback } from 'react';
import { useWakeLock } from '../../lib/useWakeLock';
import { useWordHistory } from '../../lib/useWordHistory';
import { Timer } from '../../components/Timer';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { fetchTabooCards, type TabooSettings, type TabooCard } from './api';

const QUEUE_THRESHOLD = 20;
const INITIAL_FETCH = 40;

type Phase = 'playing' | 'summary';

export function TabooGame({
  settings,
  onEnd,
}: {
  settings: Record<string, unknown>;
  onEnd: () => void;
}) {
  const s = settings as unknown as TabooSettings;
  const [queue, setQueue] = useState<TabooCard[]>([]);
  const [current, setCurrent] = useState<TabooCard | null>(null);
  const [score, setScore] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [timerRunning, setTimerRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roundWords, setRoundWords] = useState<{ word: string; got: boolean }[]>([]);
  const fetchingRef = useRef(false);
  const { getHistory, addWords } = useWordHistory('taboo', s.language);

  useWakeLock();

  const fetchMore = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const cards = await fetchTabooCards(s, getHistory(), INITIAL_FETCH);
      setQueue((prev) => [...prev, ...cards]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [s, getHistory, addWords]);

  useEffect(() => {
    fetchMore();
  }, []);

  useEffect(() => {
    if (queue.length > 0 && queue.length <= QUEUE_THRESHOLD) {
      fetchMore();
    }
  }, [queue.length]);

  const drawNext = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [next, ...rest] = prev;
      addWords([next.word]);
      setCurrent(next);
      if (!timerRunning) setTimerRunning(true);
      return rest;
    });
  }, [timerRunning, addWords]);

  const handleCorrect = () => {
    if (!current) return;
    setScore((s) => s + 1);
    setRoundWords((prev) => [...prev, { word: current.word, got: true }]);
    drawNext();
  };

  const handleSkip = () => {
    if (!current) return;
    setSkipped((s) => s + 1);
    setRoundWords((prev) => [...prev, { word: current.word, got: false }]);
    drawNext();
  };

  const handleTimeUp = () => {
    setTimerRunning(false);
    setPhase('summary');
  };

  const handleNewRound = () => {
    setScore(0);
    setSkipped(0);
    setRoundWords([]);
    setCurrent(null);
    setPhase('playing');
    setTimerRunning(false);
  };

  if (loading && queue.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <LoadingSpinner text="Generating cards..." />
      </div>
    );
  }

  if (error && queue.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-red-400">{error}</p>
        <button onClick={onEnd} className="px-6 py-2 bg-white/10 rounded-lg">Back</button>
      </div>
    );
  }

  if (phase === 'summary') {
    return (
      <div className="min-h-dvh flex flex-col p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Round Over!</h2>

        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400">{score}</div>
            <div className="text-sm text-gray-400">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-400">{skipped}</div>
            <div className="text-sm text-gray-400">Skipped</div>
          </div>
        </div>

        <div className="space-y-2 mb-8 flex-1 overflow-y-auto">
          {roundWords.map((w, i) => (
            <div
              key={i}
              className={`px-4 py-2 rounded-lg text-sm ${
                w.got ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}
            >
              {w.got ? '✓' : '✗'} {w.word}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleNewRound}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg"
          >
            New Round
          </button>
          <button
            onClick={onEnd}
            className="w-full py-3 bg-white/10 rounded-xl font-semibold text-lg"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col p-6">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onEnd} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
          ← Back
        </button>
        <div className="flex gap-4 text-sm">
          <span className="text-green-400">✓ {score}</span>
          <span className="text-red-400">✗ {skipped}</span>
        </div>
      </div>

      <Timer seconds={s.timerSeconds} running={timerRunning} onTimeUp={handleTimeUp} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 my-6">
        {current ? (
          <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold mb-6">{current.word}</div>
            <div className="space-y-2">
              {current.forbidden.map((f, i) => (
                <div key={i} className="text-red-400 text-lg font-medium">
                  🚫 {f}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-12 text-center">
            <span className="text-gray-500">Tap "Draw Card" to begin</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
        {current && timerRunning ? (
          <>
            <button
              onClick={handleSkip}
              className="py-4 bg-red-600/80 rounded-xl font-semibold text-lg active:scale-[0.97] transition-all"
            >
              Skip
            </button>
            <button
              onClick={handleCorrect}
              className="py-4 bg-green-600/80 rounded-xl font-semibold text-lg active:scale-[0.97] transition-all"
            >
              Correct!
            </button>
          </>
        ) : (
          <button
            onClick={drawNext}
            disabled={queue.length === 0}
            className="col-span-2 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Draw Card
          </button>
        )}
      </div>
    </div>
  );
}
