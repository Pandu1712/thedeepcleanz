import React, { useState, useRef, useEffect } from "react";
import { X, MapPin, Locate, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { fastReverseGeocode } from "@/utils/geocoding";

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
      const geo = await fastReverseGeocode(lat, lng, 2000);
      setAddressData({
        address: geo.street || geo.fullAddress,
        landmark: geo.landmark,
        pincode: geo.pincode,
        city: geo.city,
      });
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
              className="flex-2 rounded-xl bg-[#007A48] hover:bg-[#005B36] py-2.5 text-xs font-bold text-white shadow-md hover:scale-[1.01] transition-transform cursor-pointer"
            >
              Confirm Exact Doorstep Pin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPickerModal;
