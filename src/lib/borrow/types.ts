export type Item = {
  id: string;
  owner_id: string | null;
  owner_display_name: string;
  owner_avatar_color: string;
  distance_mi: number;
  doors_away: string;
  name: string;
  emoji: string;
  category: string;
  synonyms: string[];
  availability: string;
  availability_tags: string[];
  estimated_value: number;
};

export type BorrowRow = {
  id: string;
  item_id: string;
  borrower_id: string;
  dates: string;
  message: string;
  status: "pending" | "approved" | "declined" | "completed";
  created_at: string;
  item?: Pick<Item, "id" | "name" | "emoji" | "owner_display_name"> | null;
};

export type SearchResult = {
  itemIds: string[];
  summary: string;
  whenLabel: string | null;
  isFallback: boolean;
};
