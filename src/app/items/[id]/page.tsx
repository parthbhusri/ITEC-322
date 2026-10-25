"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import StampBadge from "@/components/StampBadge";
import FavoriteButton from "@/components/FavoriteButton";
import ItemImage from "@/components/ItemImage";
import { ErrorBox, Loading } from "@/components/PageStatus";
import { ChevronLeft, ImagePlus, MapPin, Pencil, Sparkles, Tag, UserRound } from "lucide-react";
import { Stars } from "@/components/Stars";
import { useToast } from "@/components/ToastProvider";
import { api, ApiError, type ApiReviewSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatPrice, toItem, type Item } from "@/lib/types";

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ownerReviews, setOwnerReviews] = useState<ApiReviewSummary | null>(null);
  const { user } = useAuth();
  const showToast = useToast();

  const load = useCallback(() => {
    api
      .item(id)
      .then((data) => {
        setItem(toItem(data));
        setError(null);
      })
      .catch((err: Error) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(err.message);
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // The owner's rating from past rentals
  const ownerId = item?.ownerId;
  useEffect(() => {
    if (!ownerId) return;
    api
      .userReviews(ownerId)
      .then(setOwnerReviews)
      .catch(() => setOwnerReviews(null));
  }, [ownerId]);

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !item) return;
    setUploading(true);
    try {
      const updated = await api.uploadItemImage(Number(item.id), file);
      setItem(toItem(updated));
      showToast("Photo updated!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="panel flex flex-col items-center gap-3 px-8 py-10 text-center">
          <h1 className="font-display text-2xl font-bold">Item not found</h1>
          <p className="text-sm text-mocha-600">The owner may have removed it.</p>
          <Link href="/" className="btn btn-primary mt-2">
            Back to browsing
          </Link>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        {error ? (
          <ErrorBox
            message={error}
            onRetry={() => {
              setError(null);
              load();
            }}
          />
        ) : (
          <Loading />
        )}
      </div>
    );
  }

  const isOwner = user?.id === item.ownerId;
  const isRemoved = item.status === "Removed";
  const canRent = item.status === "Available" && !isOwner;

  const details = [
    { icon: Sparkles, label: "Condition", value: item.condition },
    { icon: Tag, label: "Category", value: item.category },
    { icon: MapPin, label: "Hand-off", value: item.campusLocation },
    { icon: UserRound, label: "Listed by", value: isOwner ? "You" : item.ownerName },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-platinum/60 hover:text-platinum"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to browsing
      </Link>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.1fr] md:gap-8">
        <div>
          <div className="panel relative overflow-hidden p-3">
            <ItemImage
              title={item.title}
              category={item.category}
              imageUrl={item.imageUrl}
              size="xl"
              className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[0.9rem]"
            />
            <FavoriteButton
              itemId={item.id}
              className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-platinum-50/90 shadow-md ring-1 ring-silver/60 transition-transform duration-150 hover:scale-110"
            />
          </div>
          {isOwner && (
            <label className="btn btn-ghost mt-3 w-full">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {uploading ? "Uploading…" : item.imageUrl ? "Change photo" : "Add a photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhoto}
                disabled={uploading}
                className="sr-only"
              />
            </label>
          )}
        </div>

        <div className="panel flex flex-col gap-5 p-6 sm:p-8">
          <div>
            <StampBadge status={item.status} />
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight">
              {item.title}
            </h1>
            {item.isbn && <p className="mt-1 text-sm text-mocha-500">ISBN {item.isbn}</p>}
          </div>

          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-bold">{formatPrice(item.price)}</span>
            <span className="text-mocha-500">per day</span>
          </p>

          <dl className="grid grid-cols-1 gap-3 rounded-xl bg-platinum p-4 sm:grid-cols-2">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-lavender-700" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-mocha-500">{label}</dt>
                  <dd className="text-sm font-medium">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          {ownerReviews && ownerReviews.review_count > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Stars value={ownerReviews.average_rating ?? 0} />
              <span className="font-semibold">{ownerReviews.average_rating?.toFixed(1)}</span>
              <span className="text-mocha-500">
                from {ownerReviews.review_count} review{ownerReviews.review_count === 1 ? "" : "s"} of{" "}
                {isOwner ? "you" : item.ownerName}
              </span>
            </div>
          )}

          {item.description && (
            <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-mocha-700">
              {item.description}
            </p>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-auto pt-2">
            {isRemoved ? (
              <p className="text-sm text-mocha-500">This listing has been removed.</p>
            ) : isOwner ? (
              <div className="flex flex-wrap gap-3">
                <Link href={`/items/${item.id}/edit`} className="btn btn-primary">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit listing
                </Link>
                <Link href="/my-rentals?tab=requests" className="btn btn-outline">
                  This is your listing. See requests
                </Link>
              </div>
            ) : canRent ? (
              <Link href={`/checkout/${item.id}`} className="btn btn-primary w-full px-8 py-3 text-base sm:w-auto">
                Request to rent
              </Link>
            ) : (
              <p className="text-sm text-mocha-500">This item isn&apos;t available to rent right now.</p>
            )}
          </div>
        </div>
      </div>

      {ownerReviews && ownerReviews.reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl font-semibold text-platinum">
            Reviews of {isOwner ? "you" : item.ownerName}
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ownerReviews.reviews.slice(0, 6).map((review) => (
              <li key={review.id} className="panel flex flex-col gap-2 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Stars value={review.rating} />
                  <span className="text-xs text-mocha-500">{formatDate(review.created_at)}</span>
                </div>
                {review.comment && (
                  <p className="text-[0.95rem] leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                )}
                <p className="text-xs text-mocha-500">
                  {review.reviewer_name ?? "A student"},{" "}
                  {review.reviewer_role === "renter" ? "rented" : "lent them"}{" "}
                  {review.item_title ?? "an item"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
