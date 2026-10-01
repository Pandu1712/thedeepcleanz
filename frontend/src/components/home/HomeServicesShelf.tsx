import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import imgHouse from "@/assets/service-house.jpg";

export interface ShelfServiceItem {
  id: string;
  title: string;
  subtext: string;
  image: string;
  action: () => void;
}

interface HomeServicesShelfProps {
  allShelfServices: ShelfServiceItem[];
}

export default function HomeServicesShelf({ allShelfServices }: HomeServicesShelfProps) {
  const shelfScrollRef = useRef<HTMLDivElement>(null);

  const scrollShelf = (direction: "left" | "right") => {
    if (!shelfScrollRef.current) return;
    const scrollAmount = 300;
    shelfScrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
      <section className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 font-sans">
        <div className="relative bg-white rounded-[20px] sm:rounded-[30px] border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-3.5 sm:p-7 md:p-8 z-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 mb-3.5 sm:mb-6 lg:mb-8">
            <div className="text-left">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#0B6B46] block mb-0.5">
                — OUR CLEANING SERVICES —
              </span>
              <h2 className="font-sans text-base sm:text-xl md:text-2xl font-bold text-[#111827] leading-snug">
                Choose from our professional deep cleaning services.
              </h2>
            </div>

            {/* Left & Right Movement Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => scrollShelf("left")}
                aria-label="Previous services"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-slate-200 hover:border-[#0B6B46] bg-white hover:bg-[#0B6B46]/5 text-slate-700 hover:text-[#0B6B46] shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollShelf("right")}
                aria-label="Next services"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-slate-200 hover:border-[#0B6B46] bg-white hover:bg-[#0B6B46]/5 text-slate-700 hover:text-[#0B6B46] shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Slider Container with side floating arrows */}
          <div className="relative group/shelf">
            {/* Floating Left Button */}
            <button
              type="button"
              onClick={() => scrollShelf("left")}
              aria-label="Scroll left"
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-white border border-slate-200 hover:border-[#0B6B46] text-slate-700 hover:text-[#0B6B46] shadow-md items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Floating Right Button */}
            <button
              type="button"
              onClick={() => scrollShelf("right")}
              aria-label="Scroll right"
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-white border border-slate-200 hover:border-[#0B6B46] text-slate-700 hover:text-[#0B6B46] shadow-md items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Horizontal Scrolling Track */}
            <div
              ref={shelfScrollRef}
              className="flex overflow-x-auto no-scrollbar scroll-smooth gap-3 sm:gap-5 py-2 px-1 snap-x snap-mandatory"
            >
              {allShelfServices.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="group shrink-0 snap-start flex flex-col items-center text-center p-2 sm:p-2.5 rounded-2xl hover:bg-[#F9FAF8] transition-all duration-300 cursor-pointer border border-transparent hover:border-slate-200 w-[125px] sm:w-[145px]"
                >
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-slate-100 group-hover:border-[#0B6B46] group-hover:scale-105 transition-all duration-300 shadow-sm shrink-0 bg-slate-100 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = imgHouse;
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  {/* Fixed-height Title Box - Guaranteed NO Cropping & Proper Clamping */}
                  <div className="w-full mt-2 min-h-[42px] flex items-center justify-center px-1">
                    <span
                      className="text-xs sm:text-[13px] font-bold text-[#111827] group-hover:text-[#0B6B46] transition-colors text-center leading-tight line-clamp-2 block"
                      title={item.title}
                    >
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-[#0B6B46] tracking-tight mt-1 whitespace-nowrap block">
                    {item.subtext}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

  );
}
