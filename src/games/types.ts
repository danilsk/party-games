import type { FC } from 'react';

export interface GameModule {
  id: string;
  name: string;
  description: string;
  emoji: string;
  minPlayers?: string;
  SettingsComponent: FC<{ onStart: (settings: Record<string, unknown>) => void }>;
  GameComponent: FC<{ settings: Record<string, unknown>; onEnd: () => void }>;
}
