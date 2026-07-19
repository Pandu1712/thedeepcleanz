import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Wrench,
  Shield,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import {
  fetchTechnicianBookings,
  updateBookingJobStatus,
  rescheduleBooking,
  type AdminTechnician,
} from "@/api/admin-api";

export const Route = createFileRoute("/technician")({
  component: TechnicianPortal,
});

function TechnicianPortal() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AdminTechnician | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Status Note Modal states
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [pendingStatusBookingId, setPendingStatusBookingId] = useState("");
  const [pendingStatusValue, setPendingStatusValue] = useState("");
  const [statusNoteText, setStatusNoteText] = useState("");

  // Reschedule Modal states
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    const isAuthed = sessionStorage.getItem("technician_authenticated") === "true";
    const rawProfile = sessionStorage.getItem("technician_profile");

    if (!isAuthed || !rawProfile) {
      sessionStorage.clear();
      navigate({ to: "/login" });
      toast.error("Please login to access the Staff Portal.", { icon: "🔒" });
      return;
    }

    try {
      const parsed = JSON.parse(rawProfile);
      setProfile(parsed);
      loadBookings(parsed.id);
    } catch (e) {
      sessionStorage.clear();
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const loadBookings = async (techId: string) => {
    setIsLoading(true);
    try {
      const data = await fetchTechnicianBookings(techId);
      setBookings(data || []);
    } catch (err: any) {
      toast.error(`Failed to fetch bookings: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!profile) return;
    setIsRefreshing(true);
    try {
      const data = await fetchTechnicianBookings(profile.id);
      setBookings(data || []);
      toast.success("Assigned tasks updated!");
    } catch (err: any) {
      toast.error(`Failed to sync task sheet: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    toast.success("Logged out from Staff Portal.");
    navigate({ to: "/login" });
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    if (newStatus === "Issues") {
      setPendingStatusBookingId(bookingId);
      setPendingStatusValue(newStatus);
      setStatusNoteText("");
      setNoteModalOpen(true);
      return;
    }

    try {
      await updateBookingJobStatus(bookingId, newStatus, null);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, jobStatus: newStatus, statusNote: null } : b,
        ),
      );
      toast.success(`Job status updated to "${newStatus}"!`, { icon: "⚙️" });
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  const submitStatusWithNote = async () => {
    if (!statusNoteText.trim()) {
      toast.error("Please enter a note describing the issue/delay.");
      return;
    }

    try {
      await updateBookingJobStatus(
        pendingStatusBookingId,
        pendingStatusValue,
        statusNoteText.trim(),
      );
      setBookings((prev) =>
        prev.map((b) =>
          b.id === pendingStatusBookingId
            ? { ...b, jobStatus: pendingStatusValue, statusNote: statusNoteText.trim() }
            : b,
        ),
      );
      toast.success(`Job status updated to "${pendingStatusValue}" with note!`, { icon: "⚙️" });
      setNoteModalOpen(false);
      setPendingStatusBookingId("");
      setPendingStatusValue("");
      setStatusNoteText("");
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  const submitReschedule = async () => {
    if (!newDate || !newTime) {
      toast.error("Please select a date and time slot.");
      return;
    }
    try {
      const whoRescheduled = `Technician: ${profile?.name || "Staff"}`;
      await rescheduleBooking(rescheduleBookingId, newDate, newTime, whoRescheduled);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === rescheduleBookingId
            ? {
                ...b,
                schedule: { date: newDate, time: newTime },
              }
            : b,
        ),
      );
      toast.success("Booking rescheduled successfully!");
      setRescheduleModalOpen(false);
      setRescheduleBookingId("");
    } catch (err: any) {
      toast.error(`Reschedule failed: ${err.message}`);
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#001c17] text-white">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#cb9f5a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001713] text-cream font-sans relative">
      {/* Decorative luxury glows */}
      <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-[#cb9f5a]/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-[#cb9f5a]/3 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#00201a]/85 backdrop-blur-md border-b border-[#cb9f5a]/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-[#cb9f5a]" />
          </div>
          <div>
            <h1 className="font-display text-base font-extrabold tracking-wide text-cream">
              TheDeep CleanerZ
            </h1>
            <span className="block text-[8px] font-extrabold uppercase tracking-[0.25em] text-[#cb9f5a]">
              Staff Duty Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cream transition-all border border-white/10 active:scale-95 cursor-pointer"
            title="Reload Assigned Bookings"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/30 px-3.5 py-2 text-xs font-bold text-rose-300 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid gap-8 lg:grid-cols-4">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#002a22] border border-[#cb9f5a]/15 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-[#cb9f5a]/3 blur-xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-[#cb9f5a] to-[#cb9f5a]/50 flex items-center justify-center text-2xl font-black text-navy border-2 border-[#cb9f5a]">
                {profile.name.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <h2 className="text-lg font-bold text-cream leading-tight">{profile.name}</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/65 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-400 border border-emerald-800/40 mt-1 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                  Duty
                </span>
              </div>

              <div className="w-full border-t border-[#cb9f5a]/10 pt-4 text-left space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <Wrench className="h-4 w-4 text-[#cb9f5a] shrink-0" />
                  <div>
                    <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                      Specialty Area
                    </span>
                    <span className="font-semibold text-cream/90">
                      {profile.specialty || "General Deep Cleaning"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <Phone className="h-4 w-4 text-[#cb9f5a] shrink-0" />
                  <div>
                    <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                      Mobile Number
                    </span>
                    <span className="font-semibold text-cream/90">+91 {profile.phone}</span>
                  </div>
                </div>

                {profile.email && (
                  <div className="flex items-center gap-3 text-xs">
                    <Mail className="h-4 w-4 text-[#cb9f5a] shrink-0" />
                    <div>
                      <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                        Email Address
                      </span>
                      <span className="font-semibold text-cream/90 truncate max-w-[170px] block">
                        {profile.email}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-cream font-display">Assigned Cleaning Tasks</h2>
            <p className="text-xs text-cream/60 mt-1">
              Review dates, schedules, cleaning items, and location markers for your current duty
              bookings.
            </p>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#cb9f5a] border-t-transparent" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-[#002a22]/30 border border-[#cb9f5a]/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-[#cb9f5a]/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-[#cb9f5a]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-cream">All caught up!</h3>
                <p className="text-xs text-cream/50 mt-1">
                  No bookings are currently assigned to you. Enjoy your rest or contact the admin.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => {
                const customer =
                  typeof b.customer === "string" ? JSON.parse(b.customer) : b.customer;
                const schedule =
                  typeof b.schedule === "string" ? JSON.parse(b.schedule) : b.schedule;
                const items = typeof b.items === "string" ? JSON.parse(b.items) : b.items;

                const isFullyPaid =
                  typeof b.paymentStatus === "string" && b.paymentStatus.includes("Paid In Full");
                const isPaid =
                  typeof b.paymentStatus === "string" &&
                  (b.paymentStatus.includes("Paid") || b.paymentStatus.includes("Success"));

                const paidAmount = isFullyPaid ? b.total : isPaid ? Math.round(b.total * 0.25) : 0;
                const balanceAmount = b.total - paidAmount;

                return (
                  <div
                    key={b.id}
                    className="bg-[#002a22] border border-[#cb9f5a]/15 hover:border-[#cb9f5a]/30 transition-all rounded-3xl p-6 shadow-lg flex flex-col md:flex-row justify-between gap-6"
                  >
                    {/* Booking metadata */}
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-black text-[#cb9f5a] bg-[#cb9f5a]/10 px-2.5 py-1 rounded border border-[#cb9f5a]/20 uppercase">
                          #{b.id.substring(0, 8).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-cream/60">
                          <Calendar className="h-3.5 w-3.5 text-[#cb9f5a]" />
                          <span>{schedule?.date || "TBD"}</span>
                          <span className="text-[#cb9f5a]">•</span>
                          <Clock className="h-3.5 w-3.5 text-[#cb9f5a]" />
                          <span>{schedule?.time || "Anytime"}</span>
                          <button
                            onClick={() => {
                              setRescheduleBookingId(b.id);
                              setNewDate(schedule?.date || "");
                              setNewTime(schedule?.time || "");
                              setRescheduleModalOpen(true);
                            }}
                            className="ml-3 text-[10px] text-[#cb9f5a] hover:underline font-bold bg-[#cb9f5a]/10 px-2 py-0.5 rounded border border-[#cb9f5a]/20 cursor-pointer"
                          >
                            🗓️ Reschedule
                          </button>
                        </div>
                      </div>

                      {/* Client info */}
                      <div className="space-y-3 bg-[#001713]/40 border border-[#cb9f5a]/10 p-4 rounded-2xl max-w-2xl font-sans">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#cb9f5a]/5">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[#cb9f5a] shrink-0" />
                            <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                              Client Name:
                            </span>
                            <span className="font-bold text-cream text-sm">
                              {customer?.name || "Client Name"}
                            </span>
                          </div>
                          {customer?.phone && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                                Phone:
                              </span>
                              <span className="font-semibold text-cream">+91 {customer.phone}</span>
                              <a
                                href={`tel:${customer.phone}`}
                                className="text-[10px] text-[#cb9f5a] hover:bg-[#cb9f5a]/10 font-bold px-2.5 py-1 rounded-lg border border-[#cb9f5a]/25 transition-all"
                              >
                                📞 Call Customer
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start gap-2.5 text-xs text-cream/80">
                          <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-[#cb9f5a] uppercase tracking-wider block mb-1">
                              Service Address Location:
                            </span>
                            <span className="font-semibold block text-cream/90">
                              {customer?.address || "No address provided."}
                            </span>
                            {customer?.landmark && (
                              <span className="text-xs text-[#cb9f5a]/90 font-bold block mt-1.5 bg-[#cb9f5a]/5 border border-[#cb9f5a]/10 px-2.5 py-1 rounded-lg inline-block">
                                Landmark: {customer.landmark}
                              </span>
                            )}
                            <span className="text-[10px] text-cream/40 font-bold block uppercase mt-1">
                              {customer?.city || "Bengaluru"} - {customer?.pincode}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="border-t border-[#cb9f5a]/10 pt-3">
                        <span className="block text-[9px] font-bold text-[#cb9f5a] uppercase tracking-wider mb-2">
                          Cleaning services checklist
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {items?.map((item: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 bg-[#001713] text-cream/90 font-bold px-3 py-1 rounded-xl border border-[#cb9f5a]/10 text-2xs"
                            >
                              <ShoppingBag className="h-3 w-3 text-[#cb9f5a]" />
                              {item.title}
                              <span className="text-[#cb9f5a] font-black">x{item.qty}</span>
                            </span>
                          ))}
                        </div>
                        {/* Job Progress Status Updates */}
                        <div className="border-t border-[#cb9f5a]/10 pt-4 mt-4 font-sans">
                          <span className="block text-[9px] font-bold text-[#cb9f5a] uppercase tracking-wider mb-2.5">
                            Clean Job Progress Status
                          </span>

                          <div className="flex flex-wrap gap-2.5">
                            {[
                              {
                                value: "Pending",
                                label: "⏳ Pending",
                                color:
                                  "bg-slate-900 border-slate-700 text-slate-450 hover:bg-slate-800",
                              },
                              {
                                value: "Started",
                                label: "🚗 On My Way",
                                color:
                                  "bg-blue-950 border-blue-900/60 text-blue-400 hover:bg-blue-900",
                              },
                              {
                                value: "Ongoing",
                                label: "🧼 Work Ongoing",
                                color:
                                  "bg-amber-950 border-amber-900/65 text-amber-400 hover:bg-amber-900",
                              },
                              {
                                value: "Completed",
                                label: "✅ Completed",
                                color:
                                  "bg-emerald-950 border-emerald-900/60 text-emerald-400 hover:bg-emerald-900",
                              },
                              {
                                value: "Issues",
                                label: "⚠️ Issue/Delay",
                                color:
                                  "bg-rose-950 border-rose-900/60 text-rose-450 hover:bg-rose-900",
                              },
                            ].map((status) => {
                              const isCurrent = (b.jobStatus || "Pending") === status.value;
                              return (
                                <button
                                  key={status.value}
                                  onClick={() => handleStatusUpdate(b.id, status.value)}
                                  className={`px-3 py-1.5 rounded-xl border text-2xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                                    isCurrent
                                      ? "bg-[#cb9f5a]/20 border-[#cb9f5a] text-[#cb9f5a] shadow-[0_0_12px_rgba(203,159,90,0.15)] font-extrabold"
                                      : status.color
                                  }`}
                                >
                                  {status.label}
                                  {isCurrent && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#cb9f5a] animate-pulse" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Saved Status Note */}
                          {b.statusNote && (
                            <div className="mt-3 bg-rose-950/45 border border-rose-800/35 p-3 rounded-2xl text-xs text-rose-350 max-w-2xl">
                              <span className="font-extrabold uppercase text-[9px] text-[#cb9f5a] block mb-0.5">
                                ⚠️ Reported Delay / Issue Note:
                              </span>
                              <span className="font-semibold text-cream/90">{b.statusNote}</span>
                            </div>
                          )}

                          {/* Transformation Photos Input */}
                          <div className="mt-4 bg-[#001713] border border-[#cb9f5a]/15 p-3 rounded-2xl max-w-2xl font-sans space-y-2">
                            <span className="block text-[9px] font-bold text-[#cb9f5a] uppercase tracking-wider">
                              📸 Upload / Set Before & After Transformation Photos
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-slate-400 font-semibold block mb-1">Before Cleaning Photo URL</span>
                                <input
                                  type="text"
                                  placeholder="Paste Before Photo Link..."
                                  defaultValue={b.beforeImage || ""}
                                  onBlur={async (e) => {
                                    const val = e.target.value;
                                    await fetch(`${ADMIN_API_URL}/api/bookings/${b.id}/media`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ beforeImage: val, afterImage: b.afterImage }),
                                    });
                                    toast.success("Before photo saved!");
                                    handleRefresh();
                                  }}
                                  className="w-full text-xs font-semibold rounded-xl border border-[#cb9f5a]/20 bg-[#002a22] px-3 py-2 text-cream outline-none focus:border-[#cb9f5a]"
                                />
                              </div>
                              <div>
                                <span className="text-slate-400 font-semibold block mb-1">After Cleaning Photo URL</span>
                                <input
                                  type="text"
                                  placeholder="Paste After Photo Link..."
                                  defaultValue={b.afterImage || ""}
                                  onBlur={async (e) => {
                                    const val = e.target.value;
                                    await fetch(`${ADMIN_API_URL}/api/bookings/${b.id}/media`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ beforeImage: b.beforeImage, afterImage: val }),
                                    });
                                    toast.success("After photo saved!");
                                    handleRefresh();
                                  }}
                                  className="w-full text-xs font-semibold rounded-xl border border-[#cb9f5a]/20 bg-[#002a22] px-3 py-2 text-cream outline-none focus:border-[#cb9f5a]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Maps & Payment Status */}
                    <div className="flex flex-col justify-between items-end gap-4 md:border-l md:border-[#cb9f5a]/10 md:pl-6 shrink-0 min-w-[200px]">
                      <div className="text-right w-full space-y-3 font-sans">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-455 uppercase tracking-wider mb-1">
                            Status
                          </span>
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/70 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-400 border border-emerald-900 uppercase tracking-wider">
                              Paid In Full
                            </span>
                          ) : isPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/50 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-300 border border-emerald-800 uppercase tracking-wider">
                              Deposit Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 px-2.5 py-0.5 text-2xs font-extrabold text-amber-400 border border-amber-800 uppercase tracking-wider">
                              COD Pending
                            </span>
                          )}
                        </div>

                        <div className="border-t border-[#cb9f5a]/10 pt-2 text-xs space-y-1 font-bold">
                          <div className="flex justify-between gap-4 text-cream/70">
                            <span>Total Service Value:</span>
                            <span className="text-cream">₹{b.total}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-emerald-450">
                            <span>Amount Paid:</span>
                            <span>₹{paidAmount}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-amber-400 border-t border-[#cb9f5a]/10 pt-1 text-sm font-extrabold">
                            <span className="text-[#cb9f5a]">Balance to Collect:</span>
                            <span className="text-white">₹{balanceAmount}</span>
                          </div>
                        </div>
                      </div>

                      {customer?.mapsLink && (
                        <a
                          href={customer.mapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-center inline-flex items-center justify-center gap-2 rounded-xl bg-[#cb9f5a] hover:bg-[#b08746] px-4 py-2.5 text-xs font-bold text-navy transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Navigate via GPS
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      {/* status note prompt modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#002a22] border border-[#cb9f5a]/25 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200 font-sans">
            <h3 className="text-lg font-bold text-cream font-display flex items-center gap-2">
              ⚠️ Report Issue or Delay
            </h3>
            <p className="text-xs text-cream/60 mt-1">
              Please enter a brief note explaining the issue or reason for the schedule delay. This
              note will be visible to the customer and administrator.
            </p>

            <div className="mt-4">
              <textarea
                value={statusNoteText}
                onChange={(e) => setStatusNoteText(e.target.value)}
                placeholder="e.g. Stuck in heavy traffic, Water supply not available, etc."
                rows={4}
                className="w-full rounded-xl border border-[#cb9f5a]/20 bg-[#001713] p-3 text-xs text-cream outline-none focus:border-[#cb9f5a] placeholder-cream/35 resize-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setNoteModalOpen(false);
                  setPendingStatusBookingId("");
                  setPendingStatusValue("");
                  setStatusNoteText("");
                }}
                className="rounded-xl border border-white/10 hover:bg-white/5 px-4 py-2.5 font-semibold text-cream transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitStatusWithNote}
                className="rounded-xl bg-[#cb9f5a] hover:bg-[#b08746] px-5 py-2.5 font-bold text-navy transition-all active:scale-[0.98] cursor-pointer"
              >
                Submit Status
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#002a22] border border-[#cb9f5a]/25 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200 font-sans text-cream">
            <h3 className="text-lg font-display font-bold flex items-center gap-2">
              🗓️ Reschedule Appointment
            </h3>
            <p className="text-xs text-cream/60 mt-1">
              Select a new date and time slot for booking #
              {rescheduleBookingId.substring(0, 8).toUpperCase()}.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-[#cb9f5a]">
                  Select Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-[#cb9f5a]/20 bg-[#001713] px-3.5 py-2 text-xs text-cream outline-none focus:border-[#cb9f5a]"
                />
              </div>

              <div>
                <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-[#cb9f5a]">
                  Select Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full rounded-xl border border-[#cb9f5a]/20 bg-[#001713] px-3.5 py-2 text-xs text-cream outline-none focus:border-[#cb9f5a]"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setRescheduleModalOpen(false);
                  setRescheduleBookingId("");
                }}
                className="rounded-xl border border-white/10 hover:bg-white/5 px-4 py-2.5 font-semibold text-cream transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                className="rounded-xl bg-[#cb9f5a] hover:bg-[#b08746] px-5 py-2.5 font-bold text-navy transition-all active:scale-[0.98] cursor-pointer"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
