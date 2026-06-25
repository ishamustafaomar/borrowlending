import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { SEED_ITEMS } from "./seed";
import type { BorrowRequest, Item } from "./types";

const STORAGE_KEY = "borrow.state.v1";

type State = {
  items: Item[];
  borrows: BorrowRequest[];
};

type Action =
  | { type: "hydrate"; state: State }
  | { type: "addItem"; item: Item }
  | { type: "addBorrow"; borrow: BorrowRequest }
  | { type: "approveBorrow"; id: string }
  | { type: "reset" };

const initial: State = {
  items: SEED_ITEMS,
  borrows: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "addItem":
      return { ...state, items: [action.item, ...state.items] };
    case "addBorrow":
      return { ...state, borrows: [action.borrow, ...state.borrows] };
    case "approveBorrow":
      return {
        ...state,
        borrows: state.borrows.map((b) =>
          b.id === action.id ? { ...b, status: "Approved" } : b,
        ),
      };
    case "reset":
      return initial;
  }
}

type Ctx = {
  state: State;
  addItem: (item: Item) => void;
  requestBorrow: (borrow: Omit<BorrowRequest, "id" | "createdAt" | "status">) => void;
  reset: () => void;
  impact: { itemsShared: number; dollarsSaved: number; thingsNotBought: number };
};

const BorrowContext = createContext<Ctx | null>(null);

export function BorrowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        if (parsed.items && parsed.borrows) {
          dispatch({ type: "hydrate", state: parsed });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // Auto-approve pending borrows after ~6s for demo warmth
  useEffect(() => {
    const pending = state.borrows.filter((b) => b.status === "Pending");
    if (pending.length === 0) return;
    const timers = pending.map((b) =>
      setTimeout(() => dispatch({ type: "approveBorrow", id: b.id }), 6500),
    );
    return () => timers.forEach(clearTimeout);
  }, [state.borrows]);

  const value = useMemo<Ctx>(() => {
    const baseShared = 47;
    const baseNotBought = 31;
    const baseSaved = 3240;
    const dollarsSaved = state.borrows.reduce((sum, b) => {
      const item = state.items.find((i) => i.id === b.itemId);
      return sum + (item?.estimatedValue ?? 0);
    }, baseSaved);
    return {
      state,
      addItem: (item) => dispatch({ type: "addItem", item }),
      requestBorrow: (b) =>
        dispatch({
          type: "addBorrow",
          borrow: {
            ...b,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            status: "Pending",
          },
        }),
      reset: () => {
        if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
        dispatch({ type: "reset" });
      },
      impact: {
        itemsShared: baseShared + state.borrows.length,
        dollarsSaved,
        thingsNotBought: baseNotBought + state.borrows.length,
      },
    };
  }, [state]);

  return <BorrowContext.Provider value={value}>{children}</BorrowContext.Provider>;
}

export function useBorrow() {
  const ctx = useContext(BorrowContext);
  if (!ctx) throw new Error("useBorrow must be used within BorrowProvider");
  return ctx;
}
