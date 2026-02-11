import { chatCompletion } from '../../lib/openrouter';

export interface UndercoverSettings {
  language: string;
  difficulty: number;
  preferences: string;
}

export interface WordPair {
  civilian: string;
  undercover: string;
}

const SYSTEM_PROMPT = `You are a word pair generator for the party game "Undercover" (also known as "Who is Undercover").

In this game, most players get the same word (civilian word) while one player gets a similar but different word (undercover word). Players describe their word without saying it, trying to figure out who has the different word.

Rules:
- Return ONLY a JSON array of objects with "civilian" and "undercover" fields
- Words should be related but distinct enough to create interesting discussions
- Both words should be describable in similar ways to create confusion
- Scale difficulty: 1=obviously different pairs, 5=moderate, 10=very subtle differences
- Examples: {civilian: "coffee", undercover: "tea"}, {civilian: "guitar", undercover: "ukulele"}`;

export async function fetchWordPairs(
  settings: UndercoverSettings,
  history: string[],
  count: number = 10,
  signal?: AbortSignal,
): Promise<WordPair[]> {
  const historyNote =
    history.length > 0
      ? `\nAvoid these previously used word pairs: ${history.slice(-50).join(', ')}`
      : '';

  const userPrompt = `Generate ${count} word pairs for Undercover.
Language: ${settings.language}
Difficulty: ${settings.difficulty}/10
${settings.preferences ? `Theme/preferences: ${settings.preferences}` : ''}${historyNote}`;

  const response = await chatCompletion(SYSTEM_PROMPT, userPrompt, signal);

  try {
    const match = response.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found');
    return JSON.parse(match[0]);
  } catch {
    throw new Error('Failed to parse word pairs from AI response');
  }
}
