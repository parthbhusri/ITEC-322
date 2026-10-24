# Campus Rental Hub

A peer-to-peer rental marketplace for students — textbooks, calculators, lab
equipment, and tools, borrowed and returned right on campus.

This repo holds the whole app:

| Part | Folder | Built with |
|---|---|---|
| Frontend | `src/` | Next.js (App Router) + TypeScript + Tailwind CSS v4 |
| Backend API | `backend/` | FastAPI + PostgreSQL + SQLAlchemy + Stripe Checkout (by Arshdeep Kaur) |

## Running it locally

You need **Node.js 20+**, **Python 3.11+** and **PostgreSQL** (installed locally, or a
free hosted database such as Neon or Supabase).

### 1. Backend (terminal 1)

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate      macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env          # Windows: copy .env.example .env
# then edit .env: set DATABASE_URL and JWT_SECRET_KEY (Stripe keys are optional)

python seed_products.py       # adds 40 sample items + a demo owner account
python -m uvicorn app.main:app --port 8000
```

The tables are created automatically the first time the API starts.
API docs (Swagger): <http://localhost:8000/docs>

### 2. Frontend (terminal 2)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The frontend talks to `http://localhost:8000` by
default; to use a different address, copy `.env.example` to `.env.local` and change
`NEXT_PUBLIC_API_URL`.

### Demo accounts

- **Demo Owner** (owns the 40 sample items): `demo.owner@example.com` / `DemoOwner123!`
  Log in as this account to approve, hand over and complete rentals of sample items.
- **Students**: register with any email ending in `.edu` or `.edu.au`.

### Payments (optional)

Put a Stripe **test** secret key (`sk_test_...`) in `backend/.env` as
`STRIPE_SECRET_KEY` and restart the backend. "Pay" buttons then appear on approved
rentals and open Stripe Checkout; use card `4242 4242 4242 4242`, any future expiry
and any CVC. When the student returns, the app confirms the payment with Stripe, so
the Stripe CLI webhook is not required for local testing. Without a key, everything
except paying works.

## How a rental works

1. A student registers (university + campus are saved to their profile) and logs in.
2. They browse items, open one and choose **Request to Rent** with start/end dates.
   The total is `price per day × number of days` (both dates included).
3. The owner sees it under **My Rentals → Requests** and approves or rejects it.
   Overlapping bookings for the same item are blocked by the backend.
4. Once approved, the renter pays from **My Rentals** (Stripe Checkout, test mode).
5. The owner marks the item **handed over**, then **returned** when it comes back.
6. A renter can cancel a request while it's still waiting for approval.

## Pages

| Page | Route | What it does |
|---|---|---|
| Browse | `/` | Live items from the API; search, category filter, "available only", sort by price |
| Item detail | `/items/[id]` | Item info and photo; owners can add/change the photo |
| List an item | `/list-item` | Create a listing with optional photo; ISBN lookup via Open Library |
| Request to rent | `/checkout/[id]` | Pick dates and hand-off spot, see the total, send the request |
| My Account | `/my-rentals` | Tabs: my rentals (cancel/pay), requests on my items (approve/reject/hand over/return), my listings, saved |
| Admin | `/admin` | Listing stats and latest listings from the API |
| Log in / Register | `/login`, `/register` | Real accounts with JWT login (expires after 30 minutes) |

**Design:** library card-catalog theme (forest green + rust on white), serif wordmark,
rubber-stamp status badges, responsive layout with a mobile menu, hover animations,
confetti and toast notifications.

## Known gaps

- **Admin**: there is no admin-only API yet, so the dashboard shows listing stats only
  (not rentals across all users) and the page is open to anyone.
- **Saved items** are stored in the browser (`localStorage`), not on the account.
- **Email verification**: the `.edu` / `.edu.au` check is client-side only; no
  verification email is sent.
- No editing or deleting listings, no notifications to owners, no automated tests yet.

## Project structure

```
src/
  app/              Pages (App Router)
  components/       Shared UI (Navbar, ItemCard, ItemImage, StampBadge, PageStatus, ...)
  lib/
    api.ts          Typed client for every backend endpoint + login token storage
    auth.tsx        Login state shared across the app (useAuth)
    types.ts        UI item type, converters, categories, price/date helpers
    favorites.ts    Saved items (browser-only)
backend/
  app/              FastAPI app: auth, items, rentals, Stripe payments, models
  seed_products.py  Sample items + demo owner
  .env.example      Settings the API reads
```
