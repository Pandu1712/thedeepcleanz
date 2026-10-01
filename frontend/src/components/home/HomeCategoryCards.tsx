import React, { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { type Category, getCategoryIcon } from "@/data/homeServicesData";

interface HomeCategoryCardsProps {
  categories: Category[];
  selectedCat: string;
  setSelectedCat: (catId: string) => void;
  activeSubCategory: string | null;
  setActiveSubCategory: (subId: string | null) => void;
}

export default function HomeCategoryCards({
  categories,
  selectedCat,
  setSelectedCat,
  activeSubCategory,
  setActiveSubCategory,
}: HomeCategoryCardsProps) {
  const navigate = useNavigate();

  const parentCategoriesWithSubServices = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  return (
      <section
        id="categories"
        className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-8 sm:pb-12 font-sans"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 sm:mb-8">
          <div className="max-w-xl text-left font-sans">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#C89B3C] font-black block mb-1">
              EXPLORE OPTIONS
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] leading-tight">
              All <span className="text-[#0B6B46]">Services</span>
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-lg">
              Choose a category or sub-category package to explore all professional deep cleaning services.
            </p>
          </div>

          {/* Armchair scene banner graphic from mockup */}
          <div className="hidden md:block w-[220px] lg:w-[290px] shrink-0">
            <img
              src="/images/armchair-scene.jpg"
              alt="Luxury Living Room"
              className="w-full h-auto object-contain rounded-2xl select-none"
            />
          </div>
        </div>

        {/* DESKTOP CATEGORY CARDS (hidden on mobile) */}
        <div className="mt-4 max-w-[1400px] mx-auto hidden md:block">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 justify-center items-stretch">
            {parentCategoriesWithSubServices.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white border border-[#cb9f5a]/25 p-8 w-full rounded-2xl">
                <span className="text-2xl block mb-2">✨</span>
                <h3 className="font-sans text-base font-bold text-[#111827]">No Services Launched Yet</h3>
                <p className="text-xs text-slate-500 mt-1">Please configure catalog categories and services in the Admin Console.</p>
              </div>
            ) : (
              parentCategoriesWithSubServices.map((c) => {
                const CategoryIcon = getCategoryIcon(c.title);
                const serviceCount = c.services?.length || (c.id === "commercial" ? 8 : c.id === "customized" ? 15 : 3);
                const defaultImage = c.id === "commercial" 
                  ? "/images/commercial.jpg" 
                  : c.id === "customized" 
                  ? "/images/customized.jpg" 
                  : "/images/full_house.jpg";

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      navigate({
                        to: "/services",
                        search: { category: c.id },
                      });
                    }}
                    className="group relative overflow-hidden rounded-[22px] bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer text-left"
                  >
                    {/* Card Top: Image with Badges */}
                    <div>
                      <div className="relative w-full h-44 sm:h-52 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={c.image || defaultImage}
                          alt={c.title}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = defaultImage;
                          }}
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />

                        {/* Top-Left Badge: X SERVICES */}
                        <span className="absolute top-3 left-3 rounded-full bg-[#0B6B46] text-white px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase shadow-xs">
                          {serviceCount} SERVICES
                        </span>

                        {/* Floating Icon Box overlapping bottom-left */}
                        <div className="absolute -bottom-2.5 left-3.5 h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white border border-slate-100 shadow-md flex items-center justify-center text-[#111827] group-hover:bg-[#0B6B46] group-hover:text-white transition-colors duration-300 z-10">
                          <CategoryIcon className="h-5 w-5 stroke-[1.8]" />
                        </div>
                      </div>

                      {/* Content Details - ONLY Title/Name, No Description */}
                      <div className="mt-5 px-1">
                        <h3 className="font-sans text-lg sm:text-xl font-bold text-[#111827] group-hover:text-[#0B6B46] transition-colors leading-snug">
                          {c.title}
                        </h3>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between px-1">
                      <span className="text-xs sm:text-sm font-semibold text-[#C89B3C] group-hover:text-[#A67C22] transition-colors flex items-center gap-1.5">
                        View services <span className="transition-transform group-hover:translate-x-1">→</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                        EXPLORE —
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* MOBILE 3D CATEGORY TILES (Exact Match to User's Reference Screenshot) */}
        <div className="block md:hidden max-w-[360px] mx-auto px-4 pt-2 pb-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 items-start">
            {/* 1. Full House Deep Cleaning */}
            <div
              onClick={() => {
                navigate({
                  to: "/services",
                  search: { category: "full-house" },
                });
              }}
              className="flex flex-col items-center text-center cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-full aspect-square bg-[#FAF7EE] rounded-3xl p-2.5 border border-[#EBE5D3] shadow-xs flex items-center justify-center overflow-hidden">
                <img
                  src="/images/cat-3d-house.jpg"
                  alt="Full House Deep Cleaning"
                  className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform"
                />
              </div>
              <h3 className="mt-2 text-[13px] font-bold text-slate-900 leading-snug">
                Full House Deep Cleaning
              </h3>
            </div>

            {/* 2. Customized Cleaning Package */}
            <div
              onClick={() => {
                navigate({
                  to: "/services",
                  search: { category: "customized" },
                });
              }}
              className="flex flex-col items-center text-center cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-full aspect-square bg-[#FAF7EE] rounded-3xl p-2.5 border border-[#EBE5D3] shadow-xs flex items-center justify-center overflow-hidden">
                <img
                  src="/images/cat-3d-sofa.jpg"
                  alt="Customized Cleaning Package"
                  className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform"
                />
              </div>
              <h3 className="mt-2 text-[13px] font-bold text-slate-900 leading-snug">
                Customized Cleaning Package
              </h3>
            </div>
          </div>

          {/* 3. Commercial Post Interior Cleaning (Centered below) */}
          <div className="mt-5 flex justify-center">
            <div
              onClick={() => {
                navigate({
                  to: "/services",
                  search: { category: "commercial" },
                });
              }}
              className="w-[155px] flex flex-col items-center text-center cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="w-full aspect-square bg-[#FAF7EE] rounded-3xl p-2.5 border border-[#EBE5D3] shadow-xs flex items-center justify-center overflow-hidden">
                <img
                  src="/images/cat-3d-commercial.jpg"
                  alt="Commercial Post Interior Cleaning Services"
                  className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform"
                />
              </div>
              <h3 className="mt-2 text-[13px] font-bold text-slate-900 leading-snug">
                Commercial Post Interior Cleaning Services
              </h3>
            </div>
          </div>
        </div>
      </section>

  );
}
