const DEFAULT_MODEL = 'openai/gpt-oss-120b:nitro';

export function getApiKey(): string | null {
  return localStorage.getItem('openrouter-api-key');
}

export function setApiKey(key: string) {
  localStorage.setItem('openrouter-api-key', key);
}

export function getModel(): string {
  return localStorage.getItem('openrouter-model') || DEFAULT_MODEL;
}

export function setModel(model: string) {
  if (model.trim()) {
    localStorage.setItem('openrouter-model', model.trim());
  } else {
    localStorage.removeItem('openrouter-model');
  }
}

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key set');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 1.0,
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
