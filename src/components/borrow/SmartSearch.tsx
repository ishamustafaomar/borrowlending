import { Search, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

const SUGGESTIONS = [
  "I need a pressure washer this Saturday",
  "Can I borrow a drill tonight",
  "Anyone have a tall ladder tomorrow",
  "Looking for a KitchenAid this weekend",
];

export function SmartSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle placeholder when empty
  const placeholderRef = useRef(0);
  useEffect(() => {
    if (value) return;
    const id = setInterval(() => {
      placeholderRef.current = (placeholderRef.current + 1) % SUGGESTIONS.length;
      if (inputRef.current) {
        inputRef.current.placeholder = SUGGESTIONS[placeholderRef.current];
      }
    }, 3200);
    return () => clearInterval(id);
  }, [value]);

  return (
    <div className="rounded-3xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
      <label htmlFor="smart-search" className="sr-only">
        What do you need?
      </label>
      <div className="flex items-center gap-2 rounded-2xl bg-background px-4 py-3">
        <Sparkles className="h-5 w-5 shrink-0 text-coral" />
        <input
          ref={inputRef}
          id="smart-search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={SUGGESTIONS[0]}
          className="flex-1 bg-transparent text-base sm:text-lg font-medium text-foreground placeholder:text-muted-foreground/80 outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>
      <div className="flex flex-wrap gap-1.5 px-3 pb-2 pt-2">
        {SUGGESTIONS.slice(0, 3).map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
