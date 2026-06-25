export type Item = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  owner: { name: string; avatarColor: string };
  distanceMi: number;
  doorsAway: string;
  availability: string;
  availabilityTags: string[];
  estimatedValue: number;
  synonyms: string[];
};

export type BorrowRequest = {
  id: string;
  itemId: string;
  itemName: string;
  itemEmoji: string;
  ownerName: string;
  dates: string;
  message: string;
  status: "Pending" | "Approved";
  createdAt: number;
};
