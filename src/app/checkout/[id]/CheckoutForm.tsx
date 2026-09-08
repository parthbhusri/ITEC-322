"use client";

import { useState, type FormEvent } from "react";

export default function CheckoutForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-dashed border-forest bg-sage p-6 text-center">
        <p className="font-medium text-forest">Request sent!</p>
        <p className="mt-1 text-sm text-forest/70">
          The owner will confirm your rental request shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-xs uppercase tracking-wide text-forest/50">
        Payment (Stripe Sandbox — mock)
      </p>

      <div>
        <label htmlFor="cardNumber" className="mb-1 block text-sm font-medium text-forest/80">
          Card number
        </label>
        <input
          id="cardNumber"
          type="text"
          required
          placeholder="4242 4242 4242 4242"
          className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest placeholder:text-forest/40 focus:border-forest focus:outline-none"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="expiry" className="mb-1 block text-sm font-medium text-forest/80">
            Expiry
          </label>
          <input
            id="expiry"
            type="text"
            required
            placeholder="MM/YY"
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest placeholder:text-forest/40 focus:border-forest focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="cvc" className="mb-1 block text-sm font-medium text-forest/80">
            CVC
          </label>
          <input
            id="cvc"
            type="text"
            required
            placeholder="123"
            className="w-full rounded-md border border-sage-dark bg-white px-3 py-2 text-sm text-forest placeholder:text-forest/40 focus:border-forest focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper hover:bg-forest-light"
      >
        Confirm Request
      </button>
    </form>
  );
}
