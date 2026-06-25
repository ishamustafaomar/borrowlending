
# Borrow — Hyperlocal Neighborhood Lending

A single-page, client-side demo app. No auth, no backend. All state lives in React + localStorage so the demo is instant and never breaks.

## Design system

Update `src/styles.css` with a warm, eco palette (oklch tokens):
- Background: soft mint/sage (`--background`)
- Surface/cards: warmer off-white with sage tint
- Primary: deep forest green (headings, nav, secondary buttons)
- Accent/CTA: warm coral (the "Ask to borrow" / "+ Lend something" buttons)
- Muted: sage-gray for distance/meta text
- Soft shadows token (`--shadow-soft`) and generous border-radius (`--radius: 1rem`)
- Fonts via `<link>` in `__root.tsx`: **Fraunces** (bold display headings, handmade feel) + **Inter** (body). Registered in `@theme` as `--font-display` and `--font-sans`.

Look: rounded cards, soft shadows, hand-drawn-ish warmth — not SaaS. Emojis as item imagery so it feels playful and avoids stock-photo slop.

## Routes

Single home route `src/routes/index.tsx` is the whole experience (search + results + impact banner + my borrows). A modal/dialog handles the borrow request, and a sheet handles "+ Lend something". Keeps the demo to one screen as requested.

## Components (in `src/components/borrow/`)

- `ImpactBanner.tsx` — prominent banner: items shared, dollars saved, things not bought. Numbers animate up when a borrow is requested.
- `SmartSearch.tsx` — big conversational input with the requested placeholder. Debounced parsing. Shows the confident summary line above results.
- `ItemCard.tsx` — emoji + item name, owner avatar (initial in colored circle) + first name, distance shown both ways ("0.2 mi · 2 doors down"), availability pill, coral "Ask to borrow" button.
- `BorrowRequestDialog.tsx` — shadcn Dialog: date range picker + optional message + Send. Warm confirmation toast: "Request sent to Maria! She usually replies within an hour."
- `LendItemSheet.tsx` — shadcn Sheet: name, category select, emoji picker (small curated grid), availability text. On submit, appends to inventory.
- `MyBorrowsList.tsx` — collapsible list of requests with Pending/Approved status pill (auto-flips a couple to Approved after a short delay for demo liveliness).
- `EmptyFallback.tsx` — never a dead end: shows "Closest alternatives" using category/fuzzy matches.

## Data + logic (in `src/lib/borrow/`)

- `seed.ts` — 14 seeded items exactly per spec (Maria/pressure washer/2 doors down/free this weekend, James/cordless drill/0.1 mi, Priya/extension ladder/0.3 mi, Tom/stand mixer/0.2 mi, Sofia/camping tent/0.4 mi, plus hedge trimmer, carpet cleaner, projector, folding tables, kids' bike, sewing machine, jigsaw, wheelbarrow, KitchenAid). Each item: `id, name, emoji, category, owner {name, avatarColor}, distanceMi, doorsAway, availability, estimatedValue, synonyms[]`.
- `synonyms.ts` — hand-curated synonym map: "power washer"→"pressure washer", "drill/cordless drill/impact driver"→"cordless drill", "ladder/extension ladder/step ladder"→"extension ladder", "mixer/kitchenaid/stand mixer", "tent/camping tent", "projector/beamer", "bike/bicycle/kids bike", "saw/jigsaw", "trimmer/hedge trimmer", "wheelbarrow/cart", "carpet cleaner/rug shampooer", "sewing machine", "tables/folding tables". Bidirectional lookup.
- `parseQuery.ts` — extract item phrase + time window from the sentence with regex/keyword rules: detects "today/tonight/tomorrow/this weekend/saturday/sunday/next week/etc.", strips filler ("I need a", "looking for", "can I borrow"), returns `{ itemTerms: string[], when: string | null }`.
- `search.ts` — rank items: exact synonym match → token overlap → fuzzy (simple Levenshtein on item name) → category fallback. Sort by distance ascending. If `when` parsed, boost items whose availability matches that window. Always returns ≥3 results (falls back to closest items in same/related category) so the empty state never shows.
- `summary.ts` — generate the warm one-line summary from top result, e.g. "Found it — Maria has a pressure washer 2 doors down, free this weekend."
- `impact.ts` — derive counters from state: `itemsShared = baseline(47) + completedBorrows`, `dollarsSaved = sum(estimatedValue of borrowed)`, `thingsNotBought = baseline(31) + borrows`. Animate via simple count-up on change.
- `store.ts` — lightweight Zustand store (already a small dep, or a plain React context if we avoid adding deps): `items`, `borrows`, plus `addItem`, `requestBorrow`. Persisted to localStorage so refresh keeps state.

### AI assist (optional, graceful fallback)

`parseQuery.ts` exposes a pure rule-based parser that always works. A thin server function `src/lib/borrow/ai-parse.functions.ts` using Lovable AI Gateway (`google/gemini-3-flash-preview`, structured output `{ item, when }`) is called first; on any error/timeout (>1s) we fall back to the rule-based parser silently. This guarantees results always render. Lovable Cloud is **not** required for the demo; if `LOVABLE_API_KEY` isn't present the AI path is skipped.

## Borrow flow

1. Click "Ask to borrow" on a card → dialog opens prefilled with the parsed `when`.
2. Pick dates, optional message, Send.
3. Toast confirms; request appended to "My borrows" as **Pending**; impact counters tick up; after ~6s one flips to **Approved** for demo warmth.

## Impact counter behavior

Sticky banner near top: three big numbers with Fraunces, small label underneath. On new borrow: counters animate +1 item, +$value, +1 thing-not-bought using a small `useCountUp` hook.

## Technical details

- TanStack Start, single route `/` with `head()` set (title "Borrow — your block already owns it", description, og tags).
- shadcn components used: Dialog, Sheet, Button, Input, Textarea, Select, Calendar/Popover (date picker per the shadcn-datepicker rule with `pointer-events-auto`), Badge, Toast (sonner).
- All colors via semantic tokens — no hardcoded hex in components.
- Mobile-first layout: single column, search sticky at top; desktop ≥`md` uses a 2-up card grid and the impact banner sits beside the search.
- No new heavy deps; reuse what's already installed. (If Zustand isn't installed, use React context + reducer.)
- Seeded state initializes on first load only; localStorage hydration after.

## File plan

```
src/styles.css                              (palette + fonts + tokens)
src/routes/__root.tsx                       (add Fraunces+Inter <link>, update title)
src/routes/index.tsx                        (compose the page)
src/components/borrow/ImpactBanner.tsx
src/components/borrow/SmartSearch.tsx
src/components/borrow/ItemCard.tsx
src/components/borrow/BorrowRequestDialog.tsx
src/components/borrow/LendItemSheet.tsx
src/components/borrow/MyBorrowsList.tsx
src/components/borrow/EmptyFallback.tsx
src/components/borrow/Header.tsx            (wordmark + tagline + Lend button)
src/lib/borrow/types.ts
src/lib/borrow/seed.ts
src/lib/borrow/synonyms.ts
src/lib/borrow/parseQuery.ts
src/lib/borrow/search.ts
src/lib/borrow/summary.ts
src/lib/borrow/impact.ts
src/lib/borrow/store.tsx
src/lib/borrow/useCountUp.ts
src/lib/borrow/ai-parse.functions.ts        (optional AI path, safe fallback)
```

## Demo guarantees

- Search is never empty — always shows ≥3 ranked results or "closest alternatives".
- Every action (search, borrow request, list item) gives instant visual feedback.
- All state survives refresh via localStorage; a "Reset demo" link in the footer restores seed data.
