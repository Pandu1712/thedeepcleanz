import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import "../styles/styles.css";
import appCss from "../styles/styles.css?url";
import { reportLovableError } from "../utils/lovable-error-reporting";
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
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90" search={undefined}          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TheDeep CleanerZ — Premium Deep Cleaning" },
      {
        name: "description",
        content: "Professional deep cleaning services for homes, offices and hotels.",
      },
      { name: "author", content: "TheDeep CleanerZ" },
      { property: "og:title", content: "TheDeep CleanerZ — Premium Deep Cleaning" },
      {
        property: "og:description",
        content: "Professional deep cleaning services for homes, offices and hotels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@TheDeepCleanerz" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&family=Epilogue:wght@500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap",
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
      return () => window.removeEventListener("auth-state-change", handleAuth);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
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
