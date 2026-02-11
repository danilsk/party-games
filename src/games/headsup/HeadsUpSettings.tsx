import { useLocalStorage } from '../../lib/useLocalStorage';

const TIMER_OPTIONS = [30, 60, 90, 120];

const PRESETS = [
  'Act It Out',
  'Accents',
  'Animals',
  'Movies',
  'TV Shows',
  'Celebrities',
  'Songs',
  'Food & Drink',
  'Sports',
  'Science',
  'History',
  'Brands',
  'Slang',
  'Superpowers',
  'Occupations',
];

export function HeadsUpSettings({
  onStart,
}: {
  onStart: (settings: Record<string, unknown>) => void;
}) {
  const [language, setLanguage] = useLocalStorage('headsup-language', 'English');
  const [difficulty, setDifficulty] = useLocalStorage('headsup-difficulty', 5);
  const [timerSeconds, setTimerSeconds] = useLocalStorage('headsup-timer', 60);
  const [preferences, setPreferences] = useLocalStorage('headsup-preferences', '');

  return (
    <div className="space-y-6 p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center">📱 Heads Up</h2>

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
        <label className="block text-sm text-gray-400 mb-2">Timer</label>
        <div className="grid grid-cols-4 gap-2">
          {TIMER_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTimerSeconds(t)}
              className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                timerSeconds === t
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {t}s
            </button>
          ))}
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
          placeholder="Or type a custom category..."
          rows={2}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      </div>

      <button
        onClick={() => onStart({ language, difficulty, timerSeconds, preferences })}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
      >
        Start Game
      </button>
    </div>
  );
}
