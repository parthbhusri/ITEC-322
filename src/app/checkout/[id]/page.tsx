"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import ConfettiBurst from "@/components/ConfettiBurst";
import ItemImage from "@/components/ItemImage";
import { ErrorBox, Loading, LoginRequired } from "@/components/PageStatus";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice, rentalDays, todayISO, toItem, type Item } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none";

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const showToast = useToast();

  const [item, setItem] = useState<Item | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Default to tomorrow, for 3 days
  const [startDate, setStartDate] = useState(() => addDays(todayISO(), 1));
  const [endDate, setEndDate] = useState(() => addDays(todayISO(), 3));
  const [handoff, setHandoff] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api
      .item(id)
      .then((data) => {
        const loaded = toItem(data);
        setItem(loaded);
        setHandoff(data.pickup_location ?? "");
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [id]);

  const days = rentalDays(startDate, endDate);
  const total = item ? days * item.price : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!item) return;
    if (!startDate || !endDate || days < 1) {
      setFormError("Choose an end date on or after the start date.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await api.requestRental({
        item_id: Number(item.id),
        start_date: startDate,
        end_date: endDate,
        handoff_location: handoff.trim() || null,
      });
      setSubmitted(true);
      showToast("Request sent!");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return <Loading />;
  if (!user) return <LoginRequired message="Log in to request a rental." />;

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        {loadError ? <ErrorBox message={loadError} /> : <Loading />}
      </div>
    );
  }

  if (user.id === item.ownerId) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="font-serif text-xl font-semibold text-forest">This is your own listing</p>
        <p className="text-sm text-forest/70">You can&apos;t rent an item you listed.</p>
        <Link href={`/items/${item.id}`} className="text-sm font-medium text-forest underline">
          Back to item
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10 md:flex-row">
      <div className="flex-1">
        <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">Request to Rent</h1>

        {submitted ? (
          <div className="relative rounded-lg border border-dashed border-forest bg-sage p-6 text-center">
            <ConfettiBurst />
            <p className="font-medium text-forest">Request sent!</p>
            <p className="mt-1 text-sm text-forest/70">
              {item.ownerName} will review it. Once they approve, you can pay from My Rentals.
            </p>
            <Link
              href="/my-rentals"
              className="mt-4 inline-block rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper hover:bg-forest-light"
            >
              Go to My Rentals
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="start" className="mb-1 block text-sm font-medium text-forest/80">
                  Start date
                </label>
                <input
                  id="start"
                  type="date"
                  required
                  min={todayISO()}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="end" className="mb-1 block text-sm font-medium text-forest/80">
                  End date
                </label>
                <input
                  id="end"
                  type="date"
                  required
                  min={startDate || todayISO()}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="handoff" className="mb-1 block text-sm font-medium text-forest/80">
                Hand-off location
              </label>
              <input
                id="handoff"
                type="text"
                value={handoff}
                onChange={(e) => setHandoff(e.target.value)}
                placeholder="e.g. Library — Main Entrance"
                className={inputClass}
              />
            </div>

            <p className="rounded-md bg-sage px-3 py-2 text-sm text-forest/70">
              No payment yet. The owner approves your request first, then you pay securely
              with Stripe from <strong>My Rentals</strong>.
            </p>

            {formError && <p className="text-sm text-ink">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-forest-light hover:shadow-md disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100"
            >
              {submitting ? "Sending…" : "Send Request"}
            </button>
          </form>
        )}
      </div>

      <aside className="w-full shrink-0 self-start rounded-lg border border-sage-dark bg-sage p-5 md:w-72">
        <h2 className="mb-4 font-serif text-lg font-semibold text-forest">Order Summary</h2>
        <div className="mb-2 flex items-center gap-3">
          <ItemImage
            item={item}
            iconClassName="text-3xl"
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md"
          />
          <div>
            <p className="text-sm font-medium text-forest">{item.title}</p>
            <p className="text-xs text-forest/60">{item.condition}</p>
          </div>
        </div>
        <dl className="mt-4 space-y-2 border-t border-sage-dark pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-forest/70">Price</dt>
            <dd className="font-medium text-forest">{formatPrice(item.price)}/day</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-forest/70">Dates</dt>
            <dd className="text-right font-medium text-forest">
              {days > 0 ? `${formatDate(startDate)} – ${formatDate(endDate)}` : "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-forest/70">Days</dt>
            <dd className="font-medium text-forest">{days}</dd>
          </div>
          <div className="flex justify-between border-t border-sage-dark pt-2">
            <dt className="font-semibold text-forest">Total</dt>
            <dd className="font-semibold text-forest">{formatPrice(total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
