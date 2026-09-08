"use client";

import { useState, type FormEvent } from "react";
import StampBadge from "@/components/StampBadge";
import { useToast } from "@/components/ToastProvider";
import ConfettiBurst from "@/components/ConfettiBurst";
import { CATEGORY_ICONS, type ItemCategory, type ItemCondition } from "@/lib/types";

const categories: ItemCategory[] = ["Textbook", "Lab Equipment", "Calculator", "Tool"];
const conditions: ItemCondition[] = ["New", "Good", "Fair", "Worn"];

const MOCK_ISBN_LOOKUP: Record<string, { title: string; author: string }> = {
  "9780262046305": { title: "Introduction to Algorithms", author: "Cormen, Leiserson, Rivest, Stein" },
  "9781119316179": { title: "Organic Chemistry", author: "Klein" },
};

export default function ListItemPage() {
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Textbook");
  const [condition, setCondition] = useState<ItemCondition>("Good");
  const [price, setPrice] = useState("");
  const [campusLocation, setCampusLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const showToast = useToast();

  function handleLookup() {
    const match = MOCK_ISBN_LOOKUP[isbn.trim()];
    if (match) {
      setTitle(match.title);
      setAuthor(match.author);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    showToast("Listing created!");
  }

  if (submitted) {
    return (
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <ConfettiBurst />
        <p className="font-serif text-xl font-semibold text-forest">Listing created!</p>
        <p className="text-sm text-forest/70">
          &quot;{title || "Your item"}&quot; is now visible to other students browsing the hub.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10 md:flex-row">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <h1 className="mb-2 font-serif text-2xl font-semibold text-forest">List an Item</h1>

        <div>
          <label htmlFor="isbn" className="mb-1 block text-sm font-medium text-forest/80">
            ISBN (books only)
          </label>
          <div className="flex gap-2">
            <input
              id="isbn"
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="978..."
              className="flex-1 rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest placeholder:text-forest/40 focus:border-forest focus:outline-none"
            />
            <button
              type="button"
              onClick={handleLookup}
              className="rounded-md border border-forest px-3 py-2 text-sm font-medium text-forest transition-transform duration-150 hover:scale-105 hover:bg-sage"
            >
              Look up
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-forest/80">
            Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="author" className="mb-1 block text-sm font-medium text-forest/80">
            Author (optional)
          </label>
          <input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-forest/80">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="condition" className="mb-1 block text-sm font-medium text-forest/80">
              Condition
            </label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value as ItemCondition)}
              className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
            >
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium text-forest/80">
            Price per week ($)
          </label>
          <input
            id="price"
            type="number"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="campusLocation"
            className="mb-1 block text-sm font-medium text-forest/80"
          >
            Campus hand-off location
          </label>
          <input
            id="campusLocation"
            type="text"
            required
            value={campusLocation}
            onChange={(e) => setCampusLocation(e.target.value)}
            placeholder="e.g. Library — Main Entrance"
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest placeholder:text-forest/40 focus:border-forest focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-forest/80"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="mt-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-forest-light hover:shadow-md"
        >
          Create Listing
        </button>
      </form>

      <aside className="w-full shrink-0 md:w-64">
        <p className="mb-2 text-xs uppercase tracking-wide text-forest/50">Live Preview</p>
        <div className="group flex flex-col overflow-hidden rounded-lg border border-sage-dark bg-white shadow-sm">
          <div className="flex aspect-[3/4] items-center justify-center">
            <span className="text-6xl transition-transform duration-300 ease-out group-hover:scale-125">
              {CATEGORY_ICONS[category]}
            </span>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <h3 className="font-semibold text-forest">{title || "Untitled item"}</h3>
            {author && <p className="text-sm text-forest/70">{author}</p>}
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-forest/70">{condition}</span>
              <span className="font-semibold text-forest">${price || "0"}/wk</span>
            </div>
            <div className="mt-2">
              <StampBadge status="Available" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
