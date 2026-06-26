import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useCreateItem } from "@/lib/borrow/hooks";
import { toast } from "sonner";

const EMOJIS = ["🔧", "🪜", "🥣", "⛺", "🌿", "🧽", "📽️", "🪑", "🚲", "🧵", "🪚", "🛞", "🎂", "🧼", "🔩", "🍳", "🎸", "📷"];
const CATEGORIES = ["tools", "kitchen", "outdoor", "home", "tech", "craft"];

export function LendItemSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateItem();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("tools");
  const [emoji, setEmoji] = useState("🔧");
  const [availability, setAvailability] = useState("Free this weekend");

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Give your item a name first");
      return;
    }
    try {
      await create.mutateAsync({ name: name.trim(), emoji, category, availability });
      toast.success(`${name} is now on the block 🌱`, {
        description: "Neighbors can find it instantly in search.",
      });
      setName("");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-t-0 sm:max-w-lg sm:mx-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-2xl font-bold">Lend something</SheetTitle>
          <SheetDescription>
            Add a thing your block can borrow. Less stuff in landfills, more favors banked.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-4 pb-4">
          <div className="grid gap-1.5">
            <Label htmlFor="iname">Item name</Label>
            <Input id="iname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Leaf blower" className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="avail">Availability</Label>
              <Input id="avail" value={availability} onChange={(e) => setAvailability(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Pick an emoji</Label>
            <div className="flex flex-wrap gap-1.5 rounded-xl bg-secondary p-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all ${
                    emoji === e
                      ? "bg-coral text-coral-foreground scale-110 shadow-[var(--shadow-soft)]"
                      : "hover:bg-background"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={submit}
            disabled={create.isPending}
            className="mt-2 rounded-full bg-coral text-coral-foreground hover:bg-coral/90 font-semibold"
          >
            {create.isPending ? "Sharing…" : "Share it with the block"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
