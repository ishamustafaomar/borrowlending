import type { Item } from "@/lib/borrow/types";
import { Button } from "@/components/ui/button";
import { MapPin, Clock } from "lucide-react";

export function ItemCard({
  item,
  onAsk,
}: {
  item: Item;
  onAsk: (item: Item) => void;
}) {
  const d = Number(item.distance_mi);
  const distanceLabel = d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`;

  return (
    <article className="group flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-4xl"
          aria-hidden
        >
          {item.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-bold leading-tight text-foreground">
            {item.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground"
              style={{ background: item.owner_avatar_color }}
              aria-hidden
            >
              {item.owner_display_name[0]?.toUpperCase()}
            </span>
            <span className="text-sm font-medium text-foreground">
              {item.owner_display_name}
            </span>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>
            <span className="font-semibold text-foreground">{distanceLabel}</span>
            <span className="mx-1">·</span>
            <span>{item.doors_away}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 justify-end text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{item.availability}</span>
        </div>
      </dl>

      <Button
        onClick={() => onAsk(item)}
        className="rounded-full bg-coral text-coral-foreground hover:bg-coral/90 font-semibold"
      >
        Ask to borrow
      </Button>
    </article>
  );
}
