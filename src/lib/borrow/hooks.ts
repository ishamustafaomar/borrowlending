import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listItems,
  listMyBorrows,
  getImpact,
  smartSearch,
  requestBorrow,
  createItem,
  approveBorrow,
} from "./api.functions";

export function useItems() {
  const fn = useServerFn(listItems);
  return useQuery({ queryKey: ["items"], queryFn: () => fn() });
}

export function useMyBorrows() {
  const fn = useServerFn(listMyBorrows);
  return useQuery({
    queryKey: ["borrows"],
    queryFn: () => fn(),
    refetchInterval: 5000,
  });
}

export function useImpact() {
  const fn = useServerFn(getImpact);
  return useQuery({ queryKey: ["impact"], queryFn: () => fn() });
}

export function useSmartSearch(query: string) {
  const fn = useServerFn(smartSearch);
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => fn({ data: { query } }),
    placeholderData: (prev) => prev,
  });
}

export function useRequestBorrow() {
  const fn = useServerFn(requestBorrow);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; dates: string; message: string }) =>
      fn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["borrows"] });
      qc.invalidateQueries({ queryKey: ["impact"] });
    },
  });
}

export function useCreateItem() {
  const fn = useServerFn(createItem);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      emoji: string;
      category: string;
      availability: string;
    }) => fn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

export function useApproveBorrow() {
  const fn = useServerFn(approveBorrow);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["borrows"] }),
  });
}
