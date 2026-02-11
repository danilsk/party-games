import { chatCompletion } from '../../lib/openrouter';

export interface CharadesSettings {
  language: string;
  difficulty: number;
  wordType: 'single' | 'phrases' | 'mixed';
  preferences: string;
}

const SYSTEM_PROMPT = `You are a word generator for a Charades party game. Generate fun, actable words/phrases appropriate for the given difficulty level (1=easy, 10=very hard).

Rules:
- Return ONLY a JSON array of strings, nothing else
- Make them fun, varied, and suitable for acting out
- Avoid duplicates within the batch
- Scale difficulty: 1=common objects/animals, 5=actions/movies, 10=abstract concepts
- When told "single words only", each item must be exactly one word
- When told "phrases only", each item must be 2-4 words
- When told "mixed", use a mix of single words and short phrases`;

export async function fetchCharadesWords(
  settings: CharadesSettings,
  history: string[],
  count: number = 20,
  signal?: AbortSignal,
): Promise<string[]> {
  const historyNote =
    history.length > 0
      ? `\nAvoid these previously used words: ${history.slice(-100).join(', ')}`
      : '';

  const wordTypeInstruction = settings.wordType === 'single' ? 'single words only' : settings.wordType === 'phrases' ? 'phrases only' : 'mixed';

  const userPrompt = `Generate ${count} charades words/phrases.
Language: ${settings.language}
Difficulty: ${settings.difficulty}/10
Word type: ${wordTypeInstruction}
${settings.preferences ? `Theme/preferences: ${settings.preferences}` : ''}${historyNote}`;

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
