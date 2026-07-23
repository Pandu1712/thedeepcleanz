import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Menu,
  X,
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  Star,
  Shield,
  Clock,
  Leaf,
  Wallet,
  Wrench,
  Users,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Calendar,
  Home as HomeIcon,
  ChefHat,
  Bath,
  Sofa,
  Armchair,
  Building2,
  Hotel,
  Refrigerator,
  Layers,
  BedDouble,
  Square,
  Droplets,
  Wind,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Award,
  Send,
  Lock,
  Edit3,
  Save,
  Search,
  Heart,
  ArrowUp,
  MessageCircle,
  PartyPopper,
  Gift,
  Zap,
  BadgeCheck,
  Check,
  Car,
  Utensils,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Locate,
  User,
  Map,
  Smartphone,
} from "lucide-react";

import heroImg from "@/assets/hero-cleaning.jpg";
import imgKitchen from "@/assets/service-kitchen.jpg";
import imgSofa from "@/assets/service-sofa.jpg";
import imgBathroom from "@/assets/service-bathroom.jpg";
import imgHouse from "@/assets/service-house.jpg";
import imgOffice from "@/assets/service-office.jpg";
import imgFridge from "@/assets/service-fridge.jpg";
import imgCarpet from "@/assets/service-carpet.jpg";
import imgMattress from "@/assets/service-mattress.jpg";
import imgGlass from "@/assets/service-glass.jpg";
import imgFloor from "@/assets/service-floor.jpg";
import imgHotel from "@/assets/service-hotel.jpg";
import imgBalcony from "@/assets/service-balcony.jpg";
import imgInterior from "@/assets/service-interior.jpg";
import imgFurniture from "@/assets/service-furniture.jpg";
import imgTank from "@/assets/service-tank.jpg";
import {
  fetchAdminCatalog,
  postAdminBooking,
  createRazorpayOrder,
  fetchReviews,
  postReview,
  fetchCustomizedServices,
  validateCoupon,
  fetchCoupons,
  ADMIN_API_URL,
  fetchAllReviews,
  fetchRecentTransformations,
  type RecentTransformation,
  type AdminCatalog,
  type ServicePlan,
  type ServiceReview,
  type AdminCustomizedService,
} from "@/api/admin-api";
import Header from "@/components/Header";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/utils/firebase";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      category: typeof search.category === "string" ? search.category : undefined,
      cart: typeof search.cart === "string" ? search.cart : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "TheDeep CleanerZ — Premium Deep Cleaning for Homes & Businesses" },
      {
        name: "description",
        content:
          "Luxury deep cleaning services for homes, offices and hotels. Verified professionals, eco-friendly products, same-day booking starting ₹499.",
      },
      { property: "og:title", content: "TheDeep CleanerZ — Premium Deep Cleaning" },
      {
        property: "og:description",
        content: "Spotless spaces by trusted experts. Affordable, reliable, hassle-free.",
      },
    ],
  }),
  component: Index,
});

const SERVICE_ICONS: Record<string, any> = {
  house: HomeIcon,
  kitchen: ChefHat,
  bath: Bath,
  sofa: Sofa,
  furniture: Armchair,
  interior: Sparkles,
  balcony: Building2,
  office: Building2,
  hotel: Hotel,
  fridge: Refrigerator,
  carpet: Layers,
  mattress: BedDouble,
  glass: Square,
  floor: Droplets,
  tank: Droplets,
};

export function getServiceIcon(id: string) {
  return SERVICE_ICONS[id] || Wrench;
}

function getInclusionIcon(name: string) {
  const norm = name.toLowerCase();
  if (
    norm.includes("vacuum") ||
    norm.includes("dust") ||
    norm.includes("exhaust") ||
    norm.includes("fan")
  )
    return Wind;
  if (
    norm.includes("scrub") ||
    norm.includes("wash") ||
    norm.includes("mop") ||
    norm.includes("polish") ||
    norm.includes("limescale") ||
    norm.includes("water") ||
    norm.includes("drain") ||
    norm.includes("sediment")
  )
    return Droplets;
  if (
    norm.includes("sanit") ||
    norm.includes("disinfect") ||
    norm.includes("protect") ||
    norm.includes("shield")
  )
    return Shield;
  if (norm.includes("eco") || norm.includes("biological")) return Leaf;
  if (
    norm.includes("chimney") ||
    norm.includes("stove") ||
    norm.includes("cabinet") ||
    norm.includes("fridge") ||
    norm.includes("refrigerator") ||
    norm.includes("tray") ||
    norm.includes("rack")
  )
    return ChefHat;
  if (norm.includes("clock") || norm.includes("hour") || norm.includes("day")) return Clock;
  if (
    norm.includes("wood") ||
    norm.includes("leather") ||
    norm.includes("upholstery") ||
    norm.includes("sofa") ||
    norm.includes("furniture") ||
    norm.includes("chair")
  )
    return Sofa;
  return BadgeCheck;
}

function getCategoryIcon(id: string) {
  const norm = id.toLowerCase();
  const words = norm.split(/[\s\-_]+/);
  const hasWord = (w: string) => words.includes(w);

  if (hasWord("car") || norm.includes("car wash")) return Car;
  if (norm.includes("kitchen") || norm.includes("cook")) return ChefHat;
  if (
    norm.includes("washroom") ||
    norm.includes("bath") ||
    norm.includes("toilet") ||
    norm.includes("restroom")
  )
    return Bath;
  if (norm.includes("commercial") || norm.includes("office") || norm.includes("building"))
    return Building2;
  if (
    norm.includes("sofa") ||
    norm.includes("upholstery") ||
    norm.includes("furniture") ||
    norm.includes("chair") ||
    norm.includes("custom") ||
    norm.includes("package")
  )
    return Sofa;
  if (norm.includes("makhana") || norm.includes("food") || norm.includes("snack")) return Utensils;
  if (norm.includes("house") || norm.includes("home")) return HomeIcon;
  return Sparkles;
}

type StaticService = {
  id: string;
  title: string;
  desc: string;
  price: number;
  img: string;
  Icon: typeof HomeIcon;
  sub: { name: string; icon: typeof HomeIcon }[];
};

export const SERVICES: StaticService[] = [
  {
    id: "house",
    title: "Full House Cleaning",
    desc: "Complete top-to-bottom deep clean for every room.",
    price: 1999,
    img: imgHouse,
    Icon: HomeIcon,
    sub: [
      { name: "Bedroom Cleaning", icon: BedDouble },
      { name: "Living Room Cleaning", icon: Sofa },
      { name: "Dining Area Cleaning", icon: Armchair },
      { name: "Fan Cleaning", icon: Wind },
      { name: "Window Cleaning", icon: Square },
      { name: "Floor Mopping", icon: Droplets },
    ],
  },
  {
    id: "kitchen",
    title: "Kitchen Deep Cleaning",
    desc: "Grease-free chimney, stove, sink and cabinets.",
    price: 999,
    img: imgKitchen,
    Icon: ChefHat,
    sub: [
      { name: "Chimney Cleaning", icon: Wind },
      { name: "Stove Cleaning", icon: ChefHat },
      { name: "Sink Cleaning", icon: Droplets },
      { name: "Cabinet Cleaning", icon: Layers },
      { name: "Tile Cleaning", icon: Square },
      { name: "Exhaust Fan Cleaning", icon: Wind },
    ],
  },
  {
    id: "bath",
    title: "Bathroom Cleaning",
    desc: "Sanitised tiles, fittings and grout — sparkling fresh.",
    price: 599,
    img: imgBathroom,
    Icon: Bath,
    sub: [
      { name: "Tile & Grout", icon: Square },
      { name: "Toilet Sanitisation", icon: Droplets },
      { name: "Tap & Fittings", icon: Wrench },
      { name: "Mirror Polishing", icon: Sparkles },
      { name: "Exhaust Cleaning", icon: Wind },
      { name: "Floor Scrubbing", icon: Layers },
    ],
  },
  {
    id: "sofa",
    title: "Sofa Cleaning",
    desc: "Shampoo & steam cleaning for fabric and leather.",
    price: 499,
    img: imgSofa,
    Icon: Sofa,
    sub: [
      { name: "Fabric Shampoo", icon: Droplets },
      { name: "Leather Polish", icon: Sparkles },
      { name: "Stain Removal", icon: Wrench },
      { name: "Cushion Vacuum", icon: Wind },
      { name: "Deodorising", icon: Leaf },
      { name: "Fabric Protection", icon: Shield },
    ],
  },
  {
    id: "furniture",
    title: "Furniture Cleaning",
    desc: "Wood, glass and upholstery, polished to perfection.",
    price: 699,
    img: imgFurniture,
    Icon: Armchair,
    sub: [
      { name: "Wood Polishing", icon: Sparkles },
      { name: "Dust Removal", icon: Wind },
      { name: "Glass Wiping", icon: Square },
      { name: "Upholstery Vacuum", icon: Sofa },
      { name: "Stain Treatment", icon: Wrench },
      { name: "Surface Disinfect", icon: Shield },
    ],
  },
  {
    id: "interior",
    title: "Interior Cleaning",
    desc: "Walls, ceilings, fans and light fittings.",
    price: 1499,
    img: imgInterior,
    Icon: Layers,
    sub: [
      { name: "Wall Dusting", icon: Square },
      { name: "Ceiling Cleaning", icon: Layers },
      { name: "Fan Cleaning", icon: Wind },
      { name: "Light Fittings", icon: Sparkles },
      { name: "Switchboard Wipe", icon: Wrench },
      { name: "Skirting Polish", icon: Droplets },
    ],
  },
  {
    id: "balcony",
    title: "Balcony Cleaning",
    desc: "Power-washed floors, railings and planters.",
    price: 499,
    img: imgBalcony,
    Icon: Square,
    sub: [
      { name: "Floor Scrubbing", icon: Droplets },
      { name: "Railing Wipe", icon: Wrench },
      { name: "Planter Care", icon: Leaf },
      { name: "Glass Cleaning", icon: Square },
      { name: "Tile Polishing", icon: Sparkles },
      { name: "Drain Clearing", icon: Wind },
    ],
  },
  {
    id: "office",
    title: "Office Cleaning",
    desc: "Workstations, glass, carpets and pantry.",
    price: 2499,
    img: imgOffice,
    Icon: Building2,
    sub: [
      { name: "Workstation Wipe", icon: Wrench },
      { name: "Glass Partition", icon: Square },
      { name: "Carpet Vacuum", icon: Layers },
      { name: "Pantry Cleaning", icon: ChefHat },
      { name: "Washroom Sanitise", icon: Bath },
      { name: "Floor Mopping", icon: Droplets },
    ],
  },
  {
    id: "hotel",
    title: "Hotel Cleaning",
    desc: "Hospitality-grade housekeeping for rooms & lobbies.",
    price: 2999,
    img: imgHotel,
    Icon: Hotel,
    sub: [
      { name: "Room Turnover", icon: BedDouble },
      { name: "Linen Change", icon: Layers },
      { name: "Lobby Polish", icon: Sparkles },
      { name: "Glass Façade", icon: Square },
      { name: "Carpet Shampoo", icon: Droplets },
      { name: "Washroom Sanitise", icon: Bath },
    ],
  },
  {
    id: "fridge",
    title: "Refrigerator Cleaning",
    desc: "Inside-out hygiene with food-safe products.",
    price: 499,
    img: imgFridge,
    Icon: Refrigerator,
    sub: [
      { name: "Interior Wash", icon: Droplets },
      { name: "Shelf Sanitise", icon: Shield },
      { name: "Coil Dusting", icon: Wind },
      { name: "Door Seal Clean", icon: Wrench },
      { name: "Odour Removal", icon: Leaf },
      { name: "Exterior Polish", icon: Sparkles },
    ],
  },
  {
    id: "carpet",
    title: "Carpet Cleaning",
    desc: "Deep extraction shampoo for stains & dust mites.",
    price: 599,
    img: imgCarpet,
    Icon: Layers,
    sub: [
      { name: "Vacuum Pre-clean", icon: Wind },
      { name: "Stain Treatment", icon: Wrench },
      { name: "Shampoo Wash", icon: Droplets },
      { name: "Hot Extraction", icon: Sparkles },
      { name: "Deodorising", icon: Leaf },
      { name: "Quick Drying", icon: Shield },
    ],
  },
  {
    id: "mattress",
    title: "Mattress Cleaning",
    desc: "UV sanitisation, dust-mite & stain removal.",
    price: 599,
    img: imgMattress,
    Icon: BedDouble,
    sub: [
      { name: "Deep Vacuum", icon: Wind },
      { name: "Stain Removal", icon: Wrench },
      { name: "UV Sanitise", icon: Shield },
      { name: "Dust-mite Treat", icon: Leaf },
      { name: "Deodorising", icon: Sparkles },
      { name: "Fabric Protect", icon: Droplets },
    ],
  },
  {
    id: "glass",
    title: "Glass Cleaning",
    desc: "Streak-free windows, façades and mirrors.",
    price: 499,
    img: imgGlass,
    Icon: Square,
    sub: [
      { name: "Window Wipe", icon: Square },
      { name: "Mirror Polish", icon: Sparkles },
      { name: "Façade Cleaning", icon: Building2 },
      { name: "Frame Dusting", icon: Wind },
      { name: "Sill Scrubbing", icon: Droplets },
      { name: "Anti-spot Coat", icon: Shield },
    ],
  },
  {
    id: "floor",
    title: "Floor Scrubbing",
    desc: "Machine scrubbing & polishing for all flooring.",
    price: 799,
    img: imgFloor,
    Icon: Droplets,
    sub: [
      { name: "Marble Polish", icon: Sparkles },
      { name: "Tile Scrub", icon: Square },
      { name: "Grout Cleaning", icon: Wrench },
      { name: "Wood Care", icon: Layers },
      { name: "Anti-slip Treat", icon: Shield },
      { name: "Sealant Coat", icon: Droplets },
    ],
  },
  {
    id: "tank",
    title: "Water Tank Cleaning",
    desc: "Hygiene-certified drain, scrub & sanitise.",
    price: 1499,
    img: imgTank,
    Icon: Droplets,
    sub: [
      { name: "Tank Drain", icon: Droplets },
      { name: "Sediment Scrub", icon: Wrench },
      { name: "High-pressure Wash", icon: Wind },
      { name: "Disinfection", icon: Shield },
      { name: "Lid & Vent Clean", icon: Square },
      { name: "Quality Test", icon: Sparkles },
    ],
  },
];

export type PrecautionItem = {
  title: string;
  description: string;
};

export type CatService = {
  id: string;
  title: string;
  desc: string;
  price: number;
  img: string;
  sub: string[];
  image?: string;
  plans?: ServicePlan[];
  disclaimer?: string;
  requirements?: string;
  paymentType?: "full" | "deposit_25" | "deposit_50" | "free_advance";
  precautions?: PrecautionItem[];
};
export type Category = {
  id: string;
  title: string;
  tagline: string;
  emoji: string;
  image?: string;
  parentId?: string | null;
  services: CatService[];
};
export type Service = CatService;

const toCatService = (id: string): CatService => {
  const s = SERVICES.find((x) => x.id === id)!;
  return {
    id: s.id,
    title: s.title,
    desc: s.desc,
    price: s.price,
    img: s.img,
    sub: s.sub.map((x) => x.name),
    paymentType: "full",
  };
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "full-house",
    title: "Full House Deep Cleaning",
    tagline: "Top-to-bottom premium clean for the entire home",
    emoji: "🏠",
    image: imgHouse,
    services: ["house", "kitchen", "bath", "interior", "floor", "tank"].map(toCatService),
  },
  {
    id: "customized",
    title: "Customized Cleaning Package",
    tagline: "Pick exactly what you need — room by room",
    emoji: "🛋️",
    image: imgSofa,
    services: ["sofa", "furniture", "carpet", "mattress", "glass", "fridge", "balcony"].map(
      toCatService,
    ),
  },
  {
    id: "commercial",
    title: "Commercial Post Interior Cleaning",
    tagline: "Office, hotel & post-construction expertise",
    emoji: "🏢",
    image: imgOffice,
    services: ["office", "hotel"].map(toCatService),
  },
];

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }
    if (!document.getElementById("leaflet-css")) {
      const css = document.createElement("link");
      css.id = "leaflet-css";
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
    }
    if (document.getElementById("leaflet-js")) {
      const interval = setInterval(() => {
        if ((window as any).L) {
          clearInterval(interval);
          resolve((window as any).L);
        }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      resolve((window as any).L);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function MapPickerModal({
  open,
  initialLat,
  initialLng,
  onClose,
  onConfirmLocation,
}: {
  open: boolean;
  initialLat?: number | null;
  initialLng?: number | null;
  onClose: () => void;
  onConfirmLocation: (data: {
    address: string;
    landmark: string;
    pincode: string;
    city: string;
    lat: number;
    lng: number;
    mapsLink: string;
  }) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [currentLat, setCurrentLat] = useState<number>(initialLat || 16.307888);
  const [currentLng, setCurrentLng] = useState<number>(initialLng || 80.438993);
  const [addressData, setAddressData] = useState<{
    address: string;
    landmark: string;
    pincode: string;
    city: string;
  }>({
    address: "",
    landmark: "",
    pincode: "",
    city: "",
  });
  const [isLoadingAddr, setIsLoadingAddr] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoadingAddr(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const houseNumber = addr.house_number || addr.building || "";
        const road = addr.road || addr.street || addr.residential || "";
        const suburb = addr.suburb || addr.neighbourhood || addr.village || "";
        const city = addr.city || addr.town || addr.county || addr.state_district || "Guntur";
        const pincode = addr.postcode || "";

        const fullStreetAddr = [houseNumber, road, suburb].filter(Boolean).join(", ");
        const fullDisplayAddr = data.display_name || `${fullStreetAddr}, ${city}`;
        const landmarkStr = suburb || road ? `${suburb || road}, ${city}` : city;

        setAddressData({
          address: fullStreetAddr || fullDisplayAddr,
          landmark: landmarkStr,
          pincode: pincode,
          city: city,
        });
      }
    } catch (err) {
      console.warn("Reverse geocoding error:", err);
    } finally {
      setIsLoadingAddr(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    loadLeaflet().then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      const lat = initialLat || 16.307888;
      const lng = initialLng || 80.438993;
      setCurrentLat(lat);
      setCurrentLng(lng);
      reverseGeocode(lat, lng);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
      });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const goldIcon = L.divIcon({
        className: "custom-map-pin",
        html: `<div style="background:#002a22; color:#cb9f5a; border:2px solid #cb9f5a; border-radius:50%; width:38px; height:38px; display:grid; place-items:center; font-size:20px; shadow:0 4px 12px rgba(0,0,0,0.3); font-weight:bold;">📍</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });

      const marker = L.marker([lat, lng], { draggable: true, icon: goldIcon }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", (e: any) => {
        const position = e.target.getLatLng();
        setCurrentLat(position.lat);
        setCurrentLng(position.lng);
        reverseGeocode(position.lat, position.lng);
      });

      map.on("click", (e: any) => {
        const { lat: clickedLat, lng: clickedLng } = e.latlng;
        marker.setLatLng([clickedLat, clickedLng]);
        setCurrentLat(clickedLat);
        setCurrentLng(clickedLng);
        reverseGeocode(clickedLat, clickedLng);
      });
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }
    const tId = toast.loading("Fetching live GPS coordinates...", { icon: "📡" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLat(latitude);
        setCurrentLng(longitude);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        reverseGeocode(latitude, longitude);
        toast.success("Live GPS acquired! Adjust pin marker on map.", { id: tId, icon: "📍" });
      },
      (err) => {
        toast.error("GPS access denied or unavailable.", { id: tId });
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001712]/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200 font-sans">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="bg-white rounded-3xl w-full max-w-lg border border-[#cb9f5a]/30 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#cb9f5a]/15 flex items-center justify-between bg-[#faf8f5]">
          <div>
            <h3 className="font-display text-base font-bold text-[#002a22] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#cb9f5a]" /> Pin Exact House Location
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              Drag golden pin marker or click on map to mark your doorstep for technicians
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Map View */}
        <div className="relative flex-1 min-h-[320px] w-full bg-slate-100">
          <div ref={mapContainerRef} className="h-full w-full min-h-[320px]" />
          
          <button
            type="button"
            onClick={handleGPSDetect}
            className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 bg-white border border-[#cb9f5a]/40 text-[#002a22] px-3.5 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-[#faf8f5] transition-all cursor-pointer"
          >
            <Locate className="h-4 w-4 text-[#cb9f5a] animate-pulse" />
            <span>Center My GPS</span>
          </button>
        </div>

        {/* Footer address preview & confirm */}
        <div className="p-4 border-t border-[#cb9f5a]/15 bg-white space-y-3">
          <div className="rounded-xl bg-[#cb9f5a]/5 p-3 border border-[#cb9f5a]/15 flex items-start gap-2.5">
            <span className="text-base">📍</span>
            <div className="flex-1">
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#cb9f5a]">
                Selected Doorstep Location {isLoadingAddr && "(Loading address...)"}
              </div>
              <p className="text-xs font-bold text-[#002a22] mt-0.5 leading-snug">
                {addressData.address || `Lat: ${currentLat.toFixed(5)}, Lng: ${currentLng.toFixed(5)}`}
              </p>
              {addressData.pincode && (
                <span className="inline-block mt-1 text-[9px] font-mono font-bold text-[#cb9f5a] bg-white px-2 py-0.5 rounded border border-[#cb9f5a]/20">
                  Pincode: {addressData.pincode}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmLocation({
                  address: addressData.address,
                  landmark: addressData.landmark,
                  pincode: addressData.pincode,
                  city: addressData.city,
                  lat: currentLat,
                  lng: currentLng,
                  mapsLink: `https://www.google.com/maps?q=${currentLat},${currentLng}`,
                });
                onClose();
              }}
              className="flex-2 rounded-xl gradient-gold py-2.5 text-xs font-bold text-navy shadow-gold hover:scale-[1.01] transition-transform cursor-pointer"
            >
              Confirm Exact Doorstep Pin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const GUNTUR_LOCATIONS = [
  // --- GUNTUR AREAS ---
  {
    area: "Arundelpet",
    landmark: "Near Hindu College, NTR Stadium Road",
    pincode: "522002",
    city: "Guntur",
    mapsLink: "https://maps.google.com/?q=Arundelpet,Guntur",
    lat: 16.307888,
    lng: 80.438993,
  },
  {
    area: "Lakshmipuram",
    landmark: "Near Vidya Nagar Park, Opp. Amaravati Hotel",
    pincode: "522007",
    city: "Guntur",
    mapsLink: "https://maps.google.com/?q=Lakshmipuram,Guntur",
    lat: 16.3098,
    lng: 80.4215,
  },
  {
    area: "Brodipet",
    landmark: "Brodipet 4th Line, Opp. Union Bank",
    pincode: "522002",
    city: "Guntur",
    mapsLink: "https://maps.google.com/?q=Brodipet,Guntur",
    lat: 16.3142,
    lng: 80.4332,
  },
  {
    area: "Nagarampalem",
    landmark: "Opp. Collector Office, Near Court Complex",
    pincode: "522004",
    city: "Guntur",
    mapsLink: "https://maps.google.com/?q=Nagarampalem,Guntur",
    lat: 16.3032,
    lng: 80.4435,
  },
  {
    area: "Koritepadu",
    landmark: "Near Koritepadu Water Tank, Opp. Post Office",
    pincode: "522007",
    city: "Guntur",
    mapsLink: "https://maps.google.com/?q=Koritepadu,Guntur",
    lat: 16.3262,
    lng: 80.4312,
  },
  {
    area: "Gorantla (Amaravathi Road)",
    landmark: "Opp. Chalapathi School, Gorantla",
    pincode: "522034",
    city: "Guntur",
    mapsLink: "https://maps.google.com/?q=Gorantla,Guntur",
    lat: 16.3312,
    lng: 80.4045,
  },
  {
    area: "Pattabhipuram",
    landmark: "Near Pattabhipuram Railway Gate",
    pincode: "522006",
    city: "Guntur",
    mapsLink: "https://maps.google.com/?q=Pattabhipuram,Guntur",
    lat: 16.3082,
    lng: 80.4182,
  },
  {
    area: "Chuttugunta",
    landmark: "Chuttugunta Circle, Near RTC Bus Depot",
    pincode: "522004",
    city: "Guntur",
    mapsLink: "https://maps.google.com/?q=Chuttugunta,Guntur",
    lat: 16.2932,
    lng: 80.4512,
  },
  {
    area: "Stambalagaruvu",
    landmark: "Near Stambalagaruvu Junction",
    pincode: "522006",
    city: "Guntur",
    mapsLink: "https://maps.google.com/?q=Stambalagaruvu,Guntur",
    lat: 16.3192,
    lng: 80.4152,
  },

  // --- VIJAYAWADA AREAS ---
  {
    area: "Benz Circle",
    landmark: "Near Benz Circle Flyover, Opp. Trendset Mall",
    pincode: "520010",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Benz+Circle,Vijayawada",
    lat: 16.5062,
    lng: 80.648,
  },
  {
    area: "MG Road (Bandar Road)",
    landmark: "Opp. PVP Square Mall & Ripple Mall",
    pincode: "520010",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=MG+Road,Vijayawada",
    lat: 16.5085,
    lng: 80.6322,
  },
  {
    area: "Patamata",
    landmark: "Near High School Road, Opp. VR Siddhartha Eng. College",
    pincode: "520010",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Patamata,Vijayawada",
    lat: 16.4962,
    lng: 80.6582,
  },
  {
    area: "Patamata Lanka",
    landmark: "Near Auto Nagar Main Gate, Patamata",
    pincode: "520010",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Patamata+Lanka,Vijayawada",
    lat: 16.4912,
    lng: 80.6622,
  },
  {
    area: "Governorpet",
    landmark: "Near Prakasam Road, Opp. Congress Bhavan",
    pincode: "520002",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Governorpet,Vijayawada",
    lat: 16.5142,
    lng: 80.6212,
  },
  {
    area: "One Town (Kaleswara Rao Market)",
    landmark: "Near Kanaka Durga Temple, KR Market Road",
    pincode: "520001",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Kaleswara+Rao+Market,Vijayawada",
    lat: 16.5182,
    lng: 80.6102,
  },
  {
    area: "Eluru Road",
    landmark: "Near Machavaram Down, Opp. Chaitanya College",
    pincode: "520004",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Eluru+Road,Vijayawada",
    lat: 16.5185,
    lng: 80.6412,
  },
  {
    area: "Satyanarayanapuram",
    landmark: "Near Railway Colony, Opp. Post Office",
    pincode: "520011",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Satyanarayanapuram,Vijayawada",
    lat: 16.5242,
    lng: 80.6292,
  },
  {
    area: "Gandhi Nagar",
    landmark: "Near Press Club, Opp. Sub-Collector Office",
    pincode: "520003",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Gandhi+Nagar,Vijayawada",
    lat: 16.5122,
    lng: 80.6252,
  },
  {
    area: "Gunadala",
    landmark: "Near Mary Matha Shrine Church, Eluru Road",
    pincode: "520004",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Gunadala,Vijayawada",
    lat: 16.5292,
    lng: 80.6582,
  },
  {
    area: "Ramavarappadu",
    landmark: "Near Ramavarappadu Ring, NH-16 Junction",
    pincode: "520008",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Ramavarappadu,Vijayawada",
    lat: 16.5382,
    lng: 80.6712,
  },
  {
    area: "Enikepadu",
    landmark: "Near Latha Super Bazar, Opp. PVP Inst. of Tech",
    pincode: "521108",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Enikepadu,Vijayawada",
    lat: 16.5452,
    lng: 80.6882,
  },
  {
    area: "Prasadampadu",
    landmark: "Near Enikepadu Road, Opp. Vignana Bharathi",
    pincode: "521108",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Prasadampadu,Vijayawada",
    lat: 16.5412,
    lng: 80.6802,
  },
  {
    area: "Nidamanuru",
    landmark: "Near NH-16 Highway, Opp. Delhi Public School",
    pincode: "521104",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Nidamanuru,Vijayawada",
    lat: 16.5512,
    lng: 80.7012,
  },
  {
    area: "Kanuru",
    landmark: "Near Dhanekula Engineering College, Tadigadapa Road",
    pincode: "520007",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Kanuru,Vijayawada",
    lat: 16.4812,
    lng: 80.6782,
  },
  {
    area: "Tadigadapa",
    landmark: "Near Poranki Main Road, Opp. Time Hospital",
    pincode: "521137",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Tadigadapa,Vijayawada",
    lat: 16.4762,
    lng: 80.6842,
  },
  {
    area: "Poranki",
    landmark: "Near Penamaluru Road, Opp. Sri Chaitanya School",
    pincode: "521137",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Poranki,Vijayawada",
    lat: 16.4712,
    lng: 80.6952,
  },
  {
    area: "Penamaluru",
    landmark: "Near Penamaluru Police Station, Bandar Road",
    pincode: "521139",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Penamaluru,Vijayawada",
    lat: 16.4632,
    lng: 80.7102,
  },
  {
    area: "Tadepalli",
    landmark: "Near Manipal Hospital, Kunchanapalli Bypass",
    pincode: "522501",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Tadepalli,Vijayawada",
    lat: 16.4782,
    lng: 80.6182,
  },
  {
    area: "Bhavanipuram",
    landmark: "Near Swathi Theatre, Opp. RTC Bus Depot",
    pincode: "520012",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Bhavanipuram,Vijayawada",
    lat: 16.5282,
    lng: 80.5912,
  },
  {
    area: "Gollapudi",
    landmark: "Near Gollapudi One Center, Opp. Market Yard",
    pincode: "521225",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Gollapudi,Vijayawada",
    lat: 16.5412,
    lng: 80.5782,
  },
  {
    area: "Vidyadharapuram",
    landmark: "Near Heavy Vehicles Hill Road, Opp. Milk Factory",
    pincode: "520012",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Vidyadharapuram,Vijayawada",
    lat: 16.5312,
    lng: 80.5982,
  },
  {
    area: "Payakapuram",
    landmark: "Near Prakash Nagar Park, Payakapuram",
    pincode: "520015",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Payakapuram,Vijayawada",
    lat: 16.5452,
    lng: 80.6382,
  },
  {
    area: "Kandrika",
    landmark: "Near Inner Ring Road, Kandrika Junction",
    pincode: "520015",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Kandrika,Vijayawada",
    lat: 16.5512,
    lng: 80.6482,
  },
  {
    area: "Auto Nagar",
    landmark: "Near 100 Feet Road, Auto Nagar Industrial Area",
    pincode: "520007",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Auto+Nagar,Vijayawada",
    lat: 16.4882,
    lng: 80.6652,
  },
  {
    area: "Moghalrajpuram",
    landmark: "Near Siddhartha College, Opp. Jammi Chettu",
    pincode: "520010",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Moghalrajpuram,Vijayawada",
    lat: 16.5022,
    lng: 80.6382,
  },
  {
    area: "Labbipet",
    landmark: "Near Hotel Gateway, Opp. Modern Supermarket",
    pincode: "520010",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Labbipet,Vijayawada",
    lat: 16.5072,
    lng: 80.6352,
  },
  {
    area: "Suryaraopet",
    landmark: "Near Vijayawada Club, Opp. Fire Station",
    pincode: "520002",
    city: "Vijayawada",
    mapsLink: "https://maps.google.com/?q=Suryaraopet,Vijayawada",
    lat: 16.5112,
    lng: 80.6282,
  },

  // --- TENALI & SURROUNDING AREAS ---
  {
    area: "Tenali (VSR Road)",
    landmark: "Near VSR College, Tenali Town Center",
    pincode: "522201",
    city: "Tenali",
    mapsLink: "https://maps.google.com/?q=Tenali,Andhra+Pradesh",
    lat: 16.2429,
    lng: 80.6473,
  },
  {
    area: "Tenali (Chinaravuru)",
    landmark: "Near Chinaravuru Park, Tenali",
    pincode: "522201",
    city: "Tenali",
    mapsLink: "https://maps.google.com/?q=Chinaravuru,Tenali",
    lat: 16.2405,
    lng: 80.6382,
  },
  {
    area: "Mangalagiri (NRI Hospital)",
    landmark: "Opp. NRI Academy of Medical Sciences",
    pincode: "522503",
    city: "Mangalagiri",
    mapsLink: "https://maps.google.com/?q=NRI+Hospital,Mangalagiri",
    lat: 16.4326,
    lng: 80.5731,
  },
  {
    area: "Amaravati Secretariat",
    landmark: "AP State Secretariat, Velagapudi",
    pincode: "522020",
    city: "Amaravati",
    mapsLink: "https://maps.google.com/?q=Secretariat,Velagapudi",
    lat: 16.5432,
    lng: 80.5182,
  },
  {
    area: "Pedakakani (Siva Temple Area)",
    landmark: "Near Sri Bhramaramba Mallikarjuna Temple",
    pincode: "522509",
    city: "Pedakakani",
    mapsLink: "https://maps.google.com/?q=Pedakakani,Andhra+Pradesh",
    lat: 16.3421,
    lng: 80.4932,
  },
  {
    area: "Ponnur (Sivalayam Temple)",
    landmark: "Near Ponnur Sivalayam Temple, Ponnur",
    pincode: "522124",
    city: "Ponnur",
    mapsLink: "https://maps.google.com/?q=Ponnur,Andhra+Pradesh",
    lat: 16.0712,
    lng: 80.5512,
  },
  {
    area: "Chebrolu (Temple Street)",
    landmark: "Near Chaturmukha Brahma Temple",
    pincode: "522212",
    city: "Chebrolu",
    mapsLink: "https://maps.google.com/?q=Chebrolu,Andhra+Pradesh",
    lat: 15.9812,
    lng: 80.5312,
  },
  {
    area: "Tadikonda (Main Road)",
    landmark: "Tadikonda Junction, Main Road",
    pincode: "522236",
    city: "Tadikonda",
    mapsLink: "https://maps.google.com/?q=Tadikonda,Andhra+Pradesh",
    lat: 16.4212,
    lng: 80.4512,
  },

  // --- VISAKHAPATNAM AREAS ---
  {
    area: "Siripuram",
    landmark: "Near Sampath Vinayaka Temple, Siripuram Junction",
    pincode: "530003",
    city: "Visakhapatnam",
    mapsLink: "https://maps.google.com/?q=Siripuram,Visakhapatnam",
    lat: 17.7212,
    lng: 83.3152,
  },
  {
    area: "Beach Road",
    landmark: "Opp. RK Beach & Submarine Museum",
    pincode: "530002",
    city: "Visakhapatnam",
    mapsLink: "https://maps.google.com/?q=Beach+Road,Visakhapatnam",
    lat: 17.7122,
    lng: 83.3212,
  },
  {
    area: "MVP Colony",
    landmark: "Near AS Raja College Ground, MVP Sector 3",
    pincode: "530017",
    city: "Visakhapatnam",
    mapsLink: "https://maps.google.com/?q=MVP+Colony,Visakhapatnam",
    lat: 17.7412,
    lng: 83.3312,
  },
  {
    area: "Dwaraka Nagar",
    landmark: "Near RTC Complex, Dwaraka Bus Station",
    pincode: "530016",
    city: "Visakhapatnam",
    mapsLink: "https://maps.google.com/?q=Dwaraka+Nagar,Visakhapatnam",
    lat: 17.7282,
    lng: 83.3082,
  },
  {
    area: "Madhurawada",
    landmark: "Near Cricket Stadium, NH-16 Madhurawada",
    pincode: "530048",
    city: "Visakhapatnam",
    mapsLink: "https://maps.google.com/?q=Madhurawada,Visakhapatnam",
    lat: 17.8182,
    lng: 83.3482,
  },
  {
    area: "Gajuwaka",
    landmark: "Near Gajuwaka High School Road Junction",
    pincode: "530026",
    city: "Visakhapatnam",
    mapsLink: "https://maps.google.com/?q=Gajuwaka,Visakhapatnam",
    lat: 17.6912,
    lng: 83.2182,
  },
];

const CAT_STORAGE_KEY = "thedeepcleanerz_categories_v1";

// Map the admin server's flat catalog (categories + services with categoryId)
// into the local Category[] shape used by the UI. Falls back to a SERVICES image
// when the admin service id doesn't match a built-in service.
export function mergeAdminCatalog(catalog: AdminCatalog): Category[] {
  const fallbackImg = SERVICES[0]?.img ?? "";
  return catalog.categories.map((c) => {
    const services: CatService[] = catalog.services
      .filter((s) => s.categoryId === c.id)
      .map((s) => {
        const local = SERVICES.find((x) => x.id === s.id);
        
        let serviceImage = s.image;
        let serviceDesc = s.description || local?.desc || "";
        if (
          serviceDesc &&
          (serviceDesc.startsWith("http://") ||
            serviceDesc.startsWith("https://") ||
            serviceDesc.includes("images?q="))
        ) {
          if (!serviceImage) {
            serviceImage = serviceDesc;
          }
          serviceDesc = local?.desc || "";
        }

        return {
          id: s.id,
          title: s.title,
          desc: serviceDesc,
          price: s.price,
          img: serviceImage || local?.img || fallbackImg,
          sub: s.includes && s.includes.length ? s.includes : (local?.sub.map((x) => x.name) ?? []),
          image: serviceImage,
          plans: s.plans || [],
          disclaimer: s.disclaimer,
          requirements: s.requirements,
          precautions: s.precautions,
        };
      });

    // Determine category image
    let categoryImage = c.image;
    let categoryTagline = c.tagline;
    if (
      categoryTagline &&
      (categoryTagline.startsWith("http://") ||
        categoryTagline.startsWith("https://") ||
        categoryTagline.includes("images?q="))
    ) {
      if (!categoryImage) {
        categoryImage = categoryTagline;
      }
      categoryTagline = "";
    }

    if (!categoryImage) {
      if (c.id === "full-house") {
        categoryImage = imgHouse;
      } else if (c.id === "customized") {
        categoryImage = imgSofa;
      } else if (c.id === "commercial") {
        categoryImage = imgOffice;
      } else {
        categoryImage = services[0]?.img || fallbackImg;
      }
    }

    return {
      id: c.id,
      title: c.title,
      tagline: categoryTagline,
      emoji: c.emoji || "✨",
      image: categoryImage,
      parentId: c.parentId || null,
      includes: c.includes || [],
      services,
    };
  });
}

export type CartItem = {
  id: string;
  title: string;
  price: number;
  img: string;
  qty: number;
  paymentType?: "full" | "deposit_25" | "deposit_50" | "free_advance";
};

function Index() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<Service | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transformations, setTransformations] = useState<RecentTransformation[]>([]);
  const [toggledTrans, setToggledTrans] = useState<string[]>([]);
  const toggleTransImage = (id: string) => {
    setToggledTrans((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = 320; // Scroll by roughly one card width
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };
  const [selectedCat, setSelectedCat] = useState<string>(DEFAULT_CATEGORIES[0].id);
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [favs, setFavs] = useState<string[]>([]);
  const [showTop, setShowTop] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    referralCode?: string;
    walletBalance?: number;
  } | null>(null);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [customizedServices, setCustomizedServices] = useState<AdminCustomizedService[]>([]);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLocation, setUserLocation] = useState<string>("Detect Location");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [travelRate, setTravelRate] = useState<number>(10);
  const [freeRadius, setFreeRadius] = useState<number>(5);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  // Haversine formula calculation for KM distance
  const getKmDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculates the travel surcharge based on distance
  const getTravelSurcharge = (): number => {
    if (userLat === null || userLng === null) return 0;
    // Office Location: Arundelpet, Guntur (16.307888, 80.438993)
    const officeLat = 16.307888;
    const officeLng = 80.438993;
    const distance = getKmDistance(officeLat, officeLng, userLat, userLng);
    if (distance <= freeRadius) return 0;
    // Round to nearest 10 Rupees
    return Math.round(((distance - freeRadius) * travelRate) / 10) * 10;
  };

  // Utility to get final price including travel charge
  const getServicePrice = (basePrice: number): number => {
    const surcharge = getTravelSurcharge();
    return basePrice + surcharge;
  };

  const filteredGunturOptions = useMemo(() => {
    if (!citySearch.trim()) return [];
    const query = citySearch.toLowerCase();
    return GUNTUR_LOCATIONS.filter(
      (loc) =>
        loc.area.toLowerCase().includes(query) ||
        loc.landmark.toLowerCase().includes(query) ||
        loc.city.toLowerCase().includes(query) ||
        loc.pincode.includes(query)
    );
  }, [citySearch]);

  const saveLocationForUser = (
    address: string,
    lat?: number | string | null,
    lng?: number | string | null,
    emailStr?: string | null,
  ) => {
    const activeEmail = emailStr !== undefined ? emailStr : userEmail;
    const keySuffix = activeEmail ? `_${activeEmail.toLowerCase().trim()}` : "";

    sessionStorage.setItem("user_location_address", address);
    if (keySuffix) {
      sessionStorage.setItem(`user_location_address${keySuffix}`, address);
    }

    if (lat !== undefined && lat !== null) {
      sessionStorage.setItem("user_location_lat", String(lat));
      if (keySuffix) {
        sessionStorage.setItem(`user_location_lat${keySuffix}`, String(lat));
      }
    } else {
      sessionStorage.removeItem("user_location_lat");
      if (keySuffix) {
        sessionStorage.removeItem(`user_location_lat${keySuffix}`);
      }
    }

    if (lng !== undefined && lng !== null) {
      sessionStorage.setItem("user_location_lng", String(lng));
      if (keySuffix) {
        sessionStorage.setItem(`user_location_lng${keySuffix}`, String(lng));
      }
    } else {
      sessionStorage.removeItem("user_location_lng");
      if (keySuffix) {
        sessionStorage.removeItem(`user_location_lng${keySuffix}`);
      }
    }

    setUserLocation(address);
    if (lat !== undefined && lat !== null) {
      setUserLat(typeof lat === "number" ? lat : parseFloat(String(lat)));
    } else {
      setUserLat(null);
    }
    if (lng !== undefined && lng !== null) {
      setUserLng(typeof lng === "number" ? lng : parseFloat(String(lng)));
    } else {
      setUserLng(null);
    }
    window.dispatchEvent(new Event("location-updated"));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    const toastId = toast.loading("Detecting your exact GPS location...", { icon: "📍" });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        let formattedAddress = `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const area =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.road ||
              addr.village ||
              "";
            const city =
              addr.city || addr.town || addr.county || addr.state_district || "";
            if (area && city) {
              formattedAddress = `${area}, ${city}`;
            } else if (data.display_name) {
              formattedAddress = data.display_name.split(",").slice(0, 2).join(",");
            }
          }
        } catch {
          /* ignore */
        }

        saveLocationForUser(formattedAddress, latitude, longitude);
        toast.success(`Exact location applied: ${formattedAddress}!`, { id: toastId, icon: "📍" });
        setLocationModalOpen(false);
      },
      (err) => {
        console.warn("Location error:", err);
        toast.error("Could not retrieve GPS coordinates. Please check browser permissions.", {
          id: toastId,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user_email");
    sessionStorage.removeItem("user_authenticated");
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("user_profile");
    sessionStorage.removeItem("user_location_address");
    sessionStorage.removeItem("user_location_lat");
    sessionStorage.removeItem("user_location_lng");
    setUserEmail(null);
    setUserProfile(null);
    setIsAdmin(false);
    setUserLocation("Detect Location");
    setUserLat(null);
    setUserLng(null);
    window.dispatchEvent(new Event("location-updated"));
    toast.success("Logged out successfully", { icon: "👋" });
  };

  useEffect(() => {
    const keySuffix = userEmail ? `_${userEmail.toLowerCase().trim()}` : "";
    const saved =
      sessionStorage.getItem(`user_location_address${keySuffix}`) ||
      sessionStorage.getItem("user_location_address");
    if (saved) {
      setUserLocation(saved);
    } else {
      setUserLocation("Detect Location");
    }

    const savedLat =
      sessionStorage.getItem(`user_location_lat${keySuffix}`) ||
      sessionStorage.getItem("user_location_lat");
    const savedLng =
      sessionStorage.getItem(`user_location_lng${keySuffix}`) ||
      sessionStorage.getItem("user_location_lng");

    if (savedLat && savedLng) {
      setUserLat(parseFloat(savedLat));
      setUserLng(parseFloat(savedLng));
    } else {
      setUserLat(null);
      setUserLng(null);
    }

    const fetchTravelSettings = async () => {
      try {
        const res = await fetch(`${ADMIN_API_URL}/api/settings`);
        if (res.ok) {
          const settings = await res.json();
          if (settings.travel_rate_per_km !== undefined) {
            setTravelRate(parseFloat(settings.travel_rate_per_km));
          }
          if (settings.travel_free_radius_km !== undefined) {
            setFreeRadius(parseFloat(settings.travel_free_radius_km));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch travel settings from backend:", err);
      }
    };
    fetchTravelSettings();

    const handleLocationUpdate = () => {
      const activeEmail = sessionStorage.getItem("user_email") || userEmail;
      const kSuffix = activeEmail ? `_${activeEmail.toLowerCase().trim()}` : "";

      const updated =
        sessionStorage.getItem(`user_location_address${kSuffix}`) ||
        sessionStorage.getItem("user_location_address");
      if (updated) {
        setUserLocation(updated);
      }
      const updatedLat =
        sessionStorage.getItem(`user_location_lat${kSuffix}`) ||
        sessionStorage.getItem("user_location_lat");
      const updatedLng =
        sessionStorage.getItem(`user_location_lng${kSuffix}`) ||
        sessionStorage.getItem("user_location_lng");
      if (updatedLat && updatedLng) {
        setUserLat(parseFloat(updatedLat));
        setUserLng(parseFloat(updatedLng));
      } else {
        setUserLat(null);
        setUserLng(null);
      }
    };

    window.addEventListener("location-updated", handleLocationUpdate);
    return () => window.removeEventListener("location-updated", handleLocationUpdate);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAT_STORAGE_KEY);
      if (raw) setCategories(JSON.parse(raw));
      const f = localStorage.getItem("thedeepcleanerz_favs_v1");
      if (f) setFavs(JSON.parse(f));
      const c = localStorage.getItem("thedeepcleanerz_cart_v1");
      if (c) setCart(JSON.parse(c));
      const email = sessionStorage.getItem("user_email");
      if (email) setUserEmail(email);
      const prof = sessionStorage.getItem("user_profile");
      if (prof) setUserProfile(JSON.parse(prof));

      if (email) {
        fetch(`${ADMIN_API_URL}/api/user/profile?email=${encodeURIComponent(email)}`)
          .then((r) => r.ok && r.json())
          .then((data) => {
            if (data && data.id) {
              setUserProfile(data);
              sessionStorage.setItem("user_profile", JSON.stringify(data));
            }
          })
          .catch(() => {});
      }

      const isAdm = sessionStorage.getItem("admin_authenticated") === "true";
      setIsAdmin(isAdm);
    } catch {
      /* ignore */
    }

    const handleAuth = () => {
      try {
        const email = sessionStorage.getItem("user_email");
        setUserEmail(email);
        const prof = sessionStorage.getItem("user_profile");
        setUserProfile(prof ? JSON.parse(prof) : null);
        if (email) {
          fetch(`${ADMIN_API_URL}/api/user/profile?email=${encodeURIComponent(email)}`)
            .then((r) => r.ok && r.json())
            .then((data) => {
              if (data && data.id) {
                setUserProfile(data);
                sessionStorage.setItem("user_profile", JSON.stringify(data));
              }
            })
            .catch(() => {});
        }
        const isAdm = sessionStorage.getItem("admin_authenticated") === "true";
        setIsAdmin(isAdm);
      } catch {}
    };
    window.addEventListener("auth-state-change", handleAuth);
    return () => window.removeEventListener("auth-state-change", handleAuth);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("thedeepcleanerz_favs_v1", JSON.stringify(favs));
    } catch {
      /* ignore */
    }
  }, [favs]);
  useEffect(() => {
    try {
      localStorage.setItem("thedeepcleanerz_cart_v1", JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);
  useEffect(() => {
    if (searchParams.category) {
      setSelectedCat(searchParams.category);
      setTimeout(() => {
        const el = document.getElementById("services");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    }
  }, [searchParams.category, categories]);
  useEffect(() => {
    if (searchParams.cart === "open") {
      setCartOpen(true);
    }
  }, [searchParams.cart]);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [activeHash, setActiveHash] = useState("#home");

  useEffect(() => {
    if (window.location.hash) {
      setActiveHash(window.location.hash);
    }

    const sections = ["home", "categories", "about", "reviews", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash(`#${entry.target.id}`);
          }
        });
      },
      { threshold: 0.05, rootMargin: "-80px 0px -40% 0px" },
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleHashChange = () => {
      if (window.location.hash) {
        setActiveHash(window.location.hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Load recent transformations from admin API
  useEffect(() => {
    let active = true;
    fetchRecentTransformations()
      .then((data) => {
        if (active) setTransformations(data);
      })
      .catch((err) => {
        console.warn("Failed to fetch transformations from backend:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Sync categories + services live from the admin API. Falls back silently to
  // the localStorage / DEFAULT_CATEGORIES copy if the admin server is offline.
  useEffect(() => {
    let ctrl: AbortController | null = null;

    const syncCatalog = () => {
      if (ctrl) ctrl.abort();
      ctrl = new AbortController();
      fetchAdminCatalog(ctrl.signal)
        .then((catalog) => {
          const merged = mergeAdminCatalog(catalog);
          setCategories(merged);
          if (merged.length > 0) {
            setSelectedCat((prev) => (merged.find((c) => c.id === prev) ? prev : merged[0].id));
          } else {
            setSelectedCat("");
          }
          try {
            localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(merged));
          } catch {
            /* ignore */
          }
        })
        .catch((err) => {
          if ((err as { name?: string })?.name !== "AbortError") {
            console.warn("Admin API unreachable:", err);
          }
        });
    };

    syncCatalog();
    window.addEventListener("catalog-updated", syncCatalog);

    return () => {
      if (ctrl) ctrl.abort();
      window.removeEventListener("catalog-updated", syncCatalog);
    };
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCustomizedServices(ctrl.signal)
      .then((data) => setCustomizedServices(data || []))
      .catch((err) => {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.warn("Failed to load customized services:", err);
        }
      });
    return () => ctrl.abort();
  }, []);

  const [liveReviews, setLiveReviews] = useState<any[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewSortMode, setReviewSortMode] = useState<"recent" | "highest" | "lowest">("recent");

  useEffect(() => {
    const ctrl = new AbortController();
    fetchAllReviews(ctrl.signal)
      .then((data) => {
        if (data && data.length > 0) {
          setLiveReviews(data);
        }
      })
      .catch((err) => {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.warn("Failed to load live reviews:", err);
        }
      });
    return () => ctrl.abort();
  }, []);

  const saveCategories = (next: Category[]) => {
    setCategories(next);
    try {
      localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    toast.success("Categories saved");
  };

  const activeCategory = categories.find((c) => c.id === selectedCat) ?? categories[0];
  const parentCat = categories.find((c) => c.id === selectedCat) ?? categories[0];
  const subCats = parentCat ? categories.filter((c) => c.parentId === parentCat.id) : [];
  const activeSubCat = selectedSubCat 
    ? categories.find((c) => c.id === selectedSubCat) 
    : (subCats.length > 0 ? subCats[0] : null);

  const parentCategoriesWithSubServices = useMemo(() => {
    const parentCats = categories.filter((c) => !c.parentId);
    return parentCats.map((parent) => {
      const childCats = categories.filter((c) => c.parentId === parent.id);
      const allServices = [
        ...parent.services,
        ...childCats.flatMap((c) => c.services)
      ];
      const uniqueServices = allServices.filter(
        (s, index, self) => self.findIndex((x) => x.id === s.id) === index
      );
      return {
        ...parent,
        services: uniqueServices
      };
    });
  }, [categories]);

  const displayCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const handleSelectService = (s: Service) => {
    navigate({
      to: "/service-detail",
      search: { id: s.id },
    });
  };

  const getSubCategoryRating = (subId: string) => {
    const subServices = categories.find((c) => c.id === subId)?.services || [];
    const serviceIds = subServices.map((s) => s.id);
    const subReviews = liveReviews.filter((r) => serviceIds.includes(r.serviceId));
    if (subReviews.length > 0) {
      const avg = subReviews.reduce((acc, r) => acc + r.rating, 0) / subReviews.length;
      return avg.toFixed(2);
    }
    const charCodeSum = subId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const ratingVal = 4.6 + (charCodeSum % 31) * 0.01;
    return ratingVal.toFixed(2);
  };

  const toggleFav = (id: string, title: string) => {
    setFavs((f) => {
      if (f.includes(id)) {
        toast(`Removed ${title} from wishlist`);
        return f.filter((x) => x !== id);
      }
      toast.success(`Added ${title} to wishlist`, { icon: "❤️" });
      return [...f, id];
    });
  };

  const addCatServiceToCart = (s: CatService) => {
    if (s.plans && s.plans.length > 0) {
      setDetail(s);
    } else {
      addToCart(s);
    }
  };

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((n, i) => n + i.qty * i.price, 0), [cart]);

  const allServices = useMemo(() => {
    return categories.flatMap((c) =>
      c.services.map((s) => ({
        ...s,
        Icon: getServiceIcon(s.id),
      })),
    );
  }, [categories]);

  const reviewsToDisplay = useMemo(() => {
    if (liveReviews && liveReviews.length > 0) {
      return liveReviews.map((r, i) => {
        const colors = [
          "from-rose-400 to-rose-600",
          "from-amber-400 to-amber-600",
          "from-emerald-400 to-emerald-600",
          "from-sky-400 to-sky-600",
        ];
        const matchedService = allServices.find((s) => s.id === r.serviceId);
        const serviceTitle = matchedService ? matchedService.title : "Premium Cleaning";
        return {
          n: r.userName || "Customer",
          c: (r.userName || "C")[0].toUpperCase(),
          q: r.comment || "Great service!",
          rating: Number(r.rating) || 5,
          color: colors[i % colors.length],
          serviceTitle,
        };
      });
    }
    return [
      {
        n: "Priya Sharma",
        c: "P",
        q: "The team cleaned my entire house perfectly. Outstanding hotel-grade results.",
        rating: 5,
        color: "from-rose-400 to-rose-600",
        serviceTitle: "Full House Deep Clean",
      },
      {
        n: "Ramesh Kumar",
        c: "R",
        q: "Kitchen degreasing and sofa cleaning service exceeded expectations.",
        rating: 4,
        color: "from-amber-400 to-amber-600",
        serviceTitle: "Kitchen Degreasing",
      },
      {
        n: "Anjali Verma",
        c: "A",
        q: "Professional staff, punctual execution, and seamless online booking.",
        rating: 5,
        color: "from-emerald-400 to-emerald-600",
        serviceTitle: "Bathroom Sanitisation",
      },
      {
        n: "Rahul Gupta",
        c: "R",
        q: "Office post-interior cleaning was excellent and finished ahead of schedule.",
        rating: 3,
        color: "from-sky-400 to-sky-600",
        serviceTitle: "Office Deep Cleaning",
      },
    ];
  }, [liveReviews, allServices]);

  const sortedReviews = useMemo(() => {
    const list = [...reviewsToDisplay];
    if (reviewSortMode === "highest") {
      return list.sort((a, b) => b.rating - a.rating);
    }
    if (reviewSortMode === "lowest") {
      return list.sort((a, b) => a.rating - b.rating);
    }
    return list;
  }, [reviewsToDisplay, reviewSortMode]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allServices;
    return allServices.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.sub.some((x) => x.toLowerCase().includes(q)),
    );
  }, [allServices, search]);

  const addToCart = (s: Service, plan?: ServicePlan) => {
    setCart((c) => {
      const cartItemId = plan ? `${s.id}-${plan.name}` : s.id;
      const cartItemTitle = plan ? `${s.title} (${plan.name})` : s.title;
      const basePrice = plan ? plan.price : s.price;
      const cartItemPrice = getServicePrice(basePrice);
      const cartItemImg = s.image || s.img;
      const cartItemPaymentType = s.paymentType || "full";
      const ex = c.find((i) => i.id === cartItemId);
      if (ex) return c.map((i) => (i.id === cartItemId ? { ...i, qty: i.qty + 1 } : i));
      return [
        ...c,
        {
          id: cartItemId,
          title: cartItemTitle,
          price: cartItemPrice,
          img: cartItemImg,
          qty: 1,
          paymentType: cartItemPaymentType,
        },
      ];
    });
    toast.success(`${s.title}${plan ? ` (${plan.name})` : ""} added to cart`, { icon: "🛒" });
  };
  const addRawItemToCart = (item: {
    id: string;
    title: string;
    price: number;
    img: string;
    paymentType?: "full" | "deposit_25" | "deposit_50" | "free_advance";
  }) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === item.id);
      if (ex) return c.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      return [
        ...c,
        {
          id: item.id,
          title: item.title,
          price: item.price,
          img: item.img,
          qty: 1,
          paymentType: item.paymentType || "full",
        },
      ];
    });
    toast.success(`${item.title} added to cart`, { icon: "🛒" });
  };
  const updateQty = (id: string, d: number) =>
    setCart((c) =>
      c.flatMap((i) => (i.id === id ? (i.qty + d <= 0 ? [] : [{ ...i, qty: i.qty + d }]) : [i])),
    );
  const removeItem = (id: string) => setCart((c) => c.filter((i) => i.id !== id));
  const checkout = () => {
    setCartOpen(false);
    setBookingOpen(true);
  };
  const completeBooking = () => {
    setCart([]);
    setBookingOpen(false);
    toast.success("Booking confirmed! Our team will call you shortly.", {
      icon: "✨",
      duration: 5000,
    });
  };

  const navLinks = [
    { href: "#home", label: "Home" },
    { href: "/services", label: "Services", isRoute: true },
    { href: "#about", label: "About Us" },
    { href: "#reviews", label: "Reviews" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#002a22] pt-[112px] xs:pt-[108px] sm:pt-[116px] md:pt-[120px]">
      
      <Header
        cartCount={cartCount}
        favsCount={favs.length}
        userLocation={userLocation}
        onOpenCart={() => setCartOpen(true)}
        onOpenLocation={() => setLocationModalOpen(true)}
        onOpenReferral={() => setReferralModalOpen(true)}
        activeHash={activeHash}
        isSubPage={false}
      />


      
      {/* HERO SECTION - LIGHT CHAMPAGNE & GOLD LUXURY THEME */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#F4EDE0] to-[#EBE2CF] text-[#002a22] py-10 sm:py-14 md:py-16 border-b border-[#cb9f5a]/30"
      >
        {/* Ambient background radial glow effects */}
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-[#cb9f5a]/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 -right-32 h-96 w-96 rounded-full bg-[#cb9f5a]/10 blur-[130px] pointer-events-none" />
        <div className="absolute top-10 right-1/4 h-64 w-64 rounded-full bg-[#cb9f5a]/10 blur-[100px] pointer-events-none" />

        {/* Decorative Grid Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cb9f5a0d_1px,transparent_1px),linear-gradient(to_bottom,#cb9f5a0d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative mx-auto max-w-[1400px] px-5 lg:px-8 z-10">
          <div className="grid gap-10 lg:grid-cols-12 items-center">
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              {/* Premium Pill Badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[#cb9f5a]/40 bg-[#cb9f5a]/10 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#cb9f5a] backdrop-blur-md shadow-sm animate-fade-in-left"
                style={{ animationDelay: "100ms" }}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#cb9f5a] animate-pulse" />
                <span>INDIA'S #1 RATED LUXURY CLEANING SERVICE</span>
              </div>

              {/* Main Headline */}
              <h1
                className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-[#002a22] animate-fade-in-left"
                style={{ animationDelay: "200ms" }}
              >
                Spotless Spaces,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5be7a] via-[#cb9f5a] to-[#f5d089] font-serif italic font-normal">
                  Happier Places.
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="mt-3 max-w-xl text-xs sm:text-sm text-[#3a4d49] font-medium leading-relaxed animate-fade-in-left"
                style={{ animationDelay: "300ms" }}
              >
                Hospital-grade deep cleaning, hot-water extraction, and eco-friendly sanitization engineered by background-verified specialists for premium homes & corporate spaces.
              </p>

              {/* Trust Feature Badges */}
              <div
                className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg animate-fade-in-left"
                style={{ animationDelay: "400ms" }}
              >
                <div className="flex items-center gap-2.5 rounded-2xl border border-[#cb9f5a]/30 bg-white/60 backdrop-blur-md p-2.5 shadow-sm transition-transform hover:scale-[1.02]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#cb9f5a]/10 text-[#cb9f5a] font-bold text-sm shrink-0 border border-[#cb9f5a]/30">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-[11px] font-bold text-[#002a22]">Verified</div>
                    <div className="text-[9px] text-[#cb9f5a] font-semibold">Professionals</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl border border-[#cb9f5a]/30 bg-white/60 backdrop-blur-md p-2.5 shadow-sm transition-transform hover:scale-[1.02]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-sm shrink-0 border border-emerald-500/20">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-[11px] font-bold text-[#002a22]">100% Eco</div>
                    <div className="text-[9px] text-emerald-600 font-semibold">Biological</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl border border-[#cb9f5a]/30 bg-white/60 backdrop-blur-md p-2.5 shadow-sm transition-transform hover:scale-[1.02]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#cb9f5a]/10 text-[#cb9f5a] font-bold text-sm shrink-0 border border-[#cb9f5a]/30">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-[11px] font-bold text-[#002a22]">On-Time</div>
                    <div className="text-[9px] text-[#cb9f5a] font-semibold">Guaranteed</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Promo */}
              <div
                className="mt-6 flex flex-wrap gap-3.5 items-center w-full animate-fade-in-left"
                style={{ animationDelay: "500ms" }}
              >
                <a
                  href="#categories"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#cb9f5a] via-[#e5be7a] to-[#cb9f5a] px-7 py-3.5 text-xs font-black uppercase tracking-wider text-[#002a22] shadow-[0_10px_30px_-5px_rgba(203,159,90,0.5)] transition-all hover:scale-105 active:scale-95 hover:shadow-[0_15px_40px_-5px_rgba(203,159,90,0.7)] cursor-pointer"
                >
                  <span>Book Your Service</span>
                  <ArrowRight className="h-4 w-4 text-[#002a22]" />
                </a>
                <a
                  href="#categories"
                  className="inline-flex items-center gap-2 rounded-full border border-[#cb9f5a]/30 bg-white/80 hover:bg-[#002a22]/5 px-6 py-3.5 text-xs font-bold text-[#002a22] shadow-3xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Explore Packages</span>
                  <ArrowRight className="h-4 w-4 text-[#cb9f5a]" />
                </a>
              </div>

              {/* Live Rating & Stats Footprint */}
              <div
                className="mt-6 pt-5 border-t border-[#cb9f5a]/25 flex items-center gap-6 text-xs text-[#3a4d49] font-semibold animate-fade-in-left"
                style={{ animationDelay: "600ms" }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex text-[#cb9f5a]">
                    {"★".repeat(5)}
                  </div>
                  <span className="font-bold text-[#002a22]">4.9/5.0</span>
                  <span className="text-[10px] text-slate-500">(2,800+ Reviews)</span>
                </div>
                <div className="h-3 w-px bg-[#cb9f5a]/30" />
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#002a22]">Guntur & 25+</span>
                  <span className="text-[10px] text-slate-500">AP Cities</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-End Hero Showcase Card */}
            <div className="lg:col-span-6 relative w-full flex items-center justify-center">
              {/* Main Image Container */}
              <div className="relative w-full h-[320px] sm:h-[380px] lg:h-[420px] rounded-none overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-[#cb9f5a]/35 group">
                <img
                  src={heroImg}
                  alt="Luxury home deep cleaning team working"
                  className="h-full w-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
                />

                {/* Subtle vignette gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#002a22]/80 via-transparent to-black/30" />

                {/* Floating Glass Pill - Top Left */}
                <div className="absolute top-4 left-4 bg-[#002a22]/85 backdrop-blur-md border border-[#cb9f5a]/30 rounded-none py-2 px-3.5 text-white shadow-xl flex items-center gap-2 z-10 transition-transform duration-300 hover:scale-105">
                  <div className="grid h-7 w-7 place-items-center rounded-xl bg-[#cb9f5a] text-[#002a22] font-black text-xs shadow-sm rounded-none">
                    ★
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-xs font-bold text-white">4.9 / 5.0 Rating</div>
                    <div className="text-[9px] text-[#cb9f5a] font-semibold">2,800+ Verified Reviews</div>
                  </div>
                </div>

                {/* Floating Glass Pill - Top Right */}
                <div className="absolute top-4 right-4 bg-[#002a22]/85 backdrop-blur-md border border-white/20 rounded-none py-2 px-3.5 text-white shadow-xl flex items-center gap-2 z-10 transition-transform duration-300 hover:scale-105">
                  <div className="grid h-7 w-7 place-items-center rounded-none bg-emerald-500 text-white font-black text-xs shadow-sm">
                    ✓
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-xs font-bold text-white">100% Satisfaction</div>
                    <div className="text-[9px] text-emerald-400 font-semibold">Money-Back Guarantee</div>
                  </div>
                </div>

                {/* Floating Customer Proof Banner - Bottom Overlay */}
                <div className="absolute bottom-5 left-5 right-5 bg-[#002a22]/90 backdrop-blur-md border border-[#cb9f5a]/30 rounded-none p-3.5 text-white shadow-2xl flex items-center justify-between z-10 transition-transform duration-300 hover:scale-[1.02]">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <img
                        className="inline-block h-8 w-8 rounded-full border-2 border-[#cb9f5a] object-cover shadow-sm"
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80"
                        alt="Customer 1"
                      />
                      <img
                        className="inline-block h-8 w-8 rounded-full border-2 border-[#cb9f5a] object-cover shadow-sm"
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80"
                        alt="Customer 2"
                      />
                      <img
                        className="inline-block h-8 w-8 rounded-full border-2 border-[#cb9f5a] object-cover shadow-sm"
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80"
                        alt="Customer 3"
                      />
                    </div>
                    <div className="leading-tight text-left">
                      <div className="text-xs font-extrabold text-white">Trusted by 10,000+ Homes</div>
                      <div className="text-[10px] text-[#cb9f5a] font-semibold">In Guntur & Andhra Pradesh</div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 bg-[#cb9f5a]/20 border border-[#cb9f5a]/40 rounded-xl px-3 py-1.5 text-2xs font-extrabold text-[#cb9f5a]">
                    <span>🎁 Code: CLEAN20</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES (admin-managed) */}
      <section
        id="categories"
        className="relative mx-auto max-w-[1400px] px-5 pt-2 pb-6 md:pb-8 lg:px-8"
      >
        <div className="w-full text-left font-sans">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#cb9f5a] font-black block mb-1">
            Explore Options
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#002a22] via-[#00382d] to-[#cb9f5a] w-fit">
            ALL SERVICES
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed font-medium">
            Choose a category or sub-category package below to explore all professional services.
          </p>
        </div>

        <div className="mt-8 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 justify-center items-stretch">
            {displayCategories.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white border border-[#cb9f5a]/25 p-8 w-full">
                <span className="text-2xl block mb-2">✨</span>
                <h3 className="font-display text-sm font-bold text-[#002a22]">No Services Launched Yet</h3>
                <p className="text-2xs text-slate-550 mt-1">Please configure catalog categories and services in the Admin Console.</p>
              </div>
            ) : (
              displayCategories.map((c) => {
                const CategoryIcon = getCategoryIcon(c.title);
                const parent = c.parentId ? categories.find((cat) => cat.id === c.parentId) : null;
                const parentName = parent ? parent.title : null;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      navigate({
                        to: "/services",
                        search: { category: c.id },
                      });
                    }}
                    className="group relative overflow-hidden rounded-none text-left transition-all duration-500 border border-[#cb9f5a]/20 bg-white shadow-[0_10px_35px_-10px_rgba(0,42,34,0.08)] hover:border-[#cb9f5a]/80 hover:shadow-[0_22px_55px_-12px_rgba(0,42,34,0.15)] flex flex-col p-5 cursor-pointer hover:-translate-y-2.5"
                  >
                    {/* Category Main Image */}
                    <div className="relative w-full h-44 overflow-hidden rounded-none bg-slate-100 flex-shrink-0">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <Sparkles className="h-10 w-10 text-[#cb9f5a]" />
                        </div>
                      )}

                      {/* Gradient Overlay on Image */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                      {/* Services Count Badge */}
                      <span className="absolute top-3.5 left-3.5 rounded-full bg-[#002a22]/90 backdrop-blur-md border border-white/20 text-[#cb9f5a] px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                        {c.services?.length || 0} SERVICES
                      </span>
                    </div>

                    {/* Floating Icon badge */}
                    <div className="absolute top-[182px] left-9 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-none bg-white text-[#002a22] shadow-lg border border-[#cb9f5a]/30 group-hover:scale-110 group-hover:bg-[#002a22] group-hover:text-[#cb9f5a] transition-all duration-300 z-10">
                      <CategoryIcon className="h-6 w-6" />
                    </div>

                    {/* Content Details */}
                    <div className="mt-7 px-2 flex-1 flex flex-col justify-between">
                      <div>
                        {parentName && (
                          <span className="text-[10px] font-black text-[#cb9f5a] uppercase tracking-[0.12em] block mb-1">
                            {parentName}
                          </span>
                        )}
                        <h3 className="font-display text-lg font-bold text-[#002a22] group-hover:text-[#cb9f5a] transition-colors leading-snug">
                          {c.title}
                        </h3>
                        <p className="mt-1.5 text-xs text-[#4a5f5b] leading-relaxed line-clamp-2">
                          {c.tagline}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#cb9f5a]/15 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#cb9f5a] transition-transform group-hover:translate-x-1">
                          View services <ArrowRight className="h-4 w-4" />
                        </span>
                        <span className="text-[10px] font-bold text-[#002a22]/40 group-hover:text-[#002a22]/80 transition-colors uppercase tracking-wider">
                          Explore →
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        
      </section>

      {/* SERVICES - Commented out to keep homepage simple. Can be restored when requested.
      <section id="services" className="mx-auto max-w-7xl px-5 py-10 md:py-14 lg:px-8">
        <SectionHeader eyebrow="Popular Services" title="Cleaning Tailored to Every Space" subtitle="Pick from our most-loved services — handled by trained, verified professionals." />

        <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-full border-2 border-gold/30 bg-card px-4 py-2 shadow-luxe focus-within:border-gold">
          <Search className="h-4.5 w-4.5 text-navy/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 'kitchen', 'sofa', 'office'..."
            className="flex-1 bg-transparent py-1.5 text-sm text-navy outline-none placeholder:text-navy/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="grid h-7 w-7 place-items-center rounded-full bg-muted text-navy hover:bg-navy hover:text-cream">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="mt-3 text-center text-xs text-muted-foreground">
          Showing <span className="font-bold text-navy">{filteredServices.length}</span> of {SERVICES.length} services
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredServices.map((s) => {
            const isFav = favs.includes(s.id);
            return (
              <article key={s.id} onClick={() => setDetail(s)} className="group hover-lift overflow-hidden rounded-3xl bg-card shadow-[0_8px_30px_-12px_rgb(15_23_42/0.15)] shine cursor-pointer">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={s.img} alt={s.title} loading="lazy" width={800} height={640} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-navy/85 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-gold">
                    <s.Icon className="h-3.5 w-3.5" /> Premium
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleFav(s.id, s.title); }} aria-label="Wishlist"
                    className={`absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm transition-all ${isFav ? "bg-gold text-navy scale-110" : "bg-white/80 text-navy hover:bg-gold"}`}>
                    <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                  </button>
                  <div className="absolute bottom-3 right-3 rounded-full gradient-gold px-3 py-1 text-xs font-bold text-navy shadow-gold">
                    From ₹{s.price}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-navy">{s.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{s.desc}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setDetail(s); }} className="flex-1 rounded-full border border-navy/15 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy hover:text-cream">
                      View More
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); s.plans && s.plans.length > 0 ? setDetail(s) : addToCart(s); }} className="flex-1 rounded-full gradient-gold px-3 py-2 text-xs font-semibold text-navy transition-transform hover:scale-105">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {filteredServices.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border bg-card p-14 text-center">
              <Search className="mx-auto h-10 w-10 text-navy/30" />
              <p className="mt-3 font-semibold text-navy">No services matched "{search}"</p>
              <button onClick={() => setSearch("")} className="mt-3 rounded-full border border-navy/20 px-4 py-1.5 text-xs font-semibold text-navy hover:bg-navy hover:text-cream">Clear search</button>
            </div>
          )}
        </div>
      </section>
      */}
      {/* DYNAMIC HIERARCHICAL CATEGORY SERVICES SECTION */}
      <div id="cat-services" className="bg-[#faf8f5] py-12 border-t border-[#cb9f5a]/20 space-y-16">
        {parentCategoriesWithSubServices.map((cat) => {
          if (!cat.services || cat.services.length === 0) return null;
          return (
            <div key={cat.id} className="animate-fade-in duration-300">
              {/* Category Section Header */}
              <div className="text-center mb-6">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#cb9f5a] font-black block mb-1">
                  Category
                </span>
                <h3 className="font-display text-2xl md:text-3xl font-black text-[#002a22] uppercase tracking-wide">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 font-medium max-w-xl mx-auto px-5">
                  {cat.tagline}
                </p>
                <div className="h-0.5 w-16 bg-[#cb9f5a]/40 mx-auto mt-3 rounded-full" />
              </div>

              <CategoryCarousel
                category={cat as Category}
                onSelectService={handleSelectService}
                onAddToCart={addToCart}
                getServicePrice={getServicePrice}
                liveReviews={liveReviews}
              />
            </div>
          );
        })}
      </div>

      {/* WHY CHOOSE US */}
      <section
        id="about"
        className="bg-[#faf8f5] py-6 md:py-8 border-b border-[#cb9f5a]/10 relative"
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
                border: "border-[#cb9f5a]/15",
              },
              {
                i: Leaf,
                t: "Eco-Safe Care",
                d: "Plant-based, 100% biodegradable, pet & child-safe cleaning agents.",
                bg: "bg-[#002a22] text-white",
                border: "border-transparent",
                iconBg: "bg-white/10 text-[#cb9f5a]",
              },
              {
                i: Wallet,
                t: "Upfront Pricing",
                d: "Honest, direct pricing. No hidden rates, no surprise additions.",
                bg: "bg-white",
                border: "border-[#cb9f5a]/15",
              },
              {
                i: Clock,
                t: "Same Day Booking",
                d: "Need urgent cleaning? Book a same-day slot in under 60 seconds.",
                bg: "bg-white",
                border: "border-[#cb9f5a]/15",
              },
              {
                i: Wrench,
                t: "Advanced Gear",
                d: "Equipped with specialized HEPA-filter vacuums & high-pressure steam washers.",
                bg: "bg-white",
                border: "border-[#cb9f5a]/15",
              },
              {
                i: Users,
                t: "Elite Customer Trust",
                d: "Join 10,000+ happy clients enjoying premium luxury standards.",
                bg: "bg-white",
                border: "border-[#cb9f5a]/15",
              },
            ].map((f) => (
              <div
                key={f.t}
                className={`group hover-lift rounded-2xl p-5 border ${f.border} ${f.bg} shadow-sm transition-all hover:shadow-md`}
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl ${f.iconBg || "bg-[#cb9f5a]/15 text-[#002a22]"} transition-transform group-hover:scale-105`}
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
      <section className="mx-auto max-w-[1400px] px-5 py-6 md:py-8 lg:px-8">
        <SectionHeader eyebrow="How It Works" title="Four Simple Steps to a Spotless Space" />
        <div className="relative mt-5 grid gap-4 md:grid-cols-4">
          <div className="absolute left-0 right-0 top-6 hidden h-[1px] bg-gradient-to-r from-transparent via-[#cb9f5a]/30 to-transparent md:block" />
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
              className="relative rounded-none bg-white border border-[#cb9f5a]/10 p-5 text-center transition-all hover:border-[#cb9f5a]/30 shadow-sm"
            >
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-none bg-gradient-to-br from-[#002a22] to-[#001712] text-[#cb9f5a] shadow-md relative z-10">
                <s.i className="h-5 w-5" />
              </div>
              <div className="mt-2.5 font-display text-2xl font-black text-[#cb9f5a]/20">{s.n}</div>
              <h3 className="mt-0.5 font-display text-sm font-bold text-navy">{s.t}</h3>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT WORKS */}
      <section className="bg-white py-6 md:py-8 border-b border-[#cb9f5a]/10">
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
                <div key={w.id} className="relative overflow-hidden rounded-none shadow-sm aspect-[4/3] w-full border border-[#cb9f5a]/10 bg-slate-900">
                  <img
                    src={w.afterImage}
                    alt={w.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent z-10 pointer-events-none text-white p-4 flex flex-col justify-end">
                    <h3 className="font-display text-xs font-bold text-white leading-tight">{w.title}</h3>
                    <p className="text-[9px] text-[#cb9f5a] font-extrabold mt-0.5">{w.location}</p>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="gradient-premium relative overflow-hidden py-6 md:py-8 text-cream noise-overlay">
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-[#cb9f5a]/15 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-[#cb9f5a]/10 blur-3xl" />
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
              <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#cb9f5a] font-bold">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="mx-auto max-w-[1400px] px-5 py-6 md:py-8 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[#cb9f5a]/10 pb-4">
          <SectionHeader eyebrow="Customer Reviews" title="Loved by Homes & Businesses" />

          {/* Sorting tabs */}
          <div className="flex items-center gap-1 bg-[#002a22]/5 p-1 rounded-xl self-start md:self-auto border border-[#cb9f5a]/20 font-sans">
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
                    ? "bg-[#002a22] text-white shadow-md"
                    : "text-[#002a22]/70 hover:text-[#002a22] hover:bg-[#002a22]/10"
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

      {/* CONTACT / CTA */}
      <section
        id="contact"
        className="relative overflow-hidden bg-[#fcfbfa] border-t border-[#f1ede6] py-16 md:py-20 text-[#002a22]"
      >
        {/* Subtle Luxury Glow Blobs */}
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#cb9f5a]/3 blur-3xl pointer-events-none" />
        <div className="absolute -left-48 bottom-0 h-96 w-96 rounded-full bg-[#cb9f5a]/3 blur-3xl pointer-events-none" />

        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 lg:grid-cols-12 lg:px-8 relative z-10">
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#cb9f5a] font-extrabold px-3 py-1.5 bg-[#cb9f5a]/5 rounded-lg border border-[#cb9f5a]/15 inline-block">
                Get In Touch
              </span>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold leading-tight text-[#002a22]">
                Ready for a <span className="text-[#cb9f5a] block sm:inline">Spotless Space?</span>
              </h2>
              <p className="mt-3 max-w-md text-xs sm:text-sm text-[#002a22]/70 leading-relaxed font-sans font-medium">
                Book a premium deep cleaning service today or reach out for customized quotes. Our
                customer support team responds within minutes.
              </p>
            </div>

            <div className="space-y-4 font-sans mt-2">
              {/* Card 1: Phone Support */}
              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-[#f1ede6] hover:border-[#cb9f5a]/30 hover:bg-[#faf8f5]/50 transition-all duration-300 shadow-2xs hover:shadow-sm group">
                <div className="flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl bg-[#cb9f5a]/5 text-[#cb9f5a] border border-[#cb9f5a]/20 group-hover:scale-105 transition-transform duration-300">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#cb9f5a]">
                    Phone Support
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-[#002a22] mt-0.5">
                    +91 98765 43210
                  </p>
                  <p className="text-[9px] text-[#002a22]/60 font-semibold mt-0.5">
                    Mon - Sun: 8:00 AM - 8:00 PM
                  </p>
                </div>
              </div>

              {/* Card 2: Email support */}
              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-[#f1ede6] hover:border-[#cb9f5a]/30 hover:bg-[#faf8f5]/50 transition-all duration-300 shadow-2xs hover:shadow-sm group">
                <div className="flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl bg-[#cb9f5a]/5 text-[#cb9f5a] border border-[#cb9f5a]/20 group-hover:scale-105 transition-transform duration-300">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#cb9f5a]">
                    Email Inquiries
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-[#002a22] mt-0.5">
                    hello@thedeepcleanerz.com
                  </p>
                  <p className="text-[9px] text-[#002a22]/60 font-semibold mt-0.5">
                    Response Time: Under 15 Minutes
                  </p>
                </div>
              </div>

              {/* Card 3: Address support */}
              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-[#f1ede6] hover:border-[#cb9f5a]/30 hover:bg-[#faf8f5]/50 transition-all duration-300 shadow-2xs hover:shadow-sm group">
                <div className="flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl bg-[#cb9f5a]/5 text-[#cb9f5a] border border-[#cb9f5a]/20 group-hover:scale-105 transition-transform duration-300">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#cb9f5a]">
                    Headquarters Address
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-[#002a22] mt-0.5">
                    Arundelpet, Guntur, AP
                  </p>
                  <p className="text-[9px] text-[#002a22]/60 font-semibold mt-0.5">
                    Pincode: 522002
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Premium Request Callback Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="bg-white rounded-3xl p-6 md:p-8 border border-[#f1ede6] shadow-md hover:shadow-lg transition-shadow duration-300 space-y-6"
            >
              <div>
                <h3 className="font-display text-xl font-bold text-[#002a22]">
                  Request a Callback
                </h3>
                <p className="text-xs text-[#002a22]/60 mt-1 font-medium font-sans">
                  Leave your query details and our luxury service representative will contact you
                  shortly.
                </p>
              </div>

              <div className="space-y-4 font-sans">
                <div className="relative">
                  <input
                    placeholder="Your Name"
                    className="w-full rounded-xl border border-[#f1ede6] bg-[#faf8f5] pl-10 pr-4 py-3.5 text-xs text-[#002a22] placeholder:text-[#002a22]/35 outline-none focus:border-[#cb9f5a] focus:bg-white focus:ring-1 focus:ring-[#cb9f5a]/10 transition-all font-semibold"
                  />
                  <User className="absolute left-3.5 top-4 h-4 w-4 text-[#002a22]/40" />
                </div>

                <div className="relative">
                  <input
                    placeholder="Mobile Number"
                    className="w-full rounded-xl border border-[#f1ede6] bg-[#faf8f5] pl-10 pr-4 py-3.5 text-xs text-[#002a22] placeholder:text-[#002a22]/35 outline-none focus:border-[#cb9f5a] focus:bg-white focus:ring-1 focus:ring-[#cb9f5a]/10 transition-all font-semibold"
                  />
                  <Phone className="absolute left-3.5 top-4 h-4 w-4 text-[#002a22]/40" />
                </div>

                <div className="relative">
                  <input
                    placeholder="Service Required (e.g. Sofa Cleaning)"
                    className="w-full rounded-xl border border-[#f1ede6] bg-[#faf8f5] pl-10 pr-4 py-3.5 text-xs text-[#002a22] placeholder:text-[#002a22]/35 outline-none focus:border-[#cb9f5a] focus:bg-white focus:ring-1 focus:ring-[#cb9f5a]/10 transition-all font-semibold"
                  />
                  <Star className="absolute left-3.5 top-4 h-4 w-4 text-[#002a22]/40" />
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Your Message (Optional)"
                    className="w-full rounded-xl border border-[#f1ede6] bg-[#faf8f5] pl-10 pr-4 py-3.5 text-xs text-[#002a22] placeholder:text-[#002a22]/35 outline-none focus:border-[#cb9f5a] focus:bg-white focus:ring-1 focus:ring-[#cb9f5a]/10 transition-all resize-none font-semibold"
                  />
                  <MessageCircle className="absolute left-3.5 top-4 h-4 w-4 text-[#002a22]/40" />
                </div>

                <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-gold py-3.5 text-xs font-bold text-navy shadow-gold hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                  <Send className="h-3.5 w-3.5" /> Send Request
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* OFFICE LOCATION GOOGLE MAPS EMBED */}
        <div className="mx-auto max-w-[1400px] px-5 lg:px-8 mt-12 relative z-10">
          <div className="rounded-3xl overflow-hidden border border-[#f1ede6] shadow-md hover:shadow-lg transition-all duration-300 h-80 w-full relative group">
            {/* Absolute overlay visual hint */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 bg-[#002a22] border border-[#cb9f5a]/30 rounded-full text-[10px] font-bold text-white shadow-md">
              <Map className="h-3.5 w-3.5 text-[#cb9f5a]" />
              <span>Headquarters Location Map</span>
            </div>

            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3829.2945379659127!2d80.438992875141!3d16.307887884406753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTbCsDE4JzI4LjQiTiA4MMKwMjYnMjkuNiJF!5e0!3m2!1sen!2sin!4v1784366519525!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="TheDeep CleanerZ Office Location"
              className="grayscale-[30%] contrast-[105%] group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#001712] text-cream/80 relative overflow-hidden border-t border-[#cb9f5a]/20">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[500px] h-[250px] bg-[#cb9f5a]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-[1400px] px-5 pt-16 pb-12 lg:px-8 relative z-10">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-[#cb9f5a]/10">
            {/* Column 1: Brand Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#cb9f5a] to-[#a37937] p-[1px] shadow-lg shadow-[#cb9f5a]/10">
                  <div className="h-full w-full rounded-[15px] bg-[#001712] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-[#cb9f5a]" />
                  </div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold tracking-tight text-white">
                    TheDeep CleanerZ
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#cb9f5a] font-extrabold mt-0.5">
                    Luxury Care
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-cream/60 font-medium">
                Redefining cleanliness with bespoke, hotel-grade service for premium homes &
                estates. Our attention to detail is your ultimate peace of mind.
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
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 border border-white/10 transition-all duration-300 text-cream/70 hover:bg-[#cb9f5a] hover:text-[#001712] hover:border-[#cb9f5a] hover:-translate-y-1 hover:shadow-md hover:shadow-[#cb9f5a]/10"
                  >
                    <s.Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#cb9f5a] border-b border-[#cb9f5a]/20 pb-3">
                Quick Navigation
              </h4>
              <ul className="mt-5 space-y-3 text-xs font-semibold">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="group flex items-center gap-1 text-cream/75 hover:text-[#cb9f5a] transition-all duration-200"
                    >
                      <span className="h-1 w-1 rounded-full bg-[#cb9f5a]/50 scale-0 group-hover:scale-100 transition-transform duration-200 mr-1" />
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
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#cb9f5a] border-b border-[#cb9f5a]/20 pb-3">
                Our Core Services
              </h4>
              <ul className="mt-5 space-y-3 text-xs font-semibold">
                {SERVICES.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <a
                      href="#services"
                      className="group flex items-center gap-1 text-cream/75 hover:text-[#cb9f5a] transition-all duration-200"
                    >
                      <span className="h-1 w-1 rounded-full bg-[#cb9f5a]/50 scale-0 group-hover:scale-100 transition-transform duration-200 mr-1" />
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
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#cb9f5a] border-b border-[#cb9f5a]/20 pb-3">
                Reservations
              </h4>

              <div className="space-y-4 font-sans">
                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#cb9f5a] group-hover:bg-[#cb9f5a]/10 group-hover:border-[#cb9f5a]/30 transition-all">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-cream/40 uppercase tracking-wider font-extrabold">
                      Hotline Support
                    </div>
                    <a
                      href="tel:+919876543210"
                      className="text-xs font-bold text-white hover:text-[#cb9f5a] transition-colors"
                    >
                      +91 98765 43210
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#cb9f5a] group-hover:bg-[#cb9f5a]/10 group-hover:border-[#cb9f5a]/30 transition-all">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-cream/40 uppercase tracking-wider font-extrabold">
                      Email Concierge
                    </div>
                    <a
                      href="mailto:hello@thedeepcleanerz.com"
                      className="text-xs font-bold text-white hover:text-[#cb9f5a] transition-colors"
                    >
                      hello@thedeepcleanerz.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#cb9f5a] group-hover:bg-[#cb9f5a]/10 group-hover:border-[#cb9f5a]/30 transition-all">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-cream/40 uppercase tracking-wider font-extrabold">
                      Service Areas
                    </div>
                    <span className="text-xs font-bold text-white">25+ Luxury Hubs in India</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Legal Links */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-cream/40 font-semibold tracking-wide">
            <div>
              &copy; {new Date().getFullYear()} TheDeep CleanerZ. All rights reserved. Crafted for
              pristine luxury living.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-[#cb9f5a] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#cb9f5a] transition-colors">
                Terms of Service
              </a>
              <Link
                to="/admin"
                className="text-[#cb9f5a]/70 hover:text-[#cb9f5a] hover:underline flex items-center gap-1 font-bold"
              >
                🛡️ Admin Area
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* SERVICE DETAILS MODAL */}
      <ServiceDetailModal
        service={detail}
        onClose={() => setDetail(null)}
        onAddPlan={(s, plan) => {
          addToCart(s, plan);
          setDetail(null);
        }}
        getServicePrice={getServicePrice}
      />
      {/* CART DRAWER */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        total={cartTotal}
        updateQty={updateQty}
        removeItem={removeItem}
        onCheckout={checkout}
        onAddItem={addRawItemToCart}
        allServices={allServices}
        customizedServices={customizedServices}
      />
      {/* BOOKING MODAL */}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        cart={cart}
        total={cartTotal}
        onConfirm={completeBooking}
      />

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-24 right-6 z-40 grid h-12 w-12 place-items-center rounded-full gradient-gold text-navy shadow-gold transition-transform hover:scale-110"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* SELECT LOCATION MODAL OVERLAY */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#001712]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop Click Closer */}
          <div className="absolute inset-0" onClick={() => setLocationModalOpen(false)} />

          <div className="bg-white rounded-3xl w-full max-w-sm border border-[#cb9f5a]/20 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 font-sans text-slate-800">
            {/* Modal Title Row */}
            <div className="flex items-center gap-2.5 mb-5">
              <button
                onClick={() => setLocationModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-bold text-slate-800 font-display">Select Location</h3>
            </div>

            {/* City Input Search Box */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search Guntur area (e.g. Brodipet)"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && citySearch.trim()) {
                    const queryText = citySearch.trim();
                    sessionStorage.setItem("user_location_address", queryText);
                    // Dynamically resolve coordinates using Nominatim API
                    fetch(
                      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryText)}`,
                    )
                      .then((r) => r.json())
                      .then((data) => {
                        if (data && data[0]) {
                          sessionStorage.setItem("user_location_lat", String(data[0].lat));
                          sessionStorage.setItem("user_location_lng", String(data[0].lon));
                        } else {
                          sessionStorage.removeItem("user_location_lat");
                          sessionStorage.removeItem("user_location_lng");
                        }
                        window.dispatchEvent(new Event("location-updated"));
                      })
                      .catch(() => {
                        sessionStorage.removeItem("user_location_lat");
                        sessionStorage.removeItem("user_location_lng");
                        window.dispatchEvent(new Event("location-updated"));
                      });
                    setLocationModalOpen(false);
                    setCitySearch("");
                  }
                }}
                className="w-full text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50/50 pl-4 pr-10 py-3 text-slate-800 placeholder-slate-400 outline-none focus:border-[#cb9f5a] focus:bg-white focus:ring-1 focus:ring-[#cb9f5a]/20 transition-all"
              />
              <Search className="absolute right-4 top-3.5 h-4 w-4 text-slate-400" />

              {/* Suggestions Autocomplete List Dropdown */}
              {citySearch.trim() && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-50 p-2 space-y-0.5 animate-in fade-in duration-100 font-sans">
                  {filteredGunturOptions.length === 0 ? (
                    <div className="py-2.5 px-3.5 text-xs text-slate-400 italic text-center">
                      No matches found for "{citySearch}"
                    </div>
                  ) : (
                    filteredGunturOptions.map((loc) => (
                      <button
                        key={`${loc.area}-${loc.pincode}`}
                        onClick={() => {
                          saveLocationForUser(`${loc.area}, ${loc.city}`, loc.lat, loc.lng);
                          setLocationModalOpen(false);
                          setCitySearch("");
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-[#cb9f5a]/5 text-xs font-semibold text-slate-700 hover:text-[#002a22] transition-colors cursor-pointer border-0 bg-transparent flex flex-col items-start"
                      >
                        <span className="font-bold flex items-center gap-1.5">
                          <span>📍</span> {loc.area}, {loc.city}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium ml-4.5 mt-0.5">
                          {loc.landmark} ({loc.pincode})
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* GPS Locate Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#cb9f5a]/5 hover:bg-[#cb9f5a]/10 border border-[#cb9f5a]/10 text-xs font-bold text-[#cb9f5a] transition-all cursor-pointer select-none active:scale-[0.99]"
              >
                <Locate className="h-4 w-4 text-[#cb9f5a] animate-pulse" />
                <span>Use current location</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocationModalOpen(false);
                  setMapPickerOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#002a22] text-xs font-bold text-[#cb9f5a] border border-[#cb9f5a]/30 shadow-md hover:bg-[#00382d] transition-all cursor-pointer select-none"
              >
                <MapPin className="h-4 w-4 text-[#cb9f5a]" />
                <span>📌 Drag & Pin House Location on Live Map</span>
              </button>
            </div>

            {/* Popular Areas Selector (Guntur Only) */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455 block mb-2.5">
                Popular Locations (Guntur)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Brodipet",
                  "Arundelpet",
                  "Lakshmipuram",
                  "Koritepadu",
                  "Nagarampalem",
                  "Pattabhipuram",
                ].map((c) => {
                  const matchedLoc = GUNTUR_LOCATIONS.find((l) => l.area === c);
                  return (
                    <button
                      key={c}
                      onClick={() => {
                        saveLocationForUser(
                          `${c}, Guntur`,
                          matchedLoc?.lat || null,
                          matchedLoc?.lng || null,
                        );
                        setLocationModalOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-[#cb9f5a]/30 hover:bg-[#cb9f5a]/5 hover:text-[#002a22] text-xs font-semibold text-slate-600 transition-all cursor-pointer shadow-3xs"
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAP PICKER MODAL */}
      <MapPickerModal
        open={mapPickerOpen}
        initialLat={userLat}
        initialLng={userLng}
        onClose={() => setMapPickerOpen(false)}
        onConfirmLocation={(data) => {
          saveLocationForUser(data.address || data.landmark, data.lat, data.lng);
          toast.success(`Doorstep pin set: ${data.landmark || "Custom location"}!`, { icon: "📍" });
        }}
      />

      {/* REFER & EARN MODAL */}
      <ReferralModal
        open={referralModalOpen}
        onClose={() => setReferralModalOpen(false)}
        userProfile={userProfile}
      />
    </div>
  );
}

function ReferralModal({
  open,
  onClose,
  userProfile,
}: {
  open: boolean;
  onClose: () => void;
  userProfile: {
    name: string;
    email: string;
    referralCode?: string;
    walletBalance?: number;
  } | null;
}) {
  if (!open) return null;

  const code = userProfile?.referralCode || "CLEAN-DEEP100";
  const balance = userProfile?.walletBalance || 0;

  const shareText = `Hey! Use my referral code *${code}* on TheDeep CleanerZ for exclusive luxury home cleaning discounts! Book online at http://localhost:4000/`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Referral code copied to clipboard!", { icon: "📋" });
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white border border-[#cb9f5a]/35 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#cb9f5a] to-[#002a22] p-0.5 shadow-lg shadow-[#cb9f5a]/20 mb-3">
            <div className="h-full w-full rounded-[14px] bg-[#002a22] flex items-center justify-center">
              <Gift className="h-7 w-7 text-[#cb9f5a]" />
            </div>
          </div>
          <h3 className="font-display text-xl font-extrabold text-[#002a22]">
            Refer & Earn Luxury Credits
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Invite friends to TheDeep CleanerZ and earn instant wallet credits for every booking!
          </p>
        </div>

        {/* Wallet Balance Display Card */}
        <div className="mt-5 rounded-2xl gradient-premium p-4 text-white noise-overlay relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#cb9f5a] font-black block">
                Total Wallet Earnings
              </span>
              <span className="font-display text-2xl font-black text-white mt-0.5 block">
                ₹{balance}
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-[#cb9f5a]" />
            </div>
          </div>
          <p className="text-[10px] text-cream/75 font-semibold mt-2 relative z-10 border-t border-white/10 pt-2">
            💡 Applied automatically at checkout as an instant discount!
          </p>
        </div>

        {/* Unique Referral Code Section */}
        <div className="mt-5 space-y-2">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block text-center">
            Your Unique Referral Code
          </label>

          <div className="flex items-center justify-between rounded-2xl border-2 border-dashed border-[#cb9f5a]/40 bg-[#cb9f5a]/5 p-3.5">
            <span className="font-mono text-lg font-black tracking-widest text-[#002a22]">
              {code}
            </span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 rounded-xl gradient-gold px-3.5 py-1.5 text-2xs font-bold text-navy shadow-gold hover:scale-105 transition-transform cursor-pointer"
            >
              Copy Code
            </button>
          </div>
        </div>

        {/* WhatsApp Share Button */}
        <button
          onClick={handleShareWhatsApp}
          className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 text-xs font-bold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 fill-white" />
          <span>Share via WhatsApp</span>
        </button>

        {/* How It Works Steps */}
        <div className="mt-6 border-t border-slate-100 pt-4 space-y-2.5">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block text-center">
            How It Works
          </span>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-slate-600">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="block text-base mb-1">📢</span>
              <span>1. Share code with friends</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="block text-base mb-1">🎉</span>
              <span>2. Friend registers & books</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="block text-base mb-1">💰</span>
              <span>3. You get ₹200+ wallet reward</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="w-full text-left font-sans mb-8">
      <span className="text-[10px] uppercase tracking-[0.2em] text-[#cb9f5a] font-black block mb-1">
        {eyebrow}
      </span>
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#002a22] via-[#00382d] to-[#cb9f5a] w-fit">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2.5 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed font-medium">
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
        className={`relative w-full ${maxW} rounded-3xl bg-white border border-[#cb9f5a]/30 shadow-[0_25px_70px_-15px_rgba(0,42,34,0.35)] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-full bg-[#002a22]/85 text-[#cb9f5a] border border-[#cb9f5a]/40 backdrop-blur-md transition-all hover:bg-[#cb9f5a] hover:text-[#002a22] hover:scale-110 shadow-xl cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="p-8">
        <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-gold shadow-gold">
          <Phone className="h-5 w-5 text-navy" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold text-navy">
          Welcome to TheDeep CleanerZ
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Login or register with your mobile number.
        </p>

        {verified ? (
          <div className="mt-6 rounded-2xl bg-muted p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-gold" />
            <div className="mt-2 font-semibold text-navy">You're logged in!</div>
            <p className="text-xs text-muted-foreground">Demo only — no real OTP sent.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-navy/70">
                Mobile Number
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:border-gold">
                <span className="text-sm font-semibold text-navy">+91</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            {!sent ? (
              <button
                disabled={phone.length < 10}
                onClick={() => setSent(true)}
                className="w-full rounded-xl gradient-gold py-3 font-semibold text-navy shadow-gold transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                Send OTP
              </button>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-navy/70">
                    Enter OTP
                  </label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-lg font-semibold tracking-[0.5em] outline-none focus:border-gold"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    OTP sent to +91 {phone}. (Demo — enter any 6 digits)
                  </p>
                </div>
                <button
                  disabled={otp.length < 4}
                  onClick={() => setVerified(true)}
                  className="w-full rounded-xl gradient-navy py-3 font-semibold text-gold transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  Verify OTP
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

export function ServiceDetailModal({
  service,
  onClose,
  onAddPlan,
  getServicePrice,
}: {
  service: Service | null;
  onClose: () => void;
  onAddPlan: (s: Service, plan: ServicePlan) => void;
  getServicePrice: (basePrice: number) => number;
}) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");

  const userEmail = typeof window !== "undefined" ? sessionStorage.getItem("user_email") : null;
  const isAdmin =
    typeof window !== "undefined"
      ? sessionStorage.getItem("admin_authenticated") === "true"
      : false;
  const isLoggedIn = Boolean(userEmail || isAdmin);

  useEffect(() => {
    if (!service) return;
    onClose();
    navigate({ to: "/service-detail", search: { id: service.id } });
  }, [service]);

  if (!service) return null;

  const plans =
    service.plans && service.plans.length > 0
      ? service.plans
      : [
          {
            name: service.title,
            price: service.price,
            duration: "3 hours",
            description: service.desc || "",
            includes: service.sub || [],
            excludes: [
              "Wall painting or structural masonry repair",
              "Exterior window cleaning without balcony access",
              "Permanent old acid burn stain removal on stone",
            ],
          },
        ];

  const primaryPlan = plans[0];

  // Inclusions aggregation
  const allInclusions =
    plans.flatMap((p) => (Array.isArray(p.includes) ? p.includes : [])).length > 0
      ? Array.from(new Set(plans.flatMap((p) => (Array.isArray(p.includes) ? p.includes : []))))
      : service.sub && service.sub.length > 0
        ? service.sub
        : [
            "Deep scrubbing & degreasing of surface areas",
            "Sanitization & disinfection of all fixtures",
            "Machine vacuuming & dust extraction",
            "Post-cleaning quality inspection",
          ];

  // Exclusions aggregation
  const defaultExclusions = [
    "Wall painting, cement scraping or masonry work",
    "High-rise exterior glass cleaning without balcony access",
    "Permanent chemical burn or old acid damage stains",
    "Moving heavy furniture weighing over 40kg without assistance",
  ];

  const allExclusions =
    plans.flatMap((p) => (Array.isArray(p.excludes) ? p.excludes : [])).length > 0
      ? Array.from(new Set(plans.flatMap((p) => (Array.isArray(p.excludes) ? p.excludes : []))))
      : defaultExclusions;

  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
      : "4.9";

  const starsBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
    return { star, count, percentage };
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to submit a review");
      onClose();
      navigate({ to: "/login" });
      return;
    }
    if (!newReviewName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await postReview({
        serviceId: service.id,
        userName: newReviewName,
        rating: newReviewRating,
        comment: newReviewComment,
      });
      if (res.ok) {
        setReviews((prev) => [res.review, ...prev]);
        setNewReviewName("");
        setNewReviewRating(5);
        setNewReviewComment("");
        toast.success("Review submitted successfully!", { icon: "🎉" });
      }
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <ModalShell open onClose={onClose} maxW="max-w-5xl">
      <div className="overflow-hidden rounded-3xl max-h-[88vh] overflow-y-auto scrollbar-none font-sans bg-[#f8f6f0] p-4 sm:p-6 space-y-6">
        {/* SECTION 1: HERO TOP BLOCK (Matching Image 2 style) */}
        <div className="bg-white rounded-3xl border border-[#cb9f5a]/25 p-6 sm:p-8 shadow-[0_10px_30px_-10px_rgba(0,42,34,0.08)] grid gap-8 md:grid-cols-[1fr_360px] items-center">
          {/* Left Column: Details & CTA */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl sm:text-4xl font-black text-[#002a22] tracking-tight">
              {service.title}
            </h2>

            {/* Quick Feature Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#cb9f5a]/10 border border-[#cb9f5a]/30 px-3 py-1 rounded-full text-xs font-black text-[#002a22]">
                ⏱️ {primaryPlan?.duration || "2-3 Hours"}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black text-emerald-800">
                🛡️ Hygienic & Safe
              </span>
              <span className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full text-xs font-black text-sky-800">
                ✨ Verified Experts
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {service.desc ||
                "Professional deep cleaning engineered for luxury homes and commercial spaces using hospital-grade sanitizers."}
            </p>

            {/* Price Tag */}
            <div className="pt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-[#002a22] font-display">
                ₹{getServicePrice(primaryPlan?.price || service.price || 0)}
              </span>
              <span className="text-xs font-extrabold uppercase text-[#cb9f5a] tracking-wider">
                (Inclusive of all taxes & equipment)
              </span>
            </div>

            {/* Add to Cart Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onAddPlan(service, primaryPlan)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#002a22] via-[#00382d] to-[#002a22] hover:from-[#cb9f5a] hover:via-[#e5be7a] hover:to-[#cb9f5a] text-white hover:text-[#002a22] px-8 py-3.5 text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 100% Satisfaction
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Free Rescheduling
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Background Verified Pros
              </span>
            </div>
          </div>

          {/* Right Column: Hero Image Frame */}
          <div className="relative overflow-hidden rounded-3xl aspect-[4/3] w-full bg-slate-100 border border-[#cb9f5a]/30 shadow-md">
            <img src={service.img} alt={service.title} className="h-full w-full object-cover" />
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-[#cb9f5a]/40 px-3 py-1 rounded-full text-xs font-black text-[#002a22] flex items-center gap-1 shadow-md">
              <Star className="h-3.5 w-3.5 text-[#cb9f5a] fill-[#cb9f5a]" /> {avgRating} Rating
            </div>
          </div>
        </div>

        {/* SECTION 2: IMPORTANT NOTES (Matching Image 2 style) */}
        <div className="bg-white rounded-3xl border border-[#cb9f5a]/25 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-full bg-[#cb9f5a]/15 text-[#002a22] flex items-center justify-center font-black text-xs">
              🔔
            </div>
            <h3 className="font-display text-base font-black text-[#002a22]">
              Important Pre-Service Notes
            </h3>
          </div>
          <ul className="grid gap-2.5 text-xs text-slate-600 font-semibold sm:grid-cols-2">
            <li className="flex items-start gap-2.5 bg-[#faf8f5] p-3 rounded-xl border border-slate-100">
              <span className="text-[#cb9f5a] font-bold shrink-0">1.</span>
              <span>
                Please ensure continuous water supply & functioning 16A power sockets for scrubber
                machines.
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-[#faf8f5] p-3 rounded-xl border border-slate-100">
              <span className="text-[#cb9f5a] font-bold shrink-0">2.</span>
              <span>Keep valuable items & fragile decor secured before specialists arrive.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-[#faf8f5] p-3 rounded-xl border border-slate-100">
              <span className="text-[#cb9f5a] font-bold shrink-0">3.</span>
              <span>
                Heavy furniture over 40kg will be cleaned underneath without moving if unassisted.
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-[#faf8f5] p-3 rounded-xl border border-slate-100">
              <span className="text-[#cb9f5a] font-bold shrink-0">4.</span>
              <span>Quality check inspection will be conducted before team departure.</span>
            </li>
          </ul>
        </div>

        {/* SECTION 3: INCLUSIONS & EXCLUSIONS GRID (Matching Image 2 style) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Card: Includes */}
          <div className="bg-white rounded-3xl border border-emerald-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-emerald-100">
              <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                ⭐
              </div>
              <h3 className="font-display text-base font-black text-[#002a22]">
                Package Inclusions
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
              {allInclusions.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100"
                >
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Card: Exclusions */}
          <div className="bg-white rounded-3xl border border-rose-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-rose-100">
              <div className="h-7 w-7 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-black text-xs">
                ❌
              </div>
              <h3 className="font-display text-base font-black text-[#002a22]">
                Package Exclusions
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
              {allExclusions.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100"
                >
                  <span className="h-5 w-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    ✕
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SECTION 4: WHAT WE BRING vs WHAT WE NEED (Matching Image 2 style) */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-3xl border border-[#cb9f5a]/25 p-6 shadow-sm flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#002a22] text-[#cb9f5a] flex items-center justify-center text-xl shrink-0">
              🧰
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-[#002a22]">What We Bring</h4>
              <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                Hospital-grade disinfectants, single-use microfiber cloths, heavy-duty floor
                scrubbing machines, wet/dry vacuums & eco-friendly chemicals.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#cb9f5a]/25 p-6 shadow-sm flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#cb9f5a]/15 text-[#002a22] flex items-center justify-center text-xl shrink-0">
              🔌
            </div>
            <div>
              <h4 className="font-display text-sm font-black text-[#002a22]">What We Need</h4>
              <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                Continuous water connection & a 16A electrical socket for operating machine
                equipment during service hours.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 5: PACKAGE OPTIONS (If multiple plans exist like Express / Elite) */}
        {plans.length > 1 && (
          <div className="bg-white rounded-3xl border border-[#cb9f5a]/25 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="h-4 w-4 text-[#cb9f5a]" />
              <h3 className="font-display text-base font-black text-[#002a22]">
                Select Package Variant
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 hover:border-[#cb9f5a] p-5 transition-all bg-[#faf8f5] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-base font-black text-[#002a22]">
                        {p.name}
                      </h4>
                      <span className="text-xs font-black text-[#002a22] bg-white border border-[#cb9f5a]/30 px-3 py-1 rounded-full">
                        ₹{getServicePrice(p.price)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                      {p.description || service.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">
                      ⏱️ {p.duration || "2 Hours"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddPlan(service, p)}
                      className="bg-[#002a22] hover:bg-[#cb9f5a] hover:text-[#002a22] text-white px-4 py-2 rounded-xl text-xs font-extrabold uppercase transition-colors cursor-pointer"
                    >
                      Select Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 6: BRAND ASSURANCE BADGES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Verified Specialists", icon: "🛡️" },
            { label: "4.9/5 Rating", icon: "⭐" },
            { label: "10,000+ Cleaned", icon: "🏆" },
            { label: "100% Satisfaction", icon: "✨" },
          ].map((b, i) => (
            <div
              key={i}
              className="bg-white border border-[#cb9f5a]/20 rounded-2xl p-3 text-center shadow-3xs"
            >
              <div className="text-lg">{b.icon}</div>
              <div className="text-[11px] font-black text-[#002a22] mt-1">{b.label}</div>
            </div>
          ))}
        </div>

        {/* SECTION 7: CUSTOMER REVIEWS */}
        <div className="bg-white rounded-3xl border border-[#cb9f5a]/25 p-6 shadow-sm space-y-6">
          <h4 className="font-display text-base font-black uppercase tracking-wider text-[#002a22]">
            Verified Customer Reviews
          </h4>

          <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
            <div className="rounded-2xl bg-[#cb9f5a]/10 border border-[#cb9f5a]/20 p-5 text-center flex flex-col justify-center items-center">
              <div className="font-display text-4xl font-black text-[#cb9f5a]">{avgRating}</div>
              <div className="flex justify-center gap-0.5 text-[#cb9f5a] mt-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? "fill-current" : ""}`}
                  />
                ))}
              </div>
              <div className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-wider">
                {reviewCount} Verified Ratings
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              {starsBreakdown.map((row) => (
                <div
                  key={row.star}
                  className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"
                >
                  <span className="w-3 text-right">{row.star}</span>
                  <Star className="h-3 w-3 text-[#cb9f5a] fill-current" />
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-400">{row.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-100 p-4 bg-[#faf8f5]">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-[#002a22] text-[#cb9f5a] flex items-center justify-center font-bold text-xs">
                      {r.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-black text-[#002a22] text-xs">{r.userName}</div>
                      <div className="text-[9px] text-slate-400 font-semibold">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-[#cb9f5a]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-current" : ""}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600 font-semibold italic">"{r.comment}"</p>
              </div>
            ))}
          </div>

          {/* Write review form / Login Gate */}
          {!isLoggedIn ? (
            <div className="rounded-2xl bg-gradient-to-r from-[#002a22] to-[#00382d] p-6 text-center text-white border border-[#cb9f5a]/40 shadow-md">
              <h5 className="font-display text-base font-black text-white">
                Want to leave a review?
              </h5>
              <p className="text-xs text-cream/80 mt-1 max-w-md mx-auto font-medium">
                Please log in to your account to share your experience with our luxury cleaning
                services.
              </p>
              <div className="mt-4">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#cb9f5a] via-[#e5be7a] to-[#cb9f5a] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#002a22] shadow-md hover:scale-105 transition-all"
                >
                  🔐 Login / Register to Review
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitReview}
              className="bg-[#faf8f5] border border-[#cb9f5a]/20 rounded-2xl p-4 space-y-3"
            >
              <div className="text-xs font-black uppercase text-[#002a22] tracking-wider">
                Write a Review
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Your Name
                  </label>
                  <input
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    placeholder="Name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#cb9f5a] font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Rating Star Count
                  </label>
                  <div className="flex gap-1.5 items-center mt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="transition-transform active:scale-125 cursor-pointer"
                      >
                        <Star
                          className={`h-5 w-5 ${star <= newReviewRating ? "text-[#cb9f5a] fill-current" : "text-slate-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Review Feedback
                </label>
                <textarea
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  rows={2}
                  placeholder="Share your experience cleaning with us..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a] font-semibold resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full rounded-xl bg-[#002a22] hover:bg-[#cb9f5a] hover:text-[#002a22] text-white font-black text-xs uppercase tracking-wider py-2.5 transition-all shadow-md cursor-pointer"
              >
                {isSubmittingReview ? "Submitting Review..." : "Submit My Review"}
              </button>
            </form>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

export function CartDrawer({
  open,
  onClose,
  cart,
  total,
  updateQty,
  removeItem,
  onCheckout,
  onAddItem,
  allServices = [],
  customizedServices = [],
}: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  updateQty: (id: string, d: number) => void;
  removeItem: (id: string) => void;
  onCheckout: () => void;
  onAddItem?: (item: { id: string; title: string; price: number; img: string }) => void;
  allServices?: any[];
  customizedServices?: any[];
}) {
  // Dynamic recommendations based on current cart items
  const recommendations = useMemo(() => {
    if (cart.length === 0) return [];

    const list: Array<{ id: string; title: string; price: number; img: string; desc: string }> = [];

    // 1. Prioritize all premium customized services (Tempting & Business Type)
    if (customizedServices && customizedServices.length > 0) {
      customizedServices.forEach((cs) => {
        const isInCart = cart.some((item) => item.id.includes(cs.id));
        if (!isInCart) {
          list.push({
            id: cs.id,
            title: cs.title,
            price: cs.price,
            img:
              cs.image ||
              "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=150&q=80",
            desc: cs.tagline || "Exclusive premium customized package",
          });
        }
      });
    }

    // 2. Next, add services in the same category as cart items
    const cartSvcIds = cart.map((item) => {
      const dashIdx = item.id.lastIndexOf("-");
      return dashIdx > -1 ? item.id.substring(0, dashIdx) : item.id;
    });

    const cartSvcs = allServices.filter((s) => cartSvcIds.includes(s.id));
    const cartCatIds = [...new Set(cartSvcs.map((s) => s.categoryId))];

    if (cartCatIds.length > 0) {
      allServices.forEach((s) => {
        if (cartCatIds.includes(s.categoryId) && !cartSvcIds.includes(s.id) && !list.some((item) => item.id === s.id)) {
          list.push({
            id: s.id,
            title: s.title,
            price: s.price,
            img:
              s.image ||
              s.img ||
              "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=150&q=80",
            desc: "Popular in same category",
          });
        }
      });
    }

    // 3. Fallbacks if list is short
    if (list.length < 4 && allServices.length > 0) {
      const cheapAddons = allServices.filter(
        (s) =>
          s.price < 1000 && !cartSvcIds.includes(s.id) && !list.some((item) => item.id === s.id),
      );
      cheapAddons.forEach((s) => {
        list.push({
          id: s.id,
          title: s.title,
          price: s.price,
          img:
            s.image ||
            s.img ||
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=150&q=80",
          desc: "Highly rated add-on",
        });
      });
    }

    if (list.length < 3) {
      const fallbacks = [
        {
          id: "rec-mini-ac",
          title: "AC Filter Wash",
          price: 59,
          img: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=150&q=80",
          desc: "Quick filter dust wash",
        },
        {
          id: "rec-fan-clean",
          title: "Ceiling Fan Deep Cleaning",
          price: 99,
          img: "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&w=150&q=80",
          desc: "Rust and grease dust removal",
        },
        {
          id: "rec-sofa-shampoo",
          title: "Sofa Dry Vacuum & Shine",
          price: 299,
          img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=150&q=80",
          desc: "Single seat eco shine wash",
        },
      ];
      fallbacks.forEach((fb) => {
        const isInCart = cart.some((item) => item.id.includes(fb.id));
        if (!isInCart && !list.some((item) => item.id === fb.id)) {
          list.push(fb);
        }
      });
    }

    return list.slice(0, 4);
  }, [cart, allServices, customizedServices]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in" onClick={onClose}>
      <div className="flex-1 bg-[#001712]/60 backdrop-blur-sm" />
      <aside
        className="flex h-full w-full max-w-md flex-col bg-[#faf8f5] shadow-2xl border-l border-[#cb9f5a]/20 animate-slide-in-right font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#cb9f5a]/15 p-5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#cb9f5a]" />
            <h3 className="font-display text-xl font-bold text-[#002a22]">Your Cart</h3>
            <span className="rounded-full bg-[#cb9f5a]/10 px-2.5 py-0.5 text-2xs font-extrabold text-[#cb9f5a] border border-[#cb9f5a]/20">
              {cart.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-200/60 hover:bg-[#002a22] text-[#002a22] hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cart.length === 0 ? (
            <div className="grid h-28 place-items-center text-center py-12">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#cb9f5a]/5 border border-dashed border-[#cb9f5a]/25">
                  <ShoppingCart className="h-6 w-6 text-[#cb9f5a]/40" />
                </div>
                <p className="mt-3 font-bold text-[#002a22]">Your cart is empty</p>
                <p className="mt-1 text-xs text-slate-400 font-semibold">
                  Select a bespoke clean package to start.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((i) => (
                <li
                  key={i.id}
                  className="flex gap-3 rounded-2xl border border-[#cb9f5a]/15 bg-white p-3 shadow-sm"
                >
                  <img
                    src={i.img}
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover shrink-0 border border-[#cb9f5a]/10"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-[#002a22] leading-tight">
                        {i.title}
                      </div>
                      <button
                        onClick={() => removeItem(i.id)}
                        className="text-red-400 hover:text-red-650 hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-[#cb9f5a] font-extrabold mt-1">₹{i.price}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-[#cb9f5a]/20 bg-slate-50/50">
                        <button
                          onClick={() => updateQty(i.id, -1)}
                          className="grid h-7 w-7 place-items-center text-[#002a22] hover:bg-slate-200/50 rounded-l-full cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-[#002a22]">
                          {i.qty}
                        </span>
                        <button
                          onClick={() => updateQty(i.id, 1)}
                          className="grid h-7 w-7 place-items-center text-[#002a22] hover:bg-slate-200/50 rounded-r-full cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-xs font-extrabold text-[#002a22]">
                        ₹{i.price * i.qty}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Suggestions / Cross selling */}
          {cart.length > 0 && recommendations.length > 0 && (
            <div className="border-t border-[#cb9f5a]/15 pt-5">
              <h4 className="font-display text-2xs font-extrabold uppercase tracking-wider text-[#002a22] flex items-center gap-1.5 mb-3.5">
                <Sparkles className="h-3.5 w-3.5 text-[#cb9f5a] animate-pulse" />
                <span>Frequently Added Together</span>
              </h4>
              <div className="space-y-2.5">
                {recommendations.map((rec) => {
                  const isInCart = cart.some((item) => item.id === rec.id);
                  return (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#cb9f5a]/15 bg-white p-2.5 hover:bg-slate-50/50 transition-all"
                    >
                      <img
                        src={rec.img}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover shrink-0 border border-[#cb9f5a]/10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-[#002a22] truncate">
                          {rec.title}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate font-semibold">
                          {rec.desc}
                        </div>
                        <div className="text-xs font-extrabold text-[#cb9f5a] mt-0.5">
                          ₹{rec.price}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isInCart) {
                            updateQty(rec.id, 1);
                          } else if (onAddItem) {
                            onAddItem({
                              id: rec.id,
                              title: rec.title,
                              price: rec.price,
                              img: rec.img,
                            });
                          }
                        }}
                        className={`rounded-xl px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isInCart
                            ? "bg-[#002a22]/5 text-[#002a22] border border-[#002a22]/10"
                            : "gradient-gold text-navy shadow-gold active:scale-95"
                        }`}
                      >
                        {isInCart ? "Added ✓" : "+ Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-[#cb9f5a]/15 p-5 bg-white/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Amount
              </span>
              <span className="font-display text-2xl font-bold text-[#002a22]">₹{total}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>GST included · 72hr Free Re-clean</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                <BadgeCheck className="h-3.5 w-3.5" /> SECURE
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="mt-4 w-full rounded-xl gradient-gold py-3.5 font-bold text-navy shadow-gold transition-transform hover:scale-[1.02] cursor-pointer"
            >
              Proceed to Checkout · ₹{total}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// GUNTUR_LOCATIONS removed to prevent redundancy as it is declared globally.

export function BookingModal({
  open,
  onClose,
  cart,
  total,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    landmark: "",
    mapsLink: "",
    city: "Guntur",
    pincode: "",
    date: "",
    time: "10:00",
    notes: "",
    coupon: "",
    houseType: "Flat / Apartment",
    houseSize: "2 BHK",
    gpsCoords: "",
  });
  const [discount, setDiscount] = useState(0);
  const [success, setSuccess] = useState(false);
  const [payMethod, setPayMethod] = useState("razorpay");
  const [showGunturSuggestions, setShowGunturSuggestions] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [checkoutMapPickerOpen, setCheckoutMapPickerOpen] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showCheckoutAddressForm, setShowCheckoutAddressForm] = useState(false);
  const [newAddrType, setNewAddrType] = useState("Home");

  // Checkout Auth Gate
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authIsRegister, setAuthIsRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authReferralCode, setAuthReferralCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [useWalletCredit, setUseWalletCredit] = useState(false);

  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [mobileOtpLoading, setMobileOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const handleSendMobileOtp = async () => {
    if (!form.phone) {
      toast.error("Mobile number is required");
      return;
    }
    
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setMobileOtpLoading(true);
    
    if (isFirebaseConfigured && auth) {
      try {
        console.log(`[Firebase SMS] Sending OTP to +91${cleanPhone} via Firebase Auth...`);
        
        let appVerifier = (window as any).recaptchaVerifier;
        if (!appVerifier) {
          appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {
              // reCAPTCHA solved
            },
            'expired-callback': () => {
              toast.error("reCAPTCHA expired. Please try again.");
            }
          });
          (window as any).recaptchaVerifier = appVerifier;
        }

        const formattedPhone = `+91${cleanPhone}`;
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setOtpSentMessage(`Verification code sent to +91 ${cleanPhone} via SMS.`);
        toast.success("OTP sent to your phone via SMS!", { icon: "📨" });
        setShowOtpVerification(true);
      } catch (err: any) {
        console.error("Firebase Phone Auth failed:", err);
        toast.error(err.message || "Failed to send SMS via Firebase. Make sure Phone Auth is enabled in the Firebase Console.");
        setOtpSentMessage("Failed to send verification SMS. (Firebase Auth Error)");
      } finally {
        setMobileOtpLoading(false);
      }
    } else {
      toast.error("Firebase is not configured. Please define Firebase variables in your environment.");
      setMobileOtpLoading(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (!otpInput || otpInput.length < 6) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }

    setVerifyLoading(true);

    if (confirmationResult) {
      try {
        const result = await confirmationResult.confirm(otpInput);
        console.log("Firebase Auth success user:", result.user);
        setOtpVerified(true);
        setShowOtpVerification(false);
        setStep(2);
        toast.success("Mobile number verified successfully!", { icon: "✅" });
      } catch (err: any) {
        console.error("Firebase OTP Verification failed:", err);
        toast.error("Invalid verification code. Please check and try again.");
      } finally {
        setVerifyLoading(false);
      }
    } else {
      toast.error("No active verification session. Please click resend OTP.");
      setVerifyLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setStep(1);
      setSuccess(false);
      setDiscount(0);
      setPayMethod("razorpay");
      setIsPaying(false);
      setShowAuthGate(false);
      setAuthIsRegister(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
      setAuthPhone("");
      setAuthError("");
      setShowOtpVerification(false);
      setOtpInput("");
      setOtpVerified(false);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      let initName = "";
      let initPhone = "";
      let initAddress = "";
      let initLandmark = "";
      let initCity = "Guntur";
      let initPincode = "";
      try {
        const prof = sessionStorage.getItem("user_profile");
        if (prof) {
          const u = JSON.parse(prof);
          initName = u.name || "";
          initPhone = u.phone || "";

          if (Array.isArray(u.addresses)) {
            setSavedAddresses(u.addresses);
          } else {
            setSavedAddresses([]);
          }

          const defaultAddr = u.addresses?.find((a: any) => a.isDefault);
          if (defaultAddr) {
            initAddress = defaultAddr.address || "";
            initLandmark = defaultAddr.landmark || "";
            initCity = defaultAddr.city || "Guntur";
            initPincode = defaultAddr.pincode || "";
          }
        } else {
          setSavedAddresses([]);
        }
      } catch (e) {}
      const savedLat = sessionStorage.getItem("user_location_lat");
      const savedLng = sessionStorage.getItem("user_location_lng");
      const savedAddr = sessionStorage.getItem("user_location_address");

      // Fall back to saved GPS address if no profile address is saved
      const finalLandmark = initLandmark || savedAddr || "";

      // Try to auto-select houseSize based on cart items
      let matchedSize = "";
      const sizeOptions = [
        "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK",
        "1 Room Kitchen", "Commercial Shop", "Office Cabin / Floor"
      ];
      
      for (const item of cart) {
        const titleUpper = item.title.toUpperCase();
        const idUpper = item.id.toUpperCase();
        
        const found = sizeOptions.find(opt => 
          titleUpper.includes(opt.toUpperCase()) || 
          idUpper.includes(opt.toUpperCase()) ||
          (opt === "1 Room Kitchen" && (titleUpper.includes("1RK") || titleUpper.includes("1 RK")))
        );
        
        if (found) {
          matchedSize = found;
          break;
        }
      }

      setForm((f) => ({
        ...f,
        name: initName || f.name,
        phone: initPhone || f.phone,
        date: tomorrow,
        address: initAddress || f.address,
        landmark: finalLandmark || f.landmark,
        city: initCity || f.city,
        pincode: initPincode || f.pincode,
        gpsCoords: savedLat && savedLng ? `${Number(savedLat).toFixed(6)}, ${Number(savedLng).toFixed(6)}` : f.gpsCoords,
        mapsLink: savedLat && savedLng ? `https://www.google.com/maps?q=${savedLat},${savedLng}` : f.mapsLink,
        ...(matchedSize ? { houseSize: matchedSize } : {}),
      }));

      // Reverse geocode saved GPS coordinates if available to auto-fill pincode & city
      if (savedLat && savedLng) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${savedLat}&lon=${savedLng}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.address) {
              const pc = data.address.postcode ? data.address.postcode.replace(/\D/g, "").slice(0, 6) : "";
              const ct = data.address.city || data.address.town || data.address.county || data.address.state_district || "Guntur";
              setForm((f) => ({
                ...f,
                ...(pc ? { pincode: pc } : {}),
                city: ct || f.city,
              }));
            }
          })
          .catch(() => {});
      }

      // Fetch active coupons
      fetchCoupons()
        .then(setAvailableCoupons)
        .catch((err) => console.warn("Failed to fetch coupons list:", err));
    }
  }, [open]);

  const filteredGuntur = useMemo(() => {
    const query = form.landmark.toLowerCase();
    return GUNTUR_LOCATIONS.filter(
      (loc) =>
        loc.area.toLowerCase().includes(query) ||
        loc.landmark.toLowerCase().includes(query) ||
        loc.city.toLowerCase().includes(query) ||
        loc.pincode.includes(query),
    );
  }, [form.landmark]);

  if (!open) return null;

  const applyCoupon = async () => {
    if (!form.coupon.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    try {
      const result = await validateCoupon(form.coupon, total);
      setDiscount(result.discount);
      toast.success(`Coupon applied — ₹${result.discount} OFF!`, { icon: "🎉" });
    } catch (err: any) {
      setDiscount(0);
      toast.error(err.message || "Invalid coupon code");
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    const toastId = toast.loading("Detecting exact GPS location & auto-filling pincode...", { icon: "📍" });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordsStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        let detectedPincode = "";
        let detectedCity = "Guntur";
        let detectedLandmark = "";

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            if (addr.postcode) {
              detectedPincode = addr.postcode.replace(/\D/g, "").slice(0, 6);
            }
            if (addr.city || addr.town || addr.county || addr.state_district) {
              detectedCity = addr.city || addr.town || addr.county || addr.state_district;
            }
            const area =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.road ||
              addr.village ||
              "";
            if (area) {
              detectedLandmark = `${area}, ${detectedCity}`;
            } else if (data.display_name) {
              detectedLandmark = data.display_name.split(",").slice(0, 2).join(",");
            }
          }
        } catch {
          /* ignore reverse geocoding errors */
        }

        setForm((f) => ({
          ...f,
          gpsCoords: coordsStr,
          mapsLink: mapsUrl,
          ...(detectedPincode ? { pincode: detectedPincode } : {}),
          city: detectedCity || f.city,
          ...(detectedLandmark && !f.landmark ? { landmark: detectedLandmark } : {}),
        }));

        if (detectedPincode) {
          toast.success(`GPS Location & Pincode (${detectedPincode}) auto-detected!`, {
            id: toastId,
            icon: "📍",
          });
        } else {
          toast.success("GPS Coordinates detected successfully!", { id: toastId, icon: "📍" });
        }
        setIsLocating(false);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        toast.error("Could not retrieve GPS coordinates. Please enter location manually.", {
          id: toastId,
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (authIsRegister) {
      if (!authName.trim() || !authPhone.trim() || !authEmail.trim() || !authPassword) {
        setAuthError("All fields are required.");
        return;
      }
      if (authPhone.replace(/\D/g, "").length < 10) {
        setAuthError("Please enter a valid 10-digit mobile number.");
        return;
      }
      if (authPassword.length < 6) {
        setAuthError("Password must be at least 6 characters long.");
        return;
      }

      setAuthLoading(true);
      const normEmail = authEmail.trim().toLowerCase();
      const normPhone = authPhone.trim().replace(/\D/g, "");

      // Helper to save user locally
      const saveLocalUser = (newUser: any) => {
        try {
          const stored = localStorage.getItem("app_registered_users");
          const users: any[] = stored ? JSON.parse(stored) : [];
          const existingIdx = users.findIndex(
            (u) => u.email?.toLowerCase() === newUser.email?.toLowerCase() || u.phone === newUser.phone,
          );
          if (existingIdx >= 0) {
            users[existingIdx] = { ...users[existingIdx], ...newUser };
          } else {
            users.push(newUser);
          }
          localStorage.setItem("app_registered_users", JSON.stringify(users));
        } catch (e) {
          console.warn("Could not save local user:", e);
        }
      };

      // Check if already registered locally
      const storedUsers = localStorage.getItem("app_registered_users");
      const localUsersList: any[] = storedUsers ? JSON.parse(storedUsers) : [];
      const alreadyExists = localUsersList.find(
        (u) => u.email?.toLowerCase() === normEmail || u.phone === normPhone,
      );

      if (alreadyExists) {
        setAuthError("An account with this email or mobile number is already registered. Please login.");
        setAuthLoading(false);
        return;
      }

      const cleanName = authName.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "USER";
      const userRefCode = `CLEAN-${cleanName}${Math.floor(100 + Math.random() * 900)}`;
      const registeredObj = {
        id: `usr_${Date.now()}`,
        name: authName.trim(),
        phone: normPhone,
        email: normEmail,
        password: authPassword,
        referralCode: userRefCode,
        walletBalance: 0,
        createdAt: new Date().toISOString(),
      };

      try {
        const res = await fetch(`${ADMIN_API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: authName.trim(),
            phone: normPhone,
            email: normEmail,
            password: authPassword,
            referralCode: authReferralCode.trim() || undefined,
          }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.user) {
          saveLocalUser(data.user);
        } else if (!res.ok && data?.error) {
          throw new Error(data.error);
        } else {
          saveLocalUser(registeredObj);
        }
      } catch (err: any) {
        if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("connect")) {
          setAuthError(err.message);
          setAuthLoading(false);
          return;
        }
        // Save locally for static hostinger / offline deployment
        saveLocalUser(registeredObj);
      }

      toast.success("Account registered successfully! Please login now with your password.", { icon: "🎉" });
      setAuthIsRegister(false);
      setAuthPassword("");
      setAuthLoading(false);
    } else {
      if (!authEmail.trim() || !authPassword) {
        setAuthError("Please enter both email/phone and password.");
        return;
      }

      setAuthLoading(true);
      const normInput = authEmail.trim().toLowerCase();

      // 1. Admin Login Check
      const isAdmin =
        normInput === "admin@thedeepcleanerz.com" ||
        normInput === "thedeepcleanerz.info@gmail.com" ||
        normInput === "admin";

      if (isAdmin) {
        if (authPassword === "admin123") {
          const targetAdminEmail = "thedeepcleanerz.info@gmail.com";

          try {
            await fetch(`${ADMIN_API_URL}/api/auth/admin-otp/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: targetAdminEmail }),
            });
          } catch (e) {
            console.warn("Backend API OTP send unavailable");
          }

          toast.success(`Verification code sent to ${targetAdminEmail}! Please enter OTP on login page.`, { icon: "📨" });
          setShowAuthGate(false);
          navigate({ to: "/login" });
          setAuthLoading(false);
          return;

          /*
          // Direct Admin Authentication while Gmail is unavailable
          sessionStorage.setItem("admin_authenticated", "true");
          sessionStorage.setItem("user_authenticated", "true");
          sessionStorage.setItem("user_email", targetAdminEmail);
          sessionStorage.setItem("user_role", "admin");
          sessionStorage.setItem(
            "user_profile",
            JSON.stringify({
              id: "admin-1",
              name: "Administrator",
              email: targetAdminEmail,
              role: "admin",
            }),
          );
          window.dispatchEvent(new Event("auth-state-change"));
          toast.success("Welcome back, Administrator!", { icon: "👑" });
          setShowAuthGate(false);
          navigate({ to: "/admin" });
          setAuthLoading(false);
          return;
          */
        } else {
          setAuthError("Incorrect password. Please check your admin password and try again.");
          setAuthLoading(false);
          return;
        }
      }

      // 2. Staff / Technician Login Check
      const isTech =
        normInput === "technician@thedeepcleanerz.com" ||
        normInput === "tech" ||
        normInput.includes("technician");

      if (isTech) {
        if (authPassword === "tech123") {
          sessionStorage.setItem("technician_authenticated", "true");
          sessionStorage.setItem(
            "technician_profile",
            JSON.stringify({
              id: "tech-1",
              name: "Lead Technician",
              email: normInput,
              role: "technician",
            }),
          );
          window.dispatchEvent(new Event("auth-state-change"));
          toast.success("Welcome back! Staff Portal active.", { icon: "🛠️" });
          setShowAuthGate(false);
          navigate({ to: "/technician" });
          setAuthLoading(false);
          return;
        } else {
          setAuthError("Incorrect staff password. Please try again.");
          setAuthLoading(false);
          return;
        }
      }

      // 3. User Login Verification
      let loggedUser: any = null;

      try {
        const res = await fetch(`${ADMIN_API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrPhone: authEmail, password: authPassword }),
        });
        const data = await res.json().catch(() => null);

        if (res.ok && data?.user) {
          loggedUser = data.user;
        } else if (!res.ok && data?.error) {
          setAuthError(data.error);
          setAuthLoading(false);
          return;
        }
      } catch (netErr: any) {
        if (netErr.message && !netErr.message.includes("Failed to fetch") && !netErr.message.includes("connect")) {
          setAuthError(netErr.message);
          setAuthLoading(false);
          return;
        }
      }

      // 4. Local Registered Users Database Lookup (fallback for static hostinger)
      if (!loggedUser) {
        const stored = localStorage.getItem("app_registered_users");
        const localUsers: any[] = stored ? JSON.parse(stored) : [];
        const matchedUser = localUsers.find(
          (u) => u.email?.toLowerCase() === normInput || u.phone === normInput.replace(/\D/g, ""),
        );

        if (matchedUser) {
          if (matchedUser.password && matchedUser.password !== authPassword) {
            setAuthError("Incorrect password. Please check your credentials and try again.");
            setAuthLoading(false);
            return;
          }
          loggedUser = matchedUser;
        } else {
          setAuthError("No account found with this email/phone. Please register your account first.");
          setAuthLoading(false);
          return;
        }
      }

      sessionStorage.setItem("user_authenticated", "true");
      sessionStorage.setItem("user_email", loggedUser.email);
      sessionStorage.setItem("user_profile", JSON.stringify(loggedUser));
      window.dispatchEvent(new Event("auth-state-change"));
      toast.success(`Logged in as ${loggedUser.name}!`, { icon: "✨" });
      setShowAuthGate(false);
      setAuthLoading(false);
    }
  };



  const userWalletBalance = (() => {
    try {
      const prof = sessionStorage.getItem("user_profile");
      if (prof) {
        const u = JSON.parse(prof);
        return u.walletBalance || 0;
      }
    } catch (e) {}
    return 0;
  })();

  const totalAfterDiscount = Math.max(0, total - discount);
  const appliedWalletCredit = useWalletCredit
    ? Math.min(userWalletBalance, totalAfterDiscount)
    : 0;
  const finalTotal = Math.max(0, totalAfterDiscount - appliedWalletCredit);
  const slots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
  const canStep2 =
    form.name.trim() && form.phone.length >= 10 && form.address.trim() && form.pincode.length >= 4;

  let depositSum = 0;
  cart.forEach((i) => {
    const itemPrice = i.price * i.qty;
    if (i.paymentType === "deposit_25") {
      depositSum += itemPrice * 0.25;
    } else if (i.paymentType === "deposit_50") {
      depositSum += itemPrice * 0.50;
    } else if (i.paymentType === "free_advance") {
      depositSum += itemPrice * 0;
    } else {
      depositSum += itemPrice; // full payment (100%)
    }
  });
  const discountFactor = total > 0 ? finalTotal / total : 1;
  const upfrontPayAmount = Math.max(0, Math.round(depositSum * discountFactor));
  const payLaterAmount = Math.max(0, finalTotal - upfrontPayAmount);

  const handleConfirm = async () => {
    let userEmail: string | null = null;
    let userId: string | null = null;
    try {
      const prof = sessionStorage.getItem("user_profile");
      if (prof) {
        const u = JSON.parse(prof);
        userId = u.id || null;
        userEmail = u.email || null;
      }
    } catch (e) {}

    // Auto-save address to user profile if checked
    if (saveToProfile && userId) {
      try {
        const profStr = sessionStorage.getItem("user_profile");
        if (profStr) {
          const u = JSON.parse(profStr);
          const currentAddresses = Array.isArray(u.addresses) ? u.addresses : [];
          
          // Check if this address matches any existing saved address
          const isDuplicate = currentAddresses.some((a: any) => 
            a.address.toLowerCase().trim() === form.address.toLowerCase().trim() &&
            a.pincode.trim() === form.pincode.trim()
          );

          if (!isDuplicate && form.address.trim() && form.pincode.trim()) {
            const newAddress = {
              id: "addr-" + Math.random().toString(36).substr(2, 9),
              address: form.address.trim(),
              landmark: form.landmark.trim(),
              city: form.city.trim(),
              pincode: form.pincode.trim(),
              type: "Home", // Default new checkout addresses to 'Home'
              isDefault: currentAddresses.length === 0, // Set default if it's the first
            };
            const updatedAddresses = [...currentAddresses, newAddress];
            
            // Call the database API to save it
            await fetch(`${ADMIN_API_URL}/api/users/${userId}/addresses`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ addresses: updatedAddresses }),
            });

            // Update sessionStorage user profile representation
            const updatedProfile = { ...u, addresses: updatedAddresses };
            sessionStorage.setItem("user_profile", JSON.stringify(updatedProfile));
            window.dispatchEvent(new Event("storage"));
          }
        }
      } catch (err) {
        console.error("Error auto-saving address to profile:", err);
      }
    }

    const upfrontAmount = upfrontPayAmount;
    const isFreeAdvance = cart.some((i) => i.paymentType === "free_advance");
    const isDeposit50 = cart.some((i) => i.paymentType === "deposit_50");
    const isDeposit25 = cart.some((i) => i.paymentType === "deposit_25");
    const depositPct = isFreeAdvance ? "0%" : isDeposit50 ? "50%" : isDeposit25 ? "25%" : "Deposit";
    const descriptionText = upfrontAmount < finalTotal
      ? `Premium Cleaning Booking (${depositPct} Upfront)`
      : "Premium Cleaning Booking (Full Payment)";
    
    const paymentStatusText = upfrontAmount < finalTotal
      ? isFreeAdvance ? "Free Advance (Pay after Service)" : `Paid ${depositPct} Deposit (₹${upfrontAmount})`
      : `Paid Full Amount (₹${upfrontAmount})`;

    const customerPayload = {
      name: form.name,
      phone: form.phone,
      email: userEmail || sessionStorage.getItem("user_email") || "",
      address: form.address,
      landmark: form.landmark,
      mapsLink: form.mapsLink,
      city: form.city,
      pincode: form.pincode,
      houseType: form.houseType,
      houseSize: form.houseSize,
      gpsCoords: form.gpsCoords,
    };

    if (payMethod === "razorpay" && upfrontAmount > 0) {
      setIsPaying(true);
      try {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error("Failed to load payment gateway script. Please check your network.");
          setIsPaying(false);
          return;
        }

        // Only pay deposit upfront
        const orderInfo = await createRazorpayOrder(upfrontAmount);

        const options = {
          key: orderInfo.keyId,
          amount: orderInfo.amount,
          currency: "INR",
          name: "TheDeep CleanerZ",
          description: descriptionText,
          order_id: orderInfo.orderId,
          handler: async function (response: any) {
            try {
              await postAdminBooking({
                customer: customerPayload,
                schedule: { date: form.date, time: form.time },
                notes: form.notes,
                coupon: form.coupon || null,
                discount,
                total: finalTotal, // Keep finalTotal as grand total
                items: cart.map((i) => ({
                  id: i.id,
                  title: i.title,
                  price: i.price,
                  qty: i.qty,
                  img: i.img,
                })),
                paymentStatus: paymentStatusText,
                paymentId: response.razorpay_payment_id,
                userId,
              });
              setSuccess(true);
              setTimeout(() => {
                onConfirm();
              }, 1800);
            } catch (err) {
              console.error("Booking post-payment capture failed:", err);
              toast.error("Payment succeeded, but could not save booking. Please contact support.");
            } finally {
              setIsPaying(false);
            }
          },
          prefill: {
            name: form.name,
            contact: form.phone,
          },
          theme: {
            color: "#cbb17b",
          },
          modal: {
            ondismiss: function () {
              setIsPaying(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        console.error("Payment execution error:", err);
        toast.error(err.message || "Could not initialize checkout transaction.");
        setIsPaying(false);
      }
    } else {
      setIsPaying(true);
      try {
        await postAdminBooking({
          customer: customerPayload,
          schedule: { date: form.date, time: form.time },
          notes: form.notes,
          coupon: form.coupon || null,
          discount,
          total: finalTotal,
          items: cart.map((i) => ({
            id: i.id,
            title: i.title,
            price: i.price,
            qty: i.qty,
            img: i.img,
          })),
          paymentStatus: isFreeAdvance ? "Free Advance (Pay after Service)" : "Pending Deposit (COD)",
          paymentId: null,
          userId,
        });
        setSuccess(true);
        setTimeout(() => {
          onConfirm();
        }, 1800);
      } catch (err) {
        console.warn("Admin booking POST failed:", err);
        setSuccess(true);
        setTimeout(() => {
          onConfirm();
        }, 1800);
      } finally {
        setIsPaying(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#001712]/60 sm:p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-3xl overflow-hidden rounded-t-[32px] sm:rounded-3xl bg-[#faf8f5] shadow-2xl border-t-2 border-x sm:border border-[#cb9f5a]/25 animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 sm:duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="recaptcha-container"></div>
        {/* PREMIUM PULL SHEET INDICATOR FOR MOBILE */}
        <div className="flex justify-center py-2.5 sm:hidden bg-gradient-to-r from-[#00231c] to-[#002a22]">
          <div className="h-1.5 w-12 rounded-full bg-cream/20" />
        </div>
        <div className="flex items-center justify-between gradient-premium px-6 py-4 text-cream border-b border-[#cb9f5a]/20">
          <div className="flex items-center gap-3.5">
            {(step === 2 || showOtpVerification) && (
              <button
                onClick={() => {
                  if (showOtpVerification) {
                    setShowOtpVerification(false);
                  } else {
                    setStep(1);
                  }
                }}
                className="grid h-8 w-8 place-items-center rounded-full border border-gold/30 hover:bg-[#cb9f5a] hover:text-[#001712] transition-all cursor-pointer mr-0.5"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4 text-gold" />
              </button>
            )}
            <div>
              <div className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-gold">
                Checkout · Step {step} of 2
              </div>
              <div className="font-display text-base sm:text-xl font-bold">Confirm your booking</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-gold/30 hover:bg-[#cb9f5a] hover:text-[#001712] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="border-b border-[#cb9f5a]/10 bg-[#002a22]/5 px-6 py-3.5">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div
              className={`flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] ${step >= 1 ? "text-[#002a22]" : "text-slate-400"}`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${step >= 1 ? "gradient-gold text-navy shadow-gold" : "bg-slate-200 text-slate-500"}`}
              >
                1
              </span>{" "}
              Details
            </div>
            <div className="h-px flex-1 bg-[#cb9f5a]/20" />
            <div
              className={`flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] ${step >= 2 ? "text-[#002a22]" : "text-slate-400"}`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${step >= 2 ? "gradient-gold text-navy shadow-gold" : "bg-slate-200 text-slate-500"}`}
              >
                2
              </span>{" "}
              Schedule & Pay
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 font-sans">
          {success ? (
            <div className="grid place-items-center py-10 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full gradient-gold pulse-gold">
                <PartyPopper className="h-9 w-9 text-navy" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold text-[#002a22]">
                Booking Confirmed!
              </h3>
              <p className="mt-1 max-w-sm text-xs font-semibold text-slate-500">
                Our verified team will arrive at{" "}
                <span className="font-bold text-[#cb9f5a]">
                  {form.date} · {form.time}
                </span>
                . SMS confirmation sent to +91 {form.phone}.
              </p>
            </div>
          ) : showAuthGate ? (
            <div className="mx-auto max-w-md py-4">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#cb9f5a]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#cb9f5a]">
                  🔒 Secure Checkout
                </div>
                <h3 className="mt-2 font-display text-xl font-bold text-[#002a22]">
                  Sign In or Register
                </h3>
                <p className="text-xs text-slate-450 font-semibold mt-1">
                  Please sign in to your account to complete your deposit payment.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex rounded-full bg-[#002a22]/5 p-1 mb-6 border border-[#cb9f5a]/15">
                <button
                  type="button"
                  onClick={() => {
                    setAuthIsRegister(false);
                    setAuthError("");
                  }}
                  className={`flex-1 rounded-full py-2.5 text-xs font-bold transition-all cursor-pointer ${!authIsRegister ? "gradient-gold text-navy shadow-gold" : "text-slate-500 hover:text-[#002a22]"}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthIsRegister(true);
                    setAuthError("");
                  }}
                  className={`flex-1 rounded-full py-2.5 text-xs font-bold transition-all cursor-pointer ${authIsRegister ? "gradient-gold text-navy shadow-gold" : "text-slate-500 hover:text-[#002a22]"}`}
                >
                  Register
                </button>
              </div>

              {authError && (
                <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-[10px] font-bold text-rose-350">
                  ⚠️ {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authIsRegister && (
                  <>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-1.5">
                        Full Name
                      </div>
                      <div className="flex items-center gap-2.5 rounded-xl border border-[#cb9f5a]/20 bg-white px-4 py-3 focus-within:border-[#cb9f5a] focus-within:ring-1 focus-within:ring-[#cb9f5a] transition-all shadow-sm">
                        <User className="h-4 w-4 text-[#cb9f5a]" />
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-transparent text-xs font-semibold outline-none text-slate-800 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-1.5">
                        Mobile Number
                      </div>
                      <div className="flex items-center gap-2.5 rounded-xl border border-[#cb9f5a]/20 bg-white px-4 py-3 focus-within:border-[#cb9f5a] focus-within:ring-1 focus-within:ring-[#cb9f5a] transition-all shadow-sm">
                        <span className="text-xs font-bold text-[#cb9f5a]">+91</span>
                        <input
                          type="tel"
                          required
                          value={authPhone}
                          onChange={(e) =>
                            setAuthPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                          }
                          placeholder="98765 43210"
                          className="w-full bg-transparent text-xs font-semibold outline-none text-slate-800 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-1.5">
                        Referral Code (Optional)
                      </div>
                      <div className="flex items-center gap-2.5 rounded-xl border border-[#cb9f5a]/20 bg-white px-4 py-3 focus-within:border-[#cb9f5a] focus-within:ring-1 focus-within:ring-[#cb9f5a] transition-all shadow-sm">
                        <Gift className="h-4 w-4 text-[#cb9f5a]" />
                        <input
                          type="text"
                          value={authReferralCode}
                          onChange={(e) => setAuthReferralCode(e.target.value.toUpperCase())}
                          placeholder="e.g. CLEAN-PANDU50"
                          className="w-full bg-transparent text-xs font-mono font-bold outline-none text-slate-800 placeholder:text-slate-400 uppercase tracking-widest"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-1.5">
                    Email / Mobile Number
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-[#cb9f5a]/20 bg-white px-4 py-3 focus-within:border-[#cb9f5a] focus-within:ring-1 focus-within:ring-[#cb9f5a] transition-all shadow-sm">
                    <Mail className="h-4 w-4 text-[#cb9f5a]" />
                    <input
                      type="text"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="email@example.com or 9876543210"
                      className="w-full bg-transparent text-xs font-semibold outline-none text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-1.5">
                    Password
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-[#cb9f5a]/20 bg-white px-4 py-3 focus-within:border-[#cb9f5a] focus-within:ring-1 focus-within:ring-[#cb9f5a] transition-all shadow-sm">
                    <Lock className="h-4 w-4 text-[#cb9f5a]" />
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-xs font-semibold outline-none text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-gold py-3 text-xs font-bold text-navy shadow-gold disabled:opacity-50 hover:scale-[1.01] transition-all cursor-pointer font-sans"
                  >
                    {authLoading
                      ? "Please wait..."
                      : authIsRegister
                        ? "Register Account"
                        : "Sign In & Continue"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthGate(false);
                      setAuthError("");
                    }}
                    className="w-full py-2.5 text-xs font-bold text-[#cb9f5a] hover:text-[#cb9f5a]/80 transition-colors font-sans cursor-pointer"
                  >
                    ← Back to Address Details
                  </button>
                </div>
              </form>
            </div>
          ) : showOtpVerification ? (
            <div className="mx-auto max-w-sm py-6 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#cb9f5a]/10 mb-4 text-[#cb9f5a] border border-[#cb9f5a]/25">
                <Smartphone className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#002a22]">Verify Your Mobile</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1 px-4">
                {otpSentMessage || <>We have sent a 6-digit OTP code to <span className="font-bold text-[#002a22]">+91 {form.phone}</span>.</>}
              </p>
              
              <div className="mt-6">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Enter 6-Digit OTP Code
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  className="w-full max-w-[200px] text-center rounded-xl border-2 border-[#cb9f5a]/30 bg-white px-4 py-3.5 text-lg font-mono font-bold tracking-[0.5em] text-[#002a22] outline-none focus:border-[#cb9f5a] placeholder:text-slate-300 shadow-sm"
                />
              </div>
 
              <div className="mt-8 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={verifyLoading}
                  onClick={handleVerifyMobileOtp}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-gold py-3.5 text-xs font-bold text-navy shadow-gold hover:scale-[1.01] transition-all cursor-pointer font-sans disabled:opacity-50"
                >
                  {verifyLoading ? "Verifying..." : "Verify & Continue"}
                </button>
                <div className="flex justify-between items-center mt-2 px-1">
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    disabled={mobileOtpLoading}
                    className="text-2xs font-extrabold text-[#cb9f5a] hover:text-[#cb9f5a]/80 transition-colors cursor-pointer disabled:opacity-50 border-0 bg-transparent"
                  >
                    {mobileOtpLoading ? "Resending..." : "🔁 Resend OTP Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpVerification(false);
                      setOtpInput("");
                    }}
                    className="text-2xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    Change Number / Back
                  </button>
                </div>
              </div>
            </div>
          ) : step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Full Name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="Priya Sharma"
              />
              <Field
                label="Mobile Number"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v.replace(/\D/g, "").slice(0, 10) })}
                placeholder="98765 43210"
                prefix="+91"
              />

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  House / Property Type
                </label>
                <select
                  value={form.houseType}
                  onChange={(e) => setForm({ ...form, houseType: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-[#cb9f5a]/20 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#cb9f5a] outline-none shadow-sm cursor-pointer"
                >
                  <option value="Flat / Apartment">Flat / Apartment</option>
                  <option value="Villa / Independent House">Villa / Independent House</option>
                  <option value="Row House">Row House</option>
                  <option value="Office / Commercial Space">Office / Commercial Space</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Configuration / Size
                </label>
                <select
                  value={form.houseSize}
                  onChange={(e) => setForm({ ...form, houseSize: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-[#cb9f5a]/20 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#cb9f5a] outline-none shadow-sm cursor-pointer"
                >
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="5+ BHK">5+ BHK / Large Villa</option>
                  <option value="1 Room Kitchen">1 Room Kitchen (1RK)</option>
                  <option value="Commercial Shop">Commercial Shop</option>
                  <option value="Office Cabin / Floor">Office Cabin / Floor</option>
                </select>
              </div>

              {/* Address Section Title */}
              <div className="sm:col-span-2 flex items-center justify-between border-b border-slate-100 pb-2 mb-1 mt-2">
                <span className="text-xs font-black text-[#002a22] uppercase tracking-wider flex items-center gap-1.5">
                  <span>📍</span> Delivery / Cleaning Address
                </span>
                {sessionStorage.getItem("user_profile") && !showCheckoutAddressForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddressId(null);
                      // Clear fields for new address
                      setForm(f => ({ ...f, address: "", landmark: "", pincode: "" }));
                      setShowCheckoutAddressForm(true);
                    }}
                    className="text-[10px] text-[#cb9f5a] font-extrabold uppercase hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    ➕ Add New Address
                  </button>
                )}
              </div>

              {/* Saved Addresses Carousel List */}
              {sessionStorage.getItem("user_profile") && savedAddresses.length > 0 && !showCheckoutAddressForm && (
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin">
                    {savedAddresses.map((addr: any) => {
                      const isSelected = 
                        form.address === addr.address &&
                        form.landmark === addr.landmark &&
                        form.pincode === addr.pincode;
                      
                      return (
                        <div
                          key={addr.id}
                          className={`relative flex flex-col justify-between rounded-xl p-3 border shrink-0 min-w-[200px] max-w-[220px] transition-all ${
                            isSelected
                              ? "border-[#cb9f5a] bg-[#cb9f5a]/5 ring-1 ring-[#cb9f5a]/20"
                              : "border-slate-200 bg-white hover:border-[#cb9f5a]/45"
                          }`}
                        >
                          {/* Card click handler */}
                          <div
                            className="cursor-pointer flex-1 flex items-start gap-2"
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                address: addr.address || f.address,
                                landmark: addr.landmark || f.landmark,
                                city: addr.city || f.city,
                                pincode: addr.pincode || f.pincode,
                              }));
                            }}
                          >
                            <div className="text-sm pt-0.5">
                              {addr.type === "Home" ? "🏠" : addr.type === "Office" ? "🏢" : "📍"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-[9px] uppercase text-slate-700">{addr.type}</span>
                                {addr.isDefault && (
                                  <span className="font-black text-[7px] text-emerald-800 bg-emerald-100 px-1 rounded-full uppercase">Default</span>
                                )}
                              </div>
                              <p className="text-[10px] font-semibold text-slate-600 truncate mt-0.5">{addr.address}</p>
                              <p className="text-[9px] font-extrabold text-[#cb9f5a]/90 mt-0.5">{addr.city} - {addr.pincode}</p>
                            </div>
                          </div>

                          {/* Edit / Delete tiny buttons inside card */}
                          <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddressId(addr.id);
                                setForm((f) => ({
                                  ...f,
                                  address: addr.address,
                                  landmark: addr.landmark,
                                  city: addr.city,
                                  pincode: addr.pincode,
                                }));
                                setNewAddrType(addr.type || "Home");
                                setShowCheckoutAddressForm(true);
                              }}
                              className="text-[9px] font-bold text-slate-500 hover:text-[#cb9f5a] cursor-pointer flex items-center gap-0.5 border-0 bg-transparent"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const userId = JSON.parse(sessionStorage.getItem("user_profile") || "{}").id;
                                if (!userId) return;
                                const updated = savedAddresses.filter((a: any) => a.id !== addr.id);
                                if (addr.isDefault && updated.length > 0) {
                                  updated[0].isDefault = true;
                                }
                                try {
                                  const res = await fetch(`${ADMIN_API_URL}/api/users/${userId}/addresses`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ addresses: updated }),
                                  });
                                  if (res.ok) {
                                    setSavedAddresses(updated);
                                    const prof = JSON.parse(sessionStorage.getItem("user_profile") || "{}");
                                    const updatedProf = { ...prof, addresses: updated };
                                    sessionStorage.setItem("user_profile", JSON.stringify(updatedProf));
                                    window.dispatchEvent(new Event("storage"));
                                    toast.success("Address deleted successfully!");
                                    
                                    // Reset form values if deleted address was selected
                                    if (isSelected) {
                                      setForm(f => ({ ...f, address: "", landmark: "", pincode: "" }));
                                    }
                                  }
                                } catch (err) {
                                  toast.error("Failed to delete address.");
                                }
                              }}
                              className="text-[9px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer flex items-center gap-0.5 border-0 bg-transparent"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Show address input form fields (only if no saved addresses, or adding/editing) */}
              {(showCheckoutAddressForm || savedAddresses.length === 0) && (
                <>
                  {/* Address Type pill selector in edit form */}
                  {sessionStorage.getItem("user_profile") && (
                    <div className="sm:col-span-2 flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl mb-1 text-xs">
                      <span className="font-bold text-slate-700">Address Label Tag</span>
                      <div className="flex gap-1.5 text-[10px]">
                        {["Home", "Office", "Other"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setNewAddrType(t)}
                            className={`px-2.5 py-0.5 rounded-full font-bold transition-colors cursor-pointer border ${
                              newAddrType === t
                                ? "bg-[#002a22] border-[#002a22] text-white font-extrabold"
                                : "bg-slate-50 border-slate-200 text-slate-500"
                            }`}
                          >
                            {t === "Home" ? "🏠 Home" : t === "Office" ? "🏢 Office" : "📍 Other"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <Field
                      label="Full Address"
                      value={form.address}
                      onChange={(v) => setForm({ ...form, address: v })}
                      placeholder="Flat 302, Sunshine Apartments, Indiranagar"
                      textarea
                    />
                  </div>
                  
                  <div className={`relative ${showGunturSuggestions ? "z-30" : "z-10"}`}>
                    <div onClick={() => setShowGunturSuggestions(true)}>
                      <Field
                        label="Landmark / Nearby Place"
                        value={form.landmark}
                        onChange={(v) => {
                          setForm({ ...form, landmark: v });
                          setShowGunturSuggestions(true);
                        }}
                        placeholder="e.g. Opposite Metro Station"
                      />
                    </div>
                    {showGunturSuggestions && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowGunturSuggestions(false)}
                        />
                        <div className="absolute left-0 right-0 bottom-full mb-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg z-50 py-1 text-slate-800 font-sans">
                          <div className="px-3 py-1.5 bg-slate-50 text-[9px] font-extrabold uppercase tracking-wide text-slate-400 border-b border-slate-100 flex items-center justify-between">
                            <span>📍 Guntur Location Suggestions</span>
                            <span className="text-[8px] bg-[#cb9f5a]/10 text-[#cb9f5a] px-1 rounded">
                              Quick Auto-fill
                            </span>
                          </div>
                          {filteredGuntur.map((loc, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setForm({
                                  ...form,
                                  landmark: loc.landmark,
                                  address: `${loc.landmark}, ${loc.area}`,
                                  pincode: loc.pincode,
                                  city: "Guntur",
                                  mapsLink: loc.mapsLink,
                                });
                                setShowGunturSuggestions(false);
                                toast.success(`Location auto-filled: ${loc.area}!`, { icon: "📍" });
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-[#cb9f5a]/5 transition-colors border-0 bg-transparent cursor-pointer flex flex-col gap-0.5"
                            >
                              <div className="font-bold text-[#002a22] flex items-center justify-between">
                                <span>{loc.area}</span>
                                <span className="text-[10px] text-[#cb9f5a] font-mono">
                                  {loc.pincode}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium truncate">
                                {loc.landmark}
                              </div>
                            </button>
                          ))}
                          {filteredGuntur.length === 0 && (
                            <div className="px-3 py-4 text-center text-slate-400 text-xs italic">
                              No Guntur landmarks found matching your query
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <Field
                    label="Pincode"
                    value={form.pincode}
                    onChange={(v) => setForm({ ...form, pincode: v.replace(/\D/g, "").slice(0, 6) })}
                    placeholder="522002"
                  />

                  {/* Save / Cancel buttons in sub-form */}
                  {sessionStorage.getItem("user_profile") && savedAddresses.length > 0 && (
                    <div className="sm:col-span-2 flex justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCheckoutAddressForm(false);
                          // Restore default or previous address
                          const defaultAddr = savedAddresses.find((a: any) => a.isDefault) || savedAddresses[0];
                          if (defaultAddr) {
                            setForm((f) => ({
                              ...f,
                              address: defaultAddr.address,
                              landmark: defaultAddr.landmark,
                              city: defaultAddr.city,
                              pincode: defaultAddr.pincode,
                            }));
                          }
                        }}
                        className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!form.address.trim() || !form.pincode.trim()) {
                            toast.error("Full Address and Pincode are required");
                            return;
                          }
                          const userId = JSON.parse(sessionStorage.getItem("user_profile") || "{}").id;
                          if (!userId) return;
                          
                          let updated: any[];
                          if (editingAddressId) {
                            // Update existing address
                            updated = savedAddresses.map((a: any) => 
                              a.id === editingAddressId
                                ? { ...a, address: form.address.trim(), landmark: form.landmark.trim(), city: form.city.trim(), pincode: form.pincode.trim(), type: newAddrType }
                                : a
                            );
                          } else {
                            // Add new address
                            const newAddr = {
                              id: "addr-" + Math.random().toString(36).substr(2, 9),
                              address: form.address.trim(),
                              landmark: form.landmark.trim(),
                              city: form.city.trim(),
                              pincode: form.pincode.trim(),
                              type: newAddrType,
                              isDefault: savedAddresses.length === 0,
                            };
                            updated = [...savedAddresses, newAddr];
                          }
                          
                          try {
                            const res = await fetch(`${ADMIN_API_URL}/api/users/${userId}/addresses`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ addresses: updated }),
                            });
                            if (res.ok) {
                              setSavedAddresses(updated);
                              const prof = JSON.parse(sessionStorage.getItem("user_profile") || "{}");
                              const updatedProf = { ...prof, addresses: updated };
                              sessionStorage.setItem("user_profile", JSON.stringify(updatedProf));
                              window.dispatchEvent(new Event("storage"));
                              toast.success(editingAddressId ? "Address updated!" : "New address added!");
                              setShowCheckoutAddressForm(false);
                            }
                          } catch (err) {
                            toast.error("Failed to save address changes.");
                          }
                        }}
                        className="px-4 py-2 bg-[#002a22] text-white hover:bg-[#003d32] text-xs font-bold rounded-xl cursor-pointer"
                      >
                        {editingAddressId ? "Update Address" : "Save Address"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Preview of selected address if form is hidden */}
              {!showCheckoutAddressForm && savedAddresses.length > 0 && form.address && (
                <div className="sm:col-span-2 bg-[#faf8f5]/85 border border-[#cb9f5a]/25 rounded-2xl p-4 shadow-3xs text-xs font-sans space-y-1 mt-1">
                  <div className="font-extrabold uppercase text-[9px] text-[#cb9f5a]">Selected Delivery Address</div>
                  <p className="font-bold text-slate-700 leading-relaxed">{form.address}</p>
                  {form.landmark && <p className="text-[10px] text-slate-500 font-bold">Nearby: {form.landmark}</p>}
                  <p className="text-[10px] text-[#cb9f5a] font-extrabold uppercase">{form.city} - {form.pincode}</p>
                </div>
              )}

              {/* Save Address to Profile Checkbox for guest users who type manually */}
              {sessionStorage.getItem("user_profile") && savedAddresses.length === 0 && (
                <div className="sm:col-span-2 flex items-center gap-2 pt-1 font-sans">
                  <input
                    type="checkbox"
                    id="save-to-profile-checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="rounded border-[#cb9f5a]/30 text-[#002a22] focus:ring-[#cb9f5a] cursor-pointer h-4 w-4"
                  />
                  <label htmlFor="save-to-profile-checkbox" className="text-xs font-bold text-[#002a22]/80 select-none cursor-pointer">
                    Save this address to my profile for future bookings
                  </label>
                </div>
              )}

              {/* Technician location detector */}
              <div className="sm:col-span-2">
                <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-[#cb9f5a]/30 bg-[#cb9f5a]/5 p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h4 className="text-xs font-bold text-[#002a22] flex items-center gap-1.5">
                        <span>📍</span> Technician GPS Location
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                        Let our technicians navigate to your exact house doorstep using GPS
                        coordinates.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={isLocating}
                        className="shrink-0 flex items-center gap-1.5 rounded-xl gradient-gold px-3.5 py-2 text-2xs font-bold text-navy shadow-gold disabled:opacity-50 hover:scale-[1.02] transition-all cursor-pointer font-sans"
                      >
                        {isLocating ? "Detecting..." : "📍 Detect My Location"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutMapPickerOpen(true)}
                        className="shrink-0 flex items-center gap-1.5 rounded-xl border border-[#cb9f5a]/30 bg-white px-3.5 py-2 text-2xs font-bold text-[#002a22] shadow-2xs hover:bg-[#cb9f5a]/10 transition-all cursor-pointer font-sans"
                      >
                        🗺️ Drag Pin on Live Map
                      </button>
                    </div>
                  </div>
                  {form.gpsCoords && (
                    <div className="flex items-center gap-2 mt-2 bg-white border border-emerald-500/20 rounded-xl px-3 py-1.5 text-2xs font-bold text-emerald-700">
                      <span>✓ GPS Coordinates Captured:</span>
                      <span className="font-mono">{form.gpsCoords}</span>
                    </div>
                  )}
                </div>
              </div>

              <Field
                label="Google Maps Location URL (Optional)"
                value={form.mapsLink}
                onChange={(v) => setForm({ ...form, mapsLink: v })}
                placeholder="e.g. https://maps.app.goo.gl/..."
              />
              <Field
                label="City"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
              />
              <div className="sm:col-span-2">
                <Field
                  label="Special Instructions (optional)"
                  value={form.notes}
                  onChange={(v) => setForm({ ...form, notes: v })}
                  placeholder="Pets at home, ring twice…"
                  textarea
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-5">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Select Date
                  </div>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-[#cb9f5a]/20 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#cb9f5a] outline-none cursor-pointer shadow-sm"
                  />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Select Time Slot
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {slots.map((s) => (
                      <button
                        key={s}
                        onClick={() => setForm({ ...form, time: s })}
                        className={`rounded-xl border px-2 py-2 text-2xs font-bold transition-all cursor-pointer ${form.time === s ? "border-[#cb9f5a] gradient-gold text-navy shadow-gold" : "border-[#cb9f5a]/20 bg-white text-slate-800 hover:border-[#cb9f5a] hover:bg-slate-50/50"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Coupon Code
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={form.coupon}
                      onChange={(e) => setForm({ ...form, coupon: e.target.value })}
                      placeholder="Try WELCOME500"
                      className="flex-1 rounded-xl border border-[#cb9f5a]/20 bg-white px-4 py-3 text-xs font-semibold outline-none text-slate-800 placeholder:text-slate-400 shadow-sm"
                    />
                    <button
                      onClick={applyCoupon}
                      className="rounded-xl gradient-gold px-5 text-xs font-bold text-navy shadow-gold cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>

                  {/* Clickable Available Coupons list */}
                  {availableCoupons.length > 0 && (
                    <div className="mt-2.5">
                      <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                        Available Offers
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableCoupons
                          .filter((c) => {
                            const today = new Date().toISOString().split("T")[0];
                            return c.isActive && c.expiryDate >= today;
                          })
                          .map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={async () => {
                                // Set coupon code in form
                                setForm((f) => ({ ...f, coupon: c.code }));
                                // Auto-apply coupon
                                try {
                                  const result = await validateCoupon(c.code, total);
                                  setDiscount(result.discount);
                                  toast.success(`Coupon applied — ₹${result.discount} OFF!`, {
                                    icon: "🎉",
                                  });
                                } catch (err: any) {
                                  setDiscount(0);
                                  toast.error(err.message || "Failed to apply coupon");
                                }
                              }}
                              className={`inline-flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-all hover:scale-[1.01] active:scale-95 ${
                                form.coupon === c.code
                                  ? "border-emerald-500 bg-emerald-500/10 shadow-sm font-bold text-emerald-800"
                                  : "border-[#cb9f5a]/25 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl cursor-pointer"
                              }`}
                            >
                              <span className="font-mono text-xs font-bold text-[#cb9f5a]">
                                {c.code}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-400 mt-0.5">
                                Save ₹{c.discount} (Min. ₹{c.minAmount})
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-2xs font-bold text-emerald-700 border border-emerald-500/25">
                      <Zap className="h-3 w-3 text-emerald-500" /> Saved ₹{discount}
                    </div>
                  )}
                </div>
                {/* Refer & Earn Wallet Balance Application Box */}
                {userWalletBalance > 0 && (
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Referral Wallet Credit
                    </div>
                    <div className="mt-2 rounded-2xl border border-[#cb9f5a]/30 bg-gradient-to-r from-[#cb9f5a]/10 to-[#002a22]/5 p-4 space-y-2 font-sans">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#002a22] text-[#cb9f5a] font-bold text-sm shadow-sm">
                            🎁
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-[#002a22]">
                              Apply Referral Wallet Credit
                            </h5>
                            <p className="text-[10px] text-slate-500 font-semibold">
                              Available Balance: <strong className="text-[#cb9f5a]">₹{userWalletBalance}</strong>
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={useWalletCredit}
                            onChange={(e) => setUseWalletCredit(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#cb9f5a]"></div>
                        </label>
                      </div>
                      {useWalletCredit && (
                        <div className="text-[10px] font-bold text-emerald-700 bg-white/80 border border-emerald-500/20 rounded-xl px-3 py-1.5 flex items-center justify-between">
                          <span>✓ Wallet Credit Applied:</span>
                          <span>− ₹{appliedWalletCredit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Payment Method
                  </div>
                  <div className="mt-2 rounded-2xl border border-[#cb9f5a]/30 bg-[#cb9f5a]/5 p-4 flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-xl gradient-gold text-navy font-bold shadow-gold">
                      💳
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-[#002a22]">
                        UPI / Cards / Netbanking (Online Payment)
                      </h5>
                      <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
                        Pay upfront deposit online via Razorpay test gateway to secure your slots.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <aside className="h-fit rounded-2xl border border-[#cb9f5a]/25 bg-white p-5 shadow-sm">
                <div className="font-display text-base font-extrabold uppercase tracking-wider text-[#002a22] border-b border-[#cb9f5a]/10 pb-2">
                  Order Summary
                </div>
                <ul className="mt-3 space-y-2 text-xs font-semibold">
                  {cart.map((i) => (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span className="truncate text-slate-500">
                        {i.title} × {i.qty}
                      </span>
                      <span className="font-bold text-[#002a22]">₹{i.price * i.qty}</span>
                    </li>
                  ))}
                </ul>
                <div className="my-3 h-px bg-[#cb9f5a]/10" />
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#002a22]">₹{total}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-emerald-700">
                    <span>Discount</span>
                    <span className="font-bold text-emerald-700">− ₹{discount}</span>
                  </div>
                )}
                {appliedWalletCredit > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-emerald-700 mt-1">
                    <span>🎁 Wallet Credit</span>
                    <span className="font-bold text-emerald-700">− ₹{appliedWalletCredit}</span>
                  </div>
                )}
                <div className="mt-3 flex justify-between border-t border-[#cb9f5a]/10 pt-3 text-sm">
                  <span className="font-bold text-[#002a22]">Grand Total</span>
                  <span className="font-bold text-[#cb9f5a]">₹{finalTotal}</span>
                </div>
                <div className="mt-3 flex justify-between rounded-xl bg-[#cb9f5a]/10 p-3 border border-[#cb9f5a]/20 text-[#002a22]">
                  <div className="text-left">
                    <span className="block text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
                      Upfront Pay
                    </span>
                    <span className="font-display text-base font-black text-[#cb9f5a]">
                      ₹{upfrontPayAmount}
                    </span>
                  </div>
                  <div className="text-right border-l border-[#cb9f5a]/20 pl-3">
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">
                      Pay post-service
                    </span>
                    <span className="text-xs font-extrabold text-slate-650">
                      ₹{payLaterAmount}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[9px] text-center text-emerald-600 font-bold uppercase tracking-wider">
                  🛡️ Pay upfront amount online to secure slots
                </div>
              </aside>
            </div>
          )}
        </div>

        {!success && !showAuthGate && !showOtpVerification && (
          <div className="flex items-center justify-between border-t border-[#cb9f5a]/15 bg-white px-6 py-4.5">
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                {step === 1 ? "Subtotal" : "Upfront Payment"}
              </span>
              <span className="font-display text-lg sm:text-xl font-black text-[#002a22]">
                ₹{step === 1 ? total : upfrontPayAmount}
              </span>
            </div>
            
            {step === 1 ? (
              <button
                disabled={!canStep2 || mobileOtpLoading}
                onClick={() => {
                  if (otpVerified) {
                    setStep(2);
                  } else {
                    handleSendMobileOtp();
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#cb9f5a] via-[#e5be7a] to-[#cb9f5a] px-8 py-3 text-xs font-black uppercase tracking-wider text-[#002a22] shadow-[0_4px_15px_rgba(203,159,90,0.35)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 font-sans cursor-pointer"
              >
                {mobileOtpLoading ? "Sending OTP..." : "Continue"} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                disabled={isPaying}
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#cb9f5a] via-[#e5be7a] to-[#cb9f5a] px-8 py-3 text-xs font-black uppercase tracking-wider text-[#002a22] shadow-[0_4px_15px_rgba(203,159,90,0.35)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 font-sans cursor-pointer"
              >
                {isPaying ? "Processing..." : "Confirm & Pay"}{" "}
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* CHECKOUT MAP PICKER MODAL */}
        <MapPickerModal
          open={checkoutMapPickerOpen}
          initialLat={
            form.gpsCoords && form.gpsCoords.includes(",")
              ? parseFloat(form.gpsCoords.split(",")[0])
              : null
          }
          initialLng={
            form.gpsCoords && form.gpsCoords.includes(",")
              ? parseFloat(form.gpsCoords.split(",")[1])
              : null
          }
          onClose={() => setCheckoutMapPickerOpen(false)}
          onConfirmLocation={(data) => {
            setForm((f) => ({
              ...f,
              address: data.address || f.address,
              landmark: data.landmark || f.landmark,
              pincode: data.pincode || f.pincode,
              gpsCoords: `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`,
              mapsLink: data.mapsLink,
            }));
            const activeEmail = sessionStorage.getItem("user_email");
            const keySuffix = activeEmail ? `_${activeEmail.toLowerCase().trim()}` : "";
            const addrVal = data.address || data.landmark;
            sessionStorage.setItem("user_location_address", addrVal);
            if (keySuffix) {
              sessionStorage.setItem(`user_location_address${keySuffix}`, addrVal);
              sessionStorage.setItem(`user_location_lat${keySuffix}`, String(data.lat));
              sessionStorage.setItem(`user_location_lng${keySuffix}`, String(data.lng));
            }
            sessionStorage.setItem("user_location_lat", String(data.lat));
            sessionStorage.setItem("user_location_lng", String(data.lng));
            window.dispatchEvent(new Event("location-updated"));
            toast.success("Exact doorstep location pinned to your booking!", { icon: "📍" });
          }}
        />
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

function CategoryCarousel({
  category,
  onSelectService,
  onAddToCart,
  getServicePrice,
  liveReviews = [],
}: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const getServiceRating = (id: string) => {
    const svcReviews = liveReviews.filter((r) => r.serviceId === id);
    if (svcReviews.length > 0) {
      const avg = svcReviews.reduce((acc, r) => acc + r.rating, 0) / svcReviews.length;
      return avg.toFixed(2);
    }
    const charCodeSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const ratingVal = 4.5 + (charCodeSum % 51) * 0.01;
    return ratingVal.toFixed(2);
  };

  if (!category.services || category.services.length === 0) return null;

  return (
    <div className="relative mx-auto max-w-[1400px] px-5 py-4 lg:px-8">
      {/* Carousel Wrapper */}
      <div className="group/carousel relative">
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#002a22] hover:bg-[#cb9f5a] text-white hover:text-[#002a22] transition-all hover:scale-105 opacity-0 group-hover/carousel:opacity-100 cursor-pointer shadow-md border border-[#cb9f5a]/30 focus:outline-none"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#002a22] hover:bg-[#cb9f5a] text-white hover:text-[#002a22] transition-all hover:scale-105 opacity-0 group-hover/carousel:opacity-100 cursor-pointer shadow-md border border-[#cb9f5a]/30 focus:outline-none"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-5 scrollbar-none scroll-smooth snap-x snap-mandatory px-4 -mx-4 md:px-0 md:mx-0"
        >
          {category.services.map((s) => {
            const rating = getServiceRating(s.id);
            const numStars = Math.round(parseFloat(rating));
            return (
              <TiltCard
                key={s.id}
                onClick={() => onSelectService(s)}
                className="relative min-w-[260px] sm:min-w-[280px] md:min-w-[300px] flex flex-col rounded-none overflow-hidden snap-start select-none bg-white border border-[#cb9f5a]/15 group/card cursor-pointer"
              >
                {/* Top Half: Image */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={s.image || s.img}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  />
                  {/* Rating Badge Overlay */}
                  <div className="absolute top-3 left-3 bg-[#002a22]/90 backdrop-blur-md border border-[#cb9f5a]/40 px-2.5 py-1 rounded-none text-[10px] font-black text-[#cb9f5a] flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3 fill-[#cb9f5a] text-[#cb9f5a]" />
                    <span>{rating}</span>
                  </div>
                </div>

                {/* Bottom Half: Card Details */}
                <div className="flex-1 p-5 flex flex-col justify-between font-sans bg-white">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#002a22] group-hover/card:text-[#cb9f5a] transition-colors leading-tight">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {s.desc}
                    </p>
                    
                    {/* Stars visual display */}
                    <div className="flex items-center gap-0.5 mt-2.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < numStars ? "fill-amber-500" : "text-slate-200"}`}
                        />
                      ))}
                      <span className="text-[10px] text-slate-400 font-bold ml-1">({rating})</span>
                    </div>

                    {/* Inclusions list */}
                    {s.sub && s.sub.length > 0 && (
                      <div className="mt-3.5 space-y-1.5 border-t border-slate-100/70 pt-3">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          What's Included:
                        </span>
                        <div className="space-y-1">
                          {s.sub.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-650 font-semibold leading-normal">
                              <span className="text-[#cb9f5a] font-black mt-0.5">✓</span>
                              <span className="truncate">{item}</span>
                            </div>
                          ))}
                          {s.sub.length > 3 && (
                            <span className="text-[9px] text-[#cb9f5a] font-bold block mt-0.5">
                              + {s.sub.length - 3} more features
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                    <div className="flex items-center justify-between sm:flex-col sm:items-start shrink-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">
                        Starts at
                      </span>
                      <span className="font-display text-sm font-black text-[#002a22]">
                        ₹{getServicePrice(s.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectService(s);
                        }}
                        className="flex-1 sm:flex-none text-center px-3.5 py-1.5 border border-[#cb9f5a]/30 hover:border-[#cb9f5a] hover:bg-[#cb9f5a]/5 text-[10px] font-bold rounded-none text-[#002a22] bg-white transition-all shadow-3xs cursor-pointer"
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(s);
                        }}
                        className="flex-1 sm:flex-none text-center px-4 py-1.5 rounded-none bg-[#002a22] hover:bg-[#cb9f5a] text-white hover:text-[#002a22] text-[10px] font-bold uppercase transition-all shadow-md cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  title: string;
  location: string;
}

export function BeforeAfterSlider({ before, after, title, location }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 to 100)
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  };

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
      className="relative overflow-hidden aspect-[4/3] w-full border border-[#cb9f5a]/20 select-none rounded-none group shadow-sm bg-slate-900"
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
          style={{ width: containerRef.current?.getBoundingClientRect().width || "100%" }}
        />
      </div>

      {/* Vertical Slider Handle Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-[#cb9f5a] shadow-[0_0_15px_rgba(203,159,90,0.85)] z-20 cursor-ew-resize flex items-center justify-center"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* Grab Circle */}
        <div className="h-8 w-8 rounded-full bg-white border border-[#cb9f5a] shadow-lg flex items-center justify-center pointer-events-none select-none">
          <span className="text-[#002a22] text-xs font-black select-none">↔</span>
        </div>
      </div>

      {/* Before / After Badges */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[8px] font-black tracking-wider text-white border border-white/10 uppercase z-30 rounded-none select-none pointer-events-none">
        Before
      </div>
      <div className="absolute top-3 right-3 bg-[#cb9f5a] px-2 py-0.5 text-[8px] font-black tracking-wider text-[#002a22] z-30 rounded-none select-none pointer-events-none">
        After
      </div>

      {/* Label Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10 pointer-events-none text-white">
        <h3 className="font-display text-xs font-bold text-white leading-tight">{title}</h3>
        <p className="text-[9px] text-[#cb9f5a] font-extrabold mt-0.5">{location}</p>
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
