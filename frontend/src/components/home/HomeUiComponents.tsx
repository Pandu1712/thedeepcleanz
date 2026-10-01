import React, { useState, useEffect, useRef, type ReactNode } from "react";
import { Sparkles, X } from "lucide-react";
import type { Category, Service } from "@/data/homeServicesData";

function Counter({
  to,
  decimals = 0,
  suffix = "",
}: {
  to: number;
  decimals?: number;
  suffix?: string;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const dur = 1600;
            const tick = (t: number) => {
              const p = Math.min(1, (t - start) / dur);
              const eased = 1 - Math.pow(1 - p, 3);
              setVal(to * eased);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  const formatted = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("en-IN");
  return (
    <span ref={ref}>
      {formatted}
      {suffix}
    </span>
  );
}


function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="w-full text-left font-sans mb-6 sm:mb-8">
      <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#007A48] font-black block mb-1">
        — {eyebrow} —
      </span>
      <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight text-[#002A22]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}


function ModalShell({
  open,
  onClose,
  children,
  maxW = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxW?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#001712]/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxW} rounded-3xl bg-white border border-slate-200 shadow-[0_25px_70px_-15px_rgba(0,42,34,0.35)] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-50 grid h-9 w-9 place-items-center rounded-full bg-slate-100 hover:bg-[#002a22] text-[#002a22] hover:text-white transition-all shadow-md cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}


function Field({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  textarea?: boolean;
}) {
  return (
    <div className="font-sans">
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1.5 flex items-start gap-2 rounded-xl border border-[#cb9f5a]/20 bg-white px-4 py-3 focus-within:border-[#cb9f5a] focus-within:ring-1 focus-within:ring-[#cb9f5a] transition-all shadow-sm">
        {prefix && <span className="text-xs font-bold text-[#cb9f5a]">{prefix}</span>}
        {textarea ? (
          <textarea
            rows={2}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent text-xs font-semibold outline-none text-slate-800 placeholder:text-slate-400"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-xs font-semibold outline-none text-slate-800 placeholder:text-slate-400"
          />
        )}
      </div>
    </div>
  );
}

interface CategoryCarouselProps {
  category: Category;
  onSelectService: (s: Service) => void;
  onAddToCart: (s: Service) => void;
  getServicePrice: (basePrice: number) => number;
  liveReviews?: any[];
}


export interface BeforeAfterSliderProps {
  before: string;
  after: string;
  title: string;
  location: string;
}

export function BeforeAfterSlider({ before, after, title, location }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 to 100)
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  };

  useEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.getBoundingClientRect().width);

    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleStop = () => {
      isDragging.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleStop);
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleStop);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleStop);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleStop);
    };
  }, []);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden aspect-[4/3] w-full border border-emerald-800/40 select-none rounded-none group shadow-sm bg-slate-900"
    >
      {/* After Image (Background) */}
      <img
        src={after}
        alt={`${title} After`}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Before Image (Revealed via Clip Path) */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img
          src={before}
          alt={`${title} Before`}
          className="absolute inset-0 w-full h-full object-cover max-w-none"
          style={{ width: containerWidth ? `${containerWidth}px` : "100%" }}
        />
      </div>

      {/* Vertical Slider Handle Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-[#007A48] shadow-[0_0_15px_rgba(0,122,72,0.85)] z-20 cursor-ew-resize flex items-center justify-center"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* Grab Circle */}
        <div className="h-8 w-8 rounded-full bg-white border border-[#007A48] shadow-lg flex items-center justify-center pointer-events-none select-none">
          <span className="text-[#007A48] text-xs font-black select-none">↔</span>
        </div>
      </div>

      {/* Before / After Badges */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[8px] font-black tracking-wider text-white border border-white/10 uppercase z-30 rounded-none select-none pointer-events-none">
        Before
      </div>
      <div className="absolute top-3 right-3 bg-[#007A48] px-2 py-0.5 text-[8px] font-black tracking-wider text-white z-30 rounded-none select-none pointer-events-none">
        After
      </div>

      {/* Label Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10 pointer-events-none text-white">
        <h3 className="font-display text-xs font-bold text-white leading-tight">{title}</h3>
        <p className="text-[9px] text-emerald-400 font-extrabold mt-0.5">{location}</p>
      </div>
    </div>
  );
}

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}


export function TiltCard({ children, className, onClick }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCoords({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  const rotateX = -coords.y * 15; // Max 15 degree rotation
  const rotateY = coords.x * 15;

  const style = isHovered
    ? {
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
        transition: "transform 0.1s ease-out, box-shadow 0.1s ease-out",
        boxShadow: "0 15px 30px rgba(0, 42, 34, 0.15)",
        zIndex: 10,
      }
    : {
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: "transform 0.5s ease-out, box-shadow 0.5s ease-out",
        boxShadow: "none",
        zIndex: 1,
      };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={style}
      className={`relative select-none transition-all duration-300 will-change-transform ${className || ""}`}
    >
      {children}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 100px at ${(coords.x + 0.5) * 100}% ${(coords.y + 0.5) * 100}%, rgba(255, 255, 255, 0.25), transparent 70%)`,
            zIndex: 35,
          }}
        />
      )}
    </div>
  );
}

export { Counter, SectionHeader, ModalShell, Field };
