// Client for the standalone Node/Express admin server (backend/).
// Dynamic base URL resolution that works seamlessly for:
// 1. Local browser development (localhost, 127.0.0.1, LAN IP) -> connects to http://<hostname>:4000
// 2. Mobile native / Capacitor app -> connects to https://thedeepcleanerz.in
// 3. Production web (thedeepcleanerz.in or any host) -> ALWAYS uses window.location.origin (same origin as backend)
export const ADMIN_API_URL = (() => {
  const envUrl = (import.meta.env.VITE_ADMIN_API_URL as string | undefined)?.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    // 1. Mobile Native / Capacitor App
    const isCapacitor =
      (window as any).Capacitor?.isNativePlatform?.() ||
      window.location.protocol === "capacitor:" ||
      window.location.protocol === "ionic:" ||
      (window.location.hostname === "localhost" && window.location.port === "");
    if (isCapacitor) {
      if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
        return envUrl;
      }
      return "https://thedeepcleanerz.in";
    }

    // 2. Local browser development (Vite dev server: localhost:5173, 127.0.0.1, LAN IP)
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    ) {
      if (envUrl && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1") || envUrl.startsWith("http://192.168."))) {
        return envUrl;
      }
      return `http://${hostname || "localhost"}:4000`;
    }

    // 3. Production web deployment (both frontend & API served on the same domain)
    // Always use window.location.origin so all /api/* requests hit the active domain directly
    return window.location.origin;
  }

  // SSR / Node environment
  if (envUrl && !envUrl.includes("api.thedeepcleanerz")) {
    return envUrl;
  }
  return "https://thedeepcleanerz.in";
})();

export const ADMIN_WS_URL = (() => {
  if (typeof window === "undefined") return "ws://localhost:4000";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = ADMIN_API_URL.replace(/^https?:\/\//, "");
  return `${protocol}//${host}`;
})();

/**
 * Picks the right token for the current portal, so an admin who also logs in as a
 * customer (or technician) in the same browser doesn't send the wrong token.
 *  - /admin pages      -> admin_token
 *  - /technician pages -> technician_token
 *  - everything else   -> customer token (auth_token / user_token)
 */
export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const path = window.location.pathname || "";
    const read = (k: string) => sessionStorage.getItem(k) || localStorage.getItem(k) || "";
    if (path.startsWith("/admin")) {
      return read("admin_token") || read("auth_token");
    }
    if (path.startsWith("/technician")) {
      return read("technician_token") || read("auth_token");
    }
    return read("auth_token") || read("user_token");
  } catch {
    return "";
  }
}

/** YYYY-MM-DD for a Date in the browser's local timezone (toISOString() is UTC and is
 *  a day behind in India between 00:00 and 05:30). */
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayLocalStr(): string {
  return toLocalDateStr(new Date());
}

/** Absolute time of a booking slot ("10:00 AM", "14:00", "10:00 AM - 12:00 PM") in IST. */
export function slotDateTimeIST(dateStr: string, timeStr: string): Date {
  const norm = normalizeTimeSlot(String(timeStr || "10:00").split(" - ")[0]);
  return new Date(`${dateStr}T${/^\d{2}:\d{2}$/.test(norm) ? norm : "10:00"}:00+05:30`);
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export type AdminCategory = {
  id: string;
  title: string;
  tagline: string;
  emoji: string;
  image?: string;
  parentId?: string | null;
  includes?: string[];
  paymentType?: "fixed" | "custom_quote" | string;
};
export type ServicePlan = {
  name: string;
  price: number;
  duration: string;
  description: string;
  includes: string[];
  excludes: string[];
};

export type PrecautionItem = {
  title: string;
  description: string;
};

export type AdminService = {
  id: string;
  categoryId: string;
  title: string;
  price: number;
  description: string;
  includes: string[];
  image?: string;
  plans?: ServicePlan[];
  disclaimer?: string;
  requirements?: string;
  paymentType?: "full" | "deposit_25" | "deposit_50" | "free_advance" | "custom_quote" | string;
  precautions?: PrecautionItem[];
};
export type AdminCatalog = { categories: AdminCategory[]; services: AdminService[] };

// Last successfully loaded data. If a request fails/times out, pages keep showing this
// instead of an empty list ("no services" for customers).
let lastGoodCatalog: AdminCatalog | null = null;
let lastGoodCustomized: AdminCustomizedService[] | null = null;

function isAbortError(err: unknown): boolean {
  return (err as { name?: string })?.name === "AbortError";
}

export async function fetchAdminCatalog(signal?: AbortSignal, forceFresh = true): Promise<AdminCatalog> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const url = `${ADMIN_API_URL}/api/catalog?_t=${Date.now()}`;
    const res = await fetch(url, {
      signal: signal || ctrl.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw await readError(res, `Catalog request failed: ${res.status}`);
    const data = (await res.json()) as AdminCatalog;
    lastGoodCatalog = { categories: data.categories || [], services: data.services || [] };
    return lastGoodCatalog;
  } catch (err) {
    // A request cancelled by the caller (newer refresh started) must not overwrite the page
    if (signal?.aborted) throw err;
    console.warn("Catalog fetch failed or timed out, using last loaded data:", err);
    return lastGoodCatalog || { categories: [], services: [] };
  }
}

/** Admin version: throws on failure so the dashboard keeps its current data instead of
 *  replacing it with empty lists when the network is slow. */
export async function fetchAdminCatalogStrict(): Promise<AdminCatalog> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${ADMIN_API_URL}/api/catalog?_t=${Date.now()}`, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    if (!res.ok) throw await readError(res, `Catalog request failed: ${res.status}`);
    const data = (await res.json()) as AdminCatalog;
    return { categories: data.categories || [], services: data.services || [] };
  } finally {
    clearTimeout(timer);
  }
}

/** Admin version of customized services: throws on failure. */
export async function fetchCustomizedServicesStrict(): Promise<AdminCustomizedService[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/customized-services?_t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw await readError(res, `Customized services request failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Admin version of transformations: throws on failure. */
export async function fetchRecentTransformationsStrict(): Promise<RecentTransformation[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/transformations?_t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw await readError(res, `Transformations request failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Admin version of holidays: throws on failure. */
export async function fetchBlockedDatesStrict(): Promise<BlockedDate[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/blocked-dates?_t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw await readError(res, `Holidays request failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Settings: an admin token returns every key; the public site only gets public keys. */
export async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetch(`${ADMIN_API_URL}/api/settings?_t=${Date.now()}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Settings request failed: ${res.status}`);
  return res.json();
}

/** Admin inquiries list that throws on failure (fetchInquiries swallows errors). */
export async function fetchInquiriesStrict(): Promise<AdminInquiry[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/inquiries`, { headers: getAuthHeaders() });
  if (!res.ok) throw await readError(res, `Fetch inquiries failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : Array.isArray(data?.inquiries) ? data.inquiries : [];
}

export interface BookedSlotsResponse {
  date: string;
  bookedSlots: string[];
  normalizedSlots: string[];
}

export const STANDARD_TIME_SLOTS = [
  "08:00 AM",
  "10:00 AM",
  "12:00 PM",
  "02:00 PM",
  "04:00 PM",
  "06:00 PM",
] as const;

export type StandardTimeSlot = typeof STANDARD_TIME_SLOTS[number];

export function normalizeTimeSlot(t: string): string {
  if (!t) return "";
  let str = String(t).trim().toUpperCase();
  const match12 = str.match(/^0?(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const min = match12[2];
    const period = match12[3];
    if (period === "AM" && hour === 12) hour = 0;
    if (period === "PM" && hour < 12) hour += 12;
    return `${String(hour).padStart(2, "0")}:${min}`;
  }
  const match24 = str.match(/^0?(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    let hour = parseInt(match24[1], 10);
    const min = match24[2];
    return `${String(hour).padStart(2, "0")}:${min}`;
  }
  return str;
}

/**
 * Check whether a specific time slot on a target date has already passed.
 * @param slotStr e.g. "08:00 AM", "10:00 AM", "02:00 PM", "06:00 PM"
 * @param selectedDateStr "YYYY-MM-DD"
 * @param bufferMinutes Buffer required before service start (default 30 mins)
 */
export function isSlotInPast(
  slotStr: string,
  selectedDateStr: string,
  bufferMinutes: number = 30,
): boolean {
  if (!slotStr || !selectedDateStr) return false;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayFormatted = `${y}-${m}-${d}`;

  // If the date itself is before today, all slots are in the past
  if (selectedDateStr < todayFormatted) return true;
  // If the date is in the future, slots cannot be in the past
  if (selectedDateStr > todayFormatted) return false;

  // For today: parse slot time and compare with current clock + buffer
  const norm = normalizeTimeSlot(slotStr); // "HH:MM" in 24-hr format
  const [slotH, slotM] = norm.split(":").map(Number);
  if (isNaN(slotH) || isNaN(slotM)) return false;

  const slotMinutes = slotH * 60 + slotM;
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + bufferMinutes;

  return slotMinutes <= currentMinutes;
}

/**
 * Returns true if all standard slots for a given date have elapsed.
 */
export function areAllSlotsPassedToday(
  dateStr: string,
  bufferMinutes: number = 30,
): boolean {
  if (!dateStr) return false;
  const now = new Date();
  const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (dateStr < todayFormatted) return true;
  if (dateStr > todayFormatted) return false;

  return STANDARD_TIME_SLOTS.every((slot) =>
    isSlotInPast(slot, dateStr, bufferMinutes),
  );
}

/**
 * Finds the first available non-passed and non-booked slot for a given date.
 */
export function getFirstAvailableSlot(
  dateStr: string,
  bookedNormalizedSlots: string[] = [],
  bufferMinutes: number = 30,
): string {
  for (const slot of STANDARD_TIME_SLOTS) {
    const isPast = isSlotInPast(slot, dateStr, bufferMinutes);
    const isBooked = bookedNormalizedSlots.includes(normalizeTimeSlot(slot));
    if (!isPast && !isBooked) {
      return slot;
    }
  }
  return "";
}

export async function fetchBookedSlots(date: string, signal?: AbortSignal): Promise<BookedSlotsResponse> {
  if (!date) return { date: "", bookedSlots: [], normalizedSlots: [] };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  
  // Link external signal if provided
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      return { date, bookedSlots: [], normalizedSlots: [] };
    }
    signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }

  try {
    const res = await fetch(`${ADMIN_API_URL}/api/bookings/booked-slots?date=${encodeURIComponent(date)}`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { date, bookedSlots: [], normalizedSlots: [] };
    const data = await res.json();
    return {
      date: data.date || date,
      bookedSlots: Array.isArray(data.bookedSlots) ? data.bookedSlots : [],
      normalizedSlots: Array.isArray(data.normalizedSlots) ? data.normalizedSlots : [],
    };
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name !== "AbortError") {
      console.warn("Failed to fetch booked slots:", err);
    }
    return { date, bookedSlots: [], normalizedSlots: [] };
  }
}

export async function postAdminBooking(
  payload: unknown,
): Promise<{ ok: boolean; booking?: unknown }> {
  try {
    const res = await fetch(`${ADMIN_API_URL}/api/bookings`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Booking request failed: ${res.status}`);
    }
    return (await res.json()) as { ok: boolean; booking?: unknown };
  } catch (err: any) {
    if (err.message && err.message.includes("Failed to fetch")) {
      throw new Error("Unable to connect to the server. Please check your internet connection and try again.");
    }
    throw err;
  }
}

export function loadRazorpayScript(timeoutMs = 7000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    let settled = false;
    const finish = (result: boolean) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      finish(Boolean((window as any).Razorpay));
    }, timeoutMs);

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      if ((window as any).Razorpay) {
        finish(true);
        return;
      }
      existingScript.addEventListener("load", () => finish(true), { once: true });
      existingScript.addEventListener("error", () => finish(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => finish(true);
    script.onerror = () => finish(false);
    document.body.appendChild(script);
  });
}

export async function createRazorpayOrder(
  amount: number,
): Promise<{ orderId: string; amount: number; keyId: string }> {
  const paiseAmount = Math.round(Number(amount) * 100);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${ADMIN_API_URL}/api/payment/order`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ amount }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Payment initialization failed: ${res.status}`);
    }
    const data = await res.json();
    return {
      orderId: data.orderId || "",
      amount: data.amount || paiseAmount,
      keyId: data.keyId || "",
    };
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

export async function fetchBookings(): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Bookings request failed: ${res.status}`);
  return (await res.json()) as any[];
}

export async function fetchUserBookings(
  paramOrPhone?: string | { phone?: string; email?: string; userId?: string },
  email?: string,
  userId?: string,
): Promise<any[]> {
  const params = new URLSearchParams();
  if (typeof paramOrPhone === "object" && paramOrPhone !== null) {
    if (paramOrPhone.phone) params.set("phone", paramOrPhone.phone);
    if (paramOrPhone.email) params.set("email", paramOrPhone.email);
    if (paramOrPhone.userId) params.set("userId", paramOrPhone.userId);
  } else {
    if (paramOrPhone) params.set("phone", paramOrPhone);
    if (email) params.set("email", email);
    if (userId) params.set("userId", userId);
  }
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${ADMIN_API_URL}/api/user/bookings${qs}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `User bookings request failed: ${res.status}`);
  return (await res.json()) as any[];
}

/**
 * Builds an Error from a failed API response using the server's own message.
 * A 401/403 on the admin or technician portal means the login expired, so the portal is
 * told to log out and ask for a fresh login (instead of showing "server failed").
 */
async function readError(res: Response, fallback: string): Promise<Error> {
  const data = await res.json().catch(() => ({}));
  const serverMsg = (data as any)?.error as string | undefined;
  if ((res.status === 401 || res.status === 403) && typeof window !== "undefined") {
    const path = window.location.pathname || "";
    if (path.startsWith("/admin") || path.startsWith("/technician")) {
      window.dispatchEvent(new CustomEvent("portal-session-expired", { detail: { status: res.status } }));
      return new Error("Your login session has expired. Please log in again.");
    }
  }
  if (res.status >= 500 && !serverMsg) {
    return new Error("Server is temporarily unavailable. Please try again in a moment.");
  }
  return new Error(serverMsg || fallback);
}

/** Customer cancels their own booking. Refund + penalty are calculated on the server. */
export async function cancelMyBooking(
  id: string,
): Promise<{ ok: boolean; refundAmount?: number; penaltyPercent?: number; paymentStatus?: string }> {
  const res = await fetch(`${ADMIN_API_URL}/api/user/bookings/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
  });
  if (!res.ok) throw await readError(res, `Cancellation failed: ${res.status}`);
  return res.json();
}

/** Customer reschedules their own booking. */
export async function rescheduleMyBooking(id: string, date: string, time: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/user/bookings/${encodeURIComponent(id)}/reschedule`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ date, time }),
  });
  if (!res.ok) throw await readError(res, `Reschedule failed: ${res.status}`);
  return true;
}

/** Records a verified Razorpay balance payment for the customer's own booking. */
export async function payMyBookingBalance(
  id: string,
  rzp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
): Promise<{ ok: boolean; paymentStatus: string }> {
  const res = await fetch(`${ADMIN_API_URL}/api/user/bookings/${encodeURIComponent(id)}/pay-balance`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      razorpayOrderId: rzp.razorpay_order_id,
      razorpayPaymentId: rzp.razorpay_payment_id,
      razorpaySignature: rzp.razorpay_signature,
    }),
  });
  if (!res.ok) throw await readError(res, `Payment update failed: ${res.status}`);
  return res.json();
}

/** Logged-in customer's own profile (wallet balance, addresses, referral code). */
export async function fetchMyProfile(): Promise<any | null> {
  if (!getAuthToken()) return null;
  const res = await fetch(`${ADMIN_API_URL}/api/user/profile`, { headers: getAuthHeaders() });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchAllReviews(signal?: AbortSignal): Promise<any[]> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(`${ADMIN_API_URL}/api/reviews`, { signal: signal || ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch (err) {
    return [];
  }
}

export async function fetchUsers(): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/users`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Users request failed: ${res.status}`);
  return (await res.json()) as any[];
}

export async function deleteBooking(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Delete booking failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function updateBookingPayment(
  id: string,
  paymentStatus: string,
  paymentId: string | null,
): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/${id}/payment`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ paymentStatus, paymentId }),
  });
  if (!res.ok) throw await readError(res, `Update booking payment failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function createCategory(cat: {
  title: string;
  tagline: string;
  emoji: string;
  image?: string;
  parentId?: string | null;
  includes?: string[];
  paymentType?: string;
}): Promise<AdminCategory> {
  const res = await fetch(`${ADMIN_API_URL}/api/categories`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(cat),
  });
  if (!res.ok) throw await readError(res, `Create category failed: ${res.status}`);
  return (await res.json()).category as AdminCategory;
}

export async function updateCategory(
  id: string,
  patch: Partial<AdminCategory> & { cascadeToServices?: boolean },
): Promise<AdminCategory> {
  const res = await fetch(`${ADMIN_API_URL}/api/categories/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw await readError(res, `Update category failed: ${res.status}`);
  return (await res.json()).category as AdminCategory;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/categories/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Delete category failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function createService(
  svc: Omit<AdminService, "id"> & { id?: string },
): Promise<AdminService> {
  const res = await fetch(`${ADMIN_API_URL}/api/services`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(svc),
  });
  if (!res.ok) throw await readError(res, `Create service failed: ${res.status}`);
  return (await res.json()).service as AdminService;
}

export async function updateService(
  id: string,
  patch: Partial<AdminService>,
): Promise<AdminService> {
  const res = await fetch(`${ADMIN_API_URL}/api/services/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw await readError(res, `Update service failed: ${res.status}`);
  return (await res.json()).service as AdminService;
}

export async function deleteService(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/services/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Delete service failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export type ServiceReview = {
  id: string;
  serviceId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export async function fetchReviews(serviceId: string): Promise<ServiceReview[]> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(`${ADMIN_API_URL}/api/reviews/${serviceId}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    return (await res.json()) as ServiceReview[];
  } catch (err) {
    return [];
  }
}

export async function postReview(payload: {
  serviceId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<{ ok: boolean; review: ServiceReview }> {
  const res = await fetch(`${ADMIN_API_URL}/api/reviews`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("Please log in to write a review.");
  if (!res.ok) throw await readError(res, `Submit review failed: ${res.status}`);
  return (await res.json()) as { ok: boolean; review: ServiceReview };
}

export type AdminCustomizedService = {
  id: string;
  title: string;
  price: number;
  image?: string;
  plans?: ServicePlan[];
};

export async function fetchCustomizedServices(
  signal?: AbortSignal,
  forceFresh = true,
): Promise<AdminCustomizedService[]> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const url = forceFresh
      ? `${ADMIN_API_URL}/api/customized-services?_t=${Date.now()}`
      : `${ADMIN_API_URL}/api/customized-services`;
    const res = await fetch(url, {
      signal: signal || ctrl.signal,
      cache: forceFresh ? "no-store" : "default",
      headers: forceFresh ? { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache" } : undefined,
    });
    clearTimeout(timer);
    if (!res.ok) return lastGoodCustomized || [];
    const data = await res.json();
    lastGoodCustomized = Array.isArray(data) ? (data as AdminCustomizedService[]) : [];
    return lastGoodCustomized;
  } catch (err) {
    if (signal?.aborted && isAbortError(err)) throw err;
    return lastGoodCustomized || [];
  }
}

export async function createCustomizedService(
  svc: Omit<AdminCustomizedService, "id"> & { id?: string },
): Promise<AdminCustomizedService> {
  const res = await fetch(`${ADMIN_API_URL}/api/customized-services`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(svc),
  });
  if (!res.ok) throw await readError(res, `Create customized service failed: ${res.status}`);
  return (await res.json()).service as AdminCustomizedService;
}

export async function updateCustomizedService(
  id: string,
  patch: Partial<AdminCustomizedService>,
): Promise<AdminCustomizedService> {
  const res = await fetch(`${ADMIN_API_URL}/api/customized-services/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw await readError(res, `Update customized service failed: ${res.status}`);
  return (await res.json()).service as AdminCustomizedService;
}

export async function deleteCustomizedService(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/customized-services/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Delete customized service failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export type AdminCoupon = {
  code: string;
  discount: number;
  minAmount: number;
  expiryDate: string;
  isActive: number;
};

export async function fetchCoupons(): Promise<AdminCoupon[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/coupons`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Coupons request failed: ${res.status}`);
  return (await res.json()) as AdminCoupon[];
}

/** Public: active, non-expired coupons a customer can apply. Never throws. */
export async function fetchActiveCoupons(): Promise<AdminCoupon[]> {
  try {
    const res = await fetch(`${ADMIN_API_URL}/api/coupons/active`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createCoupon(
  coupon: Omit<AdminCoupon, "code"> & { code: string },
): Promise<AdminCoupon> {
  const res = await fetch(`${ADMIN_API_URL}/api/coupons`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(coupon),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Create coupon failed: ${res.status}`);
  }
  return (await res.json()).coupon as AdminCoupon;
}

export async function updateCoupon(
  code: string,
  patch: Partial<AdminCoupon>,
): Promise<AdminCoupon> {
  const res = await fetch(`${ADMIN_API_URL}/api/coupons/${code}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Update coupon failed: ${res.status}`);
  }
  return (await res.json()).coupon as AdminCoupon;
}

export async function deleteCoupon(code: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/coupons/${code}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Delete coupon failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function validateCoupon(
  code: string,
  total: number,
): Promise<{ code: string; discount: number }> {
  const res = await fetch(`${ADMIN_API_URL}/api/coupons/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, total }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Invalid coupon or order amount is too low.");
  }
  return (await res.json()).coupon as { code: string; discount: number };
}

export type AdminTechnician = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  specialty?: string;
  status?: string;
  password?: string;
  createdAt?: string;
};

export async function fetchTechnicians(): Promise<AdminTechnician[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/technicians`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Technicians request failed: ${res.status}`);
  return (await res.json()) as AdminTechnician[];
}

export async function fetchTechnicianBookings(id: string): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/technicians/${id}/bookings`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Technician bookings request failed: ${res.status}`);
  return (await res.json()) as any[];
}

export async function fetchAvailableTechnicianJobs(id: string): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/technicians/${id}/available-jobs`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Available jobs request failed: ${res.status}`);
  return (await res.json()) as any[];
}

export async function claimTechnicianJob(
  technicianId: string,
  bookingId: string,
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${ADMIN_API_URL}/api/technicians/${technicianId}/claim-booking`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ bookingId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Claim job failed: ${res.status}`);
  }
  return data;
}

export async function createTechnician(
  tech: Omit<AdminTechnician, "id"> & { id?: string },
): Promise<AdminTechnician> {
  const res = await fetch(`${ADMIN_API_URL}/api/technicians`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(tech),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Create technician failed: ${res.status}`);
  }
  return (await res.json()).technician as AdminTechnician;
}

export async function updateTechnician(
  id: string,
  patch: Partial<AdminTechnician>,
): Promise<AdminTechnician> {
  const res = await fetch(`${ADMIN_API_URL}/api/technicians/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Update technician failed: ${res.status}`);
  }
  return (await res.json()).technician as AdminTechnician;
}

export async function deleteTechnician(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/technicians/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Delete technician failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function updateBookingTechnician(
  id: string,
  technicianId: string | null,
): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/${id}/technician`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ technicianId }),
  });
  if (!res.ok) throw await readError(res, `Update booking technician failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function updateBookingJobStatus(
  id: string,
  jobStatus: string,
  statusNote?: string | null,
): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/${id}/job-status`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ jobStatus, statusNote }),
  });
  if (!res.ok) throw await readError(res, `Update booking job status failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function rescheduleBooking(
  id: string,
  date: string,
  time: string,
  rescheduledBy?: string,
): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/${id}/reschedule`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ date, time, rescheduledBy }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Reschedule request failed: ${res.status}`);
  }
  return (await res.json()).ok as boolean;
}

export async function fetchRescheduleLogs(): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/reschedule-logs`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Fetch reschedule logs failed: ${res.status}`);
  return await res.json();
}

export async function fetchAdmins(): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/auth/admins`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Fetch admins failed: ${res.status}`);
  return await res.json();
}

export async function sendAdminSettingsOtp(email: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/auth/admin-settings/otp/send`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Send OTP failed: ${res.status}`);
  }
  return true;
}

export async function registerAdmin(payload: any): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/auth/admin-settings/register`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Register admin failed: ${res.status}`);
  }
  return true;
}

export async function updateAdminDetails(currentEmail: string, payload: any): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/auth/admin-settings/update`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ currentEmail, ...payload }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Update admin failed: ${res.status}`);
  }
  return true;
}

export async function deleteAdmin(email: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/auth/admin-settings/delete`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw await readError(res, `Delete admin failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export interface RecentTransformation {
  id: string;
  title: string;
  location: string;
  beforeImage: string;
  afterImage: string;
  createdAt?: string;
}

export async function fetchRecentTransformations(signal?: AbortSignal): Promise<RecentTransformation[]> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(`${ADMIN_API_URL}/api/transformations`, { signal: signal || ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    return (await res.json()) as RecentTransformation[];
  } catch (err) {
    return [];
  }
}

export async function addRecentTransformation(payload: Omit<RecentTransformation, "id"> & { id?: string }): Promise<RecentTransformation> {
  const res = await fetch(`${ADMIN_API_URL}/api/transformations`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await readError(res, `Add transformation failed: ${res.status}`);
  return (await res.json()).transformation as RecentTransformation;
}

export async function updateRecentTransformation(id: string, payload: Omit<RecentTransformation, "id" | "createdAt">): Promise<RecentTransformation> {
  const res = await fetch(`${ADMIN_API_URL}/api/transformations/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await readError(res, `Update transformation failed: ${res.status}`);
  return (await res.json()).transformation as RecentTransformation;
}

export async function deleteRecentTransformation(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/transformations/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Delete transformation failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
  createdAt: string;
}

export async function fetchBlockedDates(signal?: AbortSignal): Promise<BlockedDate[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      return [];
    }
    signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }
  try {
    const res = await fetch(`${ADMIN_API_URL}/api/blocked-dates`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    return (await res.json()) as BlockedDate[];
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name !== "AbortError") {
      console.warn("Fetch blocked dates note:", err);
    }
    return [];
  }
}

export async function addBlockedDate(payload: { date: string; reason?: string }): Promise<BlockedDate> {
  const res = await fetch(`${ADMIN_API_URL}/api/blocked-dates`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Add blocked date failed: ${res.status}`);
  }
  return (await res.json()).blockedDate as BlockedDate;
}

export async function deleteBlockedDate(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/blocked-dates/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Delete blocked date failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export interface AdminInquiry {
  id: string;
  name: string;
  phone: string;
  service?: string;
  message?: string;
  city?: string;
  status: InquiryStatus | string;
  createdAt: string;
}

export type InquiryStatus = "New" | "Contacted" | "Resolved";

export async function fetchInquiries(signal?: AbortSignal): Promise<AdminInquiry[]> {
  try {
    const res = await fetch(`${ADMIN_API_URL}/api/inquiries`, {
      signal,
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await readError(res, `Fetch inquiries failed: ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.inquiries)) return data.inquiries;
    return [];
  } catch (err) {
    console.warn("Fetch inquiries error:", err);
    return [];
  }
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/inquiries/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw await readError(res, `Update inquiry status failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function deleteInquiry(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/inquiries/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await readError(res, `Delete inquiry failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}


