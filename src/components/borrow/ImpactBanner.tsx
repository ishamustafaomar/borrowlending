import { useImpact } from "@/lib/borrow/hooks";
import { useCountUp } from "@/lib/borrow/useCountUp";
import { Leaf, Wind, Recycle, Building2, Home, Trees } from "lucide-react";

export function ImpactBanner() {
  const { data } = useImpact();
  const impact = data ?? {
    itemsShared: 0,
    dollarsSaved: 0,
    thingsNotBought: 0,
    co2KgSaved: 0,
    landfillItemsDiverted: 0,
    circleBreakdown: { building: 0, block: 0, neighborhood: 0 },
  };
  const items = useCountUp(impact.itemsShared);
  const saved = useCountUp(impact.dollarsSaved);
  const not = useCountUp(impact.thingsNotBought);
  const co2 = useCountUp(impact.co2KgSaved);
  const landfill = useCountUp(impact.landfillItemsDiverted);

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent via-secondary to-cream p-5 sm:p-6 shadow-[var(--shadow-card)]"
      aria-label="Block impact"
    >
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-coral/15 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Leaf className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wider">
            Circular economy · your block
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
          Future cities
        </span>
      </div>

      <p className="relative mt-2 font-display text-xl sm:text-2xl font-bold leading-snug text-primary">
        Shared <span className="text-coral">{Math.round(items)}</span> items —{" "}
        <span className="text-coral">${Math.round(saved).toLocaleString()}</span> saved,{" "}
        <span className="text-coral">{Math.round(not)}</span> fewer things bought.
      </p>

      <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={<Wind className="h-4 w-4" />} label="CO₂ avoided" value={`${Math.round(co2)} kg`} />
        <Stat icon={<Recycle className="h-4 w-4" />} label="Diverted" value={`${Math.round(landfill)}`} />
        <Stat
          icon={<Building2 className="h-4 w-4" />}
          label="In building"
          value={`${impact.circleBreakdown.building}`}
        />
        <Stat
          icon={<Home className="h-4 w-4" />}
          label="On block"
          value={`${impact.circleBreakdown.block}`}
          extra={
            impact.circleBreakdown.neighborhood > 0 ? (
              <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Trees className="h-3 w-3" />+{impact.circleBreakdown.neighborhood}
              </span>
            ) : null
          }
        />
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-background/60 backdrop-blur px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-display text-lg font-bold text-primary">
        {value}
        {extra}
      </div>
    </div>
  );
}
