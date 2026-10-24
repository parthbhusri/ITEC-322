"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, Info } from "lucide-react";
import ConfettiBurst from "@/components/ConfettiBurst";
import ItemImage from "@/components/ItemImage";
import { ErrorBox, Loading, LoginRequired } from "@/components/PageStatus";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice, rentalDays, todayISO, toItem, type Item } from "@/lib/types";

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
        setItem(toItem(data));
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
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        {loadError ? <ErrorBox message={loadError} /> : <Loading />}
      </div>
    );
  }

  if (user.id === item.ownerId) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="panel flex flex-col items-center gap-3 px-8 py-10 text-center">
          <h1 className="font-display text-2xl font-bold">This is your own listing</h1>
          <p className="text-sm text-mocha-600">You can&apos;t rent an item you listed.</p>
          <Link href={`/items/${item.id}`} className="btn btn-outline mt-2">
            Back to item
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href={`/items/${item.id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-platinum/60 hover:text-platinum"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to item
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="panel flex-1 p-6 sm:p-8">
          <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">Request to rent</h1>

          {submitted ? (
            <div className="relative rounded-2xl bg-lavender-100 p-8 text-center">
              <ConfettiBurst />
              <p className="font-display text-xl font-bold">Request sent!</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-mocha-700">
                {item.ownerName} will review it. Once they approve, you can pay from My Rentals.
              </p>
              <Link href="/my-rentals" className="btn btn-primary mt-5">
                Go to My Rentals
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="start" className="field-label">
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
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="end" className="field-label">
                    End date
                  </label>
                  <input
                    id="end"
                    type="date"
                    required
                    min={startDate || todayISO()}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="handoff" className="field-label">
                  Where to meet
                </label>
                <input
                  id="handoff"
                  type="text"
                  value={handoff}
                  onChange={(e) => setHandoff(e.target.value)}
                  placeholder="e.g. Library main entrance"
                  className="field"
                />
              </div>

              <p className="flex gap-2.5 rounded-xl bg-lavender-50 px-4 py-3 text-sm text-mocha-700 ring-1 ring-lavender-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-lavender-700" aria-hidden="true" />
                <span>
                  You won&apos;t pay yet. The owner approves your request first, then you pay
                  with Stripe from My Rentals.
                </span>
              </p>

              {formError && <p className="text-sm text-danger">{formError}</p>}

              <button type="submit" disabled={submitting} className="btn btn-primary py-3 text-base">
                {submitting ? "Sending…" : "Send request"}
              </button>
            </form>
          )}
        </div>

        <aside className="panel w-full shrink-0 overflow-hidden md:w-80">
          <ItemImage
            title={item.title}
            category={item.category}
            imageUrl={item.imageUrl}
            className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden"
          />
          <div className="p-5">
            <p className="text-xs text-mocha-500">{item.category}</p>
            <h2 className="font-display text-lg font-semibold leading-snug">{item.title}</h2>
            <dl className="mt-4 space-y-2 border-t border-silver/70 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-mocha-500">Price</dt>
                <dd className="font-medium">{formatPrice(item.price)} per day</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-mocha-500">Dates</dt>
                <dd className="text-right font-medium">
                  {days > 0 ? `${formatDate(startDate)} to ${formatDate(endDate)}` : "Choose dates"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mocha-500">Days</dt>
                <dd className="font-medium">{days}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-silver/70 pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-2xl font-bold">{formatPrice(total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
