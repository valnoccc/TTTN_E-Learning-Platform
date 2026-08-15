import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'edumeo_saved_article_ids';

function readSavedIds(): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(value)
      ? value.filter((id): id is number => Number.isInteger(id))
      : [];
  } catch {
    return [];
  }
}

export function useSavedArticles() {
  const [savedIds, setSavedIds] = useState<number[]>(readSavedIds);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
  }, [savedIds]);

  const isSaved = useCallback((articleId: number) => savedIds.includes(articleId), [savedIds]);
  const toggleSaved = useCallback((articleId: number) => {
    setSavedIds((ids) =>
      ids.includes(articleId) ? ids.filter((id) => id !== articleId) : [...ids, articleId],
    );
  }, []);

  return { isSaved, toggleSaved };
}
