import {
  Sparkles,
  Wrench,
  Clock,
  Leaf,
  Shield,
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
  BadgeCheck,
  Car,
  Utensils,
  Home as HomeIcon,
} from "lucide-react";

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
import type { AdminCatalog, ServicePlan } from "@/api/admin-api";

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

export function getCategoryIcon(id: string) {
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
  tagline?: string;
  emoji: string;
  image?: string;
  parentId?: string | null;
  includes?: string[];
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

export const FURNISHED_SERVICES: CatService[] = [
  {
    "id": "1bhk-furnished",
    "title": "1 BHK Furnished Deep Cleaning",
    "price": 1499,
    "desc": "Complete top-to-bottom deep sanitization and cleaning for a 1 BHK furnished apartment including bedroom, living hall, kitchen, bathroom, balcony, furniture dusting and exterior appliance wipedown.",
    "img": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "Full bedroom dusting, cobweb removal & dry vacuuming",
      "Living room sofa & furniture surface wipe down",
      "Kitchen countertop, sink, tiles & outer cabinet degreasing",
      "Bathroom descaling, sanitization & floor scrubbing",
      "Balcony wash & window glass wipe down"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 1499,
        "duration": "2 - 3 hours",
        "excludes": [
          "Interior cabinet/wardrobe cleaning",
          "Appliance interior cleaning",
          "Sofa or carpet shampooing"
        ],
        "includes": [
          "Deep dusting of all rooms",
          "Floor scrubbing & wet mopping",
          "Bathroom deep cleaning (WC, tiles, basin)",
          "Kitchen slab, tiles, sink & stove wipe down"
        ],
        "description": "Standard deep dusting, manual floor scrub, bathroom & kitchen sanitize for 1 BHK furnished home."
      },
      {
        "name": "Classic",
        "price": 2199,
        "duration": "3 - 4 hours",
        "excludes": [
          "Appliance interior cleaning",
          "Sofa shampooing"
        ],
        "includes": [
          "All Express features",
          "Single disc machine floor scrubbing",
          "Window tracks & grill cleaning",
          "Kitchen chimney exterior degreasing",
          "Balcony power wash"
        ],
        "description": "Comprehensive deep clean with single-disc machine floor scrubbing, window channels & appliance exteriors."
      },
      {
        "name": "Premium",
        "price": 2999,
        "duration": "4 - 5 hours",
        "excludes": [
          "Moving excessively heavy structural fixtures"
        ],
        "includes": [
          "All Classic features",
          "Steam disinfection of bathrooms & kitchen",
          "Inside empty wardrobe & cabinet wiping",
          "Furniture polish & surface protection"
        ],
        "description": "Elite clinical-grade deep clean with inside cabinet sanitization (if empty) and steam disinfections."
      }
    ],
    "disclaimer": "Please ensure all valuables are removed or securely stored before our professionals arrive.",
    "requirements": "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for height reach."
  },
  {
    "id": "2bhk-furnished",
    "title": "2 BHK Furnished Deep Cleaning",
    "price": 2199,
    "desc": "Comprehensive hotel-grade deep clean for a 2 BHK furnished flat covering 2 bedrooms, hall, kitchen, 2 bathrooms, balconies, furniture and fixtures.",
    "img": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "Deep dusting of 2 bedrooms, living room & dining area",
      "Complete sanitization of up to 2 bathrooms",
      "Kitchen countertops, stove, tiles & sink scrub",
      "Floor scrubbing and mopping across all rooms",
      "Balconies, doors, windows & switchboards detailing"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 2199,
        "duration": "3 - 4 hours",
        "excludes": [
          "Interior cabinet cleaning",
          "Sofa shampooing"
        ],
        "includes": [
          "Deep dusting of 2 bedrooms & hall",
          "2 Bathrooms intensive sanitization",
          "Kitchen countertop & tiles degreasing",
          "Balcony & window cleaning"
        ],
        "description": "Standard deep dusting, floor scrub, bathroom & kitchen sanitize for 2 BHK furnished flat."
      },
      {
        "name": "Classic",
        "price": 3199,
        "duration": "4 - 5 hours",
        "excludes": [
          "Sofa shampooing"
        ],
        "includes": [
          "All Express features",
          "Single disc floor scrubbing",
          "Window channels & glass deep clean",
          "Kitchen chimney exterior & tile steam wipe"
        ],
        "description": "Detailed 2 BHK deep clean with machine floor buffing, window tracks & appliances exterior."
      },
      {
        "name": "Premium",
        "price": 4299,
        "duration": "5 - 6 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Steam sanitization across all rooms",
          "Inside wardrobe & cabinet wipedown",
          "Furniture protection coat"
        ],
        "description": "Ultra-luxury deep clean with complete steam sterilization, empty wardrobe interiors & finish polish."
      }
    ],
    "disclaimer": "Please ensure all valuables are removed or securely stored before our professionals arrive.",
    "requirements": "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for height reach."
  },
  {
    "id": "3bhk-furnished",
    "title": "3 BHK Furnished Deep Cleaning",
    "price": 2899,
    "desc": "All-inclusive deep cleaning and sanitization for 3 BHK furnished apartments including 3 bedrooms, large living hall, kitchen, up to 3 bathrooms & balconies.",
    "img": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "3 Bedrooms + Living room deep dusting & vacuuming",
      "Up to 3 Bathrooms intensive sanitization & descaling",
      "Kitchen slab, sink, tiles & cabinets outer degreasing",
      "Full floor scrubbing, balconies & window tracks detailing"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 2899,
        "duration": "4 - 5 hours",
        "excludes": [
          "Interior cabinet cleaning"
        ],
        "includes": [
          "3 Bedrooms + Living room deep dusting",
          "Up to 3 Bathrooms intensive clean",
          "Kitchen slab, sink, tiles degreasing",
          "Floors scrubbing & mopping"
        ],
        "description": "Deep cleaning of 3 bedrooms, hall, kitchen and up to 3 bathrooms."
      },
      {
        "name": "Classic",
        "price": 4199,
        "duration": "5 - 6 hours",
        "excludes": [
          "Sofa shampooing"
        ],
        "includes": [
          "All Express features",
          "Machine floor scrubbing",
          "Detailed window tracks & glass wipe",
          "Balcony deep washing"
        ],
        "description": "Intensive 3 BHK deep clean with machine floor scrubbing and detailed window tracks."
      },
      {
        "name": "Premium",
        "price": 5499,
        "duration": "6 - 7 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Steam treatment for kitchen & washrooms",
          "Empty wardrobe & kitchen cabinet interiors",
          "Eco-safe germicidal polish"
        ],
        "description": "Hospitality-grade sterilization for entire 3 BHK with steam treatment & wardrobe wipedowns."
      }
    ],
    "disclaimer": "Please ensure all valuables are removed or securely stored before our professionals arrive.",
    "requirements": "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for height reach."
  },
  {
    "id": "4bhk-furnished",
    "title": "4 BHK / Duplex Furnished Deep Cleaning",
    "price": 3799,
    "desc": "Large-scale deep cleaning tailored for expansive 4 BHK flats and duplex apartments with multi-bathroom sanitation and high-reach cleaning.",
    "img": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "4 Bedrooms & grand hall complete dusting",
      "Up to 4 Bathrooms intensive clinical scrub",
      "Heavy kitchen degreasing & tile steam wash",
      "Floor machine scrubbing and multi-balcony cleaning"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 3799,
        "duration": "5 - 6 hours",
        "excludes": [
          "Interior cabinet cleaning"
        ],
        "includes": [
          "4 Bedrooms + spacious hall deep dusting",
          "Up to 4 Bathrooms deep sanitized",
          "Kitchen counters, tiles & sink scrub",
          "Floor cleaning & mopping"
        ],
        "description": "Complete deep cleaning for 4 BHK flats & duplex living spaces."
      },
      {
        "name": "Classic",
        "price": 5399,
        "duration": "6 - 7 hours",
        "excludes": [],
        "includes": [
          "All Express features",
          "Machine floor scrubbing",
          "All window rails & balcony washing",
          "Appliance exterior polish"
        ],
        "description": "High-power machine scrub and comprehensive 4 BHK detailing."
      },
      {
        "name": "Premium",
        "price": 6999,
        "duration": "7 - 8 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Steam disinfection throughout",
          "Inside empty wardrobe & cabinet clean",
          "Full surface sealant & protection"
        ],
        "description": "Full luxury overhaul with steam disinfection and modular cabinet detailing."
      }
    ],
    "disclaimer": "Please ensure all valuables are removed or securely stored before our professionals arrive.",
    "requirements": "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for height reach."
  },
  {
    "id": "5bhk-furnished",
    "title": "5 BHK+ Luxury Furnished Deep Cleaning",
    "price": 4899,
    "desc": "Comprehensive deep cleaning engineered for grand 5 BHK+ homes, penthouses and sprawling apartments with dedicated specialist crews.",
    "img": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "5+ Bedrooms and sprawling hall detailing",
      "All bathrooms clinical sanitization & descaling",
      "Full modular kitchen deep degreasing",
      "Machine floor polishing & terrace/balcony power wash"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 4899,
        "duration": "6 - 7 hours",
        "excludes": [],
        "includes": [
          "5+ Bedrooms and living areas dusted",
          "All bathrooms deep sanitized",
          "Kitchen counters, sink and tiles scrubbed",
          "Floor mopping & balcony wash"
        ],
        "description": "Deep cleaning across 5 bedrooms, living rooms and multiple bathrooms."
      },
      {
        "name": "Classic",
        "price": 6899,
        "duration": "7 - 8 hours",
        "excludes": [],
        "includes": [
          "All Express features",
          "Single disc machine floor scrub",
          "All windows, sliders and balcony wash"
        ],
        "description": "Heavy-duty machine scrub and complete architectural detailing."
      },
      {
        "name": "Premium",
        "price": 8899,
        "duration": "8 - 10 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Full steam disinfection",
          "Inside modular cabinet detailing",
          "High-reach fixtures & chandeliers dusting"
        ],
        "description": "Ultimate penthouse & luxury flat overhaul with steam treatment and premium protective finishes."
      }
    ],
    "disclaimer": "Please ensure all valuables are removed or securely stored before our professionals arrive.",
    "requirements": "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for height reach."
  }
];

export const VACANT_SERVICES: CatService[] = [
  {
    "id": "1bhk-vacant",
    "title": "1 BHK Vacant / Empty Flat Deep Cleaning",
    "price": 1199,
    "desc": "Specialized deep cleaning for empty 1 BHK flats before shifting or post-tenant move-out. Includes inside-out wardrobe & cabinet cleaning, tile scrubbing and window track detailing.",
    "img": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "Inside & outside cleaning of all empty wardrobes & kitchen cabinets",
      "Intensive bathroom descaling & tile stain removal",
      "Kitchen platform, sink, chimney & exhaust deep clean",
      "Window tracks, glass & balcony deep wash",
      "Floor scrubbing to remove paint specks & stubborn grime"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 1199,
        "duration": "2 - 3 hours",
        "excludes": [
          "Heavy paint stain removal",
          "Steam sterilization"
        ],
        "includes": [
          "Dry & wet floor scrubbing",
          "1 Bathroom descaling & sanitation",
          "Kitchen platform & sink wash",
          "Inside empty wardrobe dust wipedown"
        ],
        "description": "Basic move-in wipe down, floor mopping and bathroom sanitization for empty 1 BHK flat."
      },
      {
        "name": "Classic",
        "price": 1799,
        "duration": "3 - 4 hours",
        "excludes": [],
        "includes": [
          "Machine floor scrubbing",
          "All empty cabinets washed inside-out",
          "Window tracks & balcony power wash",
          "Bathroom deep descaling"
        ],
        "description": "Complete move-in deep cleaning with machine floor scrub and inside-out cabinet detailing."
      },
      {
        "name": "Premium",
        "price": 2499,
        "duration": "4 - 5 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Steam disinfection in bathroom & kitchen",
          "Paint & cement speck removal",
          "Protective sealant application"
        ],
        "description": "Sanitized handover deep clean with steam sterilization and germicidal treatment."
      }
    ],
    "disclaimer": "Please ensure water and electricity connections are active in the vacant flat before service.",
    "requirements": "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool."
  },
  {
    "id": "2bhk-vacant",
    "title": "2 BHK Vacant / Empty Flat Deep Cleaning",
    "price": 1699,
    "desc": "Move-in / move-out deep clean for empty 2 BHK flats. Detailed cleaning of empty modular cabinets, wardrobes, kitchen, 2 bathrooms and windows.",
    "img": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "Inside-out wipedown of all empty wardrobes, lofts & kitchen cabinets",
      "2 Bathrooms intensive descaling & fixtures polish",
      "Window glass, tracks, grills & balconies power wash",
      "Floor machine scrub to eliminate dust, grime & minor paint marks"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 1699,
        "duration": "3 - 4 hours",
        "excludes": [
          "Machine floor scrub"
        ],
        "includes": [
          "Dry & wet floor scrubbing",
          "2 Bathrooms descaling",
          "Kitchen counters & sink wash",
          "Inside wardrobe wipe"
        ],
        "description": "Standard vacant flat cleaning for 2 BHK covering all empty rooms and 2 bathrooms."
      },
      {
        "name": "Classic",
        "price": 2599,
        "duration": "4 - 5 hours",
        "excludes": [],
        "includes": [
          "Machine floor scrub across all rooms",
          "Inside-out empty cabinet washing",
          "Window channels & balcony deep clean"
        ],
        "description": "Thorough move-in preparation with machine floor scrub and cabinet inside-out wash."
      },
      {
        "name": "Premium",
        "price": 3499,
        "duration": "5 - 6 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Steam disinfection in kitchen & washrooms",
          "Cement/paint mark removal",
          "High-gloss surface finish"
        ],
        "description": "Hospitality-grade sanitized handover with full steam disinfection."
      }
    ],
    "disclaimer": "Please ensure water and electricity connections are active in the vacant flat before service.",
    "requirements": "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool."
  },
  {
    "id": "3bhk-vacant",
    "title": "3 BHK Vacant / Empty Flat Deep Cleaning",
    "price": 2299,
    "desc": "Complete move-in / move-out deep cleaning for unfurnished 3 BHK flats. Full sanitation of 3 bedrooms, hall, kitchen, up to 3 bathrooms & balconies.",
    "img": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "All empty bedroom wardrobes, lofts & cabinets cleaned inside & out",
      "Up to 3 Bathrooms deep descaling, wall tiles & fixtures scrubbing",
      "Kitchen modular units, sink, tiles & exhaust deep clean",
      "Machine floor scrub & balcony wash across entire 3 BHK"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 2299,
        "duration": "4 - 5 hours",
        "excludes": [
          "Machine scrub"
        ],
        "includes": [
          "Manual floor scrub & mopping",
          "Up to 3 Bathrooms descaling",
          "Kitchen tiles & sink wash",
          "Empty wardrobe dust wipe"
        ],
        "description": "Move-in clean for empty 3 BHK including all rooms, cabinets and up to 3 bathrooms."
      },
      {
        "name": "Classic",
        "price": 3399,
        "duration": "5 - 6 hours",
        "excludes": [],
        "includes": [
          "Single disc machine floor scrub",
          "All empty cabinets washed inside-out",
          "Detailed window rails & balconies power wash"
        ],
        "description": "Intensive vacant 3 BHK deep clean with machine floor scrub and complete cabinet wash."
      },
      {
        "name": "Premium",
        "price": 4599,
        "duration": "6 - 7 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Steam disinfection in all bathrooms & kitchen",
          "Paint & glue residue removal",
          "Germicidal air and surface treatment"
        ],
        "description": "Elite move-in sanitation package with steam sterilization throughout."
      }
    ],
    "disclaimer": "Please ensure water and electricity connections are active in the vacant flat before service.",
    "requirements": "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool."
  },
  {
    "id": "4bhk-vacant",
    "title": "4 BHK Vacant / Empty Flat Deep Cleaning",
    "price": 2999,
    "desc": "Heavy-duty move-in / move-out deep cleaning for spacious 4 BHK empty flats and duplexes.",
    "img": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "Inside-out sanitization of all empty wardrobes, modular drawers & cabinets",
      "Up to 4 Bathrooms clinical descaling & tile grout brightening",
      "High-power machine floor scrubbing across all rooms",
      "Balconies, sliding glass windows & high fixtures detailing"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 2999,
        "duration": "5 - 6 hours",
        "excludes": [
          "Machine scrub"
        ],
        "includes": [
          "Floor scrubbing & mopping",
          "Up to 4 Bathrooms descaling",
          "Kitchen modular units wiped",
          "Empty wardrobes dusted"
        ],
        "description": "Standard vacant cleaning for large 4 BHK flats & duplexes."
      },
      {
        "name": "Classic",
        "price": 4399,
        "duration": "6 - 7 hours",
        "excludes": [],
        "includes": [
          "Machine floor scrub",
          "Inside-out washing of all cabinets & wardrobes",
          "Window frames & balconies power wash"
        ],
        "description": "Intensive machine scrub and complete inside-out empty modular detailing."
      },
      {
        "name": "Premium",
        "price": 5799,
        "duration": "7 - 8 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Full steam disinfection",
          "Paint & cement speck cleanup",
          "Protective tile & glass sealant"
        ],
        "description": "Ultimate move-in handover with full steam treatment and deep sanitization."
      }
    ],
    "disclaimer": "Please ensure water and electricity connections are active in the vacant flat before service.",
    "requirements": "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool."
  },
  {
    "id": "5bhk-vacant",
    "title": "5 BHK Vacant / Empty Flat Deep Cleaning",
    "price": 3799,
    "desc": "Large-scale empty penthouse and 5 BHK+ apartment deep cleaning with dedicated specialist crew.",
    "img": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "Complete inside-out wash of all 5+ room wardrobes, lofts & cabinets",
      "Clinical sanitization of all washrooms & kitchen spaces",
      "Machine floor buffing, terrace, utility & balcony power wash"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 3799,
        "duration": "6 - 7 hours",
        "excludes": [
          "Machine scrub"
        ],
        "includes": [
          "Floor scrub & mopping",
          "All bathrooms descaling",
          "Kitchen wash & wardrobe dusting"
        ],
        "description": "Standard vacant clean for 5 BHK+ expansive homes."
      },
      {
        "name": "Classic",
        "price": 5499,
        "duration": "7 - 8 hours",
        "excludes": [],
        "includes": [
          "Machine floor scrub",
          "All empty units washed inside-out",
          "Sliders, windows & balconies wash"
        ],
        "description": "Heavy-duty machine scrub and complete architectural detailing."
      },
      {
        "name": "Premium",
        "price": 7299,
        "duration": "8 - 10 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Full steam sterilization",
          "Paint/cement stain elimination",
          "Complete germicidal seal"
        ],
        "description": "Full steam sterilization and luxury handover overhaul."
      }
    ],
    "disclaimer": "Please ensure water and electricity connections are active in the vacant flat before service.",
    "requirements": "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool."
  }
];

export const VILLA_SERVICES: CatService[] = [
  {
    "id": "villa-duplex",
    "title": "Duplex / Multi-Floor Villa Deep Cleaning",
    "price": 7999,
    "desc": "Specialized deep cleaning for duplex and triplex villas focusing on staircases, double-height ceilings, multiple washrooms, balconies and living areas.",
    "img": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "Double-height living area & ceiling fixture dusting",
      "Multi-floor staircase, glass railings & landing areas scrub",
      "All bathrooms clinical descaling & modular kitchen degreasing",
      "Machine floor polishing across lower and upper levels"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 7999,
        "duration": "6 - 8 hours",
        "excludes": [
          "Machine scrub"
        ],
        "includes": [
          "Both floors dusted and mopped",
          "All bathrooms sanitized",
          "Kitchen deep cleaned",
          "Staircases wiped"
        ],
        "description": "Standard duplex deep cleaning covering both floors, staircase and bathrooms."
      },
      {
        "name": "Classic",
        "price": 11499,
        "duration": "8 - 10 hours",
        "excludes": [],
        "includes": [
          "Machine floor scrub across both levels",
          "Terrace & balcony power wash",
          "Double-height window & chandelier dusting"
        ],
        "description": "Machine floor scrubbing, terrace & balcony power wash for duplexes."
      },
      {
        "name": "Premium",
        "price": 15499,
        "duration": "10 - 12 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Steam disinfection throughout",
          "Inside empty wardrobe detailing",
          "High-gloss stone sealant"
        ],
        "description": "Elite duplex overhaul with full steam sterilization and protective finishing."
      }
    ],
    "disclaimer": "Please ensure adequate water supply and access to electrical points on each floor.",
    "requirements": "Customers are requested to provide buckets with water, power points, and a ladder or stool for height reach."
  },
  {
    "id": "villa-large",
    "title": "Large Luxury Villa / Bungalow (3500 - 5000+ sq ft)",
    "price": 9499,
    "desc": "Ultra-luxury deep sanitization and cleaning for expansive bungalows, sprawling estates and grand luxury villas (3,500 to 5,000+ sq.ft) with specialist supervisor & crew.",
    "img": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "Complete estate deep cleaning across all floors and annexes",
      "Clinical-grade sanitization for 5+ washrooms",
      "Heavy kitchen & pantry degreasing",
      "Terrace, external balconies, portico, driveway & boundary wash",
      "Chandelier, glass railings & high-reach architectural detailing"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 9499,
        "duration": "8 - 10 hours",
        "excludes": [
          "Machine floor scrub"
        ],
        "includes": [
          "All rooms dusted & mopped",
          "All bathrooms descaled & sanitized",
          "Kitchen counters & sink scrubbed",
          "Staircases & balconies washed"
        ],
        "description": "Standard large estate deep cleaning covering all primary living spaces."
      },
      {
        "name": "Classic",
        "price": 13999,
        "duration": "10 - 12 hours",
        "excludes": [],
        "includes": [
          "Machine floor scrubbing on all floors",
          "Terrace, driveway & portico power washing",
          "High glass facades & window tracks cleaned"
        ],
        "description": "Industrial machine floor scrubbing, terrace power wash and complete architectural cleaning."
      },
      {
        "name": "Premium",
        "price": 18999,
        "duration": "12 - 14 hours (or 2-day pass)",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Steam sanitization across all bathrooms, kitchens & bedrooms",
          "Modular cabinet inside-out detailing",
          "Protective polish on all premium stones & fixtures"
        ],
        "description": "Ultimate luxury estate overhaul with complete steam sterilization, germicidal treatment & surface sealants."
      }
    ],
    "disclaimer": "Please ensure adequate water supply and access to electrical points on each floor.",
    "requirements": "Customers are requested to provide buckets with water, power points, and a ladder or stool for height reach."
  },
  {
    "id": "villa-medium",
    "title": "Medium Villa / Independent House (2000 - 3500 sq ft)",
    "price": 6499,
    "desc": "Full-scale deep cleaning engineered for large independent villas and bungalows between 2,000 to 3,500 sq.ft with dedicated team and professional machinery.",
    "img": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "Multi-floor deep cleaning across 3-4 bedrooms, living halls & dining",
      "All washrooms descaled, sanitized and polished",
      "Full modular kitchen degreased and steam scrubbed",
      "Staircases, multiple balconies, terrace & garage/portico wash",
      "Facade glass, windows and high ceilings dusting"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 6499,
        "duration": "6 - 8 hours",
        "excludes": [
          "Machine scrub"
        ],
        "includes": [
          "Deep dusting & mopping on all floors",
          "All bathrooms sanitized",
          "Kitchen deep cleaned",
          "Balconies & staircase swept"
        ],
        "description": "Standard multi-floor deep clean for 2000-3500 sq ft villas."
      },
      {
        "name": "Classic",
        "price": 9499,
        "duration": "8 - 10 hours",
        "excludes": [],
        "includes": [
          "Machine floor scrubbing across all levels",
          "Terrace, portico & driveway wash",
          "Window tracks, sliders & grills power cleaned"
        ],
        "description": "Heavy-duty machine floor scrub, terrace washing and high-reach detailing for medium villas."
      },
      {
        "name": "Premium",
        "price": 12499,
        "duration": "10 - 12 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Steam disinfection throughout",
          "Inside empty wardrobe & cabinet detailing",
          "Full surface sealant & chandelier dusting"
        ],
        "description": "Hospitality-grade sterilization with steam treatments and architectural detailing."
      }
    ],
    "disclaimer": "Please ensure adequate water supply and access to electrical points on each floor.",
    "requirements": "Customers are requested to provide buckets with water, power points, and a ladder or stool for height reach."
  },
  {
    "id": "villa-small",
    "title": "Villa / Row House Deep Cleaning (Up to 2000 sq ft)",
    "price": 4499,
    "desc": "Comprehensive multi-floor deep cleaning for independent houses, row houses, and small villas up to 2,000 sq.ft. Includes staircase, portico, balconies, kitchen, bathrooms & living areas.",
    "img": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "sub": [
      "Complete multi-floor deep dusting & floor scrubbing",
      "All bathrooms clinical descaling & sanitization",
      "Modular kitchen deep degreasing & tile scrub",
      "Internal staircase, railings, portico & terrace sweep",
      "Windows, glass sliders & balconies power washing"
    ],
    "paymentType": "full",
    "plans": [
      {
        "name": "Express",
        "price": 4499,
        "duration": "5 - 6 hours",
        "excludes": [
          "Machine floor scrub",
          "Terrace wash"
        ],
        "includes": [
          "All rooms deep dusted & mopped",
          "Bathrooms sanitized",
          "Kitchen counters & sink cleaned",
          "Staircase and portico sweep"
        ],
        "description": "Essential deep cleaning for independent villa/row house up to 2000 sq ft."
      },
      {
        "name": "Classic",
        "price": 6499,
        "duration": "6 - 8 hours",
        "excludes": [],
        "includes": [
          "Machine floor scrub across all floors",
          "Terrace & portico power wash",
          "Window channels & sliders clean",
          "Kitchen & bathroom deep descaling"
        ],
        "description": "Intensive villa clean with single-disc machine floor scrub, terrace wash and window detailing."
      },
      {
        "name": "Premium",
        "price": 8499,
        "duration": "8 - 10 hours",
        "excludes": [],
        "includes": [
          "All Classic features",
          "Steam sterilization across all bathrooms & kitchen",
          "Inside empty wardrobe detailing",
          "High-reach facade and railing polish"
        ],
        "description": "Luxury villa overhaul with full steam sterilization, facade glass wipedown and protective polish."
      }
    ],
    "disclaimer": "Please ensure adequate water supply and access to electrical points on each floor.",
    "requirements": "Customers are requested to provide buckets with water, power points, and a ladder or stool for height reach."
  }
];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "full-house",
    title: "Full House Deep Cleaning",
    tagline: "Top-to-bottom ultra-premium sanitation and deep cleaning engineered for luxury homes.",
    emoji: "🏠",
    image: "/images/full_house.jpg",
    parentId: null,
    includes: ["Furnished", "Vacant", "Bungalow / Villa"],
    services: [...FURNISHED_SERVICES, ...VACANT_SERVICES, ...VILLA_SERVICES],
  },
  {
    id: "furnished",
    title: "Furnished",
    tagline: "Deep cleaning for fully furnished apartments with furniture, wardrobes & appliances.",
    emoji: "🛋️",
    image: "/images/full_house.jpg",
    parentId: "full-house",
    includes: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK+"],
    services: FURNISHED_SERVICES,
  },
  {
    id: "vacant",
    title: "Vacant",
    tagline: "Thorough deep cleaning for empty / unfurnished flats before shifting or post handover.",
    emoji: "📦",
    image: "/images/full_house.jpg",
    parentId: "full-house",
    includes: ["1 BHK Empty", "2 BHK Empty", "3 BHK Empty", "4 BHK Empty", "5 BHK Empty"],
    services: VACANT_SERVICES,
  },
  {
    id: "bungalow-villa",
    title: "Bungalow / Villa",
    tagline: "Comprehensive multi-floor deep sanitation for duplexes, bungalows & independent villas.",
    emoji: "🏡",
    image: "/images/full_house.jpg",
    parentId: "full-house",
    includes: ["Up to 2000 sq.ft", "2000 - 3500 sq.ft", "3500 - 5000+ sq.ft", "Duplex Villa"],
    services: VILLA_SERVICES,
  },
  {
    id: "customized",
    title: "Customized Cleaning Package",
    tagline: "Bespoke, room-by-room professional cleaning tailored entirely to your personal space.",
    emoji: "🛋️",
    image: "/images/customized.jpg",
    parentId: null,
    services: ["sofa", "furniture", "carpet", "mattress", "glass", "fridge", "balcony"].map(
      toCatService,
    ),
  },
  {
    id: "commercial",
    title: "Commercial Post Interior Cleaning",
    tagline: "Elite clinical-grade sanitation for corporate offices, hotels, and post-construction spaces.",
    emoji: "🏢",
    image: "/images/commercial.jpg",
    parentId: null,
    services: ["office", "hotel"].map(toCatService),
  },
];


export const CAT_STORAGE_KEY = "thedeepcleanerz_categories_v1";

// Map the admin server's flat catalog (categories + services with categoryId)
// into the local Category[] shape used by the UI. Falls back to a SERVICES image
// when the admin service id doesn't match a built-in service.
export function mergeAdminCatalog(catalog?: AdminCatalog | null): Category[] {
  if (!catalog || !Array.isArray(catalog.categories) || catalog.categories.length === 0) {
    return DEFAULT_CATEGORIES;
  }

  const fallbackImg = SERVICES[0]?.img ?? "";
  const mapped: Category[] = catalog.categories.map((c) => {
    const services: CatService[] = (catalog.services || [])
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

    // If mapped category has no services, check if it's a parent category with child categories
    const defaultCat = DEFAULT_CATEGORIES.find((dc) => dc.id === c.id);
    let finalServices = services;
    if (services.length === 0) {
      const childCategories = catalog.categories.filter((child) => child.parentId === c.id);
      if (childCategories.length > 0) {
        const childCatIds = childCategories.map((child) => child.id);
        const childServices = (catalog.services || [])
          .filter((s) => childCatIds.includes(s.categoryId))
          .map((s) => {
            const local = SERVICES.find((x) => x.id === s.id);
            return {
              id: s.id,
              title: s.title,
              desc: s.description || local?.desc || "",
              price: s.price,
              img: s.image || local?.img || fallbackImg,
              sub: s.includes && s.includes.length ? s.includes : (local?.sub.map((x) => x.name) ?? []),
              image: s.image,
              plans: s.plans || [],
              disclaimer: s.disclaimer,
              requirements: s.requirements,
              precautions: s.precautions,
            };
          });
        finalServices = childServices.length > 0 ? childServices : (defaultCat?.services || []);
      } else {
        finalServices = defaultCat?.services || [];
      }
    }

    return {
      id: c.id,
      title: c.title || defaultCat?.title || c.id,
      tagline: categoryTagline || defaultCat?.tagline,
      emoji: c.emoji || defaultCat?.emoji || "✨",
      image: categoryImage,
      parentId: c.parentId || null,
      includes: c.includes || defaultCat?.includes || [],
      services: finalServices,
    };
  });

  // Ensure default parent categories are always present
  const resultCats: Category[] = [...mapped];
  DEFAULT_CATEGORIES.forEach((dc) => {
    if (!resultCats.some((rc) => rc.id === dc.id)) {
      resultCats.push(dc);
    }
  });

  return resultCats.sort((a, b) => {
    const order: Record<string, number> = {
      "full-house": 1,
      "customized": 2,
      "commercial": 3,
    };
    const orderA = order[a.id] ?? 99;
    const orderB = order[b.id] ?? 99;
    return orderA - orderB;
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
