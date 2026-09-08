"use client";

import { useMemo, useState } from "react";
import ItemCard from "@/components/ItemCard";
import { items } from "@/lib/mock-data";
import type { ItemCategory } from "@/lib/types";

const categories: ItemCategory[] = ["Textbook", "Lab Equipment", "Calculator", "Tool"];

export default function BrowsePage() {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<ItemCategory[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);

  function toggleCategory(category: ItemCategory) {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery =
        query.trim() === "" ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.author?.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        activeCategories.length === 0 || activeCategories.includes(item.category);
      const matchesAvailability = !availableOnly || item.status === "Available";
      return matchesQuery && matchesCategory && matchesAvailability;
    });
  }, [query, activeCategories, availableOnly]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 gap-8 px-6 py-10">
      <aside className="w-56 shrink-0">
        <h2 className="mb-3 font-serif text-lg font-semibold text-forest">Filters</h2>

        <div className="mb-6">
          <label htmlFor="search" className="mb-1 block text-sm font-medium text-forest/80">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title or author"
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest placeholder:text-forest/40 focus:border-forest focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-forest/80">Category</p>
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <label key={category} className="flex items-center gap-2 text-sm text-forest/80">
                <input
                  type="checkbox"
                  checked={activeCategories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  className="h-4 w-4 rounded border-sage-dark accent-forest"
                />
                {category}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-forest/80">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="h-4 w-4 rounded border-sage-dark accent-forest"
          />
          Available only
        </label>
      </aside>

      <div className="flex-1">
        <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">
          Browse Listings
        </h1>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-sage-dark py-20 text-center">
            <p className="text-forest/70">No items match — try widening your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
