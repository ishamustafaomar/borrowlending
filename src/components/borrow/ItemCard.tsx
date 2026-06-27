import type { Item } from "@/lib/borrow/types";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Building2, Home, Trees, Sparkles } from "lucide-react";

const CIRCLE_META = {
  building: { Icon: Building2, label: "Same building", tone: "bg-coral/12 text-coral" },
  block: { Icon: Home, label: "Your block", tone: "bg-secondary text-primary" },
  neighborhood: { Icon: Trees, label: "Neighborhood", tone: "bg-accent text-primary" },
} as const;

function KarmaStars({ karma }: { karma: number }) {
  // 1 leaf per 10 karma, capped at 5
  const leaves = Math.min(5, Math.max(0, Math.round(karma / 10)));
  if (leaves === 0) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700"
      title={`${karma} karma — earned by lending`}
      aria-label={`${karma} karma`}
    >
      {"🌱".repeat(leaves)}
    </span>
  );
}

export function ItemCard({
  item,
  onAsk,
  cascadeReason,
}: {
  item: Item;
  onAsk: (item: Item) => void;
  cascadeReason?: string;
}) {
  const d = Number(item.distance_mi);
  const distanceLabel = d < 0.1 ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} mi`;
  const circle = CIRCLE_META[item.trust_circle ?? "block"];
  const CircleIcon = circle.Icon;

  return (
    <article className="group relative flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
      {cascadeReason && (
        <div className="-mx-1 -mt-1 mb-1 flex items-start gap-2 rounded-2xl bg-coral/10 px-3 py-2 text-xs font-medium text-coral">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{cascadeReason}</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-4xl"
          aria-hidden
        >
          {item.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-xl font-bold leading-tight text-foreground">
              {item.name}
            </h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${circle.tone}`}
              title={`Trust circle: ${circle.label}`}
            >
              <CircleIcon className="h-3 w-3" />
              {circle.label}
            </span>
          </div>
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
            <KarmaStars karma={item.owner_karma ?? 0} />
            {item.borrow_count > 0 && (
              <span className="text-xs text-muted-foreground">
                · lent {item.borrow_count}×
              </span>
            )}
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
