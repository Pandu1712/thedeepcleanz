import React from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Phone,
  Mail,
  MapPin,
  ArrowUp,
  Heart,
} from "lucide-react";
import { SERVICES } from "@/data/homeServicesData";

interface HomeFooterProps {
  onOpenLocation?: () => void;
}

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "#about", label: "About Us" },
  { href: "#reviews", label: "Reviews" },
  { href: "#contact", label: "Contact" },
];

export default function HomeFooter({ onOpenLocation }: HomeFooterProps) {
  return (
      <footer className="bg-[#00241B] text-slate-200 relative overflow-hidden border-t border-emerald-800/40">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[500px] h-[250px] bg-[#007A48]/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-[1400px] px-5 pt-16 pb-12 lg:px-8 relative z-10">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-emerald-900/60">
            {/* Column 1: Brand Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#007A48] to-[#005B36] p-[1px] shadow-lg shadow-[#007A48]/20">
                  <div className="h-full w-full rounded-[15px] bg-[#00241B] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold tracking-tight text-white">
                    TheDeep CleanerZ
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-extrabold mt-0.5">
                    Premium Deep Cleaning
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-300 font-medium">
                Redefining cleanliness with bespoke, hotel-grade service for premium homes &
                estates in Guntur & AP. Our attention to detail is your ultimate peace of mind.
              </p>
              <div className="flex gap-2.5">
                {[
                  { Icon: Facebook, label: "Facebook" },
                  { Icon: Instagram, label: "Instagram" },
                  { Icon: Twitter, label: "Twitter" },
                  { Icon: Youtube, label: "Youtube" },
                ].map((s, idx) => (
                  <a
                    key={idx}
                    href="#"
                    aria-label={s.label}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 border border-emerald-800/40 transition-all duration-300 text-slate-300 hover:bg-[#007A48] hover:text-white hover:border-[#007A48] hover:-translate-y-1 hover:shadow-md hover:shadow-[#007A48]/20"
                  >
                    <s.Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-800/40 pb-3">
                Quick Navigation
              </h4>
              <ul className="mt-5 space-y-3 text-xs font-semibold">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="group flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition-all duration-200"
                    >
                      <span className="h-1 w-1 rounded-full bg-emerald-400 scale-0 group-hover:scale-100 transition-transform duration-200 mr-1" />
                      <span className="group-hover:translate-x-1.5 transition-transform duration-250">
                        {l.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Top Services */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-800/40 pb-3">
                Our Core Services
              </h4>
              <ul className="mt-5 space-y-3 text-xs font-semibold">
                {SERVICES.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <a
                      href="#services"
                      className="group flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition-all duration-200"
                    >
                      <span className="h-1 w-1 rounded-full bg-emerald-400 scale-0 group-hover:scale-100 transition-transform duration-200 mr-1" />
                      <span className="group-hover:translate-x-1.5 transition-transform duration-250">
                        {s.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact & Support */}
            <div className="space-y-5">
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-800/40 pb-3">
                Reservations
              </h4>

              <div className="space-y-4 font-sans">
                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-emerald-400 group-hover:bg-[#007A48] group-hover:text-white group-hover:border-[#007A48] transition-all">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-300/70 uppercase tracking-wider font-extrabold">
                      Hotline Support
                    </div>
                    <a
                      href="tel:+919966346347"
                      className="text-xs font-bold text-white hover:text-emerald-400 transition-colors whitespace-nowrap inline-block font-mono select-all"
                    >
                      +91 99663 46347
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-emerald-400 group-hover:bg-[#007A48] group-hover:text-white group-hover:border-[#007A48] transition-all">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-300/70 uppercase tracking-wider font-extrabold">
                      Email Concierge
                    </div>
                    <a
                      href="mailto:thedeepcleanerz.info@gmail.com"
                      className="text-xs font-bold text-white hover:text-emerald-400 transition-colors"
                    >
                      thedeepcleanerz.info@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-emerald-400 group-hover:bg-[#007A48] group-hover:text-white group-hover:border-[#007A48] transition-all">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-300/70 uppercase tracking-wider font-extrabold">
                      Service Areas
                    </div>
                    <span className="text-xs font-bold text-white">Arundelpet, Guntur & AP Hubs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Legal Links */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-semibold tracking-wide">
            <div>
              &copy; {new Date().getFullYear()} TheDeep CleanerZ. All rights reserved. Crafted for
              pristine luxury living.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-emerald-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-emerald-400 transition-colors">
                Terms of Service
              </a>
              <Link
                to="/admin"
                className="text-emerald-400/80 hover:text-emerald-300 hover:underline flex items-center gap-1 font-bold"
              >
                🛡️ Admin Area
              </Link>
            </div>
          </div>
        </div>
      </footer>
  );
}
