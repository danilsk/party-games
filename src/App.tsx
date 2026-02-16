import { useState, useEffect, useCallback, useRef } from 'react';
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
  const handlingPopState = useRef(false);
  const historyDepth = useRef(0);

  const navigate = useCallback((newScreen: Screen) => {
    setScreen(newScreen);
    if (newScreen.type !== 'home') {
      window.history.pushState(null, '');
      historyDepth.current++;
    }
  }, []);

  const openSettings = useCallback(() => {
    setShowSettings(true);
    window.history.pushState(null, '');
    historyDepth.current++;
  }, []);

  const goHome = useCallback(() => {
    setScreen({ type: 'home' });
    setShowSettings(false);
    if (historyDepth.current > 0) {
      handlingPopState.current = true;
      window.history.go(-historyDepth.current);
      historyDepth.current = 0;
    }
  }, []);

  useEffect(() => {
    window.history.replaceState(null, '');

    const handlePopState = () => {
      if (handlingPopState.current) {
        handlingPopState.current = false;
        return;
      }
      historyDepth.current = Math.max(0, historyDepth.current - 1);
      setShowSettings((wasOpen) => {
        if (wasOpen) return false;
        setScreen((current) => {
          if (current.type === 'playing') {
            return { type: 'settings', game: current.game };
          }
          if (current.type === 'settings') {
            return { type: 'home' };
          }
          return current;
        });
        return false;
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!hasKey) {
    return <ApiKeySetup onDone={() => setHasKey(true)} />;
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {showSettings && <SettingsPanel onClose={() => window.history.back()} />}

      {screen.type === 'home' && (
        <div className="p-6 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-8 pt-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Party Games
            </h1>
            <button
              onClick={openSettings}
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
                onClick={() => navigate({ type: 'settings', game })}
              />
            ))}
          </div>
        </div>
      )}

      {screen.type === 'settings' && (
        <div>
          <div className="p-6 max-w-md mx-auto">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 mb-4"
            >
              ← Back
            </button>
          </div>
          <screen.game.SettingsComponent
            onStart={(settings) =>
              navigate({ type: 'playing', game: screen.game, settings })
            }
          />
        </div>
      )}

      {screen.type === 'playing' && (
        <screen.game.GameComponent
          settings={screen.settings}
          onEnd={goHome}
        />
      )}
    </div>
  );
}
