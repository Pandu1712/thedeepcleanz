import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Sparkles,
  X,
  Plus,
  Minus,
  CheckCircle2,
  Phone,
  Shield,
  Clock,
  Zap,
  Info,
  BadgeCheck,
  ShoppingCart,
  Star,
} from "lucide-react";
import { ModalShell } from "./HomeUiComponents";
import type { Service } from "@/data/homeServicesData";
import { postReview, fetchReviews, type ServicePlan, type ServiceReview } from "@/api/admin-api";
import { getServiceIcon } from "@/data/homeServicesData";

export function ServiceDetailModal({
  service,
  onClose,
  onAddPlan,
  getServicePrice,
}: {
  service: Service | null;
  onClose: () => void;
  onAddPlan: (s: Service, plan: ServicePlan) => void;
  getServicePrice: (basePrice: number) => number;
}) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");

  const userEmail = typeof window !== "undefined" ? sessionStorage.getItem("user_email") : null;
  const isAdmin =
    typeof window !== "undefined"
      ? sessionStorage.getItem("admin_authenticated") === "true"
      : false;
  const isLoggedIn = Boolean(userEmail || isAdmin);

  useEffect(() => {
    if (!service) return;
    onClose();
    navigate({ to: "/service-detail", search: { id: service.id } });
  }, [service]);

  if (!service) return null;

  const plans =
    service.plans && service.plans.length > 0
      ? service.plans
      : [
          {
            name: service.title,
            price: service.price,
            duration: "3 hours",
            description: service.desc || "",
            includes: service.sub || [],
            excludes: [
              "Wall painting or structural masonry repair",
              "Exterior window cleaning without balcony access",
              "Permanent old acid burn stain removal on stone",
            ],
          },
        ];

  const primaryPlan = plans[0];

  // Inclusions aggregation
  const allInclusions =
    plans.flatMap((p) => (Array.isArray(p.includes) ? p.includes : [])).length > 0
      ? Array.from(new Set(plans.flatMap((p) => (Array.isArray(p.includes) ? p.includes : []))))
      : service.sub && service.sub.length > 0
        ? service.sub
        : [
            "Deep scrubbing & degreasing of surface areas",
            "Sanitization & disinfection of all fixtures",
            "Machine vacuuming & dust extraction",
            "Post-cleaning quality inspection",
          ];

  // Exclusions aggregation
  const defaultExclusions = [
    "Wall painting, cement scraping or masonry work",
    "High-rise exterior glass cleaning without balcony access",
    "Permanent chemical burn or old acid damage stains",
    "Moving heavy furniture weighing over 40kg without assistance",
  ];

  const allExclusions =
    plans.flatMap((p) => (Array.isArray(p.excludes) ? p.excludes : [])).length > 0
      ? Array.from(new Set(plans.flatMap((p) => (Array.isArray(p.excludes) ? p.excludes : []))))
      : defaultExclusions;

  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
      : "4.9";

  const starsBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
    return { star, count, percentage };
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to submit a review");
      onClose();
      navigate({ to: "/login" });
      return;
    }
    if (!newReviewName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await postReview({
        serviceId: service.id,
        userName: newReviewName,
        rating: newReviewRating,
        comment: newReviewComment,
      });
      if (res.ok) {
        setReviews((prev) => [res.review, ...prev]);
        setNewReviewName("");
        setNewReviewRating(5);
        setNewReviewComment("");
        toast.success("Review submitted successfully!", { icon: "🎉" });
      }
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <ModalShell open onClose={onClose} maxW="max-w-5xl">
      <div className="overflow-hidden rounded-3xl max-h-[88vh] overflow-y-auto scrollbar-none font-sans bg-[#f8f6f0] p-4 sm:p-6 space-y-6">
        {/* SECTION 1: HERO TOP BLOCK */}
        <div className="bg-white rounded-3xl border border-emerald-200/60 p-6 sm:p-8 shadow-[0_10px_30px_-10px_rgba(0,42,34,0.08)] grid gap-8 md:grid-cols-[1fr_360px] items-center">
          {/* Left Column: Details & CTA */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl sm:text-4xl font-black text-[#002a22] tracking-tight">
              {service.title}
            </h2>

            {/* Quick Feature Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black text-[#007A48]">
                ⏱️ {primaryPlan?.duration || "2-3 Hours"}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black text-emerald-800">
                🛡️ Hygienic & Safe
              </span>
              <span className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full text-xs font-black text-sky-800">
                ✨ Verified Experts
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {service.desc ||
                "Professional deep cleaning engineered for luxury homes and commercial spaces using hospital-grade sanitizers."}
            </p>

            {/* Price Tag */}
            <div className="pt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-[#007A48] font-display">
                ₹{getServicePrice(primaryPlan?.price || service.price || 0)}
              </span>
              <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                (Inclusive of all taxes & equipment)
              </span>
            </div>

            {/* Add to Cart Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onAddPlan(service, primaryPlan)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#007A48] hover:bg-[#005B36] text-white px-8 py-3.5 text-sm font-black uppercase tracking-wider shadow-lg shadow-[#007A48]/25 hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 100% Satisfaction
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Free Rescheduling
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Background Verified Pros
              </span>
            </div>
          </div>

          {/* Right Column: Hero Image Frame */}
          <div className="relative overflow-hidden rounded-3xl aspect-[4/3] w-full bg-slate-100 border border-slate-200 shadow-md">
            <img src={service.img} alt={service.title} className="h-full w-full object-cover" />
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1 rounded-full text-xs font-black text-[#002a22] flex items-center gap-1 shadow-md">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> {avgRating} Rating
            </div>
          </div>
        </div>

        {/* SECTION 2: IMPORTANT NOTES */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-full bg-emerald-100 text-[#007A48] flex items-center justify-center font-black text-xs">
              🔔
            </div>
            <h3 className="font-display text-base font-black text-[#002a22]">
              Important Pre-Service Notes
            </h3>
          </div>
          <ul className="grid gap-2.5 text-xs text-slate-600 font-semibold sm:grid-cols-2">
            <li className="flex items-start gap-2.5 bg-[#faf8f5] p-3 rounded-xl border border-slate-100">
              <span className="text-[#007A48] font-bold shrink-0">1.</span>
              <span>
                Please ensure continuous water supply & functioning 16A power sockets for scrubber
                machines.
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-[#faf8f5] p-3 rounded-xl border border-slate-100">
              <span className="text-[#007A48] font-bold shrink-0">2.</span>
              <span>Keep valuable items & fragile decor secured before specialists arrive.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-[#faf8f5] p-3 rounded-xl border border-slate-100">
              <span className="text-[#007A48] font-bold shrink-0">3.</span>
              <span>
                Heavy furniture over 40kg will be cleaned underneath without moving if unassisted.
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-[#faf8f5] p-3 rounded-xl border border-slate-100">
              <span className="text-[#007A48] font-bold shrink-0">4.</span>
              <span>Quality check inspection will be conducted before team departure.</span>
            </li>
          </ul>
        </div>

        {/* SECTION 3: INCLUSIONS & EXCLUSIONS GRID (Matching Image 2 style) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Card: Includes */}
          <div className="bg-white rounded-3xl border border-emerald-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-emerald-100">
              <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                ⭐
              </div>
              <h3 className="font-display text-base font-black text-[#002a22]">
                Package Inclusions
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
              {allInclusions.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100"
                >
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Card: Exclusions */}
          <div className="bg-white rounded-3xl border border-rose-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-rose-100">
              <div className="h-7 w-7 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-black text-xs">
                ❌
              </div>
              <h3 className="font-display text-base font-black text-[#002a22]">
                Package Exclusions
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
              {allExclusions.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100"
                >
                  <span className="h-5 w-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    ✕
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SECTION 4: WHAT WE BRING vs WHAT WE NEED (Matching Image 2 style) */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-3xl border border-[#cb9f5a]/25 p-6 shadow-sm flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#002a22] text-[#cb9f5a] flex items-center justify-center text-xl shrink-0">
              🧰
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-[#002a22]">What We Bring</h4>
              <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                Hospital-grade disinfectants, single-use microfiber cloths, heavy-duty floor
                scrubbing machines, wet/dry vacuums & eco-friendly chemicals.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#cb9f5a]/25 p-6 shadow-sm flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#cb9f5a]/15 text-[#002a22] flex items-center justify-center text-xl shrink-0">
              🔌
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-[#002a22]">What We Need</h4>
              <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                Continuous water connection & a 16A electrical socket for operating machine
                equipment during service hours.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 5: PACKAGE OPTIONS (If multiple plans exist like Express / Elite) */}
        {plans.length > 1 && (
          <div className="bg-white rounded-3xl border border-[#cb9f5a]/25 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="h-4 w-4 text-[#cb9f5a]" />
              <h3 className="font-display text-base font-black text-[#002a22]">
                Select Package Variant
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 hover:border-[#cb9f5a] p-5 transition-all bg-[#faf8f5] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-base font-black text-[#002a22]">
                        {p.name}
                      </h4>
                      <span className="text-xs font-black text-[#002a22] bg-white border border-[#cb9f5a]/30 px-3 py-1 rounded-full">
                        ₹{getServicePrice(p.price)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                      {p.description || service.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">
                      ⏱️ {p.duration || "2 Hours"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddPlan(service, p)}
                      className="bg-[#002a22] hover:bg-[#cb9f5a] hover:text-[#002a22] text-white px-4 py-2 rounded-xl text-xs font-extrabold uppercase transition-colors cursor-pointer"
                    >
                      Select Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 6: BRAND ASSURANCE BADGES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Verified Specialists", icon: "🛡️" },
            { label: "4.9/5 Rating", icon: "⭐" },
            { label: "10,000+ Cleaned", icon: "🏆" },
            { label: "100% Satisfaction", icon: "✨" },
          ].map((b, i) => (
            <div
              key={i}
              className="bg-white border border-[#cb9f5a]/20 rounded-2xl p-3 text-center shadow-3xs"
            >
              <div className="text-lg">{b.icon}</div>
              <div className="text-[11px] font-black text-[#002a22] mt-1">{b.label}</div>
            </div>
          ))}
        </div>

        {/* SECTION 7: CUSTOMER REVIEWS */}
        <div className="bg-white rounded-3xl border border-[#cb9f5a]/25 p-6 shadow-sm space-y-6">
          <h4 className="font-display text-base font-black uppercase tracking-wider text-[#002a22]">
            Verified Customer Reviews
          </h4>

          <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
            <div className="rounded-2xl bg-[#cb9f5a]/10 border border-[#cb9f5a]/20 p-5 text-center flex flex-col justify-center items-center">
              <div className="font-display text-4xl font-black text-[#cb9f5a]">{avgRating}</div>
              <div className="flex justify-center gap-0.5 text-[#cb9f5a] mt-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? "fill-current" : ""}`}
                  />
                ))}
              </div>
              <div className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-wider">
                {reviewCount} Verified Ratings
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              {starsBreakdown.map((row) => (
                <div
                  key={row.star}
                  className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"
                >
                  <span className="w-3 text-right">{row.star}</span>
                  <Star className="h-3 w-3 text-[#cb9f5a] fill-current" />
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-400">{row.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-100 p-4 bg-[#faf8f5]">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-[#002a22] text-[#cb9f5a] flex items-center justify-center font-bold text-xs">
                      {r.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-black text-[#002a22] text-xs">{r.userName}</div>
                      <div className="text-[9px] text-slate-400 font-semibold">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-[#cb9f5a]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-current" : ""}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600 font-semibold italic">"{r.comment}"</p>
              </div>
            ))}
          </div>

          {/* Write review form / Login Gate */}
          {!isLoggedIn ? (
            <div className="rounded-2xl bg-gradient-to-r from-[#002a22] to-[#00382d] p-6 text-center text-white border border-[#cb9f5a]/40 shadow-md">
              <h5 className="font-display text-base font-black text-white">
                Want to leave a review?
              </h5>
              <p className="text-xs text-cream/80 mt-1 max-w-md mx-auto font-medium">
                Please log in to your account to share your experience with our luxury cleaning
                services.
              </p>
              <div className="mt-4">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#cb9f5a] via-[#e5be7a] to-[#cb9f5a] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#002a22] shadow-md hover:scale-105 transition-all"
                >
                  🔐 Login / Register to Review
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitReview}
              className="bg-[#faf8f5] border border-[#cb9f5a]/20 rounded-2xl p-4 space-y-3"
            >
              <div className="text-xs font-black uppercase text-[#002a22] tracking-wider">
                Write a Review
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Your Name
                  </label>
                  <input
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    placeholder="Name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#cb9f5a] font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Rating Star Count
                  </label>
                  <div className="flex gap-1.5 items-center mt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="transition-transform active:scale-125 cursor-pointer"
                      >
                        <Star
                          className={`h-5 w-5 ${star <= newReviewRating ? "text-[#cb9f5a] fill-current" : "text-slate-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Review Feedback
                </label>
                <textarea
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  rows={2}
                  placeholder="Share your experience cleaning with us..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a] font-semibold resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full rounded-xl bg-[#002a22] hover:bg-[#cb9f5a] hover:text-[#002a22] text-white font-black text-xs uppercase tracking-wider py-2.5 transition-all shadow-md cursor-pointer"
              >
                {isSubmittingReview ? "Submitting Review..." : "Submit My Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

export default ServiceDetailModal;
