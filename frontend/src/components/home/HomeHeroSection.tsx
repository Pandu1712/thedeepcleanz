import React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  Leaf,
  Clock,
  ArrowRight,
  Star,
  Home as HomeIcon,
} from "lucide-react";

export default function HomeHeroSection() {
  const navigate = useNavigate();

  return (
      <section
        id="home"
        className="relative overflow-hidden bg-[#FBFBF9] text-[#111827] pt-3 sm:pt-6 lg:pt-10 pb-8 sm:pb-16 font-sans"
      >
        <div className="relative mx-auto max-w-[1440px] 2xl:max-w-[1560px] px-3.5 sm:px-6 lg:px-8 2xl:px-10">
          {/* MOBILE HERO (< lg): Headline (1-2 lines) -> Next Image -> Next Services Shelf ("All in one view") */}
          <div className="block lg:hidden text-center pt-1 pb-1">
            {/* Small 1 or 2 line Headline */}
            <h1 className="font-sans text-xl sm:text-2xl font-black tracking-tight text-[#111827] leading-tight px-1">
              Premium Cleaning for a{" "}
              <span className="text-[#0B6B46]">Healthier &amp; Happier</span>{" "}
              Space.
            </h1>

            {/* Next: Team Image */}
            <div className="mt-3 relative w-full max-w-[340px] sm:max-w-[420px] mx-auto">
              <img
                src="/images/hero-team.jpg"
                alt="The Deep CleanerZ In-House Professional Cleaning Team"
                className="w-full h-auto object-contain rounded-2xl shadow-xs select-none"
              />
            </div>
          </div>

          {/* DESKTOP HERO (lg+): 2-Column Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headline, Description, CTAs, Trust Metrics */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Trust Badge Pill */}
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0B6B46] text-white px-4 py-1.5 text-xs font-semibold shadow-sm w-fit">
                <ShieldCheck className="h-4 w-4 text-emerald-200 shrink-0" />
                <span>Trusted Cleaning Experts</span>
              </div>

              {/* Main Headline */}
              <h1 className="mt-5 font-sans text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-black tracking-tight text-[#111827] leading-[1.12]">
                Premium Cleaning for a{" "}
                <span className="text-[#0B6B46] block sm:inline">Healthier &amp; Happier</span>{" "}
                Space.
              </h1>

              {/* Subtitle */}
              <p className="mt-4 text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                Professional home &amp; deep cleaning services for a spotless, fresh and healthy environment.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("categories");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    else navigate({ to: "/services" });
                  }}
                  className="btn-luxury-primary"
                >
                  <span>Book a Cleaning</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate({ to: "/services" })}
                  className="btn-luxury-secondary"
                >
                  <span>Explore Services</span>
                </button>
              </div>

              {/* Trust Stats Bar (4 columns) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-10 pt-8 border-t border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-[#EBF5EE] text-[#0B6B46] flex items-center justify-center shrink-0">
                    <HomeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-[#111827] leading-tight">10,000+</div>
                    <div className="text-xs text-slate-500 font-medium">Happy Homes</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-[#EBF5EE] text-[#0B6B46] flex items-center justify-center shrink-0">
                    <Star className="h-5 w-5 fill-[#0B6B46]" />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-[#111827] leading-tight">4.9 / 5.0</div>
                    <div className="text-xs text-slate-500 font-medium">Avg Rating</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-[#EBF5EE] text-[#0B6B46] flex items-center justify-center shrink-0">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-[#111827] leading-tight">100% Eco</div>
                    <div className="text-xs text-slate-500 font-medium">Safe Products</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-[#EBF5EE] text-[#0B6B46] flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-[#111827] leading-tight">On-Time</div>
                    <div className="text-xs text-slate-500 font-medium">Guaranteed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Cleaners Team Photo with Badges */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-[540px]">
                <img
                  src="/images/hero-team.jpg"
                  alt="The Deep CleanerZ In-House Professional Cleaning Team"
                  className="w-full h-auto object-contain rounded-2xl select-none"
                />
              </div>
            </div>
          </div>

          {/* Mobile Trust Stats Bar (shown below the team image on mobile) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 lg:hidden">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-3xs">
              <div className="h-8.5 w-8.5 rounded-full bg-[#EBF5EE] text-[#0B6B46] flex items-center justify-center shrink-0">
                <HomeIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#111827] leading-tight">10,000+</div>
                <div className="text-[10px] text-slate-500 font-medium">Happy Homes</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-3xs">
              <div className="h-8.5 w-8.5 rounded-full bg-[#EBF5EE] text-[#0B6B46] flex items-center justify-center shrink-0">
                <Star className="h-4 w-4 fill-[#0B6B46]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#111827] leading-tight">4.9 / 5.0</div>
                <div className="text-[10px] text-slate-500 font-medium">Avg Rating</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-3xs">
              <div className="h-8.5 w-8.5 rounded-full bg-[#EBF5EE] text-[#0B6B46] flex items-center justify-center shrink-0">
                <Leaf className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#111827] leading-tight">100% Eco</div>
                <div className="text-[10px] text-slate-500 font-medium">Safe Products</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-3xs">
              <div className="h-8.5 w-8.5 rounded-full bg-[#EBF5EE] text-[#0B6B46] flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#111827] leading-tight">On-Time</div>
                <div className="text-[10px] text-slate-500 font-medium">Guaranteed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

  );
}
