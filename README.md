# Campus Rental Hub

A peer-to-peer rental marketplace for students — textbooks, calculators, lab
equipment, and tools, borrowed and returned right on campus. This repo
currently contains the **frontend only**, built with Next.js and Tailwind
CSS.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- No backend, database, or external services yet — see [What's left](#whats-left-for-a-live-site) below

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's built (frontend)

Every screen below is fully designed and interactive, but runs on
**mock/local data only** (see [`src/lib/mock-data.ts`](src/lib/mock-data.ts))
— nothing is saved to a real server.

| Page | Route | What it does |
|---|---|---|
| Browse | `/` | Search, filter by category/availability, sort by price, hero section |
| Item detail | `/items/[id]` | Full item info, condition/price/category, "Request to Rent" |
| List an item | `/list-item` | Form with live preview and a mock ISBN auto-fill lookup |
| Checkout | `/checkout/[id]` | Order summary + a mock payment form (no real charge) |
| My Rentals | `/my-rentals` | Tabs for rentals, listings, and saved/favorited items |
| Admin dashboard | `/admin` | Metric cards + a recent activity table |
| Log in / Register | `/login`, `/register` | Forms with client-side validation only (no real auth) |

**Design system / UI features:**
- Library card-catalog theme: forest green + rust accent on a white/paper background, serif wordmark, monospace "stamp" badges for rental status (Available / Requested / Rented / Returned)
- Item-specific emoji icons instead of photos (no image hosting needed yet)
- Responsive layout with a collapsible mobile nav (hamburger menu)
- Hover animations on cards and buttons, a confetti burst on successful actions, and toast notifications
- Favorites/wishlist system using `localStorage` (per-browser only, not synced to an account)

## What's left for a live site

This is a static-data prototype. To go live, the following still need to be built:

### Backend & data
- [ ] A real API/server (e.g. Next.js API routes, or a separate backend service)
- [ ] A database (e.g. Postgres, MySQL, MongoDB) to replace `mock-data.ts` — items, users, rental records
- [ ] Image upload & storage (e.g. S3, Cloudinary) for real item photos instead of emoji placeholders
- [ ] A real ISBN lookup integration (e.g. Google Books API or Open Library API) to replace the hardcoded mock lookup in `list-item/page.tsx`

### Authentication & accounts
- [ ] Real user authentication (e.g. NextAuth.js / Auth.js, Clerk, or a custom JWT/session system)
- [ ] Student email verification (`.edu` domain check is currently just a client-side string check with no actual verification email sent)
- [ ] Password hashing & secure storage (currently there is no password storage at all)
- [ ] Session/auth state shared across the app (the Navbar's "Log In" button doesn't currently reflect whether anyone is logged in)

### Payments
- [ ] A real payment gateway integration (e.g. Stripe Checkout or Payment Intents) — the checkout form is a static mock UI with no Stripe SDK, no server-side charge, and no webhook handling
- [ ] Handling for refunds, security deposits, or late fees if the business model needs them

### Core rental logic
- [ ] Server-side rental state machine (Available → Requested → Rented → Returned) — item statuses are hardcoded in mock data and don't actually change when you click "Request to Rent"
- [ ] Notifications to the item owner when a rental is requested/confirmed (email, SMS, or in-app)
- [ ] Real-time or polling updates so listings reflect current availability across users

### Admin & trust/safety
- [ ] Real admin authentication/role checks (the `/admin` page is currently open to anyone)
- [ ] Reporting/moderation tools for problematic listings or users
- [ ] Rate limiting and abuse prevention

### Infrastructure
- [ ] Deployment (e.g. Vercel, or another host) and environment configuration
- [ ] Environment variables/secrets management for API keys (Stripe, database, email service, etc.)
- [ ] Error monitoring/logging (e.g. Sentry)
- [ ] Automated tests

## Project structure

```
src/
  app/            Pages (App Router)
  components/     Shared UI components (Navbar, ItemCard, StampBadge, etc.)
  lib/
    mock-data.ts  Fake items/users/rental history — replace with real data source
    types.ts      Shared TypeScript types
    favorites.ts  localStorage-based favorites (client-only, no backend)
```
