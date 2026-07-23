// Client for the standalone Node/Express admin server (admin-server/).
// Configure the base URL via VITE_ADMIN_API_URL (defaults to http://localhost:4000).
export const ADMIN_API_URL =
  (() => {
    const envUrl = (import.meta.env.VITE_ADMIN_API_URL as string | undefined)?.replace(/\/$/, "");
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
        return "http://localhost:4000";
      }
      // If we are on production (e.g., thedeepcleanerz.in), but VITE_ADMIN_API_URL points to thedeepcleanerz.com, ignore it and use window.location.origin
      if (envUrl && envUrl.includes(hostname)) {
        return envUrl;
      }
      return window.location.origin;
    }
    return envUrl || "http://localhost:4000";
  })();

export type AdminCategory = {
  id: string;
  title: string;
  tagline: string;
  emoji: string;
  image?: string;
  parentId?: string | null;
  includes?: string[];
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
  precautions?: PrecautionItem[];
};
export type AdminCatalog = { categories: AdminCategory[]; services: AdminService[] };

export async function fetchAdminCatalog(signal?: AbortSignal): Promise<AdminCatalog> {
  const res = await fetch(`${ADMIN_API_URL}/api/catalog`, { signal });
  if (!res.ok) throw new Error(`Catalog request failed: ${res.status}`);
  return (await res.json()) as AdminCatalog;
}

export async function postAdminBooking(
  payload: unknown,
): Promise<{ ok: boolean; booking?: unknown }> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Booking request failed: ${res.status}`);
  return (await res.json()) as { ok: boolean; booking?: unknown };
}

export async function createRazorpayOrder(
  amount: number,
): Promise<{ orderId: string; amount: number; keyId: string }> {
  const res = await fetch(`${ADMIN_API_URL}/api/payment/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Payment order request failed: ${res.status}`);
  }
  return (await res.json()) as { orderId: string; amount: number; keyId: string };
}

export async function fetchBookings(): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings`);
  if (!res.ok) throw new Error(`Bookings request failed: ${res.status}`);
  return (await res.json()) as any[];
}

export async function fetchAllReviews(signal?: AbortSignal): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/reviews`, { signal });
  if (!res.ok) throw new Error(`Reviews request failed: ${res.status}`);
  return (await res.json()) as any[];
}

export async function fetchUsers(): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/users`);
  if (!res.ok) throw new Error(`Users request failed: ${res.status}`);
  return (await res.json()) as any[];
}

export async function deleteBooking(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete booking failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function updateBookingPayment(
  id: string,
  paymentStatus: string,
  paymentId: string | null,
): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/${id}/payment`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentStatus, paymentId }),
  });
  if (!res.ok) throw new Error(`Update booking payment failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function createCategory(cat: {
  title: string;
  tagline: string;
  emoji: string;
  image?: string;
  parentId?: string | null;
  includes?: string[];
}): Promise<AdminCategory> {
  const res = await fetch(`${ADMIN_API_URL}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cat),
  });
  if (!res.ok) throw new Error(`Create category failed: ${res.status}`);
  return (await res.json()).category as AdminCategory;
}

export async function updateCategory(
  id: string,
  patch: Partial<AdminCategory>,
): Promise<AdminCategory> {
  const res = await fetch(`${ADMIN_API_URL}/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Update category failed: ${res.status}`);
  return (await res.json()).category as AdminCategory;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete category failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function createService(
  svc: Omit<AdminService, "id"> & { id?: string },
): Promise<AdminService> {
  const res = await fetch(`${ADMIN_API_URL}/api/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(svc),
  });
  if (!res.ok) throw new Error(`Create service failed: ${res.status}`);
  return (await res.json()).service as AdminService;
}

export async function updateService(
  id: string,
  patch: Partial<AdminService>,
): Promise<AdminService> {
  const res = await fetch(`${ADMIN_API_URL}/api/services/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Update service failed: ${res.status}`);
  return (await res.json()).service as AdminService;
}

export async function deleteService(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/services/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete service failed: ${res.status}`);
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
  const res = await fetch(`${ADMIN_API_URL}/api/reviews/${serviceId}`);
  if (!res.ok) throw new Error(`Reviews request failed: ${res.status}`);
  return (await res.json()) as ServiceReview[];
}

export async function postReview(payload: {
  serviceId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<{ ok: boolean; review: ServiceReview }> {
  const res = await fetch(`${ADMIN_API_URL}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Submit review failed: ${res.status}`);
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
): Promise<AdminCustomizedService[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/customized-services`, { signal });
  if (!res.ok) throw new Error(`Customized services request failed: ${res.status}`);
  return (await res.json()) as AdminCustomizedService[];
}

export async function createCustomizedService(
  svc: Omit<AdminCustomizedService, "id"> & { id?: string },
): Promise<AdminCustomizedService> {
  const res = await fetch(`${ADMIN_API_URL}/api/customized-services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(svc),
  });
  if (!res.ok) throw new Error(`Create customized service failed: ${res.status}`);
  return (await res.json()).service as AdminCustomizedService;
}

export async function updateCustomizedService(
  id: string,
  patch: Partial<AdminCustomizedService>,
): Promise<AdminCustomizedService> {
  const res = await fetch(`${ADMIN_API_URL}/api/customized-services/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Update customized service failed: ${res.status}`);
  return (await res.json()).service as AdminCustomizedService;
}

export async function deleteCustomizedService(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/customized-services/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete customized service failed: ${res.status}`);
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
  const res = await fetch(`${ADMIN_API_URL}/api/coupons`);
  if (!res.ok) throw new Error(`Coupons request failed: ${res.status}`);
  return (await res.json()) as AdminCoupon[];
}

export async function createCoupon(
  coupon: Omit<AdminCoupon, "code"> & { code: string },
): Promise<AdminCoupon> {
  const res = await fetch(`${ADMIN_API_URL}/api/coupons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Update coupon failed: ${res.status}`);
  }
  return (await res.json()).coupon as AdminCoupon;
}

export async function deleteCoupon(code: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/coupons/${code}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete coupon failed: ${res.status}`);
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
  const res = await fetch(`${ADMIN_API_URL}/api/technicians`);
  if (!res.ok) throw new Error(`Technicians request failed: ${res.status}`);
  return (await res.json()) as AdminTechnician[];
}

export async function fetchTechnicianBookings(id: string): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/technicians/${id}/bookings`);
  if (!res.ok) throw new Error(`Technician bookings request failed: ${res.status}`);
  return (await res.json()) as any[];
}

export async function createTechnician(
  tech: Omit<AdminTechnician, "id"> & { id?: string },
): Promise<AdminTechnician> {
  const res = await fetch(`${ADMIN_API_URL}/api/technicians`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Update technician failed: ${res.status}`);
  }
  return (await res.json()).technician as AdminTechnician;
}

export async function deleteTechnician(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/technicians/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete technician failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function updateBookingTechnician(
  id: string,
  technicianId: string | null,
): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/${id}/technician`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ technicianId }),
  });
  if (!res.ok) throw new Error(`Update booking technician failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function updateBookingJobStatus(
  id: string,
  jobStatus: string,
  statusNote?: string | null,
): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/${id}/job-status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobStatus, statusNote }),
  });
  if (!res.ok) throw new Error(`Update booking job status failed: ${res.status}`);
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, time, rescheduledBy }),
  });
  if (!res.ok) throw new Error(`Reschedule request failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function fetchRescheduleLogs(): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/reschedule-logs`);
  if (!res.ok) throw new Error(`Fetch reschedule logs failed: ${res.status}`);
  return await res.json();
}

export async function fetchAdmins(): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/auth/admins`);
  if (!res.ok) throw new Error(`Fetch admins failed: ${res.status}`);
  return await res.json();
}

export async function sendAdminSettingsOtp(email: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/auth/admin-settings/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`Delete admin failed: ${res.status}`);
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
  const res = await fetch(`${ADMIN_API_URL}/api/transformations`, { signal });
  if (!res.ok) throw new Error(`Fetch transformations failed: ${res.status}`);
  return (await res.json()) as RecentTransformation[];
}

export async function addRecentTransformation(payload: Omit<RecentTransformation, "id"> & { id?: string }): Promise<RecentTransformation> {
  const res = await fetch(`${ADMIN_API_URL}/api/transformations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Add transformation failed: ${res.status}`);
  return (await res.json()).transformation as RecentTransformation;
}

export async function updateRecentTransformation(id: string, payload: Omit<RecentTransformation, "id" | "createdAt">): Promise<RecentTransformation> {
  const res = await fetch(`${ADMIN_API_URL}/api/transformations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Update transformation failed: ${res.status}`);
  return (await res.json()).transformation as RecentTransformation;
}

export async function deleteRecentTransformation(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/transformations/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Delete transformation failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}
