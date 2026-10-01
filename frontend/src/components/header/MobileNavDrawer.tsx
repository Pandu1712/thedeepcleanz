import React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X, MapPin } from "lucide-react";

interface MobileNavDrawerProps {
  navOpen: boolean;
  setNavOpen: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  dropdownOpen: boolean;
  setDropdownOpen: (val: boolean) => void;
  filteredServices: any[];
  userLocation: string;
  onOpenLocation: () => void;
  navLinks: Array<{ href: string; label: string; isRoute?: boolean }>;
  getIsActive: (link: { href: string; label: string }) => boolean;
  isAdmin: boolean;
  userEmail: string | null;
  userProfile: any;
  setProfileMenuOpen: (val: boolean) => void;
  handleLogout: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  navOpen,
  setNavOpen,
  searchQuery,
  setSearchQuery,
  dropdownOpen,
  setDropdownOpen,
  filteredServices,
  userLocation,
  onOpenLocation,
  navLinks,
  getIsActive,
  isAdmin,
  userEmail,
  userProfile,
  setProfileMenuOpen,
  handleLogout,
}) => {
  const navigate = useNavigate();

  if (!navOpen) return null;

  return (
    <div className="border-t border-[#e6dfd3] bg-[#F9F7F2] px-5 pb-5 lg:hidden">
      {/* Mobile Search Bar */}
      <div className="relative font-sans mt-4">
        <div className="relative flex items-center bg-white border border-[#C89B3C]/30 rounded-2xl px-3.5 py-2.5 shadow-3xs">
          <Search className="h-4.5 w-4.5 text-[#C89B3C] mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-[#033B2E] placeholder:text-slate-400 p-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center shrink-0"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {dropdownOpen && searchQuery.trim().length >= 1 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-205 rounded-2xl shadow-xl z-50 max-h-[250px] overflow-y-auto p-1.5">
            {filteredServices.length > 0 ? (
              <div className="space-y-1">
                <div className="text-[9px] font-black uppercase tracking-wider text-[#C89B3C] px-2.5 py-1 select-none">
                  Found {filteredServices.length} Matching Services
                </div>
                {filteredServices.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F9F7F2] active:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {s.img && (
                        <img
                          src={s.img}
                          alt=""
                          className="h-8 w-8 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-extrabold text-[#033B2E] truncate">
                          {s.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          Starts at ₹{s.price}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setNavOpen(false);
                        setSearchQuery("");
                        navigate({ to: "/service-detail", search: { id: s.id } });
                      }}
                      className="text-[9px] font-black uppercase tracking-wider bg-[#033B2E] text-[#C89B3C] border border-[#C89B3C]/30 px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer shadow-3xs"
                    >
                      View
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

      <div className="flex items-center justify-between border border-[#C89B3C]/30 bg-white p-3 rounded-2xl text-xs font-bold text-[#033B2E] shadow-3xs mt-4 mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#C89B3C]" />
          <span className="max-w-[150px] truncate">{userLocation || "Guntur, AP"}</span>
        </div>
        <button
          onClick={() => {
            setNavOpen(false);
            onOpenLocation();
          }}
          className="hover:text-[#C89B3C] transition-colors underline cursor-pointer text-xs text-[#C89B3C] font-bold"
        >
          Change
        </button>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        {navLinks.map((l) => {
          const isActive = getIsActive(l);
          const linkStyles = `font-sans text-xs font-bold uppercase tracking-wider transition-colors py-2.5 border-b border-[#033B2E]/5 ${isActive ? "text-[#007A48]" : "text-slate-700 hover:text-[#007A48]"}`;
          return l.isRoute ? (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setNavOpen(false)}
              className={linkStyles}
            >
              {l.label}
            </Link>
          ) : (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setNavOpen(false)}
              className={linkStyles}
            >
              {l.label}
            </a>
          );
        })}

        {isAdmin && (
          <button
            onClick={() => {
              navigate({ to: "/admin" });
              setNavOpen(false);
            }}
            className="w-full text-center rounded-xl border border-[#C89B3C]/40 bg-gold/5 py-2.5 text-xs font-bold text-[#C89B3C] transition-colors hover:bg-[#C89B3C]/10 cursor-pointer font-sans flex items-center justify-center gap-1 mt-2"
          >
            👑 Admin Panel
          </button>
        )}

        {userEmail || userProfile ? (
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => {
                setNavOpen(false);
                setProfileMenuOpen(true);
              }}
              className="w-full text-center rounded-xl border border-[#C89B3C] bg-[#C89B3C]/10 py-2.5 text-xs font-bold text-[#C89B3C] transition-colors hover:bg-[#C89B3C]/25 cursor-pointer font-sans"
            >
              Edit Profile &amp; Saved Addresses
            </button>
            <button
              onClick={() => {
                navigate({ to: "/my-bookings" });
                setNavOpen(false);
              }}
              className="w-full text-center rounded-xl border border-[#C89B3C]/30 bg-gold/5 py-2.5 text-xs font-bold text-[#C89B3C] transition-colors hover:bg-[#C89B3C]/10 cursor-pointer font-sans"
            >
              My Bookings
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-center rounded-xl border border-rose-500/30 bg-rose-500/5 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
            >
              Logout Account
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            onClick={() => setNavOpen(false)}
            className="w-full text-center rounded-xl bg-[#C89B3C] border border-[#C89B3C]/35 py-2.5 text-xs font-black uppercase tracking-wider text-[#033B2E] hover:bg-[#A67C22] hover:text-[#033B2E] active:scale-[0.98] transition-all duration-200 block mt-2 shadow-sm"
          >
            Login / Register
          </Link>
        )}
      </div>
    </div>
  );
};
