"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Calculator, Headphones, Search, X, type LucideIcon } from "lucide-react";
import ItemCard from "@/components/ItemCard";
import { ErrorBox, Loading } from "@/components/PageStatus";
import { api } from "@/lib/api";
import { itemIcon } from "@/lib/itemArt";
import { toItem, type Item } from "@/lib/types";

type SortOption = "newest" | "price-asc" | "price-desc";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

// Decorative hang-tags in the hero
const HERO_TAGS: { icon: LucideIcon; label: string; price: string; tilt: string; className: string }[] = [
  { icon: BookOpen, label: "Textbook", price: "$3", tilt: "-9deg", className: "left-0 top-10" },
  { icon: Headphones, label: "Headphones", price: "$6", tilt: "6deg", className: "left-[38%] top-0" },
  { icon: Calculator, label: "Calculator", price: "$5", tilt: "-3deg", className: "right-0 top-16" },
];

function HeroTag({
  icon: Icon,
  label,
  price,
  tilt,
  className,
  delay,
}: (typeof HERO_TAGS)[number] & { delay: number }) {
  return (
    <div
      className={`hero-tag absolute w-36 ${className}`}
      style={
        {
          "--tilt": tilt,
          "--tilt-start": `calc(${tilt} * -1.5)`,
          animationDelay: `${delay}ms`,
        } as React.CSSProperties
      }
    >
      <svg viewBox="0 0 60 60" className="relative z-10 mx-auto -mb-[38px] h-14 w-14" aria-hidden="true">
        <path d="M30 58C28 38 36 18 56 4" fill="none" stroke="#c9b8ec" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <div
        className="relative bg-platinum-50 px-4 pb-4 pt-9 text-center text-mocha-900 [filter:drop-shadow(0_16px_20px_rgb(20_12_8/0.5))]"
        style={{ clipPath: "polygon(18% 0, 82% 0, 100% 2rem, 100% 100%, 0 100%, 0 2rem)" }}
      >
        <span className="tag-hole !top-3" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lavender-100">
          <Icon className="h-9 w-9 text-lavender-700" strokeWidth={1.4} />
        </div>
        <p className="mt-2 text-xs font-medium text-mocha-500">{label}</p>
        <p className="font-display text-lg font-bold">
          {price}
          <span className="text-xs font-normal text-mocha-500"> / day</span>
        </p>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");
  const resultsRef = useRef<HTMLDivElement>(null);

  const loadItems = useCallback(() => {
    api
      .items()
      .then((data) => {
        setItems(data.map(toItem));
        setLoadError(null);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Categories (with how many items each has), built from the live data
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items ?? []) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  function toggleCategory(category: string) {
    setActiveCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }

  function showCategory(category: string) {
    setActiveCategories([category]);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = (items ?? []).filter((item) => {
      const matchesQuery =
        q === "" ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.isbn?.includes(q);
      const matchesCategory =
        activeCategories.length === 0 || activeCategories.includes(item.category);
      const matchesAvailability = !availableOnly || item.status === "Available";
      return matchesQuery && matchesCategory && matchesAvailability;
    });

    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [items, query, activeCategories, availableOnly, sort]);

  const availableCount = items?.filter((i) => i.status === "Available").length ?? 0;
  const filtersActive = activeCategories.length > 0 || availableOnly || query.trim() !== "";

  return (
    <div className="flex flex-1 flex-col">
      {/* ---------- Hero ---------- */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-10 pt-12 sm:px-6 md:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <h1 className="max-w-xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-platinum sm:text-5xl lg:text-[3.5rem]">
            Borrow it from someone on your campus.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-platinum/70 sm:text-lg">
            Textbooks, calculators, lab gear and tech, rented by the day from students
            nearby. Hand it back when you&apos;re done.
          </p>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-platinum-50 p-1.5 pl-5 shadow-[0_18px_40px_-18px_rgb(20_12_8/0.9)] ring-1 ring-lavender-200/60 focus-within:ring-2 focus-within:ring-lavender-300"
          >
            <Search className="h-5 w-5 shrink-0 text-mocha-500" aria-hidden="true" />
            <label htmlFor="search" className="sr-only">
              Search items
            </label>
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a calculator, a textbook, headphones…"
              className="min-w-0 flex-1 bg-transparent py-2 text-[0.95rem] text-mocha-900 placeholder:text-silver-600 focus:outline-none [color-scheme:light]"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          {categories.length > 0 && (
            <div className="mt-5 flex max-w-xl flex-wrap gap-2">
              {categories.slice(0, 8).map(([category]) => {
                const Icon = itemIcon("", category);
                const isActive = activeCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => (isActive ? toggleCategory(category) : showCategory(category))}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "border-lavender-200 bg-lavender-200 font-semibold text-mocha-900"
                        : "border-platinum/20 bg-mocha-800/60 text-platinum/85 hover:border-lavender-200 hover:bg-lavender-200/10 hover:text-platinum"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-lavender-700" : "text-lavender-200"}`} aria-hidden="true" />
                    {category}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative mx-auto hidden h-72 w-full max-w-md lg:block" aria-hidden="true">
          {HERO_TAGS.map((tag, i) => (
            <HeroTag key={tag.label} {...tag} delay={150 + i * 140} />
          ))}
        </div>
      </section>

      {/* ---------- Results ---------- */}
      <div
        ref={resultsRef}
        className="mx-auto flex w-full max-w-6xl flex-1 scroll-mt-24 flex-col gap-8 px-4 pb-10 sm:px-6 md:flex-row"
      >
        <aside className="w-full shrink-0 md:w-56">
          <div className="flex flex-wrap items-center justify-between gap-x-4 rounded-2xl border border-platinum/10 bg-mocha-800/70 px-5 py-3 md:block md:p-5 md:sticky md:top-24">
            <h2 className="mb-3 hidden font-display text-lg font-semibold text-platinum md:block">
              Filter
            </h2>

            {/* On phones the category chips in the hero do this job */}
            <p className="mb-2 hidden text-sm text-platinum/60 md:block">Category</p>
            <div className="hidden flex-col gap-1 md:flex">
              {categories.map(([category, count]) => {
                const isActive = activeCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => toggleCategory(category)}
                    className={`flex items-center justify-between gap-3 rounded-full px-3 py-1.5 text-left text-sm transition-colors md:rounded-lg ${
                      isActive
                        ? "bg-lavender-200 font-semibold text-mocha-900"
                        : "text-platinum/80 hover:bg-platinum/10 hover:text-platinum"
                    }`}
                  >
                    {category}
                    <span className={isActive ? "text-mocha-700" : "text-platinum/40"}>{count}</span>
                  </button>
                );
              })}
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-platinum/80 md:mt-5">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="h-4 w-4 rounded accent-lavender-300"
              />
              Available only
            </label>

            {filtersActive && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategories([]);
                  setAvailableOnly(false);
                  setQuery("");
                }}
                className="mt-3 inline-flex items-center gap-1 text-sm text-lavender-200 hover:underline md:mt-4"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear filters
              </button>
            )}
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-platinum">
                {items === null
                  ? "Items"
                  : `${filteredItems.length} ${filteredItems.length === 1 ? "item" : "items"} found`}
              </h2>
              {items && (
                <p className="text-sm text-platinum/55">{availableCount} available to rent right now</p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-platinum/70">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-full border border-platinum/20 bg-mocha-800 px-3 py-1.5 text-sm text-platinum focus:border-lavender-300 focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loadError ? (
            <ErrorBox
              message={loadError}
              onRetry={() => {
                setLoadError(null);
                loadItems();
              }}
            />
          ) : items === null ? (
            <Loading label="Loading items…" />
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-platinum/20 px-6 py-20 text-center">
              <p className="text-platinum/70">
                {items.length === 0
                  ? "Nothing has been listed yet. List the first item and it'll show up here."
                  : "Nothing matches those filters. Try a different word or clear the filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
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
