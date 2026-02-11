import { useState, useEffect, useRef, useCallback } from 'react';
import { useWakeLock } from '../../lib/useWakeLock';
import { useWordHistory } from '../../lib/useWordHistory';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { fetchCharadesWords, type CharadesSettings } from './api';

const QUEUE_THRESHOLD = 20;
const INITIAL_FETCH = 40;

export function CharadesGame({
  settings,
  onEnd,
}: {
  settings: Record<string, unknown>;
  onEnd: () => void;
}) {
  const s = settings as unknown as CharadesSettings;
  const [queue, setQueue] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchingRef = useRef(false);
  const autoRevealRef = useRef<number | null>(null);
  const { getHistory, addWords } = useWordHistory('charades', s.language);

  useWakeLock();

  const fetchMore = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const words = await fetchCharadesWords(s, getHistory(), INITIAL_FETCH);
      setQueue((prev) => [...prev, ...words]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch words');
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

  const nextWord = useCallback(() => {
    if (autoRevealRef.current) {
      clearTimeout(autoRevealRef.current);
      autoRevealRef.current = null;
    }

    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [next, ...rest] = prev;
      addWords([next]);
      setCurrentWord(next);
      setRevealed(true);
      autoRevealRef.current = window.setTimeout(() => {
        setRevealed(false);
        autoRevealRef.current = null;
      }, 3000);
      return rest;
    });
  }, []);

  const handlePointerDown = () => setRevealed(true);
  const handlePointerUp = () => {
    if (!autoRevealRef.current) setRevealed(false);
  };

  if (loading && queue.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <LoadingSpinner text="Generating words..." />
      </div>
    );
  }

  if (error && queue.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-red-400">{error}</p>
        <button onClick={onEnd} className="px-6 py-2 bg-white/10 rounded-lg">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col p-6">
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={onEnd}
          className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20"
        >
          ← Back
        </button>
        <span className="text-gray-500 text-sm">{queue.length} words left</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {currentWord ? (
          <div
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full max-w-sm aspect-square flex items-center justify-center bg-white/5 border-2 border-white/10 rounded-3xl cursor-pointer select-none touch-none transition-all"
          >
            {revealed ? (
              <span className="text-3xl font-bold text-center px-6 break-words">
                {currentWord}
              </span>
            ) : (
              <span className="text-gray-500 text-lg">Hold to reveal</span>
            )}
          </div>
        ) : (
          <div className="w-full max-w-sm aspect-square flex items-center justify-center bg-white/5 border-2 border-dashed border-white/10 rounded-3xl">
            <span className="text-gray-500 text-lg">Tap "Next Word" to begin</span>
          </div>
        )}

        <button
          onClick={nextWord}
          disabled={queue.length === 0}
          className="w-full max-w-sm py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          Next Word
        </button>
      </div>
    </div>
  );
}
