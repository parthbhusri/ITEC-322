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
import { categoryIcon, formatDate, formatPrice, toItem, type Item } from "@/lib/types";

type Tab = "rentals" | "requests" | "listings" | "saved";
const TABS: Tab[] = ["rentals", "requests", "listings", "saved"];

interface Data {
  rentals: ApiRental[];
  requests: ApiRental[];
  listings: Item[];
  allItems: Item[];
}

const smallButton =
  "rounded-md px-3 py-1.5 text-xs font-medium transition-transform duration-150 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100";
const primaryButton = `${smallButton} bg-forest text-paper hover:bg-forest-light`;
const secondaryButton = `${smallButton} border border-forest text-forest hover:bg-sage`;

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
    <div className="flex flex-col gap-3 rounded-lg border border-sage-dark bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <Link href={`/items/${rental.item_id}`} className="group flex flex-1 items-center gap-4">
        <ItemImage
          item={{
            title: rental.item_title ?? "Item",
            coverIcon: categoryIcon(rental.item_category),
            imageUrl: imageSrc(rental.item_image_url),
          }}
          iconClassName="text-3xl"
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sage"
        />
        <div className="min-w-0">
          <p className="font-medium text-forest group-hover:underline">
            {rental.item_title ?? `Item #${rental.item_id}`}
          </p>
          <p className="text-sm text-forest/60">
            {formatDate(rental.start_date)} – {formatDate(rental.end_date)} ·{" "}
            {formatPrice(rental.total_price)}
          </p>
          <p className="text-xs text-forest/50">
            {perspective === "renter"
              ? `From ${rental.owner_name ?? "the owner"}`
              : `Requested by ${rental.renter_name ?? "a student"}`}
            {rental.handoff_location && ` · Hand-off: ${rental.handoff_location}`}
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
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="mb-6 font-serif text-2xl font-semibold text-forest">My Account</h1>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-sage-dark">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative whitespace-nowrap px-4 py-2 text-sm font-medium ${
              tab === t ? "border-b-2 border-forest text-forest" : "text-forest/50 hover:text-forest"
            }`}
          >
            {labels[t]} ({counts[t]})
            {t === "requests" && pendingRequests > 0 && (
              <span className="ml-1.5 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-bold text-paper">
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
            <Link href="/" className="font-medium text-forest underline">
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
                    <span className="text-xs text-forest/50">Payments not set up yet</span>
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
                <Link href="/list-item" className="font-medium text-forest underline">
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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-sage-dark py-20 text-center">
      <p className="text-forest/70">{children}</p>
    </div>
  );
}

function ItemGrid({ items, empty }: { items: Item[]; empty: React.ReactNode }) {
  if (items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
