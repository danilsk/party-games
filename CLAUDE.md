# Social Party Games

## Development Commands
```bash
npm run dev      # Start dev server
npm run build    # Type-check + production build → dist/
npm run preview  # Preview production build locally
```

## Architecture

Single-page React + TypeScript app built with Vite. Uses Tailwind CSS v4 (via `@tailwindcss/vite` plugin). Dark mode, mobile-first design.

### Key Directories
- `src/lib/` — Shared utilities: OpenRouter API client, hooks (wake lock, localStorage, word history)
- `src/components/` — Shared UI: API key setup, settings panel, timer, score counter, etc.
- `src/games/` — Game modules, each in their own folder
- `src/games/registry.ts` — Array of all game modules (add new games here)
- `src/games/types.ts` — `GameModule` interface

### Game Module Pattern
Each game folder exports a `GameModule` with:
- `id`, `name`, `description`, `emoji`, `minPlayers`
- `SettingsComponent` — config form, calls `onStart(settings)`
- `GameComponent` — gameplay, calls `onEnd()` to return home

### Adding a New Game
1. Create `src/games/yourgame/` with `index.ts`, settings, game, and api files
2. Import and add to the array in `src/games/registry.ts`

### API Integration
- Uses OpenRouter API (`src/lib/openrouter.ts`)
- API key stored in localStorage (`openrouter-api-key`)
- Model configurable via settings (`openrouter-model`), default: `openai/gpt-oss-120b:nitro`
- Word/card batching: games pre-fetch 20+ items, refetch when queue drops below 5
- Word history deduplication stored per-game in localStorage (max 300)

### Current Games
- **Charades** — Hold-to-reveal words, 3s auto-reveal on "Next Word"
- **Taboo** — Card with target + 5 forbidden words, countdown timer, scoring
- **Undercover** — Word pair game with pass-around reveal, elimination voting
- **Heads Up** — Phone-on-forehead word guessing, tilt to pass/fail, audio feedback
