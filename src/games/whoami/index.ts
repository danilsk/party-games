import type { GameModule } from '../types';
import { WhoAmISettings } from './WhoAmISettings';
import { WhoAmIGame } from './WhoAmIGame';

const whoami: GameModule = {
  id: 'whoami',
  name: 'Who Am I?',
  description: 'Get a famous character, then answer yes/no questions from others!',
  emoji: '🤔',
  minPlayers: '1+ players',
  SettingsComponent: WhoAmISettings,
  GameComponent: WhoAmIGame,
};

export default whoami;
