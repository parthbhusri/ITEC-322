"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import StampBadge from "@/components/StampBadge";
import ItemImage from "@/components/ItemImage";
import { Loading, LoginRequired } from "@/components/PageStatus";
import { useToast } from "@/components/ToastProvider";
import ConfettiBurst from "@/components/ConfettiBurst";
import { api, type ApiItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { categoryIcon, CONDITIONS, formatPrice, LISTING_CATEGORIES } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest placeholder:text-forest/40 focus:border-forest focus:outline-none";

/** Look up a book's title and authors on Open Library (free, no key needed). */
async function lookupIsbn(isbn: string): Promise<{ title: string; author: string } | null> {
  const clean = isbn.replace(/[^0-9Xx]/g, "");
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as Record<
    string,
    { title?: string; authors?: { name: string }[] }
  >;
  const book = data[`ISBN:${clean}`];
  if (!book?.title) return null;
  return {
    title: book.title,
    author: (book.authors ?? []).map((a) => a.name).join(", "),
  };
}

export default function ListItemPage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const showToast = useToast();

  const [isbn, setIsbn] = useState("");
  const [lookupStatus, setLookupStatus] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<string>("Textbook");
  const [condition, setCondition] = useState<string>("Good");
  const [price, setPrice] = useState("");
  const [campusLocation, setCampusLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [university, setUniversity] = useState("");
  const [campus, setCampus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ApiItem | null>(null);

  // Local preview of the chosen photo (released when it changes)
  const previewPhoto = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => {
    return () => {
      if (previewPhoto) URL.revokeObjectURL(previewPhoto);
    };
  }, [previewPhoto]);

  if (authLoading) return <Loading />;
  if (!user) return <LoginRequired message="Log in to list an item for other students to rent." />;

  // The backend needs university + campus on the profile before listing
  const needsProfile = !user.university || !user.campus;

  async function handleLookup() {
    if (!isbn.trim()) return;
    setLookupStatus("Looking up…");
    try {
      const match = await lookupIsbn(isbn);
      if (match) {
        setTitle(match.title);
        setAuthor(match.author);
        setCategory("Textbook");
        setLookupStatus(null);
      } else {
        setLookupStatus("No book found for that ISBN — fill in the details yourself.");
      }
    } catch {
      setLookupStatus("Couldn't reach the book lookup service.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    const priceNumber = Number(price);
    if (!(priceNumber > 0)) {
      setError("Enter a daily price above $0.");
      return;
    }
    if (needsProfile && (!university.trim() || !campus.trim())) {
      setError("Enter your university and campus.");
      return;
    }

    setSubmitting(true);
    try {
      if (needsProfile) {
        setUser(
          await api.updateMe({ university: university.trim(), campus: campus.trim() })
        );
      }

      const fullDescription = [author.trim() && `Author: ${author.trim()}`, description.trim()]
        .filter(Boolean)
        .join("\n\n");

      let item = await api.createItem({
        title: title.trim(),
        description: fullDescription || null,
        category,
        condition,
        price_per_day: priceNumber.toFixed(2),
        isbn: isbn.trim() || null,
        pickup_location: campusLocation.trim() || null,
      });

      if (photo) {
        try {
          item = await api.uploadItemImage(item.id, photo);
        } catch (err) {
          showToast(
            `Listing created, but the photo failed: ${err instanceof Error ? err.message : "upload error"}`
          );
        }
      }

      setCreated(item);
      showToast("Listing created!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create listing");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <ConfettiBurst />
        <p className="font-serif text-xl font-semibold text-forest">Listing created!</p>
        <p className="text-sm text-forest/70">
          &quot;{created.title}&quot; is now visible to other students browsing the hub.
        </p>
        <div className="mt-2 flex gap-3">
          <Link
            href={`/items/${created.id}`}
            className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper hover:bg-forest-light"
          >
            View listing
          </Link>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setIsbn("");
              setTitle("");
              setAuthor("");
              setPrice("");
              setDescription("");
              setPhoto(null);
            }}
            className="rounded-md border border-forest px-4 py-2 text-sm font-medium text-forest hover:bg-sage"
          >
            List another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10 md:flex-row">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <h1 className="mb-2 font-serif text-2xl font-semibold text-forest">List an Item</h1>

        {needsProfile && (
          <div className="rounded-lg border border-ink/30 bg-ink/5 p-4">
            <p className="mb-3 text-sm text-forest">
              Add your university and campus first so renters know where you are.
            </p>
            <div className="flex gap-4">
              <input
                aria-label="University"
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="University"
                className={inputClass}
              />
              <input
                aria-label="Campus"
                type="text"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                placeholder="Campus"
                className={inputClass}
              />
            </div>
          </div>
        )}

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
              maxLength={20}
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="button"
              onClick={handleLookup}
              className="rounded-md border border-forest px-3 py-2 text-sm font-medium text-forest transition-transform duration-150 hover:scale-105 hover:bg-sage"
            >
              Look up
            </button>
          </div>
          {lookupStatus && <p className="mt-1 text-xs text-forest/60">{lookupStatus}</p>}
        </div>

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-forest/80">
            Title
          </label>
          <input
            id="title"
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
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
            className={inputClass}
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
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {LISTING_CATEGORIES.map((c) => (
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
              onChange={(e) => setCondition(e.target.value)}
              className={inputClass}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium text-forest/80">
            Price per day ($)
          </label>
          <input
            id="price"
            type="number"
            min="0.5"
            step="0.5"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="campusLocation" className="mb-1 block text-sm font-medium text-forest/80">
            Campus hand-off location
          </label>
          <input
            id="campusLocation"
            type="text"
            required
            maxLength={200}
            value={campusLocation}
            onChange={(e) => setCampusLocation(e.target.value)}
            placeholder="e.g. Library — Main Entrance"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-forest/80">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            maxLength={900}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="photo" className="mb-1 block text-sm font-medium text-forest/80">
            Photo (optional, JPG/PNG/WebP up to 5 MB)
          </label>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="text-sm text-forest/80 file:mr-3 file:rounded-md file:border file:border-forest file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-forest"
          />
        </div>

        {error && <p className="text-sm text-ink">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-forest-light hover:shadow-md disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100"
        >
          {submitting ? "Creating listing…" : "Create Listing"}
        </button>
      </form>

      <aside className="w-full shrink-0 md:w-64">
        <p className="mb-2 text-xs uppercase tracking-wide text-forest/50">Live Preview</p>
        <div className="group flex flex-col overflow-hidden rounded-lg border border-sage-dark bg-white shadow-sm">
          <ItemImage
            item={{
              title: title || "Preview",
              coverIcon: categoryIcon(category),
              imageUrl: previewPhoto,
            }}
            iconClassName="text-6xl"
          />
          <div className="flex flex-col gap-2 p-4">
            <h3 className="font-semibold text-forest">{title || "Untitled item"}</h3>
            {author && <p className="text-sm text-forest/70">{author}</p>}
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-forest/70">{condition}</span>
              <span className="font-semibold text-forest">
                {formatPrice(Number(price) || 0)}/day
              </span>
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
