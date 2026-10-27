"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import ItemCard from "@/components/ItemCard";
import { Camera, ImagePlus, ScanBarcode } from "lucide-react";
import { Loading, LoginRequired } from "@/components/PageStatus";
import { useToast } from "@/components/ToastProvider";
import ConfettiBurst from "@/components/ConfettiBurst";
import { api, type ApiItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CONDITIONS, LISTING_CATEGORIES } from "@/lib/types";


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
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="panel relative flex flex-col items-center gap-3 px-8 py-10 text-center">
          <ConfettiBurst />
          <h1 className="font-display text-2xl font-bold">Listing created!</h1>
          <p className="text-sm text-mocha-600">
            &quot;{created.title}&quot; is now visible to other students browsing the hub.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Link href={`/items/${created.id}`} className="btn btn-primary">
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
              className="btn btn-outline"
            >
              List another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-platinum sm:text-4xl">
        List an item
      </h1>
      <p className="mb-6 mt-1.5 text-platinum/65">
        Earn a little from things you aren&apos;t using. You approve every request.
      </p>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <form onSubmit={handleSubmit} className="panel flex flex-1 flex-col gap-5 p-6 sm:p-8">
          {needsProfile && (
            <div className="rounded-xl bg-lavender-50 p-4 ring-1 ring-lavender-200">
              <p className="mb-3 text-sm font-medium">
                Add your university and campus first so renters know where you are.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  aria-label="University"
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="University"
                  className="field"
                />
                <input
                  aria-label="Campus"
                  type="text"
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  placeholder="Campus"
                  className="field"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="isbn" className="field-label">
              ISBN, for books (optional)
            </label>
            <div className="flex gap-2">
              <input
                id="isbn"
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978…"
                maxLength={20}
                className="field flex-1"
              />
              <button type="button" onClick={handleLookup} className="btn btn-outline">
                <ScanBarcode className="h-4 w-4" aria-hidden="true" />
                Look up
              </button>
            </div>
            {lookupStatus && <p className="mt-1.5 text-xs text-mocha-500">{lookupStatus}</p>}
          </div>

          <div>
            <label htmlFor="title" className="field-label">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Noise-cancelling headphones"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="author" className="field-label">
              Author (optional)
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="field"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="field-label">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="field"
              >
                {LISTING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="condition" className="field-label">
                Condition
              </label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="field"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="field-label">
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
                placeholder="3"
                className="field"
              />
            </div>
            <div>
              <label htmlFor="campusLocation" className="field-label">
                Where to meet
              </label>
              <input
                id="campusLocation"
                type="text"
                required
                maxLength={200}
                value={campusLocation}
                onChange={(e) => setCampusLocation(e.target.value)}
                placeholder="e.g. Library main entrance"
                className="field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="field-label">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              maxLength={900}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anything a renter should know: what's included, any wear and tear."
              className="field"
            />
          </div>

          <div>
            <span className="field-label">Photo (optional)</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Phones and tablets only: opens the camera straight away */}
              <label
                htmlFor="photo-camera"
                className="hidden cursor-pointer items-center justify-center gap-2 rounded-xl border border-lavender-500 bg-lavender-50 px-4 py-3 text-sm font-medium text-lavender-700 transition-colors hover:bg-lavender-100 pointer-coarse:flex"
              >
                <Camera className="h-5 w-5" aria-hidden="true" />
                Take photo
              </label>
              <label
                htmlFor="photo"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-silver bg-white px-4 py-3 text-sm text-mocha-600 transition-colors hover:border-lavender-500 hover:bg-lavender-50"
              >
                <ImagePlus className="h-5 w-5 shrink-0 text-lavender-700" aria-hidden="true" />
                <span className="truncate">{photo ? photo.name : "Choose a JPG, PNG or WebP photo"}</span>
              </label>
            </div>
            <input
              id="photo-camera"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn btn-primary mt-1 py-3 text-base">
            {submitting ? "Creating listing…" : "Create listing"}
          </button>
        </form>

        <aside className="w-full shrink-0 md:sticky md:top-24 md:w-72">
          <p className="mb-2 text-sm text-platinum/60">How it will look</p>
          <ItemCard
            item={{
              id: "preview",
              ownerId: 0,
              title: title || "Your item",
              category,
              condition,
              price: Number(price) || 0,
              status: "Available",
              description,
              campusLocation,
              ownerName: "",
              imageUrl: previewPhoto,
            }}
            preview
          />
        </aside>
      </div>
    </div>
  );
}
