import { chatCompletion } from '../../lib/openrouter';

export interface WhoAmISettings {
  language: string;
  difficulty: number;
  preset: string;
}

export interface Character {
  name: string;
  description: string;
}

const SYSTEM_PROMPT = `You are a character generator for the party game "Who Am I?".

Players each receive a famous person or fictional character. Other players ask them yes/no questions to figure out who they are.

Rules:
- Return ONLY a JSON array of objects with "name" and "description" fields
- "name" is the character/person name
- "description" is a short hint (1 sentence, max 15 words) to help the player who received it
- Characters should be well-known enough that others can guess them via yes/no questions
- Scale difficulty: 1=universally famous (e.g. Einstein, Batman), 5=moderately known, 10=obscure but guessable
- Vary across categories (actors, musicians, historical figures, fictional characters, athletes, etc.) unless a specific theme is requested`;

export async function fetchCharacters(
  settings: WhoAmISettings,
  history: string[],
  count: number = 40,
  signal?: AbortSignal,
): Promise<Character[]> {
  const historyNote =
    history.length > 0
      ? `\nAvoid these previously used characters: ${history.slice(-100).join(', ')}`
      : '';

  const presetNote =
    settings.preset && settings.preset !== 'Anything'
      ? `Theme/category: ${settings.preset}`
      : '';

  const userPrompt = `Generate ${count} characters for "Who Am I?".
Language: ${settings.language}
Difficulty: ${settings.difficulty}/10
${presetNote}${historyNote}`;

  const response = await chatCompletion(SYSTEM_PROMPT, userPrompt, signal);

  try {
    const match = response.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found');
    return JSON.parse(match[0]);
  } catch {
    throw new Error('Failed to parse characters from AI response');
  }
}
