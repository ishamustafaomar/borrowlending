import { Button } from "@/components/ui/button";
import { Plus, Sprout } from "lucide-react";

export function Header({ onLend }: { onLend: () => void }) {
  return (
    <header className="flex items-center justify-between gap-4 pb-2">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
          <Sprout className="h-6 w-6" strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black leading-none tracking-tight text-primary">
            Borrow
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Your block already owns it.
          </p>
        </div>
      </div>
      <Button
        onClick={onLend}
        className="rounded-full bg-coral text-coral-foreground hover:bg-coral/90 shadow-[var(--shadow-soft)]"
      >
        <Plus className="mr-1 h-4 w-4" />
        Lend something
      </Button>
    </header>
  );
}
