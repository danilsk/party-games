import type { GameModule } from '../types';
import { TabooSettings } from './TabooSettings';
import { TabooGame } from './TabooGame';

const taboo: GameModule = {
  id: 'taboo',
  name: 'Taboo',
  description: 'Describe the word without using any of the forbidden words!',
  emoji: '🚫',
  minPlayers: '2+ players',
  SettingsComponent: TabooSettings,
  GameComponent: TabooGame,
};

export default taboo;
