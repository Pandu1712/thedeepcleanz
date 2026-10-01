import React, { useState } from "react";
import { Star } from "lucide-react";
import { SectionHeader } from "./HomeUiComponents";

export interface ReviewItem {
  n: string;
  c: string;
  rating?: number;
  serviceTitle: string;
  q: string;
  color: string;
  date?: string;
}

interface HomeReviewsSectionProps {
  sortedReviews: ReviewItem[];
  reviewSortMode: "recent" | "highest" | "lowest";
  setReviewSortMode: (mode: "recent" | "highest" | "lowest") => void;
}

export default function HomeReviewsSection({
  sortedReviews,
  reviewSortMode,
  setReviewSortMode,
}: HomeReviewsSectionProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);

  return (
      <section id="reviews" className="mx-auto max-w-[1400px] px-5 py-8 md:py-12 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200 pb-4">
          <SectionHeader eyebrow="Customer Reviews" title="Loved by Homes & Businesses" />

          {/* Sorting tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200 font-sans">
            {[
              { id: "recent", label: "Most Recent" },
              { id: "highest", label: "Highest Rated" },
              { id: "lowest", label: "Lowest Rated" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setReviewSortMode(mode.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                  reviewSortMode === mode.id
                    ? "bg-[#002A22] text-white shadow-xs"
                    : "text-[#002A22]/70 hover:text-[#002A22] hover:bg-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {sortedReviews.slice(0, showAllReviews ? undefined : 4).map((r, index) => (
            <div
              key={`${r.n}-${index}`}
              className="hover-lift rounded-none bg-white p-5 border border-[#cb9f5a]/10 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex gap-0.5 text-[#cb9f5a]">
                  {Array.from({ length: r.rating || 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
                {/* Service Tag */}
                <div className="mt-1.5 text-[9px] font-extrabold uppercase tracking-wider text-[#cb9f5a]/85 bg-[#cb9f5a]/5 border border-[#cb9f5a]/20 px-2.5 py-0.5 rounded-full w-fit">
                  {r.serviceTitle}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 font-medium font-sans">
                  "{r.q}"
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2.5 pt-3 border-t border-slate-100">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${r.color} font-display text-sm font-bold text-white`}
                >
                  {r.c}
                </div>
                <div>
                  <div className="font-bold text-xs text-[#002a22]">{r.n}</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                    Verified Customer
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedReviews.length > 4 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowAllReviews((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#cb9f5a]/30 hover:border-[#cb9f5a] bg-white hover:bg-slate-50 px-6 py-2.5 text-xs font-bold text-navy shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer font-sans"
            >
              {showAllReviews ? "View Less" : "View More Reviews"}
            </button>
          </div>
        )}
      </section>

  );
}
