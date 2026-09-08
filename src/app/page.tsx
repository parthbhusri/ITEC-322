"use client";

import { useMemo, useState } from "react";
import ItemCard from "@/components/ItemCard";
import { items } from "@/lib/mock-data";
import type { ItemCategory } from "@/lib/types";

const categories: ItemCategory[] = ["Textbook", "Lab Equipment", "Calculator", "Tool"];

type SortOption = "newest" | "price-asc" | "price-desc";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export default function BrowsePage() {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<ItemCategory[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");

  function toggleCategory(category: ItemCategory) {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const matchesQuery =
        query.trim() === "" ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.author?.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        activeCategories.length === 0 || activeCategories.includes(item.category);
      const matchesAvailability = !availableOnly || item.status === "Available";
      return matchesQuery && matchesCategory && matchesAvailability;
    });

    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [query, activeCategories, availableOnly, sort]);

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-sage-dark bg-sage/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-12 text-center sm:text-left">
          <h1 className="font-serif text-3xl font-semibold text-forest sm:text-4xl">
            Rent what you need, straight from your classmates.
          </h1>
          <p className="max-w-2xl text-forest/70 sm:text-lg">
            Textbooks, calculators, lab gear, and tools — borrowed and returned right on campus.
            No shipping, no markup, just students helping students.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/list-item"
              className="rounded-md bg-forest px-5 py-2.5 text-center text-sm font-semibold text-paper hover:bg-forest-light"
            >
              List an item
            </a>
            <span className="text-sm text-forest/60">
              {items.filter((i) => i.status === "Available").length} items available right now
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
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
            <div className="flex flex-wrap gap-2 md:flex-col md:gap-2">
              {categories.map((category) => {
                const isActive = activeCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={
                      isActive
                        ? "rounded-full border border-forest bg-forest px-3 py-1.5 text-left text-sm font-medium text-paper md:rounded-md"
                        : "rounded-full border border-sage-dark bg-white px-3 py-1.5 text-left text-sm font-medium text-forest/80 hover:border-forest md:rounded-md"
                    }
                  >
                    {category}
                  </button>
                );
              })}
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-serif text-2xl font-semibold text-forest">
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} found
            </h2>
            <label className="flex items-center gap-2 text-sm text-forest/80">
              Sort by
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-md border border-sage-dark bg-white px-2 py-1.5 text-sm text-forest focus:border-forest focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

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
    </div>
  );
}
