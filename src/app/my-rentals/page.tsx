"use client";

import { useState } from "react";
import ItemCard from "@/components/ItemCard";
import { CURRENT_USER, items, rentalHistory } from "@/lib/mock-data";
import { useFavoriteIds } from "@/lib/favorites";

type Tab = "rentals" | "listings" | "saved";

export default function MyRentalsPage() {
  const [tab, setTab] = useState<Tab>("rentals");
  const favoriteIds = useFavoriteIds();

  const rentedItemIds = new Set(
    rentalHistory
      .filter((record) => record.renterName === CURRENT_USER)
      .map((record) => record.itemId)
  );
  const myRentals = items.filter((item) => rentedItemIds.has(item.id));
  const myListings = items.filter((item) => item.ownerName === CURRENT_USER);
  const savedItems = items.filter((item) => favoriteIds.has(item.id));

  const visibleItems =
    tab === "rentals" ? myRentals : tab === "listings" ? myListings : savedItems;

  const emptyMessage =
    tab === "rentals"
      ? "You haven't rented anything yet."
      : tab === "listings"
        ? "You haven't listed anything yet."
        : "You haven't saved anything yet — tap the heart on an item to save it here.";

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">My Account</h1>

      <div className="mb-6 flex gap-2 border-b border-sage-dark">
        <button
          onClick={() => setTab("rentals")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "rentals"
              ? "border-b-2 border-forest text-forest"
              : "text-forest/50 hover:text-forest"
          }`}
        >
          My Rentals ({myRentals.length})
        </button>
        <button
          onClick={() => setTab("listings")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "listings"
              ? "border-b-2 border-forest text-forest"
              : "text-forest/50 hover:text-forest"
          }`}
        >
          My Listings ({myListings.length})
        </button>
        <button
          onClick={() => setTab("saved")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "saved"
              ? "border-b-2 border-forest text-forest"
              : "text-forest/50 hover:text-forest"
          }`}
        >
          Saved ({savedItems.length})
        </button>
      </div>

      {visibleItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-sage-dark py-20 text-center">
          <p className="text-forest/70">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
