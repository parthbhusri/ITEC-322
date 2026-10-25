"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CircleDollarSign,
  LayoutGrid,
  PackageCheck,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import StampBadge from "@/components/StampBadge";
import { ErrorBox, Loading, LoginRequired } from "@/components/PageStatus";
import { useToast } from "@/components/ToastProvider";
import { api, type ApiAdminStats, type ApiAdminUser, type ApiRental } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice, toItem, type Item } from "@/lib/types";

type Tab = "overview" | "users" | "rentals" | "listings";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "rentals", label: "Rentals" },
  { id: "listings", label: "Listings" },
];

interface AdminData {
  stats: ApiAdminStats;
  users: ApiAdminUser[];
  rentals: ApiRental[];
  items: Item[];
}

const RENTAL_ORDER = ["Requested", "Approved", "Active", "Completed", "Rejected", "Cancelled"];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  if (authLoading) return <Loading />;
  if (!user) return <LoginRequired message="Log in with an admin account to open the dashboard." />;
  if (!isAdmin) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="panel flex flex-col items-center gap-3 px-8 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lavender-100">
            <ShieldCheck className="h-7 w-7 text-lavender-700" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold">Admins only</h1>
          <p className="text-sm text-mocha-600">
            Your account doesn&apos;t have admin access. Ask the project admin to run{" "}
            <code className="rounded bg-platinum px-1 py-0.5 text-xs">make_admin.py</code> for your
            email.
          </p>
          <Link href="/" className="btn btn-outline mt-2">
            Back to browsing
          </Link>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const showToast = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.all([api.adminStats(), api.adminUsers(), api.adminRentals(), api.items()])
        .then(([stats, users, rentals, items]) => {
          setData({ stats, users, rentals, items: items.map(toItem) });
          setError(null);
        })
        .catch((err: Error) => setError(err.message)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  async function removeListing(item: Item) {
    setBusyId(item.id);
    try {
      await api.adminRemoveItem(item.id);
      showToast(`Removed "${item.title}"`);
      setConfirmId(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove listing");
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const users = useMemo(
    () =>
      (data?.users ?? []).filter(
        (u) =>
          !q ||
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.university ?? "").toLowerCase().includes(q)
      ),
    [data, q]
  );
  const rentals = useMemo(
    () =>
      (data?.rentals ?? []).filter(
        (r) =>
          !q ||
          (r.item_title ?? "").toLowerCase().includes(q) ||
          (r.renter_name ?? "").toLowerCase().includes(q) ||
          (r.owner_name ?? "").toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
      ),
    [data, q]
  );
  const items = useMemo(
    () =>
      (data?.items ?? []).filter(
        (i) =>
          !q ||
          i.title.toLowerCase().includes(q) ||
          i.ownerName.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      ),
    [data, q]
  );

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <ErrorBox
          message={error}
          onRetry={() => {
            setError(null);
            load();
          }}
        />
      </div>
    );
  }
  if (!data) return <Loading />;

  const { stats } = data;
  const metrics = [
    { label: "Students", value: String(stats.users), icon: Users },
    { label: "Listings", value: String(stats.listings), icon: LayoutGrid },
    { label: "Available now", value: String(stats.available_listings), icon: PackageCheck },
    { label: "Rentals", value: String(stats.rentals), icon: ArrowLeftRight },
    { label: "Paid through Stripe", value: formatPrice(stats.revenue), icon: CircleDollarSign },
  ];

  const byCategory = new Map<string, number>();
  for (const item of data.items) byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-platinum sm:text-4xl">
        Admin dashboard
      </h1>
      <p className="mb-6 mt-1.5 text-platinum/65">Everything happening on the hub.</p>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          className="flex w-full gap-1 overflow-x-auto rounded-full bg-mocha-900/60 p-1 ring-1 ring-platinum/10 sm:w-fit"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                setConfirmId(null);
              }}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-platinum-50 text-mocha-900 shadow-sm"
                  : "text-platinum/65 hover:text-platinum"
              }`}
            >
              {t.label}
              {t.id === "users" && ` (${stats.users})`}
              {t.id === "rentals" && ` (${stats.rentals})`}
              {t.id === "listings" && ` (${stats.listings})`}
            </button>
          ))}
        </div>

        {tab !== "overview" && (
          <label className="flex items-center gap-2 rounded-full bg-platinum-50 px-4 py-2 ring-1 ring-lavender-200/60 focus-within:ring-2 focus-within:ring-lavender-300 sm:w-72">
            <Search className="h-4 w-4 text-mocha-500" aria-hidden="true" />
            <span className="sr-only">Search</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${tab}…`}
              className="min-w-0 flex-1 bg-transparent text-sm text-mocha-900 placeholder:text-silver-600 focus:outline-none [color-scheme:light]"
            />
          </label>
        )}
      </div>

      {tab === "overview" && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            {metrics.map((metric) => (
              <div key={metric.label} className="panel flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lavender-100">
                  <metric.icon className="h-5 w-5 text-lavender-700" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-2xl font-bold leading-none">{metric.value}</p>
                  <p className="mt-1 text-xs text-mocha-500">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="panel p-6">
              <h2 className="mb-4 font-display text-lg font-semibold">Rentals by status</h2>
              {stats.rentals === 0 ? (
                <p className="text-sm text-mocha-500">No rentals yet.</p>
              ) : (
                <ul className="space-y-3">
                  {RENTAL_ORDER.filter((s) => stats.rentals_by_status[s]).map((status) => {
                    const count = stats.rentals_by_status[status];
                    return (
                      <li key={status} className="flex items-center gap-3">
                        <span className="w-28 shrink-0">
                          <StampBadge status={status} />
                        </span>
                        <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-platinum">
                          <span
                            className="block h-full rounded-full bg-lavender-500"
                            style={{ width: `${(count / stats.rentals) * 100}%` }}
                          />
                        </span>
                        <span className="w-8 text-right text-sm font-semibold">{count}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="panel p-6">
              <h2 className="mb-4 font-display text-lg font-semibold">Listings by category</h2>
              <ul className="space-y-3">
                {[...byCategory.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => (
                    <li key={category} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 truncate text-sm">{category}</span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-platinum">
                        <span
                          className="block h-full rounded-full bg-mocha-300"
                          style={{ width: `${(count / Math.max(1, data.items.length)) * 100}%` }}
                        />
                      </span>
                      <span className="w-8 text-right text-sm font-semibold">{count}</span>
                    </li>
                  ))}
              </ul>
            </section>
          </div>
        </>
      )}

      {tab === "users" && (
        <Table
          empty="No users match that search."
          head={["Name", "Email", "University", "Listings", "Rentals", "Role"]}
          rows={users.map((u) => [
            <span key="n" className="font-medium">{u.full_name}</span>,
            <span key="e" className="text-mocha-600">{u.email}</span>,
            <span key="u" className="text-mocha-600">
              {[u.university, u.campus].filter(Boolean).join(", ") || "Not set"}
            </span>,
            u.listing_count,
            u.rental_count,
            u.role === "admin" ? (
              <span key="r" className="rounded-full bg-lavender-200 px-2 py-0.5 text-xs font-semibold">
                Admin
              </span>
            ) : (
              <span key="r" className="text-xs text-mocha-500">Student</span>
            ),
          ])}
        />
      )}

      {tab === "rentals" && (
        <Table
          empty="No rentals match that search."
          head={["Item", "Renter", "Owner", "Dates", "Total", "Status", "Payment"]}
          rows={rentals.map((r) => [
            <Link key="i" href={`/items/${r.item_id}`} className="font-medium hover:underline">
              {r.item_title ?? `Item #${r.item_id}`}
            </Link>,
            r.renter_name ?? "",
            r.owner_name ?? "",
            <span key="d" className="whitespace-nowrap text-mocha-600">
              {formatDate(r.start_date)} to {formatDate(r.end_date)}
            </span>,
            formatPrice(r.total_price),
            <StampBadge key="s" status={r.status} />,
            <span key="p" className={r.payment_status === "Paid" ? "font-semibold" : "text-mocha-500"}>
              {r.payment_status}
            </span>,
          ])}
        />
      )}

      {tab === "listings" && (
        <Table
          empty="No listings match that search."
          head={["Item", "Listed by", "Category", "Price", "Status", ""]}
          rows={items.map((item) => [
            <Link key="i" href={`/items/${item.id}`} className="font-medium hover:underline">
              {item.title}
            </Link>,
            item.ownerName,
            item.category,
            <span key="p" className="whitespace-nowrap">{formatPrice(item.price)} per day</span>,
            <StampBadge key="s" status={item.status} />,
            confirmId === item.id ? (
              <span key="a" className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => removeListing(item)}
                  className="btn btn-sm bg-danger text-white hover:bg-danger/90"
                >
                  {busyId === item.id ? "Removing…" : "Remove"}
                </button>
                <button type="button" onClick={() => setConfirmId(null)} className="btn btn-outline btn-sm">
                  Keep
                </button>
              </span>
            ) : (
              <span key="a" className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmId(item.id)}
                  aria-label={`Remove ${item.title}`}
                  className="btn btn-danger btn-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </span>
            ),
          ])}
        />
      )}
    </div>
  );
}

function Table({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-platinum/20 px-6 py-16 text-center text-platinum/70">
        {empty}
      </div>
    );
  }
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-platinum text-mocha-600">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-silver/60">
          {rows.map((cells, r) => (
            <tr key={r}>
              {cells.map((cell, c) => (
                <td key={c} className="px-4 py-3 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
