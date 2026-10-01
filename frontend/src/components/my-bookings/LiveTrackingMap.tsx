import React, { useEffect, useRef } from "react";

interface LiveTrackingMapProps {
  techLat: number | null;
  techLng: number | null;
  customerLat: number | null;
  customerLng: number | null;
  customerAddress?: string;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  techLat,
  techLng,
  customerLat,
  customerLng,
  customerAddress,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamically load Leaflet CSS if it hasn't been loaded already
    const linkId = "leaflet-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Initialize/update Leaflet Map
    const loadMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const points: [number, number][] = [];
      if (techLat && techLng) points.push([techLat, techLng]);
      if (customerLat && customerLng) points.push([customerLat, customerLng]);

      const center: [number, number] = points.length > 0 ? points[0] : [16.307888, 80.438993]; // default Guntur office
      const zoom = points.length === 2 ? 13 : 15;

      const map = L.map(mapRef.current, { zoomControl: false }).setView(center, zoom);
      L.control.zoom({ position: "topright" }).addTo(map);
      mapInstance.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const techIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/7542/7542670.png",
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -19],
      });

      const homeIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/25/25694.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const bounds = L.latLngBounds(points);

      if (techLat && techLng) {
        L.marker([techLat, techLng], { icon: techIcon })
          .addTo(map)
          .bindPopup("<div class='font-sans font-bold text-xs text-slate-800'>📍 Cleaning Expert<br/><span class='text-[10px] text-emerald-800'>On the way to your address</span></div>")
          .openPopup();
      }

      if (customerLat && customerLng) {
        L.marker([customerLat, customerLng], { icon: homeIcon })
          .addTo(map)
          .bindPopup(`<div class='font-sans font-bold text-xs text-slate-800'>🏠 Your doorstep<br/><span class='text-[9px] text-slate-500 font-medium'>${customerAddress || ""}</span></div>`);
      }

      if (points.length === 2) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    };

    if (!(window as any).L) {
      const scriptId = "leaflet-js";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = loadMap;
        document.body.appendChild(script);
      }
    } else {
      loadMap();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [techLat, techLng, customerLat, customerLng, customerAddress]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 h-[300px] w-full z-10 font-sans mt-3 mb-4">
      <div ref={mapRef} className="h-full w-full" />
      <div className="absolute bottom-3 left-3 bg-white/95 border border-[#cb9f5a]/30 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-xs z-50 text-[10px] font-sans flex items-center gap-1.5">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-extrabold uppercase text-[#002a22] tracking-wider">Live Expert Tracking Active</span>
      </div>
    </div>
  );
};
