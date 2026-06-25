import type { Item } from "./types";
import { parseQuery, type ParsedQuery } from "./parseQuery";

function scoreItem(item: Item, parsed: ParsedQuery): number {
  if (!parsed.itemPhrase) return 0;

  const haystack = [
    item.name.toLowerCase(),
    item.category,
    ...item.synonyms.map((s) => s.toLowerCase()),
  ];

  let score = 0;

  for (const term of haystack) {
    if (term === parsed.itemPhrase) score = Math.max(score, 100);
    if (term.includes(parsed.itemPhrase) || parsed.itemPhrase.includes(term)) {
      score = Math.max(score, 80);
    }
  }

  // Token overlap
  let tokenHits = 0;
  for (const tok of parsed.itemTerms) {
    if (tok.length < 2) continue;
    for (const term of haystack) {
      if (term.includes(tok)) {
        tokenHits++;
        break;
      }
    }
  }
  score += tokenHits * 15;

  // Availability boost
  if (parsed.whenTag && item.availabilityTags.includes(parsed.whenTag)) {
    score += 8;
  }

  // Closer = slight tiebreak
  score -= item.distanceMi * 2;

  return score;
}

export type SearchResult = {
  items: Item[];
  parsed: ParsedQuery;
  isFallback: boolean;
};

export function searchItems(query: string, inventory: Item[]): SearchResult {
  const parsed = parseQuery(query);

  if (!parsed.itemPhrase) {
    // No query: show all sorted by distance
    return {
      items: [...inventory].sort((a, b) => a.distanceMi - b.distanceMi),
      parsed,
      isFallback: false,
    };
  }

  const scored = inventory
    .map((it) => ({ it, score: scoreItem(it, parsed) }))
    .sort((a, b) => b.score - a.score || a.it.distanceMi - b.it.distanceMi);

  const strong = scored.filter((s) => s.score >= 30);

  if (strong.length > 0) {
    return { items: strong.map((s) => s.it), parsed, isFallback: false };
  }

  // Fallback: closest items so we never show empty state
  const fallback = [...inventory]
    .sort((a, b) => a.distanceMi - b.distanceMi)
    .slice(0, 4);
  return { items: fallback, parsed, isFallback: true };
}
