import { useImpact } from "@/lib/borrow/hooks";
import { useCountUp } from "@/lib/borrow/useCountUp";
import { Leaf } from "lucide-react";

export function ImpactBanner() {
  const { data } = useImpact();
  const impact = data ?? { itemsShared: 0, dollarsSaved: 0, thingsNotBought: 0 };
  const items = useCountUp(impact.itemsShared);
  const saved = useCountUp(impact.dollarsSaved);
  const not = useCountUp(impact.thingsNotBought);

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent to-secondary p-5 sm:p-6 shadow-[var(--shadow-card)]"
      aria-label="Block impact"
    >
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-coral/15 blur-2xl" />
      <div className="relative flex items-center gap-2 text-primary">
        <Leaf className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wider">Your block's impact</p>
      </div>
      <p className="relative mt-2 font-display text-xl sm:text-2xl font-bold leading-snug text-primary">
        You've shared <span className="text-coral">{Math.round(items)}</span> items —{" "}
        <span className="text-coral">${Math.round(saved).toLocaleString()}</span> saved and{" "}
        <span className="text-coral">{Math.round(not)}</span> fewer things bought.
      </p>
      <p className="relative mt-1 text-sm text-muted-foreground">
        Every borrow is one less thing manufactured, shipped, and tossed.
      </p>
    </section>
  );
}
