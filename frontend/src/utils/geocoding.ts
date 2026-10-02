// High-speed, cached, timeout-guarded reverse geocoding utility for TheDeep CleanerZ

export interface GeocodeResult {
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  fullAddress: string;
}

// In-memory cache for ultra-fast instant lookups during user session
const memoryGeoCache = new Map<string, GeocodeResult>();

// Fallback lookup based on Guntur & AP known coordinates
function getLocalFallbackLocation(lat: number, lng: number): GeocodeResult {
  // Guntur bounds: roughly 16.20 - 16.40, 80.35 - 80.55
  if (lat >= 16.2 && lat <= 16.4 && lng >= 80.35 && lng <= 80.55) {
    return {
      street: "Arundelpet",
      landmark: "Arundelpet, Guntur",
      city: "Guntur",
      state: "Andhra Pradesh",
      pincode: "522002",
      fullAddress: "Arundelpet, Guntur, Andhra Pradesh",
    };
  }
  // Vijayawada bounds
  if (lat >= 16.45 && lat <= 16.6 && lng >= 80.55 && lng <= 80.75) {
    return {
      street: "Benz Circle",
      landmark: "Benz Circle, Vijayawada",
      city: "Vijayawada",
      state: "Andhra Pradesh",
      pincode: "520010",
      fullAddress: "Benz Circle, Vijayawada, Andhra Pradesh",
    };
  }
  return {
    street: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    landmark: "Detected Location",
    city: "Guntur",
    state: "Andhra Pradesh",
    pincode: "522002",
    fullAddress: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)}), Guntur`,
  };
}

export async function fastReverseGeocode(
  lat: number,
  lng: number,
  timeoutMs = 2500,
): Promise<GeocodeResult> {
  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;

  // 1. Check in-memory session cache
  if (memoryGeoCache.has(cacheKey)) {
    return memoryGeoCache.get(cacheKey)!;
  }

  // 2. Check sessionStorage cache
  try {
    const cached = sessionStorage.getItem(`geo_${cacheKey}`);
    if (cached) {
      const parsed: GeocodeResult = JSON.parse(cached);
      memoryGeoCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {}

  // 3. Attempt network fetch with abort controller
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        signal: ctrl.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "TheDeepCleanerz-App/1.0",
        },
      },
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const houseNumber = addr.house_number || addr.building || "";
      const road = addr.road || addr.street || addr.residential || "";
      const suburb = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || "";
      const city =
        addr.city || addr.town || addr.county || addr.state_district || (addr.state === "Andhra Pradesh" ? "Guntur" : "Guntur");
      const state = addr.state || "Andhra Pradesh";
      const pincode = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);

      const street = [houseNumber, road, suburb].filter(Boolean).join(", ");
      const landmark = suburb || road ? `${suburb || road}, ${city}` : city;
      const fullAddress =
        street && city
          ? `${street}, ${city}`
          : data.display_name
            ? data.display_name.split(",").slice(0, 3).join(",")
            : `${city}, ${state}`;

      const result: GeocodeResult = {
        street: street || fullAddress,
        landmark: landmark || city,
        city: city || "Guntur",
        state: state || "Andhra Pradesh",
        pincode: pincode || (city.toLowerCase().includes("guntur") ? "522002" : ""),
        fullAddress: fullAddress || "Detected Location",
      };

      memoryGeoCache.set(cacheKey, result);
      try {
        sessionStorage.setItem(`geo_${cacheKey}`, JSON.stringify(result));
      } catch {}

      return result;
    }
  } catch (err) {
    console.warn("Geocoding network timeout/error, using instant fallback:", err);
  }

  // 4. Return instant local fallback if network times out or fails
  const fallback = getLocalFallbackLocation(lat, lng);
  memoryGeoCache.set(cacheKey, fallback);
  return fallback;
}
