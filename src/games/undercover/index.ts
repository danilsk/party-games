import type { GameModule } from '../types';
import { UndercoverSettings } from './UndercoverSettings';
import { UndercoverGame } from './UndercoverGame';

const undercover: GameModule = {
  id: 'undercover',
  name: 'Undercover',
  description: 'Find the spy with a different word! Discuss, deduce, eliminate.',
  emoji: '🕵️',
  minPlayers: '4-12 players',
  SettingsComponent: UndercoverSettings,
  GameComponent: UndercoverGame,
};

export default undercover;
