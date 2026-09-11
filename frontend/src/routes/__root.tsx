import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster, toast } from "sonner";

import "../styles/styles.css";
import appCss from "../styles/styles.css?url";
import { ADMIN_API_URL } from "../api/admin-api";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            search={{ category: undefined, cart: undefined }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Application error:", error);
  const router = useRouter();

  useEffect(() => {
    const msg = error?.message || "";
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("Loading chunk") ||
      msg.includes("dynamically imported")
    ) {
      const now = Date.now();
      const lastReload = Number(sessionStorage.getItem("last_chunk_reload") || "0");
      if (now - lastReload > 10000) {
        sessionStorage.setItem("last_chunk_reload", String(now));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-sans">
      <div className="max-w-md text-center p-8 bg-white rounded-3xl border border-[#cb9f5a]/30 shadow-xl">
        <div className="h-12 w-12 mx-auto mb-4 rounded-2xl bg-[#007A48]/10 text-[#007A48] flex items-center justify-center font-black text-xl">
          ✨
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#002A22]">
          Quick Refresh Needed
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">
          The app was updated with a new version or your connection experienced a momentary interruption.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-[#007A48] px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] shadow-md cursor-pointer"
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 cursor-pointer"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": "https://thedeepcleanerz.in/#business",
  "name": "TheDeep CleanerZ",
  "alternateName": ["TheDeepCleanerz", "The Deep CleanerZ", "The Deep Cleanerz Guntur"],
  "image": "https://thedeepcleanerz.in/logos/logo.png",
  "logo": "https://thedeepcleanerz.in/logos/logo.png",
  "url": "https://thedeepcleanerz.in",
  "telephone": "+91 93902 46688",
  "email": "thedeepcleanerz.info@gmail.com",
  "priceRange": "₹₹",
  "currenciesAccepted": "INR",
  "paymentAccepted": "Cash, Credit Card, Debit Card, UPI, Net Banking, Razorpay",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Arundelpet",
    "addressLocality": "Guntur",
    "addressRegion": "Andhra Pradesh",
    "postalCode": "522002",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 16.307888,
    "longitude": 80.438993
  },
  "hasMap": "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3829.2945379659127!2d80.438992875141!3d16.307887884406753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTbCsDE4JzI4LjQiTiA4MMKwMjYnMjkuNiJF!5e0!3m2!1sen!2sin!4v1784366519525!5m2!1sen!2sin",
  "areaServed": [
    { "@type": "City", "name": "Guntur" },
    { "@type": "City", "name": "Vijayawada" },
    { "@type": "City", "name": "Tenali" },
    { "@type": "City", "name": "Mangalagiri" },
    { "@type": "City", "name": "Amaravati" },
    { "@type": "AdministrativeArea", "name": "Andhra Pradesh" }
  ],
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ],
    "opens": "07:00",
    "closes": "21:00"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "385",
    "bestRating": "5",
    "worstRating": "1"
  },
  "sameAs": [
    "https://instagram.com/thedeepcleanerz",
    "https://facebook.com/thedeepcleanerz",
    "https://twitter.com/TheDeepCleanerz"
  ]
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://thedeepcleanerz.in/#website",
  "name": "TheDeep CleanerZ",
  "url": "https://thedeepcleanerz.in",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://thedeepcleanerz.in/services?service={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What cleaning services does TheDeep CleanerZ provide in Guntur?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TheDeep CleanerZ offers full house deep cleaning, furnished and vacant flat cleaning, luxury villa sanitization, kitchen degreasing, bathroom descaling, sofa shampooing, carpet extraction, mattress sanitization, and commercial post-construction cleaning in Guntur and Andhra Pradesh."
      }
    },
    {
      "@type": "Question",
      "name": "Where is TheDeep CleanerZ office located in Guntur?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our office is centrally located at Arundelpet, Guntur, Andhra Pradesh 522002, India (Coordinates: 16.307888, 80.438993)."
      }
    },
    {
      "@type": "Question",
      "name": "How can I book a deep cleaning service?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can easily book online at https://thedeepcleanerz.in, customize your package, choose a time slot, or call our team at +91 93902 46688."
      }
    },
    {
      "@type": "Question",
      "name": "Are the cleaning chemicals eco-friendly and pet-safe?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we exclusively utilize hospital-standard, biodegradable, non-hazardous, and eco-friendly cleaning agents that are safe for infants, seniors, and pets."
      }
    }
  ]
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { title: "TheDeep CleanerZ — Top #1 Deep Cleaning & Sanitization Services in Guntur, AP" },
      {
        name: "description",
        content: "TheDeep CleanerZ is Guntur's #1 premier deep cleaning and sanitization brand. Luxury deep cleaning for homes, apartments, villas, and commercial spaces in Arundelpet, Guntur & AP.",
      },
      {
        name: "keywords",
        content: "TheDeep CleanerZ, The Deep CleanerZ, deep cleaning services Guntur, home cleaning Guntur, sofa cleaning Guntur, bathroom cleaning Guntur, kitchen deep cleaning, villa cleaning, commercial cleaning Arundelpet Guntur, full house cleaning Andhra Pradesh, deep sanitization, carpet cleaning, mattress cleaning",
      },
      { name: "author", content: "TheDeep CleanerZ" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "theme-color", content: "#0B6B46" },
      { name: "geo.region", content: "IN-AP" },
      { name: "geo.placename", content: "Guntur" },
      { name: "geo.position", content: "16.307888;80.438993" },
      { name: "ICBM", content: "16.307888, 80.438993" },
      { name: "google-site-verification", content: "google639a710a1902b697" },
      { property: "og:title", content: "TheDeep CleanerZ — Top #1 Deep Cleaning & Sanitization Services in Guntur, AP" },
      {
        property: "og:description",
        content: "Professional deep cleaning, sanitization, and maintenance services for homes, apartments, villas, and commercial spaces in Guntur.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://thedeepcleanerz.in/" },
      { property: "og:image", content: "https://thedeepcleanerz.in/logos/logo.png" },
      { property: "og:image:alt", content: "TheDeep CleanerZ Official Logo" },
      { property: "og:site_name", content: "TheDeep CleanerZ" },
      { property: "og:locale", content: "en_IN" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@TheDeepCleanerz" },
      { name: "twitter:title", content: "TheDeep CleanerZ — Premium Deep Cleaning Services" },
      {
        name: "twitter:description",
        content: "Guntur's #1 premier deep cleaning and sanitization experts. Spotless spaces with clinical perfection.",
      },
      { name: "twitter:image", content: "https://thedeepcleanerz.in/logos/logo.png" },
    ],
    links: [
      { rel: "canonical", href: "https://thedeepcleanerz.in/" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/logos/logo.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/logos/logo.png" },
      { rel: "shortcut icon", type: "image/png", href: "/logos/logo.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "stylesheet", href: import.meta.env.DEV ? `${appCss}?direct` : appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&family=Urbanist:wght@300;400;500;600;700;800&family=Epilogue:wght@500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Google Analytics Tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-KCXSZYY046"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-KCXSZYY046');
            `,
          }}
        />
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [isOnline, setIsOnline] = useState(true);

  // Prompt user for location on site visit and store in database
  const getLiveLocation = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let userId: string | null = null;
          try {
            const prof = sessionStorage.getItem("user_profile");
            if (prof) {
              const u = JSON.parse(prof);
              userId = u.id || null;
            }
          } catch (e) { }

          // 1. Log to database
          try {
            await fetch(`${ADMIN_API_URL}/api/locations`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, latitude, longitude }),
            });
          } catch (err) {
            console.warn("Failed to report live visitor location:", err);
          }

          // 2. Reverse geocode location using OpenStreetMap Nominatim
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            );
            const geoData = await geoRes.json();
            if (geoData && geoData.address) {
              const city =
                geoData.address.city ||
                geoData.address.town ||
                geoData.address.village ||
                geoData.address.suburb ||
                "";
              const state = geoData.address.state || "";
              const addressText =
                city && state ? `${city}, ${state}` : city || state || "Detected Location";
              sessionStorage.setItem("user_location_address", addressText);
              sessionStorage.setItem("user_location_lat", String(latitude));
              sessionStorage.setItem("user_location_lng", String(longitude));
              window.dispatchEvent(new Event("location-updated"));
            }
          } catch (geoErr) {
            console.error("Reverse geocoding failed:", geoErr);
          }
        },
        (error) => {
          console.warn("Location permission denied or lookup failed:", error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).requestLiveLocation = getLiveLocation;
      getLiveLocation();

      const handleAuth = () => {
        getLiveLocation();
      };
      window.addEventListener("auth-state-change", handleAuth);

      // Track online status
      setIsOnline(navigator.onLine);
      const handleOnlineStatus = () => {
        setIsOnline(true);
        toast.success("Internet connection restored!", { id: "network-toast" });
        window.dispatchEvent(new Event("network-state-change"));
      };
      const handleOfflineStatus = () => {
        setIsOnline(false);
        toast.error("Offline. Running in high-speed cached mode.", { id: "network-toast" });
        window.dispatchEvent(new Event("network-state-change"));
      };

      window.addEventListener("online", handleOnlineStatus);
      window.addEventListener("offline", handleOfflineStatus);

      // Register Custom Service Worker with Instant Update
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => {
              console.log("Service Worker registered scope:", reg.scope);
              // Proactively check for updates on cold visit
              reg.update();
              if (reg.waiting) {
                reg.waiting.postMessage({ action: "skipWaiting" });
              }
              reg.addEventListener("updatefound", () => {
                const newWorker = reg.installing;
                if (newWorker) {
                  newWorker.addEventListener("statechange", () => {
                    if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                      newWorker.postMessage({ action: "skipWaiting" });
                    }
                  });
                }
              });
            })
            .catch((err) => {
              console.error("Service Worker registration failed:", err);
            });
        });
      }

      return () => {
        window.removeEventListener("auth-state-change", handleAuth);
        window.removeEventListener("online", handleOnlineStatus);
        window.removeEventListener("offline", handleOfflineStatus);
      };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      
      {/* Offline Status Float Banner */}
      {!isOnline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-pulse bg-rose-600/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-rose-500/30 text-xs font-bold font-sans">
          <span className="h-2 w-2 rounded-full bg-white animate-ping" />
          <span>Offline (High-Speed Cache Mode)</span>
        </div>
      )}

      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "!bg-[oklch(0.32_0.07_165)] !text-[oklch(0.98_0.015_90)] !border !border-[oklch(0.78_0.13_85)]/40 !rounded-2xl",
        }}
      />
    </QueryClientProvider>
  );
}
