import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Car,
  MapPin,
  Sparkles,
  ShieldCheck,
  Phone,
  MessageSquare,
  Navigation,
  Image as ImageIcon,
  Maximize2,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { LiveTrackingMap } from "./LiveTrackingMap";

interface UrbanCompanyLiveTrackerProps {
  booking: any;
  onRescheduleClick?: () => void;
}

export const UrbanCompanyLiveTracker: React.FC<UrbanCompanyLiveTrackerProps> = ({
  booking,
  onRescheduleClick,
}) => {
  const [showMap, setShowMap] = useState<boolean>(() => {
    const st = (booking?.jobStatus || "").toLowerCase();
    return st === "started" || st === "arrived";
  });
  const [activePhotoTab, setActivePhotoTab] = useState<"both" | "before" | "after">("both");
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string } | null>(null);

  const jobStatus = booking?.jobStatus || "Pending";
  const hasTech = Boolean(booking?.technicianId || booking?.technician);
  const isCancelled = jobStatus === "Cancelled";

  // Stages calculation
  // Stage 0: Confirmed
  // Stage 1: Assigned
  // Stage 2: En Route (Started)
  // Stage 3: Arrived
  // Stage 4: Ongoing
  // Stage 5: Completed
  const getStageIndex = () => {
    if (isCancelled) return -1;
    const s = jobStatus.toLowerCase();
    if (s === "completed") return 5;
    if (s === "ongoing") return 4;
    if (s === "arrived") return 3;
    if (s === "started") return 2;
    if (s === "assigned" || s === "accepted") return 1;
    if (hasTech) return 1;
    return 0; // Confirmed
  };

  const currentStageIdx = getStageIndex();

  const stages = [
    {
      idx: 0,
      title: "Booking Confirmed",
      desc: "Order placed & verified",
      icon: CheckCircle2,
      activeColor: "from-emerald-500 to-teal-600",
    },
    {
      idx: 1,
      title: "Expert Assigned",
      desc: hasTech ? (booking?.technician?.name || "Clean Expert Assigned") : "Assigning verified pro",
      icon: ShieldCheck,
      activeColor: "from-blue-500 to-indigo-600",
    },
    {
      idx: 2,
      title: "On The Way",
      desc: "En route to doorstep",
      icon: Car,
      activeColor: "from-amber-500 to-yellow-600",
    },
    {
      idx: 3,
      title: "Arrived",
      desc: "At your service address",
      icon: MapPin,
      activeColor: "from-teal-500 to-emerald-600",
    },
    {
      idx: 4,
      title: "Cleaning In Progress",
      desc: "Deep cleaning underway",
      icon: Sparkles,
      activeColor: "from-purple-500 to-indigo-600",
    },
    {
      idx: 5,
      title: "Work Completed",
      desc: "Sparkling clean delivered",
      icon: CheckCircle2,
      activeColor: "from-emerald-600 to-green-700",
    },
  ];

  const beforePhoto = booking?.beforeImage || null;
  const afterPhoto = booking?.afterImage || null;
  const hasPhotos = Boolean(beforePhoto || afterPhoto);

  const technician = booking?.technician;
  const customer = typeof booking?.customer === "string" ? JSON.parse(booking?.customer) : booking?.customer;
  const schedule = typeof booking?.schedule === "string" ? JSON.parse(booking?.schedule) : booking?.schedule;

  return (
    <div className="my-5 rounded-3xl border border-[#cb9f5a]/30 bg-gradient-to-b from-white via-slate-50/50 to-white p-4 sm:p-6 shadow-sm font-sans transition-all">
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            {!isCancelled && currentStageIdx < 5 ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : isCancelled ? (
              <span className="inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            ) : (
              <span className="inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            )}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#002a22]">
                {isCancelled
                  ? "Service Cancelled"
                  : currentStageIdx === 5
                    ? "✨ Service Completed & Quality Inspected"
                    : "Live Clean Expert Tracking"}
              </h4>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#cb9f5a]/15 text-[#002a22] border border-[#cb9f5a]/30 uppercase">
                Urban Company Standard
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Slot: <strong className="text-slate-800">{schedule?.date || "TBD"}</strong> at{" "}
              <strong className="text-slate-800">{schedule?.time || "TBD"}</strong>
            </p>
          </div>
        </div>

        {/* Reschedule Button */}
        {!isCancelled && currentStageIdx < 4 && onRescheduleClick && (
          <button
            type="button"
            onClick={onRescheduleClick}
            className="self-start sm:self-auto text-[11px] font-bold text-[#002a22] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#cb9f5a]/50 px-3 py-1.5 rounded-xl shadow-3xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="h-3 w-3 text-[#cb9f5a]" />
            <span>Reschedule Slot</span>
          </button>
        )}
      </div>

      {/* Stepper Progress Bar (Responsive Stepper) */}
      {!isCancelled && (
        <div className="py-6 overflow-x-auto scrollbar-none">
          <div className="min-w-[620px] px-2">
            {/* Steps Nodes & Line Container */}
            <div className="relative flex items-center justify-between">
              {/* Connecting Background Line */}
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0" />

              {/* Connecting Completed Fill Line */}
              <div
                className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 via-[#cb9f5a] to-emerald-600 rounded-full z-0 transition-all duration-700"
                style={{
                  width: `${(Math.min(currentStageIdx, 5) / (stages.length - 1)) * 100}%`,
                }}
              />

              {/* Step Circles */}
              {stages.map((st) => {
                const isPassed = currentStageIdx > st.idx;
                const isCurrent = currentStageIdx === st.idx;
                const IconComponent = st.icon;

                return (
                  <div key={st.idx} className="relative z-10 flex flex-col items-center group">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCurrent
                          ? "bg-[#002a22] text-[#cb9f5a] ring-4 ring-[#cb9f5a]/40 shadow-lg scale-110"
                          : isPassed
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-white text-slate-300 border-2 border-slate-200"
                      }`}
                    >
                      <IconComponent className={`h-4.5 w-4.5 ${isCurrent ? "animate-pulse" : ""}`} />
                    </div>

                    {/* Step Title & Subtitle */}
                    <div className="absolute top-11 flex flex-col items-center text-center w-28">
                      <span
                        className={`text-[11px] font-extrabold leading-tight ${
                          isCurrent
                            ? "text-[#002a22]"
                            : isPassed
                              ? "text-emerald-800"
                              : "text-slate-400"
                        }`}
                      >
                        {st.title}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5 truncate w-full">
                        {st.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Spacer for bottom labels */}
          <div className="h-8" />
        </div>
      )}

      {/* Message from Technician Note (if any) */}
      {booking?.statusNote && (
        <div className="my-3 rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <span className="text-base shrink-0">💬</span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
              Direct Message from Clean Expert:
            </span>
            <p className="font-semibold mt-0.5">{booking.statusNote}</p>
          </div>
        </div>
      )}

      {/* Assigned Technician Profile Card */}
      {!isCancelled && technician && (
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-950/[0.04] via-[#cb9f5a]/[0.06] to-emerald-950/[0.04] border border-[#cb9f5a]/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-3xs">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-[#002a22] text-[#cb9f5a] flex items-center justify-center font-black text-base uppercase shadow-md border border-[#cb9f5a]/30">
                {technician.name ? technician.name.substring(0, 2).toUpperCase() : "EX"}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white" title="Verified Professional">
                <CheckCircle2 className="h-3 w-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h5 className="font-extrabold text-[#002a22] text-sm">
                  {technician.name}
                </h5>
                <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                  Verified Clean Pro
                </span>
                {technician.lat && technician.lng && (
                  <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-ping" />
                    Live GPS Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Specialty: <span className="text-slate-700 font-bold">{technician.specialty || "Full Deep Cleaning"}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {technician.phone && (
              <a
                href={`tel:${technician.phone}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl gradient-gold text-navy font-bold text-xs shadow-gold hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call Expert</span>
              </a>
            )}

            {technician.phone && (
              <a
                href={`https://wa.me/91${technician.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${technician.name}, I am contacting you regarding my TheDeep CleanerZ booking #${booking.id?.substring(0, 8)}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Toggle GPS Map button if coordinates exist */}
            {technician.lat && technician.lng && (
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs shadow-3xs transition-all cursor-pointer"
              >
                <Navigation className="h-3.5 w-3.5 text-sky-600" />
                <span>{showMap ? "Hide GPS Map" : "View Live Route"}</span>
                {showMap ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Real-time Live GPS Leaflet Route Map */}
      {!isCancelled && showMap && technician?.lat && technician?.lng && (
        <div className="mt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-emerald-600" />
              Live Technician Distance &amp; GPS Transit Map
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Satellite Feed
            </span>
          </div>

          <LiveTrackingMap
            techLat={Number(technician.lat)}
            techLng={Number(technician.lng)}
            customerLat={
              customer?.gpsCoords
                ? Number(String(customer.gpsCoords).split(",")[0]?.trim())
                : null
            }
            customerLng={
              customer?.gpsCoords
                ? Number(String(customer.gpsCoords).split(",")[1]?.trim())
                : null
            }
            customerAddress={customer?.address}
          />
        </div>
      )}

      {/* Urban Company-Style Before & After Transformation Photos Showcase */}
      {hasPhotos && (
        <div className="mt-5 rounded-2xl bg-white border border-[#cb9f5a]/30 p-4 sm:p-5 shadow-xs font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#002a22] text-[#cb9f5a] flex items-center justify-center font-bold text-sm shadow-xs">
                📸
              </div>
              <div>
                <h5 className="font-extrabold text-[#002a22] text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>Transformation Inspection Gallery</span>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full lowercase">
                    verified photos
                  </span>
                </h5>
                <p className="text-[10px] text-slate-400 font-medium">
                  Actual service photos documented on-site by your certified clean expert
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 p-1 rounded-xl text-[10px] font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActivePhotoTab("both")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activePhotoTab === "both" ? "bg-white text-[#002a22] shadow-3xs font-extrabold" : "hover:text-slate-900"
                }`}
              >
                Both
              </button>
              {beforePhoto && (
                <button
                  type="button"
                  onClick={() => setActivePhotoTab("before")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activePhotoTab === "before" ? "bg-white text-[#002a22] shadow-3xs font-extrabold" : "hover:text-slate-900"
                  }`}
                >
                  Before
                </button>
              )}
              {afterPhoto && (
                <button
                  type="button"
                  onClick={() => setActivePhotoTab("after")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activePhotoTab === "after" ? "bg-white text-[#002a22] shadow-3xs font-extrabold" : "hover:text-slate-900"
                  }`}
                >
                  After ✨
                </button>
              )}
            </div>
          </div>

          {/* Photo Display Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* Before Photo Card */}
            {(activePhotoTab === "both" || activePhotoTab === "before") && (
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 transition-all hover:shadow-md">
                <div className="absolute top-3 left-3 z-10 bg-black/75 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                  🔍 Before Cleaning
                </div>

                {beforePhoto ? (
                  <div
                    className="relative cursor-pointer overflow-hidden aspect-video"
                    onClick={() => setLightboxImg({ url: beforePhoto, title: "Before Cleaning Condition" })}
                  >
                    <img
                      src={beforePhoto}
                      alt="Before Cleaning"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                        <Maximize2 className="h-3.5 w-3.5" /> Tap to Enlarge
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-100/50">
                    <ImageIcon className="h-8 w-8 text-slate-300 mb-2" />
                    <span className="text-xs font-semibold">Before photo pending upload</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Technician takes this before starting scrub</span>
                  </div>
                )}
              </div>
            )}

            {/* After Photo Card */}
            {(activePhotoTab === "both" || activePhotoTab === "after") && (
              <div className="group relative rounded-2xl overflow-hidden border border-emerald-300 bg-emerald-50/30 transition-all hover:shadow-md">
                <div className="absolute top-3 left-3 z-10 bg-emerald-800/90 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                  <span>✨ After Deep Cleaning</span>
                </div>

                {afterPhoto ? (
                  <div
                    className="relative cursor-pointer overflow-hidden aspect-video"
                    onClick={() => setLightboxImg({ url: afterPhoto, title: "Completed Transformation Result" })}
                  >
                    <img
                      src={afterPhoto}
                      alt="After Cleaning"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                        <Maximize2 className="h-3.5 w-3.5" /> Tap to Enlarge
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-100/50">
                    <Sparkles className="h-8 w-8 text-emerald-400 mb-2" />
                    <span className="text-xs font-semibold">After photo pending completion</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Will be uploaded upon finishing inspection</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            <span>🛡️ Quality Inspected &amp; Certified by TheDeep CleanerZ</span>
            <span className="font-bold text-slate-600">Guntur HQ Certified</span>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 bg-black/50 text-white border-b border-white/10">
              <span className="text-sm font-bold flex items-center gap-2">
                <span>📸</span> {lightboxImg.title}
              </span>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[80vh]">
              <img
                src={lightboxImg.url}
                alt={lightboxImg.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
            <div className="p-3 bg-black/70 flex items-center justify-between text-2xs text-white/60">
              <span>Verified Customer Inspection Photo</span>
              <a
                href={lightboxImg.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#cb9f5a] hover:underline font-bold flex items-center gap-1"
              >
                <span>Open original HD</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
