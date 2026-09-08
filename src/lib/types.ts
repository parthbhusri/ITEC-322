export type RentalStatus = "Available" | "Requested" | "Rented" | "Returned";

export type ItemCategory = "Textbook" | "Lab Equipment" | "Calculator" | "Tool";

export type ItemCondition = "New" | "Good" | "Fair" | "Worn";

export interface Item {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  category: ItemCategory;
  condition: ItemCondition;
  price: number;
  status: RentalStatus;
  description: string;
  campusLocation: string;
  ownerName: string;
  coverColor: string;
}

export interface RentalRecord {
  id: string;
  itemId: string;
  renterName: string;
  status: RentalStatus;
  requestedAt: string;
}
