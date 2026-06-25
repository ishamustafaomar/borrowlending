import { useBorrow } from "@/lib/borrow/store";
import { Badge } from "@/components/ui/badge";

export function MyBorrowsList() {
  const { state } = useBorrow();
  if (state.borrows.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold text-primary">
          My borrows
        </h2>
        <span className="text-xs text-muted-foreground">
          {state.borrows.length} active
        </span>
      </div>
      <ul className="divide-y divide-border">
        {state.borrows.map((b) => (
          <li key={b.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xl">
              {b.itemEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {b.itemName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {b.ownerName} · {b.dates}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={
                b.status === "Approved"
                  ? "bg-primary text-primary-foreground"
                  : "bg-coral/15 text-coral border-coral/20"
              }
            >
              {b.status}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
