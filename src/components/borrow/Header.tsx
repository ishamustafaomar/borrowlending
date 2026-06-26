import { Button } from "@/components/ui/button";
import { Plus, Sprout, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

export function Header({ onLend }: { onLend: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

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
          <p className="mt-1 text-xs text-muted-foreground">Your block already owns it.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={onLend}
          className="rounded-full bg-coral text-coral-foreground hover:bg-coral/90 shadow-[var(--shadow-soft)]"
        >
          <Plus className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Lend something</span>
          <span className="sm:hidden">Lend</span>
        </Button>
        <Button
          onClick={signOut}
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
