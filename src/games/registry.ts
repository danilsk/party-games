import type { GameModule } from './types';
import charades from './charades';
import taboo from './taboo';
import undercover from './undercover';
import headsup from './headsup';
import whoami from './whoami';

export const games: GameModule[] = [charades, taboo, undercover, headsup, whoami];
