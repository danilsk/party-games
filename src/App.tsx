import { useState, useEffect, useCallback } from 'react';
import { getApiKey } from './lib/openrouter';
import { ApiKeySetup } from './components/ApiKeySetup';
import { SettingsPanel } from './components/SettingsPanel';
import { GameCard } from './components/GameCard';
import { games } from './games/registry';
import type { GameModule } from './games/types';

type Screen =
  | { type: 'home' }
  | { type: 'settings'; game: GameModule }
  | { type: 'playing'; game: GameModule; settings: Record<string, unknown> };

export default function App() {
  const [hasKey, setHasKey] = useState(() => !!getApiKey());
  const [screen, setScreen] = useState<Screen>({ type: 'home' });
  const [showSettings, setShowSettings] = useState(false);

  const goBack = useCallback(() => {
    if (showSettings) {
      setShowSettings(false);
      return;
    }
    setScreen((current) => {
      if (current.type === 'playing') {
        return { type: 'settings', game: current.game };
      }
      if (current.type === 'settings') {
        return { type: 'home' };
      }
      return current;
    });
  }, [showSettings]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      goBack();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [goBack]);

  useEffect(() => {
    if (screen.type !== 'home' || showSettings) {
      window.history.pushState({ screen: screen.type, showSettings }, '');
    }
  }, [screen, showSettings]);

  if (!hasKey) {
    return <ApiKeySetup onDone={() => setHasKey(true)} />;
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {screen.type === 'home' && (
        <div className="p-6 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-8 pt-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Party Games
            </h1>
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-lg"
              aria-label="Settings"
            >
              ⚙️
            </button>
          </div>

          <div className="grid gap-4">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => setScreen({ type: 'settings', game })}
              />
            ))}
          </div>
        </div>
      )}

      {screen.type === 'settings' && (
        <div>
          <div className="p-6 max-w-md mx-auto">
            <button
              onClick={() => setScreen({ type: 'home' })}
              className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 mb-4"
            >
              ← Back
            </button>
          </div>
          <screen.game.SettingsComponent
            onStart={(settings) =>
              setScreen({ type: 'playing', game: screen.game, settings })
            }
          />
        </div>
      )}

      {screen.type === 'playing' && (
        <screen.game.GameComponent
          settings={screen.settings}
          onEnd={() => setScreen({ type: 'home' })}
        />
      )}
    </div>
  );
}
