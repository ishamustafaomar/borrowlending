// Fully client-side store for the Borrow demo.
// Everything lives in localStorage — no auth, no cloud.

import type { Item, BorrowRow, SearchResult, ImpactStats, TrustCircle } from "./types";

const KEYS = {
  profile: "borrow:profile",
  items: "borrow:items",
  borrows: "borrow:borrows",
};

export type Profile = {
  name: string;
  address: string;
  avatarColor: string;
};

const AVATAR_COLORS = [
  "oklch(0.7 0.16 32)",
  "oklch(0.72 0.14 180)",
  "oklch(0.7 0.18 145)",
  "oklch(0.74 0.15 90)",
  "oklch(0.7 0.17 280)",
];

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
  // Notify the same-tab listeners (storage events only fire across tabs).
  window.dispatchEvent(new CustomEvent("borrow:store-change", { detail: { key } }));
}

// ---------- Profile ----------

export function getProfile(): Profile | null {
  return read<Profile | null>(KEYS.profile, null);
}

export function setProfile(p: Profile) {
  write(KEYS.profile, p);
}

export function pickAvatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ---------- Items ----------

export function listItemsLocal(): Item[] {
  const items = read<Item[]>(KEYS.items, []);
  return [...items].sort((a, b) => a.distance_mi - b.distance_mi);
}

function uuid() {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function buildSynonyms(name: string): string[] {
  const n = name.toLowerCase().trim();
  const syn = new Set<string>([n]);
  // a couple of cheap morphological variants
  if (n.endsWith("s")) syn.add(n.slice(0, -1));
  else syn.add(n + "s");
  for (const word of n.split(/\s+/)) if (word.length > 2) syn.add(word);
  return [...syn];
}

export type CreateItemInput = {
  name: string;
  emoji: string;
  category: string;
  availability: string;
  trust_circle: TrustCircle;
};

export function createItemLocal(input: CreateItemInput): Item {
  const profile = getProfile();
  const name = input.name.trim();
  const item: Item = {
    id: uuid(),
    owner_id: profile ? "me" : null,
    owner_display_name: profile?.name ?? "You",
    owner_avatar_color: profile ? pickAvatarColor(profile.name) : "oklch(0.7 0.16 32)",
    distance_mi: 0,
    doors_away: profile?.address ? "Right here" : "On your block",
    name,
    emoji: input.emoji,
    category: input.category,
    synonyms: buildSynonyms(name),
    availability: input.availability,
    availability_tags: ["today", "tomorrow", "weekend", "weekday"],
    estimated_value: 100,
    trust_circle: input.trust_circle,
    borrow_count: 0,
    co2_kg_per_borrow: 8,
    owner_karma: 0,
  };
  const items = read<Item[]>(KEYS.items, []);
  items.push(item);
  write(KEYS.items, items);
  return item;
}

// ---------- Borrows ----------

export function listMyBorrowsLocal(): BorrowRow[] {
  const borrows = read<BorrowRow[]>(KEYS.borrows, []);
  const items = read<Item[]>(KEYS.items, []);
  const byId = new Map(items.map((i) => [i.id, i]));
  return [...borrows]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((b) => {
      const item = byId.get(b.item_id);
      return {
        ...b,
        item: item
          ? {
              id: item.id,
              name: item.name,
              emoji: item.emoji,
              owner_display_name: item.owner_display_name,
            }
          : null,
      };
    });
}

export function requestBorrowLocal(input: {
  itemId: string;
  dates: string;
  message: string;
}): BorrowRow {
  const items = read<Item[]>(KEYS.items, []);
  const item = items.find((i) => i.id === input.itemId);
  if (!item) throw new Error("That item isn't available anymore.");

  const row: BorrowRow = {
    id: uuid(),
    item_id: input.itemId,
    borrower_id: "me",
    dates: input.dates,
    message: input.message,
    status: "pending",
    created_at: new Date().toISOString(),
    item: {
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      owner_display_name: item.owner_display_name,
    },
  };
  const borrows = read<BorrowRow[]>(KEYS.borrows, []);
  borrows.push(row);
  write(KEYS.borrows, borrows);

  // Auto-approve after a short delay so the demo feels alive.
  setTimeout(() => approveBorrowLocal(row.id), 6000);

  return row;
}

export function approveBorrowLocal(id: string): { ok: true } {
  const borrows = read<BorrowRow[]>(KEYS.borrows, []);
  const idx = borrows.findIndex((b) => b.id === id);
  if (idx === -1) return { ok: true };
  if (borrows[idx].status !== "pending") return { ok: true };
  borrows[idx] = { ...borrows[idx], status: "approved" };
  write(KEYS.borrows, borrows);

  // Bump the item's borrow_count + owner karma.
  const items = read<Item[]>(KEYS.items, []);
  const itemIdx = items.findIndex((i) => i.id === borrows[idx].item_id);
  if (itemIdx !== -1) {
    items[itemIdx] = {
      ...items[itemIdx],
      borrow_count: (items[itemIdx].borrow_count ?? 0) + 1,
      owner_karma: (items[itemIdx].owner_karma ?? 0) + 5,
    };
    write(KEYS.items, items);
  }
  return { ok: true };
}

// ---------- Impact ----------

export function getImpactLocal(): ImpactStats {
  const items = listItemsLocal();
  const borrows = read<BorrowRow[]>(KEYS.borrows, []);
  const approved = borrows.filter((b) => b.status === "approved").length;

  let dollarsSaved = 0;
  let co2KgSaved = 0;
  let landfillItemsDiverted = 0;
  const circleBreakdown = { building: 0, block: 0, neighborhood: 0 };

  for (const i of items) {
    const bc = i.borrow_count ?? 0;
    dollarsSaved += bc * (i.estimated_value ?? 0);
    co2KgSaved += bc * (i.co2_kg_per_borrow ?? 8);
    landfillItemsDiverted += bc;
    circleBreakdown[i.trust_circle] = (circleBreakdown[i.trust_circle] ?? 0) + 1;
  }

  return {
    itemsShared: items.length,
    dollarsSaved,
    thingsNotBought: approved,
    co2KgSaved,
    landfillItemsDiverted,
    circleBreakdown,
  };
}

// ---------- Smart search (rule-based, fully local) ----------

const SYNONYM_HINTS: Record<string, string[]> = {
  "pressure washer": ["power washer", "powerwasher", "pressurewasher"],
  drill: ["cordless drill", "power drill", "impact driver"],
  ladder: ["extension ladder", "step ladder", "stepladder"],
  "stand mixer": ["kitchenaid", "mixer"],
  tent: ["camping tent", "shelter"],
  "carpet cleaner": ["rug cleaner", "shampooer"],
  projector: ["movie projector", "beamer"],
  "sewing machine": ["sewer"],
  jigsaw: ["jig saw", "saw"],
  wheelbarrow: ["barrow", "wheel barrow"],
  "hedge trimmer": ["hedge cutter", "trimmer"],
  bike: ["bicycle", "kids bike"],
};

function expandedHaystack(item: Item): string {
  const extras: string[] = [];
  const key = item.name.toLowerCase();
  for (const [k, vs] of Object.entries(SYNONYM_HINTS)) {
    if (key.includes(k)) extras.push(...vs);
    for (const v of vs) if (key.includes(v)) extras.push(k);
  }
  return [item.name, item.category, ...item.synonyms, ...extras].join(" ").toLowerCase();
}

function detectWhen(q: string): string | null {
  const map: Record<string, string> = {
    tonight: "tonight",
    today: "today",
    tomorrow: "tomorrow",
    "this weekend": "this weekend",
    weekend: "this weekend",
    saturday: "this Saturday",
    sunday: "this Sunday",
    "next week": "next week",
  };
  const lower = q.toLowerCase();
  for (const k of Object.keys(map)) if (lower.includes(k)) return map[k];
  return null;
}

export function smartSearchLocal(query: string): SearchResult {
  const items = listItemsLocal();
  const q = query.trim();

  if (!q) {
    return {
      itemIds: items.map((i) => i.id),
      summary:
        items.length === 0
          ? "Nothing on the block yet — be the first to lend something."
          : `${items.length} thing${items.length === 1 ? "" : "s"} your block is happy to lend right now.`,
      whenLabel: null,
      isFallback: false,
    };
  }

  if (items.length === 0) {
    return {
      itemIds: [],
      summary: "Your block doesn't have anything listed yet. Lend something to get it started.",
      whenLabel: null,
      isFallback: true,
    };
  }

  const lower = q.toLowerCase();
  const tokens = lower
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored = items.map((it) => {
    const hay = expandedHaystack(it);
    let score = 0;
    if (hay.includes(lower)) score += 30;
    for (const t of tokens) if (hay.includes(t)) score += 10;
    score -= it.distance_mi * 2;
    return { it, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const whenLabel = detectWhen(q);
  const strong = scored.filter((s) => s.score >= 10);

  if (strong.length > 0) {
    const top = strong[0].it;
    return {
      itemIds: strong.map((s) => s.it.id),
      summary: `Found it — ${top.owner_display_name} has a ${top.name.toLowerCase()} ${top.doors_away.toLowerCase()}, ${top.availability.toLowerCase()}.`,
      whenLabel,
      isFallback: false,
    };
  }

  // No direct match — surface the closest few items as suggestions.
  const closest = items.slice(0, Math.min(4, items.length));
  return {
    itemIds: closest.map((i) => i.id),
    summary: `No exact match — here are the closest things your block has right now.`,
    whenLabel,
    isFallback: true,
  };
}

// ---------- Demo helpers ----------

export function resetAllLocal() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEYS.items);
  localStorage.removeItem(KEYS.borrows);
  window.dispatchEvent(new CustomEvent("borrow:store-change", { detail: { key: "all" } }));
}

export const STORE_KEYS = KEYS;
