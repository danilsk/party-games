import { useState } from 'react';
import { useLocalStorage } from '../../lib/useLocalStorage';

const defaultNames = () => Array.from({ length: 12 }, (_, i) => `Player ${i + 1}`);

export function WhoAmISetup({
  onStart,
  onBack,
}: {
  onStart: (players: string[]) => void;
  onBack: () => void;
}) {
  const [count, setCount] = useLocalStorage('whoami-player-count', 4);
  const [savedNames, setSavedNames] = useLocalStorage<string[]>('whoami-player-names', defaultNames());
  const [names, setNames] = useState<string[]>(() => {
    const saved = savedNames;
    if (saved.length < 12) {
      return [...saved, ...Array.from({ length: 12 - saved.length }, (_, i) => `Player ${saved.length + i + 1}`)];
    }
    return saved;
  });

  const updateName = (idx: number, name: string) => {
    setNames((prev) => {
      const next = [...prev];
      next[idx] = name;
      return next;
    });
  };

  return (
    <div className="space-y-6 p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold">Player Setup</h2>
        <div className="w-16" />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Players: {count}
        </label>
        <input
          type="range"
          min={1}
          max={12}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1</span>
          <span>12</span>
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: count }, (_, i) => (
          <input
            key={i}
            type="text"
            value={names[i]}
            onChange={(e) => updateName(i, e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        ))}
      </div>

      <button
        onClick={() => {
          localStorage.setItem('whoami-player-names', JSON.stringify(names));
          localStorage.setItem('whoami-player-count', JSON.stringify(count));
          onStart(names.slice(0, count));
        }}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
      >
        Start Game
      </button>

      <button
        onClick={() => {
          const fresh = defaultNames();
          setNames(fresh);
          setSavedNames(fresh);
          setCount(4);
        }}
        className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        Reset Players
      </button>
    </div>
  );
}
