import { useState, useEffect, useCallback, useRef } from 'react';
import { useWakeLock } from '../../lib/useWakeLock';
import { useWordHistory } from '../../lib/useWordHistory';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { WhoAmISetup } from './WhoAmISetup';
import { fetchCharacters, type WhoAmISettings, type Character } from './api';

type Phase = 'setup' | 'loading' | 'reveal' | 'board';

interface PlayerState {
  name: string;
  character: Character;
  seen: boolean;
}

export function WhoAmIGame({
  settings,
  onEnd,
}: {
  settings: Record<string, unknown>;
  onEnd: () => void;
}) {
  const s = settings as unknown as WhoAmISettings;
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [currentReveal, setCurrentReveal] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const [characterQueue, setCharacterQueue] = useState<Character[]>([]);
  const [error, setError] = useState('');
  const [showingPlayer, setShowingPlayer] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const fetchingRef = useRef(false);
  const { getHistory, addWords } = useWordHistory('whoami', s.language);

  useWakeLock();

  const fetchMore = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const chars = await fetchCharacters(s, getHistory());
      setCharacterQueue((prev) => [...prev, ...chars]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch characters');
    } finally {
      fetchingRef.current = false;
    }
  }, [s, getHistory]);

  useEffect(() => {
    fetchMore();
  }, []);

  const takeCharacter = (queue: Character[]): [Character, Character[]] => {
    const [char, ...rest] = queue;
    addWords([char.name]);
    return [char, rest];
  };

  const startGame = (playerNames: string[]) => {
    if (characterQueue.length < playerNames.length) {
      setPhase('loading');
      const check = setInterval(() => {
        setCharacterQueue((q) => {
          if (q.length >= playerNames.length) {
            clearInterval(check);
            initGame(playerNames, q);
            return q;
          }
          return q;
        });
      }, 200);
      return;
    }
    initGame(playerNames, characterQueue);
  };

  const initGame = (playerNames: string[], queue: Character[]) => {
    let remaining = queue;
    const gamePlayers: PlayerState[] = playerNames.map((name) => {
      const [char, rest] = takeCharacter(remaining);
      remaining = rest;
      return { name, character: char, seen: false };
    });
    setCharacterQueue(remaining);
    setPlayers(gamePlayers);
    setCurrentReveal(0);
    setPhase('reveal');
  };

  const swapCharacter = (playerIdx: number) => {
    if (characterQueue.length === 0) return;
    const [newChar, rest] = takeCharacter(characterQueue);
    setCharacterQueue(rest);
    setPlayers((prev) => {
      const next = [...prev];
      next[playerIdx] = { ...next[playerIdx], character: newChar };
      return next;
    });
    if (rest.length < 10) fetchMore();
  };

  const playAgain = () => {
    setPhase('setup');
    setPlayers([]);
    setShowingPlayer(null);
    if (characterQueue.length < 12) fetchMore();
  };

  if (phase === 'setup') {
    return <WhoAmISetup onStart={startGame} onBack={onEnd} />;
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <LoadingSpinner text="Generating characters..." />
      </div>
    );
  }

  if (error && characterQueue.length === 0 && players.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-red-400">{error}</p>
        <button onClick={onEnd} className="px-6 py-2 bg-white/10 rounded-lg">Back</button>
      </div>
    );
  }

  if (phase === 'reveal') {
    const player = players[currentReveal];
    const isLast = currentReveal + 1 >= players.length;

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <p className="text-gray-400 text-sm mb-2">
            {currentReveal + 1} / {players.length}
          </p>
          <h2 className="text-2xl font-bold">{player.name}</h2>
          <p className="text-gray-400 mt-1">
            {player.seen ? 'Character seen!' : 'Tap the card to see your character'}
          </p>
        </div>

        <div
          onClick={!player.seen && !peeking ? () => setPeeking(true) : undefined}
          className={`w-full max-w-xs aspect-[3/4] flex items-center justify-center rounded-3xl text-center select-none transition-all duration-300 ${
            player.seen
              ? 'bg-green-500/20 border-2 border-green-500/40'
              : peeking
                ? 'bg-purple-500/20 border-2 border-purple-500/40'
                : 'bg-white/5 border-2 border-white/10 active:scale-95 active:bg-white/10 cursor-pointer'
          }`}
        >
          {peeking ? (
            <div className="flex flex-col items-center gap-3 px-6">
              <span className="text-3xl font-bold break-words">{player.character.name}</span>
              <span className="text-gray-400 text-sm">{player.character.description}</span>
            </div>
          ) : player.seen ? (
            <span className="text-green-400 text-lg">Seen ✓</span>
          ) : (
            <span className="text-gray-500">Tap to reveal</span>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
          {peeking && !player.seen && (
            <>
              <button
                onClick={() => {
                  setPeeking(false);
                  setPlayers((prev) => {
                    const next = [...prev];
                    next[currentReveal] = { ...next[currentReveal], seen: true };
                    return next;
                  });
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg active:scale-[0.98] transition-all"
              >
                {isLast ? 'Done — Show Players' : 'OK — Next Player'}
              </button>
              <button
                onClick={() => swapCharacter(currentReveal)}
                className="w-full py-2.5 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/15 active:scale-[0.98] transition-all"
              >
                🔄 Different Character
              </button>
            </>
          )}
          {player.seen && (
            <button
              onClick={() => {
                if (isLast) {
                  setPhase('board');
                } else {
                  setCurrentReveal(currentReveal + 1);
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg active:scale-[0.98] transition-all"
            >
              {isLast ? 'Show Players' : 'Next Player'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Board phase — player list with Show buttons
  if (showingPlayer !== null) {
    const player = players[showingPlayer];
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <p className="text-gray-400 text-sm mb-2">{player.name}'s character</p>
        </div>

        <div className="w-full max-w-xs aspect-[3/4] flex items-center justify-center rounded-3xl text-center bg-purple-500/20 border-2 border-purple-500/40">
          <div className="flex flex-col items-center gap-3 px-6">
            <span className="text-3xl font-bold break-words">{player.character.name}</span>
            <span className="text-gray-400 text-sm">{player.character.description}</span>
          </div>
        </div>

        <button
          onClick={() => setShowingPlayer(null)}
          className="mt-6 w-full max-w-xs py-3 bg-white/10 rounded-xl font-semibold text-lg active:scale-[0.98] transition-all"
        >
          Hide
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onEnd} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
          ← End
        </button>
        <h2 className="text-xl font-bold">🤔 Who Am I?</h2>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="px-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20"
        >
          ?
        </button>
      </div>

      {showHelp && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-gray-300 space-y-3">
          <p className="font-semibold text-white">How to play</p>
          <p>
            Everyone has a character that they know. Other players ask yes/no questions to figure out who you are.
            This is the reverse of the classic sticky-note version — here <em>you</em> know your character,
            and <em>others</em> are guessing.
          </p>
          <p className="font-semibold text-white mt-3">Ways to play</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li><strong className="text-gray-300">Hot Seat</strong> — Focus on one player at a time. Everyone asks them yes/no questions until someone guesses, then move on.</li>
            <li><strong className="text-gray-300">Free-for-all</strong> — Take turns asking any player a question. First to guess everyone else's characters wins.</li>
            <li><strong className="text-gray-300">20 Questions</strong> — Each player gets exactly 20 questions. Fewest questions to be guessed wins.</li>
          </ul>
        </div>
      )}

      <p className="text-gray-400 text-center mb-4 text-sm">
        Tap "Show" to re-check your character. Ask each other yes/no questions!
      </p>

      <div className="space-y-3 flex-1">
        {players.map((player, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10"
          >
            <span className="font-medium">{player.name}</span>
            <button
              onClick={() => setShowingPlayer(idx)}
              className="px-4 py-1.5 bg-purple-600/80 rounded-lg text-sm font-semibold active:scale-95 transition-all"
            >
              Show
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={playAgain}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg active:scale-[0.98] transition-all"
        >
          New Round
        </button>
      </div>
    </div>
  );
}
