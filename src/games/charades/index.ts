import type { GameModule } from '../types';
import { CharadesSettings } from './CharadesSettings';
import { CharadesGame } from './CharadesGame';

const charades: GameModule = {
  id: 'charades',
  name: 'Charades',
  description: 'Act out words without speaking. Hold to peek, then perform!',
  emoji: '🎭',
  minPlayers: '2+ players',
  SettingsComponent: CharadesSettings,
  GameComponent: CharadesGame,
};

export default charades;
