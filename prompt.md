Build a static single-page app using React + TypeScript (Vite) for GitHub Pages — a social party games app. Output should build to static files (npm run build → dist/).

Core Infrastructure
API Key Management:

User enters their OpenRouter API key on first visit
Key is saved to localStorage indefinitely
Option to remove/change the key
All LLM calls go through OpenRouter's API (https://openrouter.ai/api/v1/chat/completions)

Model Selection:

Default model: openai/gpt-oss-120b:nitro (hardcoded as default)
Text field to override with a custom model string

Screen Wake Lock:

Use the Screen Wake Lock API to prevent the device from sleeping while the app is open. Fallback gracefully if unsupported.

Architecture:

Design a plugin/module system for games so new ones can be added easily (e.g., a game registry — each game is a self-contained module exporting its config component, game component, and metadata)
Main screen shows a grid/list of available games
Shared hooks/components for common patterns (settings panels, timers, score counters, word history)

General UX:

Show loading indicators whenever waiting for LLM responses
All game state should survive in memory/localStorage — if the user loses connection mid-game (e.g., Undercover), the local game state is preserved
Each game should have a "Reset word history" button in its settings to clear the dedup history


Game 1: Charades
Settings:

Language: English, Russian, Spanish
Difficulty: slider 1–10
Preferences: free text field passed to the LLM (e.g., "no pop-culture")

Gameplay:

Calls OpenRouter to generate words in batches of at least 20 based on settings
Pre-fetches the next batch while the current one is being used, so there's never a wait between words
Maintains a history of up to 300 previously used words in localStorage (persists across sessions). Sends history to the LLM with instructions to avoid duplicates.
To see the current word, user must press and hold a button (word hidden on release) — so nearby players can't accidentally see it
A "Next word" action auto-reveals the new word for 3 seconds, then hides it (hold-to-peek still works after)

Game 2: Taboo
Settings:

Language: English, Russian, Spanish
Difficulty: slider 1–10
Preferences: free text field
Timer duration: choice of 30, 60, 90, or 120 seconds

Gameplay:

Calls OpenRouter to generate taboo cards (target word + forbidden words) in batches of at least 20
Pre-fetches the next batch while the current one is being used
Same 300-word dedup history as Charades (separate history for Taboo)
Displays a visible countdown timer
Score counter: buttons for ✅ (correct) and ❌ (skip/wrong), running tally shown
Show a reminder like: "The player to your right checks that you don't use the forbidden words!"
"Next word" advances to a new taboo card
When the timer ends: show a summary screen with the final score. Provide a button to start a new round.

Game 3: Undercover
Setup:

Enter number of players (4–12)
Players are named "Player 1", "Player 2", etc. by default
Allow overriding names — make this convenient on mobile (e.g., inline editable list, easy to tap and type)
Settings: Language (English, Russian, Spanish), Difficulty (slider 1–10), Preferences (free text)

Gameplay:

Calls OpenRouter to generate a pair of similar-but-different words (e.g., "coffee" vs "tea"). The LLM should be told the number of players, difficulty, and preferences.
Randomly assigns exactly 1 player as undercover (gets the different word). All others get the majority word. Nobody is told their role.
Word reveal phase: The phone is passed around. Each player taps their name, then holds a button for at least 0.5 seconds to see their word privately (to prevent accidental taps). The word stays visible only while holding. Once a player has viewed their word, their name/card changes color so the group can see who has already looked and catch anyone who hasn't or who peeks twice. Once all players have seen their word, the game proceeds.
Discussion & elimination: Players discuss and describe their words vaguely. There is no in-app voting — instead, each active player has a "Kill" button next to their name. When the group decides, someone taps "Kill" on the chosen player. That player is eliminated and cannot participate further (their card is greyed out/removed from active play).
End condition: The game ends when the undercover player is eliminated (majority wins) or when the undercover player is one of the last 2 standing (undercover wins). Show the reveal of both words and who was undercover. Provide a button to start a new game.
Keep word pair history in localStorage (up to 300) to avoid repeats across sessions.


UI/UX Notes

Mobile-first, responsive, clean and playful design
Dark mode friendly
Make it feel like a party app — fun colors, large tap targets, big readable text for words
Game rule explanations 
Use Tailwind CSS for styling

Finally, add a CLAUDE.md file with instructions on how to add new games etc