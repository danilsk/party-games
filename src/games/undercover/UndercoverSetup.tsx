import { useState } from 'react';

export function UndercoverSetup({
  onStart,
  onBack,
}: {
  onStart: (players: string[]) => void;
  onBack: () => void;
}) {
  const [count, setCount] = useState(6);
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: 12 }, (_, i) => `Player ${i + 1}`),
  );

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
          min={4}
          max={12}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>4</span>
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
        onClick={() => onStart(names.slice(0, count))}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
      >
        Start Game
      </button>
    </div>
  );
}
