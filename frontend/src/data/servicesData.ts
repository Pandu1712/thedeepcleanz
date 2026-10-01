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
  Sparkles,
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
  Shield,
  Leaf,
  Wrench,
  Clock,
  BadgeCheck,
} from "lucide-react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  qty?: number;
  img?: string;
  paymentType?: string;
}

export type PrecautionItem = {
  title: string;
  description: string;
};

export type StaticService = {
  id: string;
  title: string;
  desc: string;
  price: number;
  img: string;
  Icon: typeof HomeIcon;
  sub: { name: string; icon: typeof HomeIcon }[];
};

export type Category = {
  id: string;
  title: string;
  tagline: string;
  emoji: string;
  image?: string;
  parentId?: string | null;
  includes?: string[];
  services?: any[];
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
