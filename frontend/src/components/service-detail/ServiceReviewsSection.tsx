import React from "react";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { type ServiceReview } from "@/api/admin-api";

interface ServiceReviewsSectionProps {
  reviews: ServiceReview[];
  avgRating: string;
  reviewCount: number;
  isLoggedIn: boolean;
  newReviewName: string;
  setNewReviewName: (val: string) => void;
  newReviewRating: number;
  setNewReviewRating: (val: number) => void;
  newReviewComment: string;
  setNewReviewComment: (val: string) => void;
  isSubmittingReview: boolean;
  handleSubmitReview: (e: React.FormEvent) => Promise<void>;
}

export const ServiceReviewsSection: React.FC<ServiceReviewsSectionProps> = ({
  reviews,
  avgRating,
  reviewCount,
  isLoggedIn,
  newReviewName,
  setNewReviewName,
  newReviewRating,
  setNewReviewRating,
  newReviewComment,
  setNewReviewComment,
  isSubmittingReview,
  handleSubmitReview,
}) => {
  return (
    <section className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B6B46]">
            Verified Customer Feedback
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#002A22] mt-0.5">
            Reviews &amp; Experiences
          </h2>
        </div>
        <div className="flex items-center gap-3 bg-[#F4FAF6] border border-emerald-200 px-4 py-2.5 rounded-2xl shrink-0">
          <span className="text-2xl sm:text-3xl font-black text-[#002A22]">{avgRating}</span>
          <div>
            <div className="flex gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
              ))}
            </div>
            <span className="text-[10px] font-bold text-emerald-800">
              {reviewCount} verified reviews
            </span>
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FBFBF9] border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-[#002A22] text-white flex items-center justify-center font-bold text-xs">
                R
              </div>
              <div>
                <span className="text-xs font-bold text-[#002A22] block">Ramesh V.</span>
                <span className="text-[10px] text-slate-400">Verified Guntur Customer</span>
              </div>
            </div>
            <div className="flex gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-600 italic leading-relaxed">
            "Excellent service by The Deep CleanerZ team. No harsh chemical smells and completely spotless finish. Highly recommended!"
          </p>
        </div>

        {reviews.map((r) => (
          <div key={r.id} className="p-3.5 sm:p-4 rounded-2xl bg-[#FBFBF9] border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-[#002A22] text-white flex items-center justify-center font-bold text-xs">
                  {r.userName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#002A22] block">{r.userName}</span>
                  <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < (r.rating || 5) ? "fill-amber-500 text-amber-500" : "text-slate-300"}`} />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-600 italic leading-relaxed">
              "{r.comment}"
            </p>
          </div>
        ))}
      </div>

      {/* Write a Review Section */}
      <div className="pt-4 border-t border-slate-100">
        {!isLoggedIn ? (
          <div className="rounded-2xl bg-[#F6FAF8] border border-[#CBE2D8] p-4 text-center">
            <span className="text-xs text-slate-600 font-medium">
              Have you booked this service?{" "}
              <Link to="/login" className="text-[#0B6B46] font-bold underline">
                Log in to leave a verified rating &amp; review.
              </Link>
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="space-y-3 max-w-xl">
            <h3 className="text-xs font-bold text-[#002A22] uppercase tracking-wider">
              Leave Your Experience
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={newReviewName}
                onChange={(e) => setNewReviewName(e.target.value)}
                placeholder="Your Name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0B6B46]"
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-600 font-medium">Rating:</span>
                <select
                  value={newReviewRating}
                  onChange={(e) => setNewReviewRating(Number(e.target.value))}
                  className="text-xs font-bold text-amber-600 bg-transparent outline-none cursor-pointer"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars)</option>
                  <option value={2}>⭐⭐ (2 Stars)</option>
                  <option value={1}>⭐ (1 Star)</option>
                </select>
              </div>
            </div>
            <textarea
              value={newReviewComment}
              onChange={(e) => setNewReviewComment(e.target.value)}
              rows={2}
              placeholder="Share details of your cleaning experience..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0B6B46] resize-none"
            />
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="px-6 py-2.5 rounded-xl bg-[#002A22] hover:bg-[#0B6B46] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-0"
            >
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
