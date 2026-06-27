import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  listItemsLocal,
  listMyBorrowsLocal,
  getImpactLocal,
  smartSearchLocal,
  requestBorrowLocal,
  createItemLocal,
  approveBorrowLocal,
  type CreateItemInput,
} from "./local-store";

// Re-render queries when localStorage changes (same tab + cross-tab).
function useStoreSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["borrows"] });
      qc.invalidateQueries({ queryKey: ["impact"] });
      qc.invalidateQueries({ queryKey: ["search"] });
    };
    window.addEventListener("borrow:store-change", invalidate);
    window.addEventListener("storage", invalidate);
    return () => {
      window.removeEventListener("borrow:store-change", invalidate);
      window.removeEventListener("storage", invalidate);
    };
  }, [qc]);
}

export function useItems() {
  useStoreSync();
  return useQuery({ queryKey: ["items"], queryFn: () => Promise.resolve(listItemsLocal()) });
}

export function useMyBorrows() {
  useStoreSync();
  return useQuery({
    queryKey: ["borrows"],
    queryFn: () => Promise.resolve(listMyBorrowsLocal()),
    refetchInterval: 5000,
  });
}

export function useImpact() {
  useStoreSync();
  return useQuery({ queryKey: ["impact"], queryFn: () => Promise.resolve(getImpactLocal()) });
}

export function useSmartSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => Promise.resolve(smartSearchLocal(query)),
    placeholderData: (prev) => prev,
  });
}

export function useRequestBorrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; dates: string; message: string }) =>
      Promise.resolve(requestBorrowLocal(input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["borrows"] });
      qc.invalidateQueries({ queryKey: ["impact"] });
    },
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItemInput) => Promise.resolve(createItemLocal(input)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["search"] });
      qc.invalidateQueries({ queryKey: ["impact"] });
    },
  });
}

export function useApproveBorrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(approveBorrowLocal(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["borrows"] });
      qc.invalidateQueries({ queryKey: ["impact"] });
    },
  });
}
