import type { Item } from "./types";
import type { ParsedQuery } from "./parseQuery";

export function buildSummary(
  query: string,
  items: Item[],
  parsed: ParsedQuery,
  isFallback: boolean,
): string {
  if (!query.trim()) {
    return `${items.length} things your block is happy to lend right now.`;
  }
  if (items.length === 0) {
    return "Nothing matches yet — try a simpler word like 'drill' or 'tent'.";
  }
  const top = items[0];
  if (isFallback) {
    return `No exact match — here are the closest things ${top.owner.name} and others are lending.`;
  }
  const when = parsed.whenLabel
    ? matchesWhen(top, parsed.whenLabel)
      ? `, free ${parsed.whenLabel}`
      : `, available ${top.availability.toLowerCase()}`
    : `, ${top.availability.toLowerCase()}`;

  return `Found it — ${top.owner.name} has a ${top.name.toLowerCase()} ${top.doorsAway.toLowerCase()}${when}.`;
}

function matchesWhen(item: Item, whenLabel: string): boolean {
  return item.availability.toLowerCase().includes(whenLabel.toLowerCase());
}
