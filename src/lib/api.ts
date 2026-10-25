// Small client for the FastAPI backend in /backend.
// All requests go through `apiFetch`, which adds the login token and turns
// error responses into readable messages.

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

const TOKEN_KEY = "campus-rental-hub:token";
export const AUTH_EXPIRED_EVENT = "auth-expired";

// ---------- Shapes returned by the backend ----------

export interface ApiUser {
  id: number;
  full_name: string;
  email: string;
  is_verified: boolean;
  role: string;
  university: string | null;
  campus: string | null;
}

export interface ApiItem {
  id: number;
  owner_id: number;
  owner_name: string | null;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  price_per_day: string; // Decimal comes back as text, e.g. "2.50"
  status: string;
  isbn: string | null;
  university: string | null;
  campus: string | null;
  pickup_location: string | null;
  image_url: string | null;
}

export type RentalStatus =
  | "Requested"
  | "Approved"
  | "Rejected"
  | "Active"
  | "Completed"
  | "Cancelled";

export interface ApiRental {
  id: number;
  item_id: number;
  renter_id: number;
  start_date: string;
  end_date: string;
  total_price: string;
  status: RentalStatus;
  payment_status: string;
  handoff_location: string | null;
  created_at: string | null;
  item_title: string | null;
  item_category: string | null;
  item_image_url: string | null;
  owner_name: string | null;
  renter_name: string | null;
  owner_id: number | null;
  renter_reviewed: boolean;
  owner_reviewed: boolean;
}

export interface ApiReview {
  id: number;
  rental_id: number;
  rating: number;
  comment: string | null;
  created_at: string | null;
  reviewer_name: string | null;
  item_title: string | null;
  reviewer_role: "renter" | "owner";
}

export interface ApiReviewSummary {
  user_id: number;
  full_name: string;
  average_rating: number | null;
  review_count: number;
  reviews: ApiReview[];
}

export interface ApiRentalSummary {
  requests_to_review: number;
  rentals_to_pay: number;
  reviews_to_write: number;
  total: number;
}

export interface ApiAdminUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  university: string | null;
  campus: string | null;
  listing_count: number;
  rental_count: number;
}

export interface ApiAdminStats {
  users: number;
  listings: number;
  available_listings: number;
  rentals: number;
  rentals_by_status: Record<string, number>;
  paid_rentals: number;
  revenue: string;
}

export type ItemUpdate = Partial<{
  title: string;
  description: string | null;
  category: string;
  condition: string;
  price_per_day: string;
  isbn: string | null;
  pickup_location: string | null;
  status: "Available" | "Unavailable";
}>;

export interface LoginResponse {
  access_token: string;
  user_id: number;
  full_name: string;
  role: string;
}

// ---------- Token storage ----------

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked (private mode): stay logged in for this page only
  }
}

// ---------- Errors ----------

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function errorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    // FastAPI validation errors: [{ loc: [...], msg: "..." }]
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { loc?: unknown[]; msg?: string };
      const field = first.loc?.[first.loc.length - 1];
      const msg = (first.msg ?? "Invalid value").replace(/^Value error, /, "");
      return field ? `${String(field).replace(/_/g, " ")}: ${msg}` : msg;
    }
  }
  if (status >= 500) return "The server ran into a problem. Please try again.";
  return `Request failed (${status})`;
}

// ---------- Fetch helper ----------

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; form?: FormData; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
    });
  } catch {
    throw new ApiError(
      0,
      `Can't reach the server at ${API_URL}. Is the backend running?`
    );
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    // Login token missing or expired: log out everywhere
    if (response.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(response.status, errorMessage(response.status, data));
  }

  return data as T;
}

// ---------- Endpoint helpers ----------

export const api = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  register: (full_name: string, email: string, password: string) =>
    apiFetch<ApiUser>("/api/auth/register", {
      method: "POST",
      body: { full_name, email, password },
    }),
  me: () => apiFetch<ApiUser>("/api/auth/me"),
  updateMe: (data: Partial<Pick<ApiUser, "full_name" | "university" | "campus">>) =>
    apiFetch<ApiUser>("/api/auth/me", { method: "PATCH", body: data }),

  items: () => apiFetch<ApiItem[]>("/api/items"),
  item: (id: string | number) => apiFetch<ApiItem>(`/api/items/${id}`),
  myItems: () => apiFetch<ApiItem[]>("/api/items/mine"),
  createItem: (data: {
    title: string;
    description: string | null;
    category: string;
    condition: string;
    price_per_day: string;
    isbn: string | null;
    pickup_location: string | null;
  }) => apiFetch<ApiItem>("/api/items", { method: "POST", body: data }),
  uploadItemImage: (id: number, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return apiFetch<ApiItem>(`/api/items/${id}/image`, { method: "POST", form });
  },

  requestRental: (data: {
    item_id: number;
    start_date: string;
    end_date: string;
    handoff_location: string | null;
  }) => apiFetch<ApiRental>("/api/rentals", { method: "POST", body: data }),
  myRentals: () => apiFetch<ApiRental[]>("/api/rentals/mine"),
  receivedRequests: () => apiFetch<ApiRental[]>("/api/rentals/received"),
  cancelRental: (id: number) =>
    apiFetch<ApiRental>(`/api/rentals/${id}/cancel`, { method: "PATCH" }),
  decideRental: (id: number, decision: "approve" | "reject") =>
    apiFetch<ApiRental>(`/api/rentals/${id}/decision?decision=${decision}`, {
      method: "PATCH",
    }),
  startRental: (id: number) =>
    apiFetch<ApiRental>(`/api/rentals/${id}/start`, { method: "PATCH" }),
  completeRental: (id: number) =>
    apiFetch<ApiRental>(`/api/rentals/${id}/complete`, { method: "PATCH" }),

  updateItem: (id: number | string, data: ItemUpdate) =>
    apiFetch<ApiItem>(`/api/items/${id}`, { method: "PATCH", body: data }),
  deleteItem: (id: number | string) =>
    apiFetch<null>(`/api/items/${id}`, { method: "DELETE" }),

  changePassword: (current_password: string, new_password: string) =>
    apiFetch<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: { current_password, new_password },
    }),

  favorites: () => apiFetch<number[]>("/api/favorites"),
  addFavorite: (itemId: number | string) =>
    apiFetch<null>(`/api/favorites/${itemId}`, { method: "PUT" }),
  removeFavorite: (itemId: number | string) =>
    apiFetch<null>(`/api/favorites/${itemId}`, { method: "DELETE" }),

  rentalSummary: () => apiFetch<ApiRentalSummary>("/api/rentals/summary"),

  leaveReview: (rentalId: number, rating: number, comment: string | null) =>
    apiFetch<ApiReview>(`/api/rentals/${rentalId}/review`, {
      method: "POST",
      body: { rating, comment },
    }),
  userReviews: (userId: number) =>
    apiFetch<ApiReviewSummary>(`/api/users/${userId}/reviews`),

  adminStats: () => apiFetch<ApiAdminStats>("/api/admin/stats"),
  adminUsers: () => apiFetch<ApiAdminUser[]>("/api/admin/users"),
  adminRentals: () => apiFetch<ApiRental[]>("/api/admin/rentals"),
  adminRemoveItem: (id: number | string) =>
    apiFetch<null>(`/api/admin/items/${id}`, { method: "DELETE" }),

  paymentConfig: () => apiFetch<{ enabled: boolean }>("/api/payments/config"),
  startCheckout: (rentalId: number) =>
    apiFetch<{ checkout_url: string }>(`/api/payments/checkout/${rentalId}`, {
      method: "POST",
    }),
  verifyPayment: (rentalId: number) =>
    apiFetch<{ payment_status: string }>(`/api/payments/verify/${rentalId}`, {
      method: "POST",
    }),
};

/** Turn a backend image path like "/uploads/x.jpg" into a full URL. */
export function imageSrc(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}
