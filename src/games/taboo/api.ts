import { chatCompletion } from '../../lib/openrouter';

export interface TabooSettings {
  language: string;
  difficulty: number;
  timerSeconds: number;
  preferences: string;
}

export interface TabooCard {
  word: string;
  forbidden: string[];
}

const SYSTEM_PROMPT = `You are a card generator for the Taboo word game. Generate cards with a target word and 5 forbidden/taboo words that players cannot say while describing the target.

Rules:
- Return ONLY a JSON array of objects with "word" and "forbidden" fields
- Each "forbidden" array must have exactly 5 words
- Forbidden words should be the most obvious clues for the target word
- Scale difficulty: 1=common words, 5=moderate, 10=obscure/challenging
- Make cards fun and varied`;

export async function fetchTabooCards(
  settings: TabooSettings,
  history: string[],
  count: number = 20,
  signal?: AbortSignal,
): Promise<TabooCard[]> {
  const historyNote =
    history.length > 0
      ? `\nAvoid these previously used target words: ${history.slice(-100).join(', ')}`
      : '';

  const userPrompt = `Generate ${count} Taboo cards.
Language: ${settings.language}
Difficulty: ${settings.difficulty}/10
${settings.preferences ? `Theme/preferences: ${settings.preferences}` : ''}${historyNote}`;

  const response = await chatCompletion(SYSTEM_PROMPT, userPrompt, signal);

  try {
    const match = response.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found');
    return JSON.parse(match[0]);
  } catch {
    throw new Error('Failed to parse Taboo cards from AI response');
  }
}
