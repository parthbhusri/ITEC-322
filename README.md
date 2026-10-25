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

### Open it on your phone (same Wi-Fi)

1. Start the backend so other devices can reach it (note `--host 0.0.0.0`):
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
2. Start the website as usual with `npm run dev`. It prints a **Network** address,
   e.g. `http://192.168.1.20:3000`.
3. On your phone (connected to the **same Wi-Fi**), open that Network address.
4. On Windows, if it doesn't load, allow **Python** and **Node.js** through the
   firewall on **Private networks** (Windows usually asks the first time).

The site finds the backend automatically on the same computer, and the backend
accepts requests from home/uni network addresses (`192.168.x.x`, `10.x.x.x`,
`172.16–31.x.x`). Some uni and public Wi-Fi networks block devices from
talking to each other; use a phone hotspot or home Wi-Fi instead.

### Demo accounts

- **Demo Owner** (owns the 40 sample items): `demo.owner@example.com` / `DemoOwner123!`
  Log in as this account to approve, hand over and complete rentals of sample items.
- **Students**: register with any email ending in `.edu` or `.edu.au`. The server
  rejects any other email, even if someone bypasses the Register page.

### Admin access

Register on the website first, then from the `backend` folder (virtual environment
active) run:

```bash
python make_admin.py you@university.edu.au            # give admin access
python make_admin.py you@university.edu.au --remove   # take it away
```

Log out and back in. An **Admin** link appears in the navbar; nobody else can see
or open the dashboard.

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
6. Once it's returned, the renter and the owner can **rate each other** (1–5 stars
   plus an optional comment). Ratings show on the owner's listings and profiles.
7. A renter can cancel a request while it's still waiting for approval.

A **badge on My Rentals** in the navbar counts what needs your attention: requests
to approve, approved rentals to pay, and reviews to write.

## Pages

| Page | Route | What it does |
|---|---|---|
| Browse | `/` | Live items from the API; search, category filter, "available only", sort by price |
| Item detail | `/items/[id]` | Item info and photo, the owner's rating and reviews; owners can change the photo |
| Edit listing | `/items/[id]/edit` | Owners change details or price, pause the listing, or delete it |
| List an item | `/list-item` | Create a listing with optional photo; ISBN lookup via Open Library |
| Request to rent | `/checkout/[id]` | Pick dates and hand-off spot, see the total, send the request |
| My Account | `/my-rentals` | Tabs: my rentals (cancel / pay / review), requests on my items (approve / reject / hand over / return / review), my listings (edit), saved |
| Profile | `/profile` | Edit name, university and campus; change password; reviews about you |
| Admin | `/admin` | **Admins only.** Site stats, all users (never passwords), all rentals, remove any listing |
| Log in / Register | `/login`, `/register` | Real accounts with JWT login (expires after 30 minutes) |

## Design

- **Colours:** mocha brown background (`#4B3428`), platinum silver cards and text
  (`#E6E5E3` / `#F4F3F1`), pale lavender buttons and accents (`#DCD0F3`). All colours
  are defined once as tokens in `src/app/globals.css`.
- **Brand:** the logo is a rental hang-tag with swap arrows (borrow and return)
  (`src/components/Logo.tsx`, browser icon in `src/app/icon.svg`). Item cards are
  shaped like the same hang-tag, with a punched hole and string.
- **Item pictures:** items without a photo get a picture of what they are, chosen
  from the title (headphones, a book, a stethoscope, a drill...) with the category
  as a fallback (`src/lib/itemArt.ts`). Uploaded photos always replace it.
- **Type:** Bricolage Grotesque for headings, Geist for body text.
- **Buttons:** shared `btn btn-primary` (lavender), `btn-ghost` (on mocha) and
  `btn-outline` (on cards) classes; form fields use `field`.
- Responsive down to phone width, visible keyboard focus, and animations switch
  off for people who set "reduce motion".

## Known gaps

- **Email verification:** student emails are checked by their ending (`.edu` /
  `.edu.au`), but no verification email is sent.
- **Forgot password:** there's no reset-by-email yet; logged-in users can change
  their password on the Profile page.
- **Notifications** are in-app only (the navbar badge), not email.
- Deleting a listing hides it rather than erasing it, so past rentals still show
  what was rented. Admins can remove a listing even while it's booked; owners can't.
- No automated test suite in the repo yet.

## Project structure

```
src/
  app/              Pages (App Router)
  components/       Shared UI (Navbar, ItemCard, ItemImage, StampBadge, PageStatus, ...)
  lib/
    api.ts          Typed client for every backend endpoint + login token storage
    auth.tsx        Login state shared across the app (useAuth)
    types.ts        UI item type, converters, categories, price/date helpers
    favorites.ts    Saved items (on the account when logged in, browser otherwise)
    notifications.ts  Navbar badge: what needs the user's attention
    itemArt.ts      Picks a picture for items without a photo
backend/
  app/              FastAPI app: auth, items, rentals, Stripe payments, models
  seed_products.py  Sample items + demo owner
  make_admin.py     Give or remove admin access
  .env.example      Settings the API reads
```
