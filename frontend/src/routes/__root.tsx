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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "name": "TheDeep CleanerZ",
  "alternateName": "TheDeepCleanerz",
  "image": "https://thedeepcleanerz.com/logos/logo.png",
  "logo": "https://thedeepcleanerz.com/logos/logo.png",
  "url": "https://thedeepcleanerz.com",
  "telephone": "+91 93902 46688",
  "email": "thedeepcleanerz.info@gmail.com",
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
  "priceRange": "₹₹",
  "sameAs": [
    "https://instagram.com/thedeepcleanerz",
    "https://facebook.com/thedeepcleanerz"
  ]
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TheDeep CleanerZ — Premium Deep Cleaning & Sanitization Services" },
      {
        name: "description",
        content: "TheDeep CleanerZ provides premium hotel-grade deep cleaning, sanitization, and maintenance services for homes, apartments, villas, corporate offices and hotels in Guntur and Andhra Pradesh.",
      },
      {
        name: "keywords",
        content: "deep cleaning, home cleaning, sofa cleaning, kitchen deep cleaning, bathroom cleaning, villa cleaning, commercial cleaning, Guntur deep cleaners, TheDeep CleanerZ, full house cleaning, Andhra Pradesh",
      },
      { name: "author", content: "TheDeep CleanerZ" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "theme-color", content: "#0B6B46" },
      { property: "og:title", content: "TheDeep CleanerZ — Premium Deep Cleaning & Sanitization Services" },
      {
        property: "og:description",
        content: "Professional deep cleaning, sanitization, and maintenance services for homes, apartments, villas and commercial spaces.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://thedeepcleanerz.com/" },
      { property: "og:image", content: "https://thedeepcleanerz.com/logos/logo.png" },
      { property: "og:image:alt", content: "TheDeep CleanerZ Official Logo" },
      { property: "og:site_name", content: "TheDeep CleanerZ" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@TheDeepCleanerz" },
      { name: "twitter:title", content: "TheDeep CleanerZ — Premium Deep Cleaning Services" },
      {
        name: "twitter:description",
        content: "Professional deep cleaning services for homes, villas, offices and hotels.",
      },
      { name: "twitter:image", content: "https://thedeepcleanerz.com/logos/logo.png" },
    ],
    links: [
      { rel: "canonical", href: "https://thedeepcleanerz.com/" },
      { rel: "icon", type: "image/png", href: "/logos/logo.png" },
      { rel: "apple-touch-icon", href: "/logos/logo.png" },
      { rel: "shortcut icon", type: "image/png", href: "/logos/logo.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&family=Urbanist:wght@300;400;500;600;700;800&family=Epilogue:wght@500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap",
      },
      { rel: "stylesheet", href: import.meta.env.DEV ? `${appCss}?direct` : appCss },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
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

      // Register Custom Service Worker
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => {
              console.log("Service Worker registered scope:", reg.scope);
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
