"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ItemCard from "@/components/ItemCard";
import ItemImage from "@/components/ItemImage";
import StampBadge from "@/components/StampBadge";
import { ErrorBox, Loading, LoginRequired } from "@/components/PageStatus";
import { useToast } from "@/components/ToastProvider";
import { api, imageSrc, type ApiRental } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useFavoriteIds } from "@/lib/favorites";
import { formatDate, formatPrice, toItem, type Item } from "@/lib/types";
import { CalendarDays } from "lucide-react";

type Tab = "rentals" | "requests" | "listings" | "saved";
const TABS: Tab[] = ["rentals", "requests", "listings", "saved"];

interface Data {
  rentals: ApiRental[];
  requests: ApiRental[];
  listings: Item[];
  allItems: Item[];
}

const primaryButton = "btn btn-primary btn-sm";
const secondaryButton = "btn btn-outline btn-sm";

function RentalRow({
  rental,
  perspective,
  children,
}: {
  rental: ApiRental;
  perspective: "renter" | "owner";
  children?: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link href={`/items/${rental.item_id}`} className="group flex flex-1 items-center gap-4">
        <ItemImage
          title={rental.item_title ?? "Item"}
          category={rental.item_category}
          imageUrl={imageSrc(rental.item_image_url)}
          size="sm"
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        />
        <div className="min-w-0">
          <p className="font-display font-semibold group-hover:underline">
            {rental.item_title ?? `Item #${rental.item_id}`}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-mocha-600">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(rental.start_date)} to {formatDate(rental.end_date)}
            <span className="font-semibold text-mocha-900">{formatPrice(rental.total_price)}</span>
          </p>
          <p className="mt-0.5 text-xs text-mocha-500">
            {perspective === "renter"
              ? `From ${rental.owner_name ?? "the owner"}`
              : `Requested by ${rental.renter_name ?? "a student"}`}
            {rental.handoff_location && `, meeting at ${rental.handoff_location}`}
          </p>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <StampBadge status={rental.status} />
        {["Approved", "Active", "Completed"].includes(rental.status) && (
          <StampBadge status={rental.payment_status === "Paid" ? "Paid" : "Unpaid"} />
        )}
        {children}
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary in this Next.js version
export default function MyRentalsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MyRentals />
    </Suspense>
  );
}

function MyRentals() {
  const { user, loading: authLoading } = useAuth();
  const showToast = useToast();
  const favoriteIds = useFavoriteIds();

  // Open a specific tab from the URL, e.g. /my-rentals?tab=requests,
  // until the user clicks a different tab
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [chosenTab, setTab] = useState<Tab | null>(null);
  const tab: Tab = chosenTab ?? (TABS.includes(urlTab as Tab) ? (urlTab as Tab) : "rentals");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);

  const load = useCallback(
    (): Promise<ApiRental[] | null> =>
      Promise.all([
        api.myRentals(),
        api.receivedRequests(),
        api.myItems(),
        api.items(),
        api.paymentConfig().catch(() => ({ enabled: false })),
      ])
        .then(([rentals, requests, listings, allItems, payments]) => {
          setPaymentsEnabled(payments.enabled);
          setData({
            rentals,
            requests,
            listings: listings.map(toItem),
            allItems: allItems.map(toItem),
          });
          setError(null);
          return rentals;
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Could not load your rentals");
          return null;
        }),
    []
  );

  useEffect(() => {
    if (!user) return;
    load().then(async (rentals) => {
      // Back from Stripe Checkout: confirm the payment with the backend
      const params = new URLSearchParams(window.location.search);
      const payment = params.get("payment");
      if (!payment) return;
      window.history.replaceState(null, "", "/my-rentals");
      if (payment === "cancelled") {
        showToast("Payment cancelled — you can try again any time.");
        return;
      }
      const unpaid = (rentals ?? []).filter(
        (r) => r.status === "Approved" && r.payment_status !== "Paid"
      );
      const results = await Promise.all(
        unpaid.map((r) => api.verifyPayment(r.id).catch(() => null))
      );
      if (results.some((r) => r?.payment_status === "Paid")) {
        showToast("Payment received — thank you!");
        load();
      } else {
        showToast("Payment is still processing. Refresh in a moment.");
      }
    });
  }, [user, load, showToast]);

  async function act(id: number, action: () => Promise<unknown>, message: string) {
    setBusyId(id);
    try {
      await action();
      showToast(message);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function pay(rental: ApiRental) {
    setBusyId(rental.id);
    try {
      const { checkout_url } = await api.startCheckout(rental.id);
      window.location.href = checkout_url;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not start payment");
      setBusyId(null);
    }
  }

  if (authLoading) return <Loading />;
  if (!user) return <LoginRequired message="Log in to see your rentals, requests and listings." />;

  const savedItems = (data?.allItems ?? []).filter((item) => favoriteIds.has(item.id));
  const pendingRequests = (data?.requests ?? []).filter((r) => r.status === "Requested").length;

  const counts: Record<Tab, number> = {
    rentals: data?.rentals.length ?? 0,
    requests: data?.requests.length ?? 0,
    listings: data?.listings.length ?? 0,
    saved: savedItems.length,
  };
  const labels: Record<Tab, string> = {
    rentals: "My Rentals",
    requests: "Requests",
    listings: "My Listings",
    saved: "Saved",
  };

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-bold tracking-tight text-platinum sm:text-4xl">My account</h1>

      <div role="tablist" className="mb-6 flex w-full gap-1 overflow-x-auto rounded-full bg-mocha-900/60 p-1 ring-1 ring-platinum/10 sm:w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            role="tab"
            aria-selected={tab === t}
            className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-platinum-50 text-mocha-900 shadow-sm"
                : "text-platinum/65 hover:text-platinum"
            }`}
          >
            {labels[t]} ({counts[t]})
            {t === "requests" && pendingRequests > 0 && (
              <span className="ml-1.5 rounded-full bg-lavender-200 px-1.5 py-0.5 text-[10px] font-bold text-mocha-900">
                {pendingRequests} new
              </span>
            )}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorBox
          message={error}
          onRetry={() => {
            setError(null);
            load();
          }}
        />
      ) : !data ? (
        <Loading />
      ) : tab === "rentals" ? (
        data.rentals.length === 0 ? (
          <Empty>
            You haven&apos;t rented anything yet.{" "}
            <Link href="/" className="font-semibold text-lavender-200 underline-offset-2 hover:underline">
              Browse items
            </Link>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {data.rentals.map((rental) => (
              <RentalRow key={rental.id} rental={rental} perspective="renter">
                {rental.status === "Requested" && (
                  <button
                    type="button"
                    disabled={busyId === rental.id}
                    onClick={() =>
                      act(rental.id, () => api.cancelRental(rental.id), "Request cancelled")
                    }
                    className={secondaryButton}
                  >
                    Cancel
                  </button>
                )}
                {rental.status === "Approved" && rental.payment_status !== "Paid" &&
                  (paymentsEnabled ? (
                    <button
                      type="button"
                      disabled={busyId === rental.id}
                      onClick={() => pay(rental)}
                      className={primaryButton}
                    >
                      {busyId === rental.id ? "Opening Stripe…" : `Pay ${formatPrice(rental.total_price)}`}
                    </button>
                  ) : (
                    <span className="text-xs text-mocha-500">Payments not set up yet</span>
                  ))}
              </RentalRow>
            ))}
          </div>
        )
      ) : tab === "requests" ? (
        data.requests.length === 0 ? (
          <Empty>No one has requested your items yet.</Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {data.requests.map((rental) => (
              <RentalRow key={rental.id} rental={rental} perspective="owner">
                {rental.status === "Requested" && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === rental.id}
                      onClick={() =>
                        act(rental.id, () => api.decideRental(rental.id, "approve"), "Request approved")
                      }
                      className={primaryButton}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === rental.id}
                      onClick={() =>
                        act(rental.id, () => api.decideRental(rental.id, "reject"), "Request rejected")
                      }
                      className={secondaryButton}
                    >
                      Reject
                    </button>
                  </>
                )}
                {rental.status === "Approved" && (
                  <button
                    type="button"
                    disabled={busyId === rental.id}
                    onClick={() =>
                      act(rental.id, () => api.startRental(rental.id), "Marked as handed over")
                    }
                    className={primaryButton}
                  >
                    Mark handed over
                  </button>
                )}
                {rental.status === "Active" && (
                  <button
                    type="button"
                    disabled={busyId === rental.id}
                    onClick={() =>
                      act(rental.id, () => api.completeRental(rental.id), "Marked as returned")
                    }
                    className={primaryButton}
                  >
                    Mark returned
                  </button>
                )}
              </RentalRow>
            ))}
          </div>
        )
      ) : (
        <ItemGrid
          items={tab === "listings" ? data.listings : savedItems}
          empty={
            tab === "listings" ? (
              <>
                You haven&apos;t listed anything yet.{" "}
                <Link href="/list-item" className="font-semibold text-lavender-200 underline-offset-2 hover:underline">
                  List an item
                </Link>
              </>
            ) : (
              "You haven't saved anything yet — tap the heart on an item to save it here."
            )
          }
        />
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-platinum/20 px-6 py-20 text-center">
      <p className="text-platinum/70">{children}</p>
    </div>
  );
}

function ItemGrid({ items, empty }: { items: Item[]; empty: React.ReactNode }) {
  if (items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
