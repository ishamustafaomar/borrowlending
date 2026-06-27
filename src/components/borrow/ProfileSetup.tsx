import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getProfile, setProfile, pickAvatarColor, type Profile } from "@/lib/borrow/local-store";
import { Sprout } from "lucide-react";

/**
 * First-visit modal. Asks for the user's name + street address and saves
 * them to localStorage. No accounts, no servers.
 */
export function ProfileSetup({
  onReady,
}: {
  onReady?: (p: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = getProfile();
    if (!existing) {
      setOpen(true);
    } else {
      onReady?.(existing);
    }
  }, [onReady]);

  const save = () => {
    const trimmedName = name.trim();
    const trimmedAddr = address.trim();
    if (trimmedName.length < 2) {
      setError("Please share at least your first name.");
      return;
    }
    if (trimmedAddr.length < 4) {
      setError("Give us a street + number so neighbors know how close you are.");
      return;
    }
    const profile: Profile = {
      name: trimmedName.slice(0, 60),
      address: trimmedAddr.slice(0, 120),
      avatarColor: pickAvatarColor(trimmedName),
    };
    setProfile(profile);
    onReady?.(profile);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => v || (name && address && save())}>
      <DialogContent
        className="rounded-3xl sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="font-display text-2xl font-bold">Welcome to the block</DialogTitle>
              <DialogDescription>Just two quick things — stays on this device.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 pt-2">
          <div className="grid gap-1.5">
            <Label htmlFor="pname">Your first name</Label>
            <Input
              id="pname"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maria"
              maxLength={60}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="paddr">Your street address</Label>
            <Input
              id="paddr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="142 Maple Street"
              maxLength={120}
              className="rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
            <p className="text-xs text-muted-foreground">
              Used only to show neighbors how close you are. Nothing leaves this browser.
            </p>
          </div>

          {error && <p className="text-sm text-coral">{error}</p>}

          <Button
            onClick={save}
            className="mt-1 rounded-full bg-coral text-coral-foreground hover:bg-coral/90 font-semibold"
          >
            Hop on the block
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
