import { useCallback, useRef } from 'react';

const MAX_HISTORY = 300;

/** DJB2 hash → 8-char hex string, safe for localStorage keys */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function loadHistory(key: string): string[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useWordHistory(gameId: string, language: string = '', extra: string = '') {
  const langSuffix = language ? `-${language.toLowerCase().trim()}` : '';
  const extraSuffix = extra ? `-${simpleHash(extra)}` : '';
  const key = `word-history-${gameId}${langSuffix}${extraSuffix}`;
  const historyRef = useRef<string[]>(loadHistory(key));

  const getHistory = useCallback((): string[] => {
    return historyRef.current;
  }, []);

  const addWords = useCallback(
    (words: string[]) => {
      const current = getHistory();
      const updated = [...current, ...words].slice(-MAX_HISTORY);
      historyRef.current = updated;
      localStorage.setItem(key, JSON.stringify(updated));
    },
    [key, getHistory],
  );

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    localStorage.removeItem(key);
  }, [key]);

  const clearAllHistory = useCallback(() => {
    historyRef.current = [];
    const prefix = `word-history-${gameId}`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  }, [gameId]);

  return { getHistory, addWords, clearHistory, clearAllHistory };
}
