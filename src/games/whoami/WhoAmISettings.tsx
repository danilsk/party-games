import { useState } from 'react';
import { useLocalStorage } from '../../lib/useLocalStorage';
import { useWordHistory } from '../../lib/useWordHistory';

const PRESETS = [
  'Movies & TV',
  'Historical',
  'Fictional',
  'Music',
  'Sports',
  'Science',
  'Anime & Manga',
  'Video Games',
  'Mythology',
];

export function WhoAmISettings({
  onStart,
}: {
  onStart: (settings: Record<string, unknown>) => void;
}) {
  const [language, setLanguage] = useLocalStorage('whoami-language', 'English');
  const [difficulty, setDifficulty] = useLocalStorage('whoami-difficulty', 5);
  const [preferences, setPreferences] = useLocalStorage('whoami-preferences', '');
  const { clearAllHistory } = useWordHistory('whoami', language);
  const [historyCleared, setHistoryCleared] = useState(false);

  return (
    <div className="space-y-6 p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center">🤔 Who Am I?</h2>

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
          <span>Famous</span>
          <span>Obscure</span>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Category</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => setPreferences(preset)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                preferences === preset
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="Leave empty for a mix of everything!"
          rows={2}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      </div>

      <button
        onClick={() => onStart({ language, difficulty, preset: preferences })}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
      >
        Next: Player Setup
      </button>

      <button
        onClick={() => {
          clearAllHistory();
          setHistoryCleared(true);
          setTimeout(() => setHistoryCleared(false), 2000);
        }}
        className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors [@media(min-height:760px)]:fixed [@media(min-height:760px)]:bottom-3 [@media(min-height:760px)]:left-0 [@media(min-height:760px)]:right-0"
      >
        {historyCleared ? 'History cleared!' : 'Clear character history'}
      </button>
    </div>
  );
}
