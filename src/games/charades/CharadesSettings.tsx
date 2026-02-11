import { useState } from 'react';
import { useLocalStorage } from '../../lib/useLocalStorage';
import { useWordHistory } from '../../lib/useWordHistory';

export function CharadesSettings({
  onStart,
}: {
  onStart: (settings: Record<string, unknown>) => void;
}) {
  const [language, setLanguage] = useLocalStorage('charades-language', 'English');
  const [difficulty, setDifficulty] = useLocalStorage('charades-difficulty', 5);
  const [wordType, setWordType] = useLocalStorage('charades-word-type', 'mixed');
  const [preferences, setPreferences] = useLocalStorage('charades-preferences', '');
  const { clearAllHistory } = useWordHistory('charades', language);
  const [historyCleared, setHistoryCleared] = useState(false);

  return (
    <div className="space-y-6 p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center">🎭 Charades</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Language</label>
        <input
          type="text"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Difficulty: {difficulty}/10
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Easy</span>
          <span>Hard</span>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Word Type</label>
        <div className="flex gap-2">
          {(['single', 'phrases', 'mixed'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setWordType(type)}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                wordType === type
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
              }`}
            >
              {type === 'single' ? 'Single Words' : type === 'phrases' ? 'Phrases' : 'Mixed'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Preferences (optional)
        </label>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="e.g., movies only, animals, no food..."
          rows={2}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      </div>

      <button
        onClick={() => onStart({ language, difficulty, wordType, preferences })}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
      >
        Start Game
      </button>

      <button
        onClick={() => {
          clearAllHistory();
          setHistoryCleared(true);
          setTimeout(() => setHistoryCleared(false), 2000);
        }}
        className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors [@media(min-height:760px)]:fixed [@media(min-height:760px)]:bottom-3 [@media(min-height:760px)]:left-0 [@media(min-height:760px)]:right-0"
      >
        {historyCleared ? 'History cleared!' : 'Clear word history'}
      </button>
    </div>
  );
}
