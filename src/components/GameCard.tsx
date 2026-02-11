import type { GameModule } from '../games/types';

export function GameCard({
  game,
  onClick,
}: {
  game: GameModule;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all active:scale-[0.97] group"
    >
      <div className="text-4xl mb-3">{game.emoji}</div>
      <h3 className="text-xl font-bold mb-1 group-hover:text-purple-300 transition-colors">
        {game.name}
      </h3>
      <p className="text-gray-400 text-sm">{game.description}</p>
      {game.minPlayers && (
        <p className="text-gray-500 text-xs mt-2">{game.minPlayers}</p>
      )}
    </button>
  );
}
