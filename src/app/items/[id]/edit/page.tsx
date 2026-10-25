"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import ItemCard from "@/components/ItemCard";
import { ErrorBox, Loading, LoginRequired } from "@/components/PageStatus";
import { useToast } from "@/components/ToastProvider";
import { api, type ApiItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CONDITIONS, LISTING_CATEGORIES, toItem } from "@/lib/types";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const showToast = useToast();

  const [original, setOriginal] = useState<ApiItem | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [pickup, setPickup] = useState("");
  const [isbn, setIsbn] = useState("");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .item(id)
      .then((item) => {
        setOriginal(item);
        setTitle(item.title);
        setCategory(item.category);
        setCondition(item.condition);
        setPrice(Number(item.price_per_day).toString());
        setPickup(item.pickup_location ?? "");
        setIsbn(item.isbn ?? "");
        setDescription(item.description ?? "");
        setAvailable(item.status !== "Unavailable");
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const priceNumber = Number(price);
    if (!(priceNumber > 0)) {
      setError("Enter a daily price above $0.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api.updateItem(id, {
        title: title.trim(),
        category,
        condition,
        price_per_day: priceNumber.toFixed(2),
        pickup_location: pickup.trim() || null,
        isbn: isbn.trim() || null,
        description: description.trim() || null,
        status: available ? "Available" : "Unavailable",
      });
      showToast("Listing saved");
      router.push(`/items/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes");
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteItem(id);
      showToast("Listing deleted");
      router.push("/my-rentals?tab=listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete listing");
      setConfirmingDelete(false);
      setDeleting(false);
    }
  }

  if (authLoading) return <Loading />;
  if (!user) return <LoginRequired message="Log in to edit your listing." />;

  if (!original) {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        {loadError ? <ErrorBox message={loadError} /> : <Loading />}
      </div>
    );
  }

  if (original.owner_id !== user.id || original.status === "Removed") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="panel flex flex-col items-center gap-3 px-8 py-10 text-center">
          <h1 className="font-display text-2xl font-bold">You can&apos;t edit this listing</h1>
          <p className="text-sm text-mocha-600">Only the student who listed it can change it.</p>
          <Link href={`/items/${id}`} className="btn btn-outline mt-2">
            Back to item
          </Link>
        </div>
      </div>
    );
  }

  const preview = toItem({
    ...original,
    title: title || "Your item",
    category,
    condition,
    price_per_day: price || "0",
    status: available ? "Available" : "Unavailable",
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href={`/items/${id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-platinum/60 hover:text-platinum"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to item
      </Link>
      <h1 className="mb-6 font-display text-3xl font-bold tracking-tight text-platinum sm:text-4xl">
        Edit listing
      </h1>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex flex-1 flex-col gap-6">
          <form onSubmit={handleSave} className="panel flex flex-col gap-5 p-6 sm:p-8">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-lavender-50 p-4 ring-1 ring-lavender-200">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-lavender-500"
              />
              <span>
                <span className="block text-sm font-semibold">Available to rent</span>
                <span className="block text-xs text-mocha-600">
                  Untick to pause the listing. It stays visible but nobody can request it.
                </span>
              </span>
            </label>

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
                  {[...new Set([category, ...LISTING_CATEGORIES])].map((c) => (
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
                  {[...new Set([condition, ...CONDITIONS])].map((c) => (
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
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="pickup" className="field-label">
                  Where to meet
                </label>
                <input
                  id="pickup"
                  type="text"
                  maxLength={200}
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="isbn" className="field-label">
                ISBN, for books (optional)
              </label>
              <input
                id="isbn"
                type="text"
                maxLength={20}
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="description" className="field-label">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="field"
              />
            </div>

            <p className="text-xs text-mocha-500">
              To change the photo, use &quot;Change photo&quot; on the item page.
            </p>

            {error && (
              <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="btn btn-primary px-8 py-3 text-base">
                {saving ? "Saving…" : "Save changes"}
              </button>
              <Link href={`/items/${id}`} className="btn btn-outline py-3">
                Cancel
              </Link>
            </div>
          </form>

          <div className="panel flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="font-display text-lg font-semibold">Delete this listing</h2>
              <p className="text-sm text-mocha-600">
                It disappears from the hub and any waiting requests are declined.
              </p>
            </div>
            {confirmingDelete ? (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn btn-sm bg-danger text-white hover:bg-danger/90"
                >
                  {deleting ? "Deleting…" : "Yes, delete it"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="btn btn-outline btn-sm"
                >
                  Keep it
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="btn btn-danger shrink-0"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete listing
              </button>
            )}
          </div>
        </div>

        <aside className="w-full shrink-0 md:sticky md:top-24 md:w-72">
          <p className="mb-2 text-sm text-platinum/60">How it will look</p>
          <ItemCard item={preview} preview />
        </aside>
      </div>
    </div>
  );
}
