"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import StampBadge from "@/components/StampBadge";
import FavoriteButton from "@/components/FavoriteButton";
import ItemImage from "@/components/ItemImage";
import { ErrorBox, Loading } from "@/components/PageStatus";
import { ChevronLeft, ImagePlus, MapPin, Sparkles, Tag, UserRound } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice, toItem, type Item } from "@/lib/types";

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
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

          {item.description && (
            <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-mocha-700">
              {item.description}
            </p>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-auto pt-2">
            {isOwner ? (
              <Link href="/my-rentals?tab=requests" className="btn btn-outline w-full sm:w-auto">
                This is your listing. See requests
              </Link>
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
    </div>
  );
}
