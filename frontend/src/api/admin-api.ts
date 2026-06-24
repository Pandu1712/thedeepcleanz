// Client for the standalone Node/Express admin server (admin-server/).
// Configure the base URL via VITE_ADMIN_API_URL (defaults to http://localhost:4000).
export const ADMIN_API_URL =
  (import.meta.env.VITE_ADMIN_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:4000";

export type AdminCategory = { id: string; title: string; tagline: string; emoji: string };
export type AdminService = {
  id: string;
  categoryId: string;
  title: string;
  price: number;
  description: string;
  includes: string[];
};
export type AdminCatalog = { categories: AdminCategory[]; services: AdminService[] };

export async function fetchAdminCatalog(signal?: AbortSignal): Promise<AdminCatalog> {
  const res = await fetch(`${ADMIN_API_URL}/api/catalog`, { signal });
  if (!res.ok) throw new Error(`Catalog request failed: ${res.status}`);
  return (await res.json()) as AdminCatalog;
}

export async function postAdminBooking(payload: unknown): Promise<{ ok: boolean; booking?: unknown }> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Booking request failed: ${res.status}`);
  return (await res.json()) as { ok: boolean; booking?: unknown };
}

export async function fetchBookings(): Promise<any[]> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings`);
  if (!res.ok) throw new Error(`Bookings request failed: ${res.status}`);
  return (await res.json()) as any[];
}

export async function deleteBooking(id: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API_URL}/api/bookings/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete booking failed: ${res.status}`);
  return (await res.json()).ok as boolean;
}

export async function createCategory(cat: { title: string; tagline: string; emoji: string }): Promise<AdminCategory> {
  const res = await fetch(`${ADMIN_API_URL}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cat),
  });
  if (!res.ok) throw new Error(`Create category failed: ${res.status}`);
  return (await res.json()).category as AdminCategory;
}

export async function updateCategory(id: string, patch: Partial<AdminCategory>): Promise<AdminCategory> {
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

export async function createService(svc: Omit<AdminService, "id"> & { id?: string }): Promise<AdminService> {
  const res = await fetch(`${ADMIN_API_URL}/api/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(svc),
  });
  if (!res.ok) throw new Error(`Create service failed: ${res.status}`);
  return (await res.json()).service as AdminService;
}

export async function updateService(id: string, patch: Partial<AdminService>): Promise<AdminService> {
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
