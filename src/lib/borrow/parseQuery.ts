// Pure rule-based query parser. Always works, no network.

const FILLER = [
  "i need a", "i need an", "i need", "do you have a", "do you have an", "do you have",
  "looking for a", "looking for an", "looking for",
  "can i borrow a", "can i borrow an", "can i borrow",
  "anyone have a", "anyone have an", "anyone got a", "anyone have",
  "i'd like a", "i'd like to borrow", "i would like a",
  "need a", "need an", "want a", "want to borrow",
  "please", "thanks", "thx",
];

const TIME_PATTERNS: Array<{ re: RegExp; label: string; tag: string }> = [
  { re: /\bthis weekend\b/i, label: "this weekend", tag: "weekend" },
  { re: /\bnext weekend\b/i, label: "next weekend", tag: "weekend" },
  { re: /\bnext week\b/i, label: "next week", tag: "next week" },
  { re: /\btonight\b/i, label: "tonight", tag: "tonight" },
  { re: /\btomorrow\b/i, label: "tomorrow", tag: "tomorrow" },
  { re: /\btoday\b/i, label: "today", tag: "today" },
  { re: /\bsaturday\b/i, label: "Saturday", tag: "saturday" },
  { re: /\bsunday\b/i, label: "Sunday", tag: "sunday" },
  { re: /\bfriday\b/i, label: "Friday", tag: "friday" },
  { re: /\bthis week\b/i, label: "this week", tag: "weekday" },
  { re: /\bthis evening\b/i, label: "this evening", tag: "evening" },
];

export type ParsedQuery = {
  itemPhrase: string;
  itemTerms: string[];
  whenLabel: string | null;
  whenTag: string | null;
};

export function parseQuery(raw: string): ParsedQuery {
  let q = " " + raw.toLowerCase().trim() + " ";

  let whenLabel: string | null = null;
  let whenTag: string | null = null;
  for (const { re, label, tag } of TIME_PATTERNS) {
    if (re.test(q)) {
      whenLabel = label;
      whenTag = tag;
      q = q.replace(re, " ");
      break;
    }
  }

  // Strip filler phrases (longest first)
  for (const f of [...FILLER].sort((a, b) => b.length - a.length)) {
    q = q.replace(new RegExp(`\\b${f}\\b`, "gi"), " ");
  }

  // Strip common stop words
  q = q
    .replace(/[?.!,]/g, " ")
    .replace(/\b(a|an|the|for|on|in|to|by|please|some|this|that)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const itemPhrase = q;
  const itemTerms = q.split(" ").filter(Boolean);

  return { itemPhrase, itemTerms, whenLabel, whenTag };
}
