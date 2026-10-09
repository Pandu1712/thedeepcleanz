import React from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface HeaderSearchOverlayProps {
  searchExpanded: boolean;
  setSearchExpanded: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  dropdownOpen: boolean;
  setDropdownOpen: (val: boolean) => void;
  filteredServices: any[];
}

export const HeaderSearchOverlay: React.FC<HeaderSearchOverlayProps> = ({
  searchExpanded,
  setSearchExpanded,
  searchQuery,
  setSearchQuery,
  dropdownOpen,
  setDropdownOpen,
  filteredServices,
}) => {
  const navigate = useNavigate();

  if (!searchExpanded) return null;

  return (
    <div className="border-t border-slate-100 bg-white/98 px-4 sm:px-6 lg:px-8 py-3 shadow-md animate-in slide-in-from-top-2 duration-200 pointer-events-auto">
      <div className="mx-auto max-w-[1400px] flex items-center gap-3">
        <div className="relative flex-1 flex items-center bg-[#F9FAF8] border border-slate-200 focus-within:border-[#007A48] focus-within:bg-white rounded-full px-4 py-2 transition-all">
          <Search className="h-4 w-4 text-[#007A48] mr-2.5 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search for deep cleaning, kitchen, bathroom, sofa..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchExpanded(false);
            setDropdownOpen(false);
            setSearchQuery("");
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 cursor-pointer"
        >
          Close
        </button>
      </div>

      {/* Dynamic search dropdown results */}
      {dropdownOpen && searchQuery.trim().length >= 1 && (
        <div className="mx-auto max-w-[1400px] mt-2 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 max-h-[300px] overflow-y-auto p-2">
          {filteredServices.length > 0 ? (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#007A48] px-3 py-1 select-none">
                Found {filteredServices.length} Matching Services
              </div>
              {filteredServices.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F9FAF8] group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {s.img && (
                      <img
                        src={s.img}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-[#007A48] transition-colors">
                        {s.title}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        Starts at ₹{s.price}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setSearchExpanded(false);
                      setSearchQuery("");
                      navigate({ to: "/service-detail", search: { id: s.id } });
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider bg-[#007A48] text-white hover:bg-[#00633B] px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer shadow-xs"
                  >
                    View Service
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 px-4 text-xs italic text-slate-400 select-none">
              No matching services found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
