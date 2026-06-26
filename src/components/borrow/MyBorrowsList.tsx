import { useMyBorrows, useApproveBorrow } from "@/lib/borrow/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MyBorrowsList() {
  const { data: borrows = [] } = useMyBorrows();
  const approve = useApproveBorrow();
  if (borrows.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold text-primary">My borrows</h2>
        <span className="text-xs text-muted-foreground">{borrows.length} active</span>
      </div>
      <ul className="divide-y divide-border">
        {borrows.map((b) => {
          const isPending = b.status === "pending";
          return (
            <li key={b.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xl">
                {b.item?.emoji ?? "📦"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {b.item?.name ?? "Item"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {b.item?.owner_display_name} · {b.dates}
                </p>
              </div>
              {isPending && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 rounded-full text-xs"
                  onClick={() => approve.mutate(b.id)}
                >
                  Demo approve
                </Button>
              )}
              <Badge
                variant="secondary"
                className={
                  b.status === "approved"
                    ? "bg-primary text-primary-foreground capitalize"
                    : "bg-coral/15 text-coral border-coral/20 capitalize"
                }
              >
                {b.status}
              </Badge>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
