import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, memo, useCallback } from "react";
import { toast } from "sonner";
import { ArrowUp } from "lucide-react";

import {
  fetchAdminCatalog,
  fetchAllReviews,
  fetchRecentTransformations,
  fetchCustomizedServices,
  ADMIN_API_URL,
  type RecentTransformation,
  type ServicePlan,
  type AdminCustomizedService,
} from "@/api/admin-api";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import { fastReverseGeocode } from "@/utils/geocoding";
import { GUNTUR_LOCATIONS } from "@/data/homeLocationData";
import {
  DEFAULT_CATEGORIES,
  mergeAdminCatalog,
  SERVICES,
  getServiceIcon,
  CAT_STORAGE_KEY,
  type Category,
  type Service,
  type CatService,
  type CartItem,
} from "@/data/homeServicesData";

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

// Home Section Components
import HomeHeroSection from "@/components/home/HomeHeroSection";
import HomeCategoryCards from "@/components/home/HomeCategoryCards";
import HomeServicesShelf from "@/components/home/HomeServicesShelf";
import HomeWhyChooseUs from "@/components/home/HomeWhyChooseUs";
import HomeReviewsSection from "@/components/home/HomeReviewsSection";
import HomeContactFaqSection from "@/components/home/HomeContactFaqSection";
import HomeFooter from "@/components/home/HomeFooter";

// Modals
import HomeLocationModal from "@/components/home/HomeLocationModal";
import MapPickerModal from "@/components/home/MapPickerModal";
import ReferralModal from "@/components/home/ReferralModal";
import ServiceDetailModal from "@/components/home/ServiceDetailModal";
import BookingModal from "@/components/home/BookingModal";

export { HomeLocationModal, MapPickerModal, ReferralModal, ServiceDetailModal, BookingModal };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      category: typeof search.category === "string" ? search.category : undefined,
      cart: typeof search.cart === "string" ? search.cart : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "TheDeep CleanerZ — Top #1 Deep Cleaning & Sanitization Services in Guntur, AP" },
      {
        name: "description",
        content:
          "TheDeep CleanerZ is Guntur's #1 premier deep cleaning brand. Verified specialists for Full House, Furnished & Vacant Flats, Luxury Villas, Kitchen, Bathroom, Sofa & Commercial Deep Cleaning in Arundelpet, Guntur & AP. Starting ₹499.",
      },
      {
        name: "keywords",
        content:
          "TheDeep CleanerZ, The Deep CleanerZ, deep cleaning services Guntur, home cleaning Guntur, full house cleaning, sofa cleaning, kitchen deep cleaning, bathroom sanitization, villa deep cleaning, commercial cleaning Arundelpet Guntur, best cleaning company Guntur, house sanitization Andhra Pradesh",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "TheDeep CleanerZ — Top #1 Deep Cleaning & Sanitization Services in Guntur, AP" },
      {
        property: "og:description",
        content: "Spotless spaces by trusted cleaning experts. Affordable, reliable, hospital-grade sanitization.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://thedeepcleanerz.in/" },
      { property: "og:image", content: "https://thedeepcleanerz.in/logos/logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TheDeep CleanerZ — Premium Deep Cleaning Services" },
      { name: "twitter:description", content: "Guntur's #1 premier deep cleaning and sanitization experts." },
      { name: "twitter:image", content: "https://thedeepcleanerz.in/logos/logo.png" },
    ],
    links: [
      { rel: "canonical", href: "https://thedeepcleanerz.in/" },
    ],
  }),
  component: Index,
});


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

  const shelfScrollRef = useRef<HTMLDivElement>(null);
  const scrollShelf = (direction: "left" | "right") => {
    if (shelfScrollRef.current) {
      const scrollAmount = 380;
      shelfScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const allShelfServices = useMemo(() => {
    const list: {
      id: string;
      title: string;
      subtext: string;
      image: string;
      action: () => void;
    }[] = [];

    const seen = new Set<string>();

    const getFallbackImage = (title: string = "", id: string = ""): string => {
      const norm = ((title || "") + " " + (id || "")).toLowerCase();
      if (norm.includes("chimney") || norm.includes("kitchen")) return imgKitchen;
      if (norm.includes("bath") || norm.includes("toilet") || norm.includes("restroom")) return imgBathroom;
      if (norm.includes("sofa") || norm.includes("couch") || norm.includes("cushion")) return imgSofa;
      if (norm.includes("furnitur") || norm.includes("table") || norm.includes("chair") || norm.includes("dining")) return imgFurniture;
      if (norm.includes("balcony")) return imgBalcony;
      if (norm.includes("carpet") || norm.includes("rug")) return imgCarpet;
      if (norm.includes("mattress") || norm.includes("bed")) return imgMattress;
      if (norm.includes("fridge") || norm.includes("refrigerator") || norm.includes("appliance")) return imgFridge;
      if (norm.includes("glass") || norm.includes("window")) return imgGlass;
      if (norm.includes("floor") || norm.includes("tile") || norm.includes("marble")) return imgFloor;
      if (norm.includes("tank") || norm.includes("water")) return imgTank;
      if (norm.includes("office") || norm.includes("commercial") || norm.includes("warehouse") || norm.includes("shop") || norm.includes("showroom") || norm.includes("restaurant") || norm.includes("hotel")) return imgOffice;
      if (norm.includes("house") || norm.includes("flat") || norm.includes("home") || norm.includes("room")) return imgHouse;
      return imgInterior;
    };

    const cleanTitle = (raw: string = "") => {
      return (raw || "")
        .replace(/\s*\(Only For Flats\)/gi, "")
        .replace(/\s*Service$/gi, "")
        .trim();
    };

    // 1. Follow exact category order: 1st Full House, 2nd Customized, 3rd Commercial
    categories.forEach((cat) => {
      if (Array.isArray(cat.services)) {
        cat.services.forEach((s) => {
          if (s && s.id && !seen.has(s.id)) {
            seen.add(s.id);
            const titleStr = s.title || "";
            const fallbackImg = getFallbackImage(titleStr, s.id);
            const img: string = (s.img && s.img.startsWith("http")) || (s.image && s.image.startsWith("http"))
              ? (s.img || s.image || fallbackImg)
              : (s.img || s.image || fallbackImg);
            list.push({
              id: s.id,
              title: cleanTitle(titleStr),
              subtext: s.price ? `Starts ₹${s.price}` : "Deep Clean",
              image: img || imgInterior,
              action: () => navigate({ to: "/service-detail", search: { id: s.id } }),
            });
          }
        });
      }
    });

    // 2. Add any remaining built-in services if not already added
    SERVICES.forEach((s) => {
      if (s && s.id && !seen.has(s.id)) {
        seen.add(s.id);
        const titleStr = s.title || "";
        const fallbackImg = getFallbackImage(titleStr, s.id);
        const img: string = s.img || fallbackImg || imgInterior;
        list.push({
          id: s.id,
          title: cleanTitle(titleStr),
          subtext: `Starts ₹${s.price}`,
          image: img,
          action: () => navigate({ to: "/service-detail", search: { id: s.id } }),
        });
      }
    });

    return list;
  }, [categories, navigate]);

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
  const [selectedCity, setSelectedCity] = useState("Guntur");

  // Contact & Callback Request Form State & Real-time Validations
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactService, setContactService] = useState("Full House Deep Cleaning");
  const [contactMessage, setContactMessage] = useState("");
  const [contactTouched, setContactTouched] = useState({ name: false, phone: false });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Derived validation rules
  const isContactNameValid =
    contactName.trim().length >= 2 && /^[A-Za-z\s]{2,60}$/.test(contactName.trim());
  const isContactPhoneValid = /^[6-9]\d{9}$/.test(contactPhone.replace(/\D/g, ""));

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactTouched({ name: true, phone: true });

    if (!contactName.trim()) {
      toast.error("Please enter your name (letters only)");
      return;
    }
    if (!isContactNameValid) {
      toast.error("Name must contain letters only (at least 2 characters)");
      return;
    }
    if (!contactPhone.trim()) {
      toast.error("Please enter your 10-digit mobile number");
      return;
    }
    if (!isContactPhoneValid) {
      toast.error("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9");
      return;
    }

    setIsSubmittingContact(true);
    const toastId = toast.loading("Submitting your request to our concierge...", { id: "contact-submit" });

    try {
      const res = await fetch(`${ADMIN_API_URL}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName.trim(),
          phone: contactPhone.replace(/\D/g, ""),
          service: contactService,
          message: contactMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit inquiry. Please try again.");
      }

      toast.success("Request received! Redirecting to confirmation...", { id: "contact-submit" });

      // Save contact info locally
      try {
        localStorage.setItem(
          "thedeepcleanz_saved_contact",
          JSON.stringify({
            name: contactName.trim(),
            phone: contactPhone.replace(/\D/g, ""),
          })
        );
      } catch {}

      // Reset form
      setContactName("");
      setContactPhone("");
      setContactMessage("");
      setContactTouched({ name: false, phone: false });
      setIsSubmittingContact(false);

      // Smooth redirect to Thank You page
      setTimeout(() => {
        navigate({
          to: "/thank-you",
          search: {
            id: data.id || `INQ-${Date.now().toString().slice(-6)}`,
            name: data.inquiry?.name || contactName.trim(),
            phone: data.inquiry?.phone || contactPhone.replace(/\D/g, ""),
            service: data.inquiry?.service || contactService,
            type: "inquiry",
          },
        });
      }, 400);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request", { id: "contact-submit" });
      setIsSubmittingContact(false);
    }
  };

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
          const geo = await fastReverseGeocode(latitude, longitude, 2500);
          formattedAddress = geo.fullAddress || `${geo.street}, ${geo.city}` || `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
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
    sessionStorage.clear();
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_profile");
    localStorage.removeItem("user_authenticated");
    localStorage.removeItem("user_phone");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_id");
    localStorage.removeItem("admin_authenticated");
    localStorage.removeItem("technician_authenticated");
    setUserEmail(null);
    setUserProfile(null);
    setIsAdmin(false);
    setUserLocation("Detect Location");
    setUserLat(null);
    setUserLng(null);
    window.dispatchEvent(new Event("location-updated"));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("auth-state-change"));
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
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch(`${ADMIN_API_URL}/api/settings`, { signal: ctrl.signal });
        clearTimeout(timer);
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
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((c: any) => Array.isArray(c.services) && c.services.length > 0)) {
            setCategories(parsed);
          }
        } catch {}
      }
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
    const order = ["full-house", "customized", "commercial"];
    const sortedCats = [...parentCats].sort((a, b) => {
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    return sortedCats.map((parent) => {
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
    navigate({ to: "/checkout" });
  };
  const completeBooking = () => {
    setCart([]);
    setBookingOpen(false);
    toast.success("Booking confirmed! Redirecting to your bookings...", {
      icon: "🎉",
      duration: 4000,
    });
    navigate({ to: "/my-bookings" });
  };

  const navLinks = [
    { href: "#home", label: "Home" },
    { href: "/services", label: "Services", isRoute: true },
    { href: "#about", label: "About Us" },
    { href: "#reviews", label: "Reviews" },
    { href: "#contact", label: "Contact" },
  ];


  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#111827] pt-[max(calc(env(safe-area-inset-top,0px)+64px),72px)] sm:pt-[76px] pb-[max(calc(env(safe-area-inset-bottom,0px)+76px),6rem)] md:pb-0">
      
      <Header
        cartCount={cartCount}
        favsCount={favs.length}
        userLocation={userLocation}
        onOpenCart={() => setCartOpen(true)}
        onOpenLocation={() => setLocationModalOpen(true)}
        onOpenReferral={() => setReferralModalOpen(true)}
        activeHash={activeHash}
        isSubPage={false}
        hideMobileNav={cartOpen || bookingOpen || locationModalOpen || referralModalOpen}
      />

      {/* HERO SECTION */}
      <HomeHeroSection />

      {/* CATEGORIES SECTION */}
      <HomeCategoryCards
        categories={categories}
        selectedCat={selectedCat}
        setSelectedCat={setSelectedCat}
        activeSubCategory={selectedSubCat}
        setActiveSubCategory={setSelectedSubCat}
      />

      {/* SERVICES SHELF CAROUSEL */}
      <HomeServicesShelf allShelfServices={allShelfServices} />

      {/* WHY CHOOSE US & PROCESS */}
      <HomeWhyChooseUs />

      {/* CUSTOMER REVIEWS */}
      <HomeReviewsSection
        sortedReviews={sortedReviews}
        reviewSortMode={reviewSortMode}
        setReviewSortMode={setReviewSortMode}
      />

      {/* CONTACT, FAQ & GOOGLE MAPS */}
      <HomeContactFaqSection />

      {/* FOOTER */}
      <HomeFooter onOpenLocation={() => setLocationModalOpen(true)} />

      {/* SERVICE DETAILS MODAL */}
      {detail && (
        <ServiceDetailModal
          service={detail}
          onClose={() => setDetail(null)}
          onAddPlan={(s, plan) => {
            addToCart(s, plan);
            setDetail(null);
          }}
          getServicePrice={getServicePrice}
        />
      )}

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
      {bookingOpen && (
        <BookingModal
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          cart={cart}
          total={cartTotal}
          onConfirm={completeBooking}
        />
      )}

      {/* BACK TO TOP FLOATING BUTTON */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-24 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#007A48] hover:bg-[#005B36] text-white shadow-lg shadow-[#007A48]/30 transition-transform hover:scale-110 cursor-pointer"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* SELECT LOCATION MODAL */}
      {locationModalOpen && (
        <HomeLocationModal
          open={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          citySearch={citySearch}
          setCitySearch={setCitySearch}
          onSelectArea={(loc) => {
            saveLocationForUser(loc.area, loc.lat, loc.lng);
            setLocationModalOpen(false);
            toast.success(`Location set to ${loc.area}!`, { icon: "📍" });
          }}
          onOpenMapPicker={() => {
            setLocationModalOpen(false);
            setMapPickerOpen(true);
          }}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
        />
      )}

      {/* MAP PICKER MODAL */}
      {mapPickerOpen && (
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
      )}

      {/* REFER & EARN MODAL */}
      {referralModalOpen && (
        <ReferralModal
          open={referralModalOpen}
          onClose={() => setReferralModalOpen(false)}
          userProfile={userProfile}
        />
      )}
    </div>
  );
}
