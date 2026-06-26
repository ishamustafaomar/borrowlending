import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import type { Item } from "@/lib/borrow/types";
import { useRequestBorrow } from "@/lib/borrow/hooks";
import { toast } from "sonner";

export function BorrowRequestDialog({
  item,
  defaultWhen,
  open,
  onOpenChange,
}: {
  item: Item | null;
  defaultWhen: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const mutation = useRequestBorrow();
  const [dates, setDates] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open && item) {
      setDates(defaultWhen ? cap(defaultWhen) : "This weekend");
      setMessage("");
    }
  }, [open, item, defaultWhen]);

  if (!item) return null;

  const submit = async () => {
    try {
      await mutation.mutateAsync({
        itemId: item.id,
        dates: dates || "Flexible",
        message,
      });
      toast.success(`Request sent to ${item.owner_display_name}!`, {
        description: `${item.owner_display_name} usually replies within an hour.`,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-3xl">
              {item.emoji}
            </div>
            <div>
              <DialogTitle className="font-display text-2xl font-bold">
                Ask {item.owner_display_name}
              </DialogTitle>
              <DialogDescription>
                for their {item.name.toLowerCase()} · {item.doors_away.toLowerCase()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 pt-2">
          <div className="grid gap-1.5">
            <Label htmlFor="dates">When do you need it?</Label>
            <Input
              id="dates"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              placeholder="e.g. Saturday afternoon"
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="msg">A friendly note (optional)</Label>
            <Textarea
              id="msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! Cleaning the deck this weekend — would love to borrow it for a couple hours."
              className="min-h-24 rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={mutation.isPending}
            className="rounded-full bg-coral text-coral-foreground hover:bg-coral/90 font-semibold"
          >
            {mutation.isPending ? "Sending…" : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
