import { useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";

/**
 * Official WhatsApp Original Vector Logo Icon
 */
export function WhatsAppOriginalIcon({ className = "w-6 h-6 text-white" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 2.667C8.636 2.667 2.667 8.636 2.667 16c0 2.479.678 4.801 1.861 6.793L2.667 29.333l6.732-1.765A13.284 13.284 0 0016 29.333c7.364 0 13.333-5.969 13.333-13.333S23.364 2.667 16 2.667zm0 24.373a11.02 11.02 0 01-5.617-1.536l-.403-.24-4.175 1.095 1.115-4.068-.263-.418A11.02 11.02 0 014.96 16c0-6.087 4.953-11.04 11.04-11.04 6.087 0 11.04 4.953 11.04 11.04 0 6.087-4.953 11.04-11.04 11.04zm6.056-8.256c-.332-.167-1.966-.97-2.271-1.081-.305-.111-.527-.167-.749.167-.222.333-.859 1.081-1.053 1.303-.194.222-.388.25-.72.083-.333-.167-1.405-.518-2.677-1.652-.989-.882-1.657-1.972-1.851-2.305-.194-.333-.021-.513.146-.679.15-.15.333-.388.5-.582.166-.194.222-.333.333-.555.111-.222.055-.416-.028-.582-.083-.167-.749-1.803-1.026-2.47-.27-.648-.544-.56-.749-.57-.194-.01-.416-.013-.638-.013s-.582.083-.887.416c-.305.333-1.164 1.137-1.164 2.774 0 1.637 1.192 3.218 1.358 3.44.167.222 2.345 3.581 5.682 5.023.794.343 1.414.548 1.898.702.798.254 1.524.218 2.098.132.64-.096 1.966-.804 2.243-1.581.277-.777.277-1.442.194-1.581-.083-.139-.305-.222-.638-.388z"
      />
    </svg>
  );
}

/**
 * Official Phone Call Original Vector Icon with Ringing / Dial Vibration
 */
export function PhoneCallOriginalIcon({ className = "w-6 h-6 text-white" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

interface StickyContactButtonsProps {
  whatsappNumber?: string;
  phoneNumber?: string;
  defaultMessage?: string;
}

export default function StickyContactButtons({
  whatsappNumber = "919966346347",
  phoneNumber = "+919966346347",
  defaultMessage = "Hi TheDeep CleanerZ, I would like to inquire about your professional deep cleaning services in Guntur.",
}: StickyContactButtonsProps) {
  const location = useLocation();
  const currentPath = location?.pathname || "";

  // Hide on Admin and Technician control portals
  if (
    currentPath.startsWith("/admin") ||
    currentPath.startsWith("/technician")
  ) {
    return null;
  }

  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(defaultMessage)}`;
  const telUrl = `tel:${phoneNumber.replace(/\s/g, "")}`;

  return (
    <aside
      aria-label="Quick Contact Sticky Buttons"
      className="fixed z-40 flex flex-col items-end gap-3 right-4 sm:right-6 bottom-[82px] md:bottom-6 pointer-events-none select-none"
    >
      {/* 1. STICKY WHATSAPP BUTTON (Original WhatsApp Green #25D366) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with TheDeep CleanerZ on WhatsApp"
        className="pointer-events-auto group relative flex items-center justify-center h-13 w-13 sm:h-14 sm:w-14 rounded-full bg-[#25D366] text-white shadow-[0_8px_25px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_32px_rgba(37,211,102,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 cursor-pointer"
      >
        {/* Subtle Pulse Ping Wave */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/35 animate-ping opacity-75 pointer-events-none" />

        {/* Official WhatsApp Logo */}
        <WhatsAppOriginalIcon className="h-7 w-7 sm:h-8 sm:w-8 relative z-10 drop-shadow-sm transition-transform duration-300 group-hover:rotate-6" />

        {/* Hover Tooltip (Desktop) */}
        <span className="absolute right-full mr-3.5 hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/95 text-white text-xs font-bold font-sans tracking-wide shadow-xl whitespace-nowrap opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none border border-white/10">
          <span className="h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
          Chat on WhatsApp
        </span>
      </a>

      {/* 2. STICKY CALL BUTTON (Deep Emerald / Royal Green Dial Hotline) */}
      <a
        href={telUrl}
        aria-label="Call TheDeep CleanerZ Hotline: +91 99663 46347"
        className="pointer-events-auto group relative flex items-center justify-center h-13 w-13 sm:h-14 sm:w-14 rounded-full bg-gradient-to-tr from-[#005B36] to-[#00874F] text-white shadow-[0_8px_25px_rgba(0,122,72,0.4)] hover:shadow-[0_12px_32px_rgba(0,122,72,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#007A48]/40 cursor-pointer"
      >
        {/* Call Icon */}
        <PhoneCallOriginalIcon className="h-6 w-6 sm:h-7 sm:w-7 relative z-10 drop-shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />

        {/* Hover Tooltip (Desktop) */}
        <span className="absolute right-full mr-3.5 hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/95 text-white text-xs font-bold font-sans tracking-wide shadow-xl whitespace-nowrap opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none border border-white/10">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Call: +91 99663 46347
        </span>
      </a>
    </aside>
  );
}
