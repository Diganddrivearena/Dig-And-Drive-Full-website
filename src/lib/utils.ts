import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple Levenshtein distance for fuzzy matching
export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return matrix[b.length][a.length];
}

export function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const queryWords = query.toLowerCase().trim().split(/\s+/);
  const textWords = text.toLowerCase().split(/\W+/).filter(Boolean);
  
  return queryWords.every(qWord => {
    if (text.toLowerCase().includes(qWord)) return true;
    const maxErrors = qWord.length <= 3 ? 0 : qWord.length <= 5 ? 1 : 2;
    return textWords.some(tWord => levenshtein(qWord, tWord) <= maxErrors);
  });
}
