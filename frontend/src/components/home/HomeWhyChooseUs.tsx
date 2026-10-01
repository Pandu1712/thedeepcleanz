import React from "react";
import {
  Shield,
  Leaf,
  Wallet,
  Clock,
  Wrench,
  Users,
  CheckCircle2,
  Sparkles,
  Calendar,
} from "lucide-react";
import { SectionHeader, Counter, BeforeAfterSlider } from "./HomeUiComponents";
import type { RecentTransformation } from "@/api/admin-api";

interface HomeWhyChooseUsProps {
  transformations?: RecentTransformation[];
}

export default function HomeWhyChooseUs({ transformations = [] }: HomeWhyChooseUsProps) {
  return (
    <>
      <section
        id="about"
        className="bg-[#F8FAF9] py-8 md:py-12 border-b border-slate-200 relative"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeader
            eyebrow="Why Choose Us"
            title="Trusted by Thousands for a Reason"
            subtitle="Every booking is backed by training, technology and a satisfaction promise."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                i: Shield,
                t: "Verified Staff",
                d: "Background-checked, certified professionals in full uniform.",
                bg: "bg-white",
                border: "border-slate-200",
                iconBg: "bg-[#EBF5EE] text-[#007A48]",
              },
              {
                i: Leaf,
                t: "Eco-Safe Care",
                d: "Plant-based, 100% biodegradable, pet & child-safe cleaning agents.",
                bg: "bg-[#002A22] text-white",
                border: "border-transparent",
                iconBg: "bg-white/10 text-emerald-400",
              },
              {
                i: Wallet,
                t: "Upfront Pricing",
                d: "Honest, direct pricing. No hidden rates, no surprise additions.",
                bg: "bg-white",
                border: "border-slate-200",
                iconBg: "bg-[#EBF5EE] text-[#007A48]",
              },
              {
                i: Clock,
                t: "Same Day Booking",
                d: "Need urgent cleaning? Book a same-day slot in under 60 seconds.",
                bg: "bg-white",
                border: "border-slate-200",
                iconBg: "bg-[#EBF5EE] text-[#007A48]",
              },
              {
                i: Wrench,
                t: "Advanced Gear",
                d: "Equipped with specialized HEPA-filter vacuums & high-pressure steam washers.",
                bg: "bg-white",
                border: "border-slate-200",
                iconBg: "bg-[#EBF5EE] text-[#007A48]",
              },
              {
                i: Users,
                t: "Elite Customer Trust",
                d: "Join 10,000+ happy clients enjoying premium luxury standards.",
                bg: "bg-white",
                border: "border-slate-200",
                iconBg: "bg-[#EBF5EE] text-[#007A48]",
              },
            ].map((f) => (
              <div
                key={f.t}
                className={`group hover-lift rounded-2xl p-5 border ${f.border} ${f.bg} shadow-sm transition-all hover:shadow-md`}
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl ${f.iconBg} transition-transform group-hover:scale-105`}
                >
                  <f.i className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold">{f.t}</h3>
                <p className="mt-1 text-xs opacity-75 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="mx-auto max-w-[1400px] px-5 py-8 md:py-12 lg:px-8">
        <SectionHeader eyebrow="How It Works" title="Four Simple Steps to a Spotless Space" />
        <div className="relative mt-5 grid gap-4 md:grid-cols-4">
          <div className="absolute left-0 right-0 top-6 hidden h-[1px] bg-gradient-to-r from-transparent via-[#007A48]/20 to-transparent md:block" />
          {[
            {
              n: "01",
              t: "Select Service",
              d: "Explore luxury treatments & customize your session.",
              i: Sparkles,
            },
            {
              n: "02",
              t: "Schedule Slot",
              d: "Choose a time slot that matches your itinerary.",
              i: Calendar,
            },
            {
              n: "03",
              t: "Team Execution",
              d: "Certified professionals arrive to sterilize your space.",
              i: Users,
            },
            {
              n: "04",
              t: "Indulge & Enjoy",
              d: "Step back into a pristine, refreshed domain.",
              i: CheckCircle2,
            },
          ].map((s) => (
            <div
              key={s.n}
              className="relative rounded-2xl bg-white border border-slate-200 p-5 text-center transition-all hover:border-[#007A48]/40 hover:shadow-md shadow-xs"
            >
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#002A22] text-emerald-400 shadow-sm relative z-10">
                <s.i className="h-5 w-5" />
              </div>
              <div className="mt-2.5 font-display text-2xl font-black text-[#007A48]/25">{s.n}</div>
              <h3 className="mt-0.5 font-display text-sm font-bold text-[#002A22]">{s.t}</h3>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed font-medium">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT WORKS */}
      <section className="bg-white py-8 md:py-12 border-b border-slate-200">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
          <SectionHeader eyebrow="Recent Services" title="Recently Completed Transformations" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {transformations.map((w) => (
              w.beforeImage ? (
                <BeforeAfterSlider
                  key={w.id}
                  before={w.beforeImage}
                  after={w.afterImage}
                  title={w.title}
                  location={w.location}
                />
              ) : (
                <div key={w.id} className="relative overflow-hidden rounded-2xl shadow-sm aspect-[4/3] w-full border border-slate-200 bg-slate-900">
                  <img
                    src={w.afterImage}
                    alt={w.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent z-10 pointer-events-none text-white p-4 flex flex-col justify-end">
                    <h3 className="font-display text-xs font-bold text-white leading-tight">{w.title}</h3>
                    <p className="text-[9px] text-emerald-300 font-extrabold mt-0.5">{w.location}</p>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="gradient-premium relative overflow-hidden py-8 md:py-12 text-cream noise-overlay">
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-[1400px] gap-6 px-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {[
            { n: 10000, suffix: "+", l: "Happy Customers" },
            { n: 500, suffix: "+", l: "Daily Bookings" },
            { n: 4.9, suffix: "", l: "Average Rating", decimals: 1 },
            { n: 50, suffix: "+", l: "Professional Staff" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-4xl font-extrabold text-white md:text-5xl">
                <Counter to={s.n} decimals={s.decimals ?? 0} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-emerald-300 font-bold">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

    </>
  );
}
