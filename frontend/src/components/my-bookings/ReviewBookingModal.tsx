import React from "react";
import { X, Star } from "lucide-react";

interface ReviewBookingModalProps {
  open: boolean;
  onClose: () => void;
  service: { id: string; title: string } | null;
  rating: number;
  setRating: (r: number) => void;
  comment: string;
  setComment: (c: string) => void;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
}

export const ReviewBookingModal: React.FC<ReviewBookingModalProps> = ({
  open,
  onClose,
  service,
  rating,
  setRating,
  comment,
  setComment,
  isSubmitting,
  onSubmit,
}) => {
  if (!open || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001712]/60 backdrop-blur-md p-4 font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#00241B] p-6 shadow-2xl animate-in zoom-in-95 duration-250 border border-[#cb9f5a]/25 text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-[#faf8f5]/75 hover:bg-[#cb9f5a] hover:text-[#001712] border border-white/10 transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 pr-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#cb9f5a]">
            Service Review
          </span>
          <h2 className="mt-1.5 font-display text-xl font-bold text-[#faf8f5] leading-snug">
            Review "{service.title}"
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-[#faf8f5]/50 block mb-1.5 uppercase tracking-wider">
              Your Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform active:scale-125 cursor-pointer"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating ? "text-[#cb9f5a] fill-current" : "text-white/20"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-[#faf8f5]/50 block mb-1.5 uppercase tracking-wider">
              Your Comments
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="How clean did our team leave your place? Share your honest feedback..."
              className="w-full rounded-2xl border border-[#cb9f5a]/20 bg-black/25 px-4 py-3 text-xs text-white outline-none focus:border-[#cb9f5a] focus:ring-1 focus:ring-[#cb9f5a] transition-all resize-none placeholder:text-[#faf8f5]/30 font-semibold"
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa771c] text-[#002A22] font-bold py-3.5 rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-sans shadow-md"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#002A22] border-t-transparent" />
            ) : null}
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
};
