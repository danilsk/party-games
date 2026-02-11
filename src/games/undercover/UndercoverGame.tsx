import { useState, useEffect, useRef, useCallback } from 'react';
import { useWakeLock } from '../../lib/useWakeLock';
import { useWordHistory } from '../../lib/useWordHistory';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { UndercoverSetup } from './UndercoverSetup';
import { fetchWordPairs, type UndercoverSettings, type WordPair } from './api';

type Phase = 'setup' | 'loading' | 'reveal' | 'discuss' | 'result';

interface Player {
  name: string;
  isUndercover: boolean;
  word: string;
  revealed: boolean;
  eliminated: boolean;
}

const MIN_HOLD_MS = 500;

export function UndercoverGame({
  settings,
  onEnd,
}: {
  settings: Record<string, unknown>;
  onEnd: () => void;
}) {
  const s = settings as unknown as UndercoverSettings;
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentReveal, setCurrentReveal] = useState(0);
  const [holding, setHolding] = useState(false);
  const [canRelease, setCanRelease] = useState(false);
  const [wordPairQueue, setWordPairQueue] = useState<WordPair[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ winner: 'civilians' | 'undercover'; undercoverName: string } | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const fetchingRef = useRef(false);
  const { getHistory, addWords } = useWordHistory('undercover', s.language);

  useWakeLock();

  const fetchMore = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const pairs = await fetchWordPairs(s, getHistory());
      setWordPairQueue((prev) => [...prev, ...pairs]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch word pairs');
    } finally {
      fetchingRef.current = false;
    }
  }, [s, getHistory, addWords]);

  useEffect(() => {
    fetchMore();
  }, []);

  const startGame = (playerNames: string[]) => {
    if (wordPairQueue.length === 0) {
      setPhase('loading');
      const check = setInterval(() => {
        setWordPairQueue((q) => {
          if (q.length > 0) {
            clearInterval(check);
            initGame(playerNames, q[0]);
            return q.slice(1);
          }
          return q;
        });
      }, 200);
      return;
    }

    const [pair, ...rest] = wordPairQueue;
    setWordPairQueue(rest);
    initGame(playerNames, pair);
  };

  const initGame = (playerNames: string[], pair: WordPair) => {
    addWords([`${pair.civilian}/${pair.undercover}`]);
    const undercoverIdx = Math.floor(Math.random() * playerNames.length);
    const gamePlayers: Player[] = playerNames.map((name, i) => ({
      name,
      isUndercover: i === undercoverIdx,
      word: i === undercoverIdx ? pair.undercover : pair.civilian,
      revealed: false,
      eliminated: false,
    }));
    setPlayers(gamePlayers);
    setCurrentReveal(0);
    setPhase('reveal');
  };

  const handlePointerDown = () => {
    setHolding(true);
    setCanRelease(false);
    holdTimerRef.current = window.setTimeout(() => {
      setCanRelease(true);
    }, MIN_HOLD_MS);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (!canRelease) return;
    setHolding(false);
    setCanRelease(false);

    setPlayers((prev) => {
      const next = [...prev];
      next[currentReveal] = { ...next[currentReveal], revealed: true };
      return next;
    });

    const nextIdx = currentReveal + 1;
    if (nextIdx >= players.length) {
      setPhase('discuss');
    } else {
      setCurrentReveal(nextIdx);
    }
  };

  const eliminate = (idx: number) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], eliminated: true };

      // Check win condition using the updated state
      const alive = next.filter((p) => !p.eliminated);
      const undercoverAlive = alive.some((p) => p.isUndercover);
      const undercover = next.find((p) => p.isUndercover);

      if (undercover && !undercoverAlive) {
        setResult({ winner: 'civilians', undercoverName: undercover.name });
        setPhase('result');
      } else if (undercover && alive.length <= 2) {
        setResult({ winner: 'undercover', undercoverName: undercover.name });
        setPhase('result');
      }

      return next;
    });
  };

  const playAgain = () => {
    setPhase('setup');
    setPlayers([]);
    setResult(null);
    if (wordPairQueue.length < 3) fetchMore();
  };

  if (phase === 'setup') {
    return <UndercoverSetup onStart={startGame} onBack={onEnd} />;
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <LoadingSpinner text="Generating word pair..." />
      </div>
    );
  }

  if (error && wordPairQueue.length === 0 && players.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-red-400">{error}</p>
        <button onClick={onEnd} className="px-6 py-2 bg-white/10 rounded-lg">Back</button>
      </div>
    );
  }

  if (phase === 'reveal') {
    const player = players[currentReveal];
    const viewed = player?.revealed;

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <p className="text-gray-400 text-sm mb-2">
            {currentReveal + 1} / {players.length}
          </p>
          <h2 className="text-2xl font-bold">{player.name}</h2>
          <p className="text-gray-400 mt-1">Hold the card to see your word</p>
        </div>

        <div
          onPointerDown={!viewed ? handlePointerDown : undefined}
          onPointerUp={!viewed ? handlePointerUp : undefined}
          onPointerLeave={() => {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
            setHolding(false);
            setCanRelease(false);
          }}
          className={`w-full max-w-xs aspect-[3/4] flex items-center justify-center rounded-3xl text-center select-none touch-none transition-all duration-300 ${
            viewed
              ? 'bg-green-500/20 border-2 border-green-500/40'
              : holding
                ? 'bg-purple-500/30 border-2 border-purple-500/50 scale-95'
                : 'bg-white/5 border-2 border-white/10'
          }`}
        >
          {holding && !viewed ? (
            <span className="text-3xl font-bold px-6 break-words">{player.word}</span>
          ) : viewed ? (
            <span className="text-green-400 text-lg">Viewed ✓</span>
          ) : (
            <span className="text-gray-500">Hold to reveal</span>
          )}
        </div>

        {viewed && (
          <button
            onClick={() => {
              const nextIdx = currentReveal + 1;
              if (nextIdx >= players.length) {
                setPhase('discuss');
              } else {
                setCurrentReveal(nextIdx);
              }
            }}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg"
          >
            {currentReveal + 1 >= players.length ? 'Start Discussion' : 'Next Player'}
          </button>
        )}
      </div>
    );
  }

  if (phase === 'discuss') {
    const alive = players.filter((p) => !p.eliminated);

    return (
      <div className="min-h-dvh flex flex-col p-6 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onEnd} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
            ← End
          </button>
          <h2 className="text-xl font-bold">Vote & Eliminate</h2>
          <div className="w-16" />
        </div>

        <p className="text-gray-400 text-center mb-6 text-sm">
          Discuss and vote. Tap "Eliminate" on the suspected undercover agent.
          <br />
          {alive.length} players remaining
        </p>

        <div className="space-y-3 flex-1">
          {players.map((player, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                player.eliminated
                  ? 'bg-white/5 opacity-40'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <span className={`font-medium ${player.eliminated ? 'line-through' : ''}`}>
                {player.name}
              </span>
              {!player.eliminated && (
                <button
                  onClick={() => eliminate(idx)}
                  className="px-4 py-1.5 bg-red-600/80 rounded-lg text-sm font-semibold active:scale-95 transition-all"
                >
                  Eliminate
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'result' && result) {
    const undercover = players.find((p) => p.isUndercover)!;
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">
          {result.winner === 'civilians' ? '🎉' : '🕵️'}
        </div>
        <h2 className="text-3xl font-bold mb-2">
          {result.winner === 'civilians' ? 'Civilians Win!' : 'Undercover Wins!'}
        </h2>
        <p className="text-gray-400 mb-2">
          The undercover agent was <strong>{result.undercoverName}</strong>
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Their word: <strong>{undercover.word}</strong> (vs{' '}
          {players.find((p) => !p.isUndercover)?.word})
        </p>

        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={playAgain}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg"
          >
            Play Again
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

  return null;
}
