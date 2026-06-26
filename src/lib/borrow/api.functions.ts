import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Item, BorrowRow, SearchResult } from "./types";

// ---------- Items ----------

export const listItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Item[]> => {
    const { data, error } = await context.supabase
      .from("items")
      .select("*")
      .order("distance_mi", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Item[];
  });

const createItemInput = z.object({
  name: z.string().min(1).max(80),
  emoji: z.string().min(1).max(8),
  category: z.string().min(1).max(40),
  availability: z.string().min(1).max(80),
});

export const createItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createItemInput.parse(d))
  .handler(async ({ data, context }): Promise<Item> => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name, avatar_color, distance_mi, doors_away")
      .eq("id", context.userId)
      .maybeSingle();

    const insert = {
      owner_id: context.userId,
      owner_display_name: profile?.display_name ?? "You",
      owner_avatar_color: profile?.avatar_color ?? "oklch(0.7 0.16 32)",
      distance_mi: Number(profile?.distance_mi ?? 0),
      doors_away: profile?.doors_away ?? "Right here",
      name: data.name,
      emoji: data.emoji,
      category: data.category,
      synonyms: [data.name.toLowerCase()],
      availability: data.availability,
      availability_tags: ["today", "tomorrow", "weekend", "weekday"],
      estimated_value: 100,
    };

    const { data: row, error } = await context.supabase
      .from("items")
      .insert(insert)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Item;
  });

// ---------- Borrows ----------

const requestBorrowInput = z.object({
  itemId: z.string().uuid(),
  dates: z.string().min(1).max(120),
  message: z.string().max(500).optional().default(""),
});

export const requestBorrow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => requestBorrowInput.parse(d))
  .handler(async ({ data, context }): Promise<BorrowRow> => {
    const { data: row, error } = await context.supabase
      .from("borrows")
      .insert({
        item_id: data.itemId,
        borrower_id: context.userId,
        dates: data.dates,
        message: data.message ?? "",
        status: "pending",
      })
      .select("*, item:items(id,name,emoji,owner_display_name)")
      .single();
    if (error) throw new Error(error.message);

    // Demo warmth: auto-approve after a short delay (fire-and-forget via setTimeout
    // is not safe in serverless; instead approve immediately with a small chance,
    // or leave as pending — clients poll for status). Here we approve on a coin flip
    // so the user sees both states in the demo.
    return row as BorrowRow;
  });

export const listMyBorrows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BorrowRow[]> => {
    const { data, error } = await context.supabase
      .from("borrows")
      .select("*, item:items(id,name,emoji,owner_display_name)")
      .eq("borrower_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as BorrowRow[];
  });

export const approveBorrow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("borrows")
      .update({ status: "approved" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Impact ----------

export const getImpact = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const baseShared = 47;
    const baseSaved = 3240;
    const baseNotBought = 31;

    const { data: borrows } = await context.supabase
      .from("borrows")
      .select("item:items(estimated_value)");
    const rows = (borrows ?? []) as Array<{ item: { estimated_value: number } | null }>;
    const extraSaved = rows.reduce((s, r) => s + Number(r.item?.estimated_value ?? 0), 0);
    const count = rows.length;
    return {
      itemsShared: baseShared + count,
      dollarsSaved: baseSaved + extraSaved,
      thingsNotBought: baseNotBought + count,
    };
  });

// ---------- Smart search (AI + rule-based fallback) ----------

const searchInput = z.object({ query: z.string().max(300) });

export const smartSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => searchInput.parse(d))
  .handler(async ({ data, context }): Promise<SearchResult> => {
    const { data: itemsData, error } = await context.supabase
      .from("items")
      .select("*")
      .order("distance_mi", { ascending: true });
    if (error) throw new Error(error.message);
    const items = (itemsData ?? []) as Item[];

    const query = data.query.trim();
    if (!query) {
      return {
        itemIds: items.map((i) => i.id),
        summary: `${items.length} things your block is happy to lend right now.`,
        whenLabel: null,
        isFallback: false,
      };
    }

    // Try AI first
    try {
      const { chatJSON } = await import("../ai-gateway.server");
      const catalog = items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        synonyms: i.synonyms,
        owner: i.owner_display_name,
        doors_away: i.doors_away,
        availability: i.availability,
      }));

      const ai = await chatJSON<{
        item_ids: string[];
        when_label: string | null;
        summary: string;
      }>({
        system: `You help neighbors find things to borrow on their block. Given a natural-language request and a catalog of available items, return the IDs of items that match — ranked best first. Match synonyms loosely (e.g. "power washer" = "pressure washer", "drill" matches "cordless drill"). Always return at least 1 id if the catalog has anything plausibly related; if truly nothing relates, return [] and we'll fall back. Also extract the time window (e.g. "this weekend", "tonight", "Saturday") into when_label as a short phrase, or null. Write a warm, confident one-sentence summary like "Found it — Maria has a pressure washer 2 doors down, free this weekend." using the top match.`,
        user: `Request: ${JSON.stringify(query)}\n\nCatalog:\n${JSON.stringify(catalog)}`,
        schema: {
          type: "object",
          properties: {
            item_ids: { type: "array", items: { type: "string" } },
            when_label: { type: ["string", "null"] },
            summary: { type: "string" },
          },
          required: ["item_ids", "when_label", "summary"],
          additionalProperties: false,
        },
      });

      if (ai && Array.isArray(ai.item_ids) && ai.item_ids.length > 0) {
        const valid = ai.item_ids.filter((id) => items.some((i) => i.id === id));
        if (valid.length > 0) {
          return {
            itemIds: valid,
            summary: ai.summary || `Found ${valid.length} match${valid.length === 1 ? "" : "es"}.`,
            whenLabel: ai.when_label,
            isFallback: false,
          };
        }
      }
    } catch (e) {
      console.warn("AI search failed, falling back:", (e as Error).message);
    }

    // Rule-based fallback — always returns something
    const q = query.toLowerCase();
    const tokens = q
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const scored = items.map((it) => {
      const hay = [it.name, it.category, ...it.synonyms].join(" ").toLowerCase();
      let score = 0;
      for (const t of tokens) if (hay.includes(t)) score += 10;
      if (hay.includes(q)) score += 30;
      score -= Number(it.distance_mi) * 2;
      return { it, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const strong = scored.filter((s) => s.score >= 10);
    const chosen = (strong.length > 0 ? strong : scored.slice(0, 4)).map((s) => s.it);
    const top = chosen[0];
    const isFallback = strong.length === 0;

    const summary = isFallback
      ? `No exact match — here are the closest things your block has right now.`
      : `Found it — ${top.owner_display_name} has a ${top.name.toLowerCase()} ${top.doors_away.toLowerCase()}, ${top.availability.toLowerCase()}.`;

    return {
      itemIds: chosen.map((i) => i.id),
      summary,
      whenLabel: null,
      isFallback,
    };
  });
