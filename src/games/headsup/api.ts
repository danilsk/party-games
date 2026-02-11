import { chatCompletion } from '../../lib/openrouter';

export interface HeadsUpSettings {
  language: string;
  timerSeconds: number;
  difficulty: number;
  preferences: string;
}

const SYSTEM_PROMPT = `You are a word/phrase generator for a "Heads Up" party game. Players hold a phone on their forehead and others describe the word without saying it.

Rules:
- Return ONLY a JSON array of strings, nothing else
- Generate fun, describable words/phrases suitable for the game
- Avoid duplicates within the batch
- Scale difficulty: 1=common everyday words, 5=popular culture/moderate, 10=obscure/challenging
- Words should be 1-3 words max (short enough to display large on a phone screen)`;

export async function fetchHeadsUpWords(
  settings: HeadsUpSettings,
  count: number = 20,
  signal?: AbortSignal,
): Promise<string[]> {
  const userPrompt = `Generate ${count} words/phrases for Heads Up.
Language: ${settings.language}
Difficulty: ${settings.difficulty}/10
${settings.preferences ? `Theme/category: ${settings.preferences}` : 'Mix of fun categories'}`;

  const response = await chatCompletion(SYSTEM_PROMPT, userPrompt, signal);

  try {
    const match = response.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found');
    return JSON.parse(match[0]);
  } catch {
    return response
      .split('\n')
      .map((l) => l.replace(/^[\d.\-*]+\s*/, '').trim())
      .filter(Boolean);
  }
}
