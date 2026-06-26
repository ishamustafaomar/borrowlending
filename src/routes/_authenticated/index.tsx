import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useItems, useSmartSearch } from "@/lib/borrow/hooks";
import { Header } from "@/components/borrow/Header";
import { ImpactBanner } from "@/components/borrow/ImpactBanner";
import { SmartSearch } from "@/components/borrow/SmartSearch";
import { ItemCard } from "@/components/borrow/ItemCard";
import { BorrowRequestDialog } from "@/components/borrow/BorrowRequestDialog";
import { LendItemSheet } from "@/components/borrow/LendItemSheet";
import { MyBorrowsList } from "@/components/borrow/MyBorrowsList";
import type { Item } from "@/lib/borrow/types";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Borrow — your block already owns it" },
      {
        name: "description",
        content:
          "Borrow tools, gear, and appliances from neighbors. Smart conversational search finds what you need on your block in seconds.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const [lendOpen, setLendOpen] = useState(false);
  const [askItem, setAskItem] = useState<Item | null>(null);

  const { data: items = [] } = useItems();
  const { data: search, isFetching: searching } = useSmartSearch(query);

  const itemsById = useMemo(() => {
    const m = new Map<string, Item>();
    for (const i of items) m.set(i.id, i);
    return m;
  }, [items]);

  const ranked: Item[] = useMemo(() => {
    if (!search) return items;
    return search.itemIds.map((id) => itemsById.get(id)).filter((x): x is Item => !!x);
  }, [search, items, itemsById]);

  const summary =
    search?.summary ?? `${items.length} things your block is happy to lend right now.`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
        <Header onLend={() => setLendOpen(true)} />
        <ImpactBanner />

        <div className="sticky top-2 z-10">
          <SmartSearch value={query} onChange={setQuery} />
        </div>

        <div className="flex items-start gap-2 rounded-2xl bg-accent/60 px-4 py-3 text-sm text-primary">
          {searching ? (
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-coral" />
          ) : (
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
          )}
          <p className="font-medium">{searching && query ? "Asking the block…" : summary}</p>
        </div>

        <section aria-label="Available items">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ranked.map((it) => (
              <ItemCard key={it.id} item={it} onAsk={setAskItem} />
            ))}
          </div>
        </section>

        <MyBorrowsList />

        <footer className="mt-4 flex flex-col items-center gap-1 pb-6 text-center text-xs text-muted-foreground">
          <p>Borrow, don't buy. Your block already owns it. 🌱</p>
        </footer>
      </div>

      <BorrowRequestDialog
        item={askItem}
        defaultWhen={search?.whenLabel ?? null}
        open={!!askItem}
        onOpenChange={(v) => !v && setAskItem(null)}
      />
      <LendItemSheet open={lendOpen} onOpenChange={setLendOpen} />
    </div>
  );
}
