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
  updateTechnician,
  type AdminTechnician,
  ADMIN_API_URL,
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
  const [activeFilter, setActiveFilter] = useState<"assigned" | "completed" | "profile">("assigned");

  // Profile edit states
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);


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
      setEditName(parsed.name || "");
      setEditPhone(parsed.phone || "");
      setEditSpecialty(parsed.specialty || "");
      loadBookings(parsed.id);
    } catch (e) {
      sessionStorage.clear();
      navigate({ to: "/login" });
    }
  }, [navigate]);

  // Real-time geolocation tracking for In Transit jobs
  useEffect(() => {
    if (!profile?.id) return;
    
    // Check if any booking is actively "Started" (En Route)
    const hasInTransitJob = bookings.some(b => b.jobStatus === "Started");
    
    if (!hasInTransitJob) return;
    
    console.log("Starting real-time GPS location tracker for technician...");
    let watchId: number | null = null;
    
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await fetch(`${ADMIN_API_URL}/api/technicians/${profile.id}/location`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
            console.log(`GPS Ping sent: ${latitude}, ${longitude}`);
          } catch (e) {
            console.error("Failed to send GPS coordinates:", e);
          }
        },
        (error) => {
          console.error("GPS Watch Position error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
    }
    
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        console.log("Stopped real-time GPS location tracker.");
      }
    };
  }, [profile?.id, bookings]);

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

  const assignedBookings = bookings.filter((b) => (b.jobStatus || "Pending") !== "Completed");
  const completedBookings = bookings.filter((b) => (b.jobStatus || "Pending") === "Completed");
  const displayBookings = activeFilter === "assigned" ? assignedBookings : completedBookings;

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#cb9f5a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">

      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-3xs">
              <Sparkles className="h-4.5 w-4.5 text-[#cb9f5a]" />
            </div>
            <div>
              <h1 className="font-display text-sm font-extrabold tracking-tight text-[#002a22]">
                TheDeep CleanerZ
              </h1>
              <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-[#cb9f5a]">
                Staff Duty Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all border border-slate-200 active:scale-95 cursor-pointer"
              title="Reload Assigned Bookings"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/60 px-3 py-1.5 text-2xs font-extrabold text-rose-600 transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-20 md:pt-24 md:pb-8 grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Profile Sidebar */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center text-center sm:text-left lg:text-center gap-4 sm:gap-6 lg:gap-0">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-[#cb9f5a] to-[#cb9f5a]/50 flex items-center justify-center text-2xl font-black text-navy border-2 border-[#cb9f5a] shrink-0 sm:mb-0 lg:mb-4">
                {profile.name.substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 sm:mb-0 lg:mb-4">
                <h2 className="text-lg font-bold text-slate-800 leading-tight">{profile.name}</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-700 border border-emerald-200/60 mt-1 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Duty
                </span>
              </div>

              <div className="w-full border-t border-slate-100 sm:border-t-0 lg:border-t pt-4 sm:pt-0 lg:pt-4 text-left grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 sm:gap-4 lg:gap-3">
                <div className="flex items-center gap-3 text-xs">
                  <Wrench className="h-4 w-4 text-[#cb9f5a] shrink-0" />
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Specialty Area
                    </span>
                    <span className="font-semibold text-slate-700">
                      {profile.specialty || "General Deep Cleaning"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <Phone className="h-4 w-4 text-[#cb9f5a] shrink-0" />
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Mobile Number
                    </span>
                    <span className="font-semibold text-slate-700">+91 {profile.phone}</span>
                  </div>
                </div>

                {profile.email && (
                  <div className="flex items-center gap-3 text-xs">
                    <Mail className="h-4 w-4 text-[#cb9f5a] shrink-0" />
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Email Address
                      </span>
                      <span className="font-semibold text-slate-700 truncate max-w-[170px] block">
                        {profile.email}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Tasks List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#002a22] font-display">
                {activeFilter === "profile" ? "Profile Settings" : "Assigned Cleaning Tasks"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeFilter === "profile"
                  ? "Manage your display name, specialty description, and phone details."
                  : "Review dates, schedules, cleaning items, and location markers for your current duty bookings."}
              </p>
            </div>

            {/* Desktop Filter Tabs */}
            <div className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveFilter("assigned")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === "assigned"
                    ? "bg-white text-[#002a22] shadow-xs"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Assigned ({assignedBookings.length})
              </button>
              <button
                onClick={() => setActiveFilter("completed")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === "completed"
                    ? "bg-white text-[#002a22] shadow-xs"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Completed ({completedBookings.length})
              </button>
              <button
                onClick={() => setActiveFilter("profile")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === "profile"
                    ? "bg-white text-[#002a22] shadow-xs"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                👤 Profile Settings
              </button>
            </div>
          </div>

          {activeFilter === "profile" ? (
            !isEditingProfile ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-md mx-auto sm:mx-0 font-sans space-y-6">
                <div className="text-center pb-6 border-b border-slate-100">
                  <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-tr from-[#002a22] to-[#004d3e] flex items-center justify-center text-3xl font-black text-white border-4 border-slate-100 shadow-sm mb-3">
                    {profile.name.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{profile.name}</h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-700 border border-emerald-250 mt-2 uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Duty Staff
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <Wrench className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Specialty Area
                      </span>
                      <span className="font-bold text-slate-700">
                        {profile.specialty || "General Deep Cleaning"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Mobile Number
                      </span>
                      <span className="font-bold text-slate-700">+91 {profile.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Email Address
                      </span>
                      <span className="font-bold text-slate-700">{profile.email}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setEditName(profile.name || "");
                      setEditPhone(profile.phone || "");
                      setEditSpecialty(profile.specialty || "");
                      setIsEditingProfile(true);
                    }}
                    className="w-full text-center py-2.5 rounded-xl bg-[#002a22] hover:bg-[#00382d] text-xs font-bold text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    ✏️ Edit Profile details
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-md mx-auto sm:mx-0 font-sans space-y-5">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-800">Edit Profile Details</h3>
                  <p className="text-2xs text-slate-400">Update your Display Name, Mobile phone, and specialties below.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-700 outline-none focus:border-[#002a22]"
                      placeholder="Enter name..."
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Mobile Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-700 outline-none focus:border-[#002a22]"
                      placeholder="Enter mobile..."
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Specialty Area</label>
                    <input
                      type="text"
                      value={editSpecialty}
                      onChange={(e) => setEditSpecialty(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-700 outline-none focus:border-[#002a22]"
                      placeholder="e.g. Sofa Cleaning..."
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-extrabold uppercase tracking-wider text-slate-350 block mb-1">Email Address (Read-only)</label>
                    <input
                      type="email"
                      value={profile.email || ""}
                      disabled
                      className="w-full text-xs font-semibold rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-slate-400 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 text-xs">
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                    }}
                    className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 font-bold text-slate-500 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editName.trim() || !editPhone.trim()) {
                        toast.error("Name and phone are required fields.");
                        return;
                      }
                      setIsSavingProfile(true);
                      try {
                        const updated = await updateTechnician(profile.id, {
                          name: editName.trim(),
                          phone: editPhone.trim(),
                          specialty: editSpecialty.trim(),
                        });
                        setProfile(updated);
                        sessionStorage.setItem("technician_profile", JSON.stringify(updated));
                        toast.success("Profile saved successfully!");
                        setIsEditingProfile(false);
                      } catch (err: any) {
                        toast.error(`Save failed: ${err.message}`);
                      } finally {
                        setIsSavingProfile(false);
                      }
                    }}
                    disabled={isSavingProfile}
                    className="rounded-xl bg-[#002a22] hover:bg-[#00382d] px-5 py-2 font-bold text-white transition-all active:scale-95 cursor-pointer"
                  >
                    {isSavingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )
          ) : isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#cb9f5a] border-t-transparent" />
            </div>
          ) : displayBookings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-3xs">
              <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {activeFilter === "assigned" ? "All caught up!" : "No completed tasks yet"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {activeFilter === "assigned"
                    ? "No bookings are currently assigned to you. Enjoy your rest!"
                    : "When you finish and mark a job completed, it will appear here."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {displayBookings.map((b) => {
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
                    className="bg-white border border-slate-200 hover:border-slate-300 transition-all rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row justify-between gap-6"
                  >
                    {/* Booking metadata */}
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-655 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 uppercase">
                            #{b.id.substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{schedule?.date || "TBD"}</span>
                          </span>
                          <span className="text-slate-300 hidden sm:inline">•</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{schedule?.time || "Anytime"}</span>
                          </span>
                          <button
                            onClick={() => {
                              setRescheduleBookingId(b.id);
                              setNewDate(schedule?.date || "");
                              setNewTime(schedule?.time || "");
                              setRescheduleModalOpen(true);
                            }}
                            className="ml-2 text-[10px] text-slate-600 hover:text-[#002a22] hover:underline font-bold bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
                          >
                            🗓️ Reschedule
                          </button>
                        </div>
                      </div>

                      {/* Client info */}
                      <div className="space-y-3 bg-slate-50 border border-slate-150 p-3 sm:p-4 rounded-xl max-w-2xl font-sans">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Client Name:
                            </span>
                            <span className="font-bold text-slate-800 text-sm">
                              {customer?.name || "Client Name"}
                            </span>
                          </div>
                          {customer?.phone && (
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Phone:
                              </span>
                              <span className="font-semibold text-slate-700">+91 {customer.phone}</span>
                              <a
                                href={`tel:${customer.phone}`}
                                className="text-[10px] text-slate-700 hover:bg-slate-150/40 font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition-all"
                              >
                                📞 Call Customer
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start gap-2.5 text-xs text-slate-600">
                          <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Service Address Location:
                            </span>
                            <span className="font-semibold block text-slate-700">
                              {customer?.address || "No address provided."}
                            </span>
                            {customer?.landmark && (
                              <span className="text-xs text-amber-800 font-bold block mt-1.5 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg inline-block">
                                Landmark: {customer.landmark}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-bold block uppercase mt-1">
                              {customer?.city || "Bengaluru"} - {customer?.pincode}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="border-t border-slate-150 pt-3">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Cleaning services checklist
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {items?.map((item: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 font-bold px-3 py-1 rounded-xl border border-slate-200 text-2xs"
                            >
                              <ShoppingBag className="h-3 w-3 text-slate-400" />
                              {item.title}
                              <span className="text-slate-500 font-black">x{item.qty}</span>
                            </span>
                          ))}
                        </div>
                        {/* Job Progress Status Updates */}
                        <div className="border-t border-slate-100 pt-4 mt-4 font-sans">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                            Clean Job Progress Status
                          </span>

                          <div className="flex flex-wrap gap-2.5">
                            {[
                              {
                                value: "Assigned",
                                label: "📋 Assigned",
                                color: "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100",
                              },
                              {
                                value: "Accepted",
                                label: "🤝 Accept Job / Agree",
                                color: "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100",
                              },
                              {
                                value: "Started",
                                label: "🚗 On My Way",
                                color: "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100",
                              },
                              {
                                value: "Arrived",
                                label: "📍 Arrived / In Location",
                                color: "bg-teal-50 border-teal-200 text-teal-755 hover:bg-teal-100",
                              },
                              {
                                value: "Ongoing",
                                label: "🧼 Work Ongoing",
                                color: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
                              },
                              {
                                value: "Completed",
                                label: "✅ Complete Work / Finished",
                                color: "bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100",
                              },
                              {
                                value: "Issues",
                                label: "⚠️ Issue/Delay",
                                color: "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100",
                              },
                            ].map((status) => {
                              const isCurrent = (b.jobStatus || "Pending") === status.value;
                              return (
                                <button
                                  key={status.value}
                                  onClick={() => handleStatusUpdate(b.id, status.value)}
                                  className={`px-3 py-1.5 rounded-xl border text-2xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                                    isCurrent
                                      ? "bg-[#002a22] border-[#002a22] text-white font-extrabold shadow-sm"
                                      : status.color
                                  }`}
                                >
                                  {status.label}
                                  {isCurrent && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Saved Status Note */}
                          {b.statusNote && (
                            <div className="mt-3 bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-700 max-w-2xl">
                              <span className="font-extrabold uppercase text-[9px] text-[#cb9f5a] block mb-0.5">
                                ⚠️ Reported Delay / Issue Note:
                              </span>
                              <span className="font-semibold text-slate-700">{b.statusNote}</span>
                            </div>
                          )}

                          {/* Transformation Photos Input */}
                          <div className="mt-4 bg-slate-50/80 border border-slate-200 p-3 rounded-xl max-w-2xl font-sans space-y-2">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              📸 Upload / Set Before & After Transformation Photos
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-slate-500 font-semibold block mb-1">Before Cleaning Photo URL</span>
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
                                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-[#002a22]"
                                />
                              </div>
                              <div>
                                <span className="text-slate-500 font-semibold block mb-1">After Cleaning Photo URL</span>
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
                                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-[#002a22]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Maps & Payment Status */}
                    <div className="flex flex-col justify-between items-start md:items-end gap-4 md:border-l md:border-slate-100 md:pl-6 shrink-0 min-w-[200px] w-full md:w-auto">
                      <div className="text-left md:text-right w-full space-y-3 font-sans text-xs">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Status
                          </span>
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-700 border border-emerald-250 uppercase tracking-wider">
                              Paid In Full
                            </span>
                          ) : isPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-650 border border-emerald-200 uppercase tracking-wider">
                              Deposit Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-2xs font-extrabold text-amber-700 border border-amber-200 uppercase tracking-wider">
                              COD Pending
                            </span>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-2 text-xs space-y-1 font-bold">
                          <div className="flex justify-between gap-4 text-slate-500">
                            <span>Total Service Value:</span>
                            <span className="text-slate-800">₹{b.total}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-emerald-600">
                            <span>Amount Paid:</span>
                            <span>₹{paidAmount}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-amber-600 border-t border-slate-100 pt-1 text-sm font-extrabold">
                            <span>Balance to Collect:</span>
                            <span className="text-slate-900">₹{balanceAmount}</span>
                          </div>
                        </div>
                      </div>

                      {customer?.mapsLink && (
                        <a
                          href={customer.mapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-center inline-flex items-center justify-center gap-2 rounded-xl bg-[#002a22] hover:bg-[#00382d] px-4 py-2.5 text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-xl relative animate-in fade-in zoom-in duration-200 font-sans text-slate-800">
            <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
              ⚠️ Report Issue or Delay
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Please enter a brief note explaining the issue or reason for the schedule delay. This
              note will be visible to the customer and administrator.
            </p>

            <div className="mt-4">
              <textarea
                value={statusNoteText}
                onChange={(e) => setStatusNoteText(e.target.value)}
                placeholder="e.g. Stuck in heavy traffic, Water supply not available, etc."
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 outline-none focus:border-[#002a22] placeholder-slate-400 resize-none"
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
                className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 font-semibold text-slate-600 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitStatusWithNote}
                className="rounded-xl bg-[#002a22] hover:bg-[#00382d] px-5 py-2.5 font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
              >
                Submit Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl relative animate-in fade-in zoom-in duration-200 font-sans text-slate-800">
            <h3 className="text-lg font-display font-bold flex items-center gap-2 text-slate-800">
              🗓️ Reschedule Appointment
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select a new date and time slot for booking #
              {rescheduleBookingId.substring(0, 8).toUpperCase()}.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-slate-400">
                  Select Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-700 outline-none focus:border-[#002a22]"
                />
              </div>

              <div>
                <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-slate-400">
                  Select Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-700 outline-none focus:border-[#002a22]"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setRescheduleModalOpen(false);
                  setRescheduleBookingId("");
                }}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 font-semibold text-slate-600 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                className="rounded-xl bg-[#002a22] hover:bg-[#00382d] px-5 py-2.5 font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sticky Bottom Navigation Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-2.5 px-6 flex justify-around items-center md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveFilter("assigned")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeFilter === "assigned" ? "text-[#002a22]" : "text-slate-400"
          }`}
        >
          <span className="relative text-sm">
            🚗
            {assignedBookings.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-[#002a22] text-white text-[8px] font-black rounded-full h-4 w-4 flex items-center justify-center border border-white">
                {assignedBookings.length}
              </span>
            )}
          </span>
          <span>Assigned ({assignedBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter("completed")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeFilter === "completed" ? "text-emerald-700" : "text-slate-400"
          }`}
        >
          <span className="relative text-sm">
            ✅
            {completedBookings.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-emerald-600 text-white text-[8px] font-black rounded-full h-4 w-4 flex items-center justify-center border border-white">
                {completedBookings.length}
              </span>
            )}
          </span>
          <span>Completed ({completedBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter("profile")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            activeFilter === "profile" ? "text-slate-800 font-black" : "text-slate-400"
          }`}
        >
          <span className="text-sm">👤</span>
          <span>Profile</span>
        </button>
      </div>
    </div>
  );
}
