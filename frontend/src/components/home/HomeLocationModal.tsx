import React from "react";
import { ArrowLeft, Search, MapPin, Locate, Map as MapIcon, Sparkles } from "lucide-react";
import { GUNTUR_LOCATIONS, type LocationItem } from "@/data/homeLocationData";

interface HomeLocationModalProps {
  open: boolean;
  onClose: () => void;
  citySearch: string;
  setCitySearch: (val: string) => void;
  onSelectArea: (loc: LocationItem) => void;
  onOpenMapPicker: () => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

export default function HomeLocationModal({
  open,
  onClose,
  citySearch,
  setCitySearch,
  onSelectArea,
  onOpenMapPicker,
  selectedCity,
  setSelectedCity,
}: HomeLocationModalProps) {
  if (!open) return null;

  const filteredLocations = GUNTUR_LOCATIONS.filter((loc) => {
    if (citySearch.trim()) {
      const q = citySearch.toLowerCase();
      return (
        loc.area.toLowerCase().includes(q) ||
        loc.landmark.toLowerCase().includes(q) ||
        loc.pincode.includes(q) ||
        loc.city.toLowerCase().includes(q)
      );
    }
    return loc.city.toLowerCase() === selectedCity.toLowerCase();
  });

  const popularCities = ["Guntur", "Vijayawada", "Visakhapatnam", "Tenali", "Mangalagiri"];

  return (
    <div className="fixed inset-0 z-50 bg-[#001712]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop Click Closer */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-white rounded-3xl w-full max-w-sm border border-slate-200 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 font-sans text-slate-800 max-h-[90vh] flex flex-col">
        {/* Modal Title Row */}
        <div className="flex items-center gap-2.5 mb-5 shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-bold text-slate-800 font-display">Select Location</h3>
        </div>

        {/* City Input Search Box */}
        <div className="relative mb-4 shrink-0">
          <input
            type="text"
            placeholder="Search area (e.g. Brodipet, Arundelpet)"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#007A48] focus:bg-white focus:ring-1 focus:ring-[#007A48] transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Map Picker CTA */}
        <button
          onClick={onOpenMapPicker}
          className="w-full mb-4 py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-[#005B36] to-[#007A48] text-white flex items-center justify-between shadow-xs hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer shrink-0 group"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-white/15 flex items-center justify-center">
              <MapIcon className="h-4 w-4 text-emerald-200" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold leading-tight">Pin on Live GPS Map</div>
              <div className="text-[9px] text-emerald-100 font-medium">Auto-detect doorstep coordinates</div>
            </div>
          </div>
          <Locate className="h-4 w-4 text-emerald-300 group-hover:rotate-45 transition-transform" />
        </button>

        {/* City Filter Pills */}
        <div className="mb-3 shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Select City
          </div>
          <div className="flex flex-wrap gap-1.5">
            {popularCities.map((city) => (
              <button
                key={city}
                onClick={() => {
                  setSelectedCity(city);
                  setCitySearch("");
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCity.toLowerCase() === city.toLowerCase() && !citySearch
                    ? "bg-[#002A22] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Area List */}
        <div className="overflow-y-auto no-scrollbar flex-1 space-y-1.5 pr-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 sticky top-0 bg-white py-1">
            Available Service Areas ({filteredLocations.length})
          </div>
          {filteredLocations.map((loc) => (
            <button
              key={`${loc.area}-${loc.pincode}`}
              onClick={() => onSelectArea(loc)}
              className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/60 border border-transparent hover:border-emerald-200/60 transition-all cursor-pointer flex items-start gap-2.5 group"
            >
              <MapPin className="h-4 w-4 text-[#007A48] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-[#007A48] transition-colors">
                  {loc.area}
                </div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                  {loc.landmark} • {loc.pincode}
                </div>
              </div>
            </button>
          ))}
          {filteredLocations.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              No matching service area found. Try searching another area or pin on map.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
