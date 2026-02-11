import type { GameModule } from '../types';
import { HeadsUpSettings } from './HeadsUpSettings';
import { HeadsUpGame } from './HeadsUpGame';

const headsup: GameModule = {
  id: 'headsup',
  name: 'Heads Up',
  description: 'Hold the phone on your forehead while friends describe the word. Tilt to answer!',
  emoji: '📱',
  minPlayers: '2+ players',
  SettingsComponent: HeadsUpSettings,
  GameComponent: HeadsUpGame,
};

export default headsup;
