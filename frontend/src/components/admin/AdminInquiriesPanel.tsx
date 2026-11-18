import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Phone, RefreshCw, Trash2, MessageSquare } from "lucide-react";
import {
  fetchInquiries,
  updateInquiryStatus,
  deleteInquiry,
  type AdminInquiry,
  type InquiryStatus,
} from "@/api/admin-api";

const STATUSES: InquiryStatus[] = ["New", "Contacted", "Resolved"];

// Older rows may carry lowercase / legacy values ("pending", "contacted")
function normalizeStatus(s: string | undefined): InquiryStatus {
  const v = String(s || "").toLowerCase();
  if (v === "contacted") return "Contacted";
  if (v === "resolved") return "Resolved";
  return "New";
}

const STATUS_STYLES: Record<InquiryStatus, string> = {
  New: "bg-amber-50 text-amber-700 border-amber-200",
  Contacted: "bg-sky-50 text-sky-700 border-sky-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/** Admin view of contact / callback / quote requests submitted from the website. */
export function AdminInquiriesPanel({ onCountChange }: { onCountChange?: (newCount: number) => void }) {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"All" | InquiryStatus>("All");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchInquiries();
      setInquiries(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    onCountChange?.(inquiries.filter((i) => normalizeStatus(i.status) === "New").length);
  }, [inquiries, onCountChange]);

  const visible = useMemo(
    () => inquiries.filter((i) => filter === "All" || normalizeStatus(i.status) === filter),
    [inquiries, filter],
  );

  const changeStatus = async (id: string, status: InquiryStatus) => {
    setBusyId(id);
    try {
      await updateInquiryStatus(id, status);
      setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
      toast.success(`Marked as ${status}`);
    } catch (err: any) {
      toast.error(err?.message || "Could not update status");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this inquiry permanently?")) return;
    setBusyId(id);
    try {
      await deleteInquiry(id);
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      toast.success("Inquiry deleted");
    } catch (err: any) {
      toast.error(err?.message || "Could not delete inquiry");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Customer Inquiries & Quote Requests</h2>
          <p className="text-xs text-slate-500 mt-1">
            Callback, contact-form and free-estimate requests submitted from the website.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["All", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                filter === s ? "bg-[#002a22] text-white border-[#002a22]" : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-2xs font-extrabold uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-5 py-4">Received</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Service / Message</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  <MessageSquare className="mx-auto mb-2 h-6 w-6" />
                  {loading ? "Loading inquiries..." : "No inquiries found."}
                </td>
              </tr>
            )}
            {visible.map((inq) => {
              const status = normalizeStatus(inq.status);
              const created = inq.createdAt ? new Date(inq.createdAt) : null;
              return (
                <tr key={inq.id} className="hover:bg-slate-50/50 align-top">
                  <td className="px-5 py-4 text-xs whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-400">{inq.id}</div>
                    <div>{created && !isNaN(created.getTime()) ? created.toLocaleString("en-IN") : "-"}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-[#002a22]">{inq.name}</div>
                    <a href={`tel:+91${inq.phone}`} className="text-xs font-semibold text-sky-700 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> +91 {inq.phone}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-xs max-w-md">
                    <div className="font-semibold text-slate-800">{inq.service || "General Inquiry"}</div>
                    {inq.message && <div className="mt-1 whitespace-pre-wrap text-slate-500">{inq.message}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={status}
                      disabled={busyId === inq.id}
                      onChange={(e) => changeStatus(inq.id, e.target.value as InquiryStatus)}
                      className={`rounded-lg border px-2 py-1 text-xs font-bold cursor-pointer ${STATUS_STYLES[status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => remove(inq.id)}
                      disabled={busyId === inq.id}
                      className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete inquiry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminInquiriesPanel;
