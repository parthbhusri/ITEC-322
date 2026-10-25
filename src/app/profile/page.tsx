"use client";

import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, UserRound } from "lucide-react";
import { Loading, LoginRequired } from "@/components/PageStatus";
import { Stars } from "@/components/Stars";
import { useToast } from "@/components/ToastProvider";
import { api, type ApiReviewSummary, type ApiUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/types";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <LoginRequired message="Log in to see your profile." />;

  // key: reset the forms if a different account logs in
  return <Profile key={user.id} user={user} />;
}

function Profile({ user }: { user: ApiUser }) {
  const { setUser } = useAuth();
  const showToast = useToast();

  const [name, setName] = useState(user.full_name);
  const [university, setUniversity] = useState(user.university ?? "");
  const [campus, setCampus] = useState(user.campus ?? "");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<ApiReviewSummary | null>(null);

  useEffect(() => {
    api
      .userReviews(user.id)
      .then(setReviews)
      .catch(() => setReviews(null));
  }, [user.id]);

  async function saveDetails(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setDetailsError("Enter your full name.");
      return;
    }
    setDetailsError(null);
    setSavingDetails(true);
    try {
      const updated = await api.updateMe({
        full_name: name.trim(),
        university: university.trim(),
        campus: campus.trim(),
      });
      setUser(updated);
      showToast("Profile saved");
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSavingDetails(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords don't match.");
      return;
    }
    setPasswordError(null);
    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mocha-300 font-display text-2xl font-bold text-mocha-950">
          {user.full_name[0]?.toUpperCase()}
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-platinum sm:text-4xl">
            {user.full_name}
          </h1>
          <p className="text-platinum/65">
            {user.email}
            {user.role === "admin" && (
              <span className="ml-2 rounded-full bg-lavender-200 px-2 py-0.5 text-xs font-semibold text-mocha-900">
                Admin
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={saveDetails} className="panel flex flex-col gap-5 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <UserRound className="h-5 w-5 text-lavender-700" aria-hidden="true" />
            Your details
          </h2>
          <div>
            <label htmlFor="name" className="field-label">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="email" className="field-label">
              Student email
            </label>
            <input id="email" type="email" value={user.email} disabled className="field opacity-70" />
            <p className="mt-1 text-xs text-mocha-500">Your email is how you log in, so it can&apos;t be changed.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="university" className="field-label">
                University
              </label>
              <input
                id="university"
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="campus" className="field-label">
                Campus
              </label>
              <input
                id="campus"
                type="text"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="field"
              />
            </div>
          </div>
          {detailsError && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {detailsError}
            </p>
          )}
          <button type="submit" disabled={savingDetails} className="btn btn-primary self-start px-6">
            {savingDetails ? "Saving…" : "Save details"}
          </button>
        </form>

        <form onSubmit={savePassword} className="panel flex flex-col gap-5 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <KeyRound className="h-5 w-5 text-lavender-700" aria-hidden="true" />
            Change password
          </h2>
          <div>
            <label htmlFor="currentPassword" className="field-label">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="field-label">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="field"
            />
            <p className="mt-1 text-xs text-mocha-500">At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="field-label">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field"
            />
          </div>
          {passwordError && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {passwordError}
            </p>
          )}
          <button type="submit" disabled={savingPassword} className="btn btn-primary self-start px-6">
            {savingPassword ? "Changing…" : "Change password"}
          </button>
        </form>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-display text-2xl font-semibold text-platinum">Reviews about you</h2>
          {reviews && reviews.review_count > 0 && (
            <span className="flex items-center gap-2 text-platinum/75">
              <Stars value={reviews.average_rating ?? 0} />
              {reviews.average_rating?.toFixed(1)} from {reviews.review_count} review
              {reviews.review_count === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {!reviews || reviews.review_count === 0 ? (
          <p className="rounded-2xl border border-dashed border-platinum/20 px-6 py-12 text-center text-platinum/70">
            No reviews yet. After a rental is returned, the other student can rate you.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reviews.reviews.map((review) => (
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
                  {review.reviewer_role === "renter" ? "rented" : "lent you"} {review.item_title ?? "an item"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
