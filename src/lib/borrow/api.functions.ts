import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Item, BorrowRow, SearchResult, ImpactStats, TrustCircle } from "./types";

function safeError(error: unknown, fallback = "Something went wrong. Please try again."): Error {
  console.error("[borrow api error]", error);
  const code = (error as { code?: string } | null)?.code;
  if (code === "23505") return new Error("That already exists.");
  if (code === "23503") return new Error("Related record not found.");
  if (code === "23514") return new Error("Invalid value provided.");
  if (code === "42501" || code === "PGRST301") return new Error("You don't have permission to do that.");
  return new Error(fallback);
}

async function attachKarma(
  supabase: { from: (t: string) => { select: (s: string) => { in: (c: string, v: string[]) => Promise<{ data: { id: string; karma: number }[] | null }> } } },
  items: Item[],
): Promise<Item[]> {
  const ownerIds = Array.from(new Set(items.map((i) => i.owner_id).filter((x): x is string => !!x)));
  if (ownerIds.length === 0) return items;
  const { data } = await supabase.from("profiles").select("id, karma").in("id", ownerIds);
  const map = new Map<string, number>();
  for (const r of data ?? []) map.set(r.id, r.karma ?? 0);
  return items.map((i) => ({ ...i, owner_karma: i.owner_id ? map.get(i.owner_id) ?? 0 : 0 }));
}

// ---------- Items ----------

export const listItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Item[]> => {
    const { data, error } = await context.supabase
      .from("items")
      .select("*")
      .order("distance_mi", { ascending: true });
    if (error) throw safeError(error, "Couldn't load items.");
    return attachKarma(context.supabase as never, (data ?? []) as Item[]);
  });

const createItemInput = z.object({
  name: z.string().min(1).max(80),
  emoji: z.string().min(1).max(8),
  category: z.string().min(1).max(40),
  availability: z.string().min(1).max(80),
  trust_circle: z.enum(["building", "block", "neighborhood"]).default("block"),
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
      trust_circle: data.trust_circle,
    };

    const { data: row, error } = await context.supabase
      .from("items")
      .insert(insert)
      .select("*")
      .single();
    if (error) throw safeError(error, "Couldn't list your item.");
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
    if (error) throw safeError(error, "Couldn't send your borrow request.");
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
    if (error) throw safeError(error, "Couldn't load your borrows.");
    return (data ?? []) as BorrowRow[];
  });

export const approveBorrow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: borrow, error: fetchErr } = await context.supabase
      .from("borrows")
      .select("id, item:items(owner_id)")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw safeError(fetchErr, "Couldn't approve that request.");
    if (!borrow) throw new Error("Request not found.");

    const ownerId = (borrow as { item: { owner_id: string | null } | null }).item?.owner_id;
    if (!ownerId || ownerId !== context.userId) {
      throw new Error("Only the item's owner can approve this request.");
    }

    const { error } = await context.supabase
      .from("borrows")
      .update({ status: "approved" })
      .eq("id", data.id);
    if (error) throw safeError(error, "Couldn't approve that request.");
    return { ok: true };
  });

// ---------- Impact ----------

export const getImpact = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ImpactStats> => {
    const { data: items } = await context.supabase
      .from("items")
      .select("id, trust_circle, borrow_count, co2_kg_per_borrow, estimated_value");
    const rows = (items ?? []) as Array<{
      id: string;
      trust_circle: TrustCircle;
      borrow_count: number;
      co2_kg_per_borrow: number;
      estimated_value: number;
    }>;

    const { count: approvedBorrows } = await context.supabase
      .from("borrows")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");

    let dollarsSaved = 0;
    let co2KgSaved = 0;
    let landfillItemsDiverted = 0;
    const circleBreakdown = { building: 0, block: 0, neighborhood: 0 };

    for (const r of rows) {
      const bc = Number(r.borrow_count ?? 0);
      dollarsSaved += bc * Number(r.estimated_value ?? 0);
      co2KgSaved += bc * Number(r.co2_kg_per_borrow ?? 8);
      landfillItemsDiverted += bc;
      const c = (r.trust_circle ?? "block") as TrustCircle;
      circleBreakdown[c] = (circleBreakdown[c] ?? 0) + 1;
    }

    return {
      itemsShared: rows.length,
      dollarsSaved,
      thingsNotBought: approvedBorrows ?? 0,
      co2KgSaved,
      landfillItemsDiverted,
      circleBreakdown,
    };
  });

// ---------- Smart search (AI + rule-based fallback + cascade substitutes) ----------

const searchInput = z.object({ query: z.string().max(300) });

export const smartSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => searchInput.parse(d))
  .handler(async ({ data, context }): Promise<SearchResult> => {
    const { data: itemsData, error } = await context.supabase
      .from("items")
      .select("*")
      .order("distance_mi", { ascending: true });
    if (error) throw safeError(error, "Couldn't search right now.");
    const items = (itemsData ?? []) as Item[];

    const query = data.query.trim();
    if (!query) {
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

    let chosenIds: string[] = [];
    let whenLabel: string | null = null;
    let summary = "";

    // 1) AI primary match
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

      const ai = await chatJSON<{ item_ids: string[]; when_label: string | null; summary: string }>({
        system: `Match a neighbor's natural-language borrow request to items in the catalog. Return ids of items that match (best first). Handle synonyms loosely (power washer = pressure washer, drill = cordless drill). If nothing matches, return []. Extract any time phrase ("this weekend", "tonight") into when_label. Write a warm one-sentence summary using the top match (owner + item + doors_away + availability).`,
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

      if (ai && Array.isArray(ai.item_ids)) {
        chosenIds = ai.item_ids.filter((id) => items.some((i) => i.id === id));
        whenLabel = ai.when_label ?? null;
        if (chosenIds.length > 0) summary = ai.summary || "";
      }
    } catch (e) {
      console.warn("AI search failed, falling back:", (e as Error).message);
    }

    // 2) Rule-based fallback if AI returned nothing
    if (chosenIds.length === 0) {
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
      if (strong.length > 0) {
        chosenIds = strong.map((s) => s.it.id);
        const top = strong[0].it;
        summary =
          summary ||
          `Found it — ${top.owner_display_name} has a ${top.name.toLowerCase()} ${top.doors_away.toLowerCase()}, ${top.availability.toLowerCase()}.`;
      }
    }

    // 3) Cascade — no direct match? Ask AI for creative substitutes from the catalog.
    let substitutes: SearchResult["substitutes"] = undefined;
    let isFallback = false;
    if (chosenIds.length === 0) {
      isFallback = true;
      try {
        const { chatJSON } = await import("../ai-gateway.server");
        const catalog = items.map((i) => ({ id: i.id, name: i.name, category: i.category }));
        const ai = await chatJSON<{ substitutes: { id: string; reason: string }[]; summary: string }>({
          system: `The neighbor's exact request isn't in the catalog. Suggest up to 3 items from the catalog that could plausibly substitute (e.g. "no pressure washer, but a garden hose nozzle handles light grime"). Each substitute needs a short one-sentence reason starting like "No X, but…". Write a warm summary acknowledging no exact match and pointing to the substitutes.`,
          user: `Request: ${JSON.stringify(query)}\n\nCatalog:\n${JSON.stringify(catalog)}`,
          schema: {
            type: "object",
            properties: {
              substitutes: {
                type: "array",
                items: {
                  type: "object",
                  properties: { id: { type: "string" }, reason: { type: "string" } },
                  required: ["id", "reason"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["substitutes", "summary"],
            additionalProperties: false,
          },
        });
        if (ai && Array.isArray(ai.substitutes)) {
          substitutes = ai.substitutes
            .filter((s) => items.some((i) => i.id === s.id))
            .slice(0, 3)
            .map((s) => ({ itemId: s.id, reason: s.reason }));
          if (substitutes.length > 0) {
            chosenIds = substitutes.map((s) => s.itemId);
            summary = ai.summary || `No exact match — here are some creative swaps from your block.`;
          }
        }
      } catch (e) {
        console.warn("Cascade AI failed:", (e as Error).message);
      }

      if (chosenIds.length === 0) {
        chosenIds = items.slice(0, 4).map((i) => i.id);
        summary = `No exact match — here are the closest things your block has right now.`;
      }
    }

    const withKarma = await attachKarma(context.supabase as never, items);
    void withKarma; // karma is fetched via listItems for the cards; search only returns ids

    return { itemIds: chosenIds, summary, whenLabel, isFallback, substitutes };
  });
