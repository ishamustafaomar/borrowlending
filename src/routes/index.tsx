import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BorrowProvider, useBorrow } from "@/lib/borrow/store";
import { searchItems } from "@/lib/borrow/search";
import { buildSummary } from "@/lib/borrow/summary";
import { Header } from "@/components/borrow/Header";
import { ImpactBanner } from "@/components/borrow/ImpactBanner";
import { SmartSearch } from "@/components/borrow/SmartSearch";
import { ItemCard } from "@/components/borrow/ItemCard";
import { BorrowRequestDialog } from "@/components/borrow/BorrowRequestDialog";
import { LendItemSheet } from "@/components/borrow/LendItemSheet";
import { MyBorrowsList } from "@/components/borrow/MyBorrowsList";
import type { Item } from "@/lib/borrow/types";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Borrow — your block already owns it" },
      {
        name: "description",
        content:
          "Borrow tools, gear, and appliances from neighbors. Smart conversational search finds what you need on your block in seconds.",
      },
      { property: "og:title", content: "Borrow — your block already owns it" },
      {
        property: "og:description",
        content: "Borrow, don't buy. Hyperlocal neighborhood lending.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <BorrowProvider>
      <Home />
    </BorrowProvider>
  );
}

function Home() {
  const { state, reset } = useBorrow();
  const [query, setQuery] = useState("");
  const [lendOpen, setLendOpen] = useState(false);
  const [askItem, setAskItem] = useState<Item | null>(null);

  const result = useMemo(
    () => searchItems(query, state.items),
    [query, state.items],
  );
  const summary = useMemo(
    () => buildSummary(query, result.items, result.parsed, result.isFallback),
    [query, result],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
        <Header onLend={() => setLendOpen(true)} />

        <ImpactBanner />

        <div className="sticky top-2 z-10">
          <SmartSearch value={query} onChange={setQuery} />
        </div>

        <div className="flex items-start gap-2 rounded-2xl bg-accent/60 px-4 py-3 text-sm text-primary">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
          <p className="font-medium">{summary}</p>
        </div>

        <section aria-label="Available items">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {result.items.map((it) => (
              <ItemCard key={it.id} item={it} onAsk={setAskItem} />
            ))}
          </div>
        </section>

        <MyBorrowsList />

        <footer className="mt-4 flex flex-col items-center gap-1 pb-6 text-center text-xs text-muted-foreground">
          <p>
            Borrow, don't buy. Your block already owns it. 🌱
          </p>
          <button
            onClick={reset}
            className="underline-offset-2 hover:underline"
          >
            Reset demo
          </button>
        </footer>
      </div>

      <BorrowRequestDialog
        item={askItem}
        defaultWhen={result.parsed.whenLabel}
        open={!!askItem}
        onOpenChange={(v) => !v && setAskItem(null)}
      />
      <LendItemSheet open={lendOpen} onOpenChange={setLendOpen} />
    </div>
  );
}
