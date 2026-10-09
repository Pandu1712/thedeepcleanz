import React, { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { ADMIN_API_URL } from "@/api/admin-api";

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  userProfile: any;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  userEmail: string | null;
  isAdmin: boolean;
  onLogout: () => void;
  onOpenReferral?: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  open,
  onClose,
  userProfile,
  setUserProfile,
  userEmail,
  isAdmin,
  onLogout,
  onOpenReferral,
}) => {
  const navigate = useNavigate();

  // Address form states
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddrType, setNewAddrType] = useState("Home");
  const [newAddrLine, setNewAddrLine] = useState("");
  const [newAddrLandmark, setNewAddrLandmark] = useState("");
  const [newAddrCity, setNewAddrCity] = useState("Guntur");
  const [newAddrPincode, setNewAddrPincode] = useState("");
  const [isSavingAddr, setIsSavingAddr] = useState(false);

  // Change password states
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSaveAddress = async () => {
    if (!newAddrLine.trim() || !newAddrPincode.trim()) {
      toast.error("Address line and Pincode are required fields.");
      return;
    }
    if (!userProfile?.id) {
      toast.error("User profile not found.");
      return;
    }
    setIsSavingAddr(true);
    try {
      const currentAddresses = Array.isArray(userProfile.addresses) ? userProfile.addresses : [];
      const newAddress = {
        id: "addr-" + Math.random().toString(36).substr(2, 9),
        address: newAddrLine.trim(),
        landmark: newAddrLandmark.trim(),
        city: newAddrCity.trim(),
        pincode: newAddrPincode.trim(),
        type: newAddrType,
        isDefault: currentAddresses.length === 0,
      };

      const updatedAddresses = [...currentAddresses, newAddress];
      const response = await fetch(`${ADMIN_API_URL}/api/users/${userProfile.id}/addresses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: updatedAddresses }),
      });

      if (response.ok) {
        const updatedProfile = { ...userProfile, addresses: updatedAddresses };
        setUserProfile(updatedProfile);
        sessionStorage.setItem("user_profile", JSON.stringify(updatedProfile));
        localStorage.setItem("user_profile", JSON.stringify(updatedProfile));
        localStorage.setItem("thedeepcleanz_saved_addresses", JSON.stringify(updatedAddresses));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("auth-state-change"));
        toast.success("New address saved successfully!", { icon: "🏠" });

        // Reset fields
        setNewAddrLine("");
        setNewAddrLandmark("");
        setNewAddrCity("Guntur");
        setNewAddrPincode("");
        setShowAddAddressForm(false);
      } else {
        toast.error("Failed to save address details.");
      }
    } catch (e: any) {
      toast.error(`Error saving address: ${e.message}`);
    } finally {
      setIsSavingAddr(false);
    }
  };

  const handleSetDefaultAddress = async (addrId: string) => {
    if (!userProfile?.id) return;
    const currentAddresses = Array.isArray(userProfile.addresses) ? userProfile.addresses : [];
    const updatedAddresses = currentAddresses.map((a: any) => ({
      ...a,
      isDefault: a.id === addrId,
    }));

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/users/${userProfile.id}/addresses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: updatedAddresses }),
      });

      if (response.ok) {
        const updatedProfile = { ...userProfile, addresses: updatedAddresses };
        setUserProfile(updatedProfile);
        sessionStorage.setItem("user_profile", JSON.stringify(updatedProfile));
        localStorage.setItem("user_profile", JSON.stringify(updatedProfile));
        localStorage.setItem("thedeepcleanz_saved_addresses", JSON.stringify(updatedAddresses));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("auth-state-change"));
        toast.success("Default address updated!");
      }
    } catch (e) {
      toast.error("Failed to update default address.");
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!userProfile?.id) return;
    const currentAddresses = Array.isArray(userProfile.addresses) ? userProfile.addresses : [];
    const targetAddress = currentAddresses.find((a: any) => a.id === addrId);
    const updatedAddresses = currentAddresses.filter((a: any) => a.id !== addrId);

    if (targetAddress?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/users/${userProfile.id}/addresses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: updatedAddresses }),
      });

      if (response.ok) {
        const updatedProfile = { ...userProfile, addresses: updatedAddresses };
        setUserProfile(updatedProfile);
        sessionStorage.setItem("user_profile", JSON.stringify(updatedProfile));
        localStorage.setItem("user_profile", JSON.stringify(updatedProfile));
        localStorage.setItem("thedeepcleanz_saved_addresses", JSON.stringify(updatedAddresses));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("auth-state-change"));
        toast.success("Address deleted.");
      }
    } catch (e) {
      toast.error("Failed to delete address.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) {
      toast.error("User profile not found.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfile.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update password.");
      }

      toast.success("Password updated successfully!", { icon: "🔐" });
      setShowChangePasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Incorrect current password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <>
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 z-50 bg-[#033B2E]/60 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto cursor-pointer"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm sm:max-w-md bg-[#F9F7F2] border-l border-[#C89B3C]/30 shadow-2xl z-55 flex flex-col animate-in slide-in-from-right duration-250 font-sans text-slate-700 pointer-events-auto">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#C89B3C]/20 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C89B3C] block">Account Profile</span>
            <h2 className="text-base font-display font-bold text-[#033B2E] mt-0.5">My Details &amp; Addresses</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-[#C89B3C] hover:text-[#033B2E] text-slate-500 transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* User Bio Information */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-4 shadow-3xs">
            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#002a22] to-[#004d3e] flex items-center justify-center text-xl font-black text-[#cb9f5a] border border-[#cb9f5a]/30 shrink-0">
              {userProfile?.name?.substring(0, 2).toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-800 truncate">{userProfile?.name || "Client Guest"}</h3>
              <span className="block text-[10px] text-slate-400 font-semibold truncate mt-0.5">{userEmail || "Customer"}</span>
              {userProfile?.phone && (
                <span className="inline-block text-[10px] text-slate-500 font-bold mt-1 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg">+91 {userProfile.phone}</span>
              )}
            </div>
          </div>

          {/* Premium Wallet & Referral Status */}
          <div className="bg-gradient-to-r from-[#002a22] to-[#023b30] border border-[#cb9f5a]/20 p-4 rounded-2xl text-white shadow-sm font-sans space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-[8px] font-black text-[#cb9f5a] uppercase tracking-widest">Available Credit</span>
                <div className="text-xl font-black text-white mt-0.5">₹{userProfile?.walletBalance || 0}</div>
              </div>
              <span className="text-sm">💳</span>
            </div>
            {onOpenReferral && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReferral();
                }}
                className="w-full text-center py-2 rounded-xl bg-[#cb9f5a] hover:bg-[#cb9f5a]/90 text-[#002a22] text-xs font-black transition-all active:scale-[0.98] cursor-pointer shadow-gold"
              >
                🎁 Refer &amp; Earn Bonus Cash
              </button>
            )}
          </div>

          {/* Saved Addresses Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#002a22] uppercase tracking-wider">📍 Saved Addresses</h4>
              <button
                onClick={() => setShowAddAddressForm((v) => !v)}
                className="text-[10px] text-[#cb9f5a] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showAddAddressForm ? "Cancel" : "➕ Add New"}
              </button>
            </div>

            {/* Add Address Form */}
            {showAddAddressForm && (
              <div className="bg-white border border-[#cb9f5a]/20 rounded-2xl p-4 space-y-3.5 shadow-2xs font-sans text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-700">New Address Details</span>
                  <div className="flex gap-1.5 text-[10px]">
                    {["Home", "Office", "Other"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewAddrType(t)}
                        className={`px-2.5 py-0.5 rounded-full font-bold transition-colors cursor-pointer border ${
                          newAddrType === t
                            ? "bg-[#002a22] border-[#002a22] text-white font-extrabold"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        {t === "Home" ? "🏠 Home" : t === "Office" ? "🏢 Office" : "📍 Other"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">Full Address</label>
                    <textarea
                      value={newAddrLine}
                      onChange={(e) => setNewAddrLine(e.target.value)}
                      rows={2}
                      placeholder="Flat/House No, Building, Street Address..."
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-[#cb9f5a]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">Landmark / Nearby Place</label>
                      <input
                        type="text"
                        value={newAddrLandmark}
                        onChange={(e) => setNewAddrLandmark(e.target.value)}
                        placeholder="e.g. Near Park..."
                        className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-[#cb9f5a]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">City</label>
                      <input
                        type="text"
                        value={newAddrCity}
                        onChange={(e) => setNewAddrCity(e.target.value)}
                        placeholder="City Name"
                        className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-[#cb9f5a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">Pincode</label>
                    <input
                      type="text"
                      value={newAddrPincode}
                      onChange={(e) => setNewAddrPincode(e.target.value)}
                      placeholder="6-digit pincode"
                      className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-[#cb9f5a]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAddress}
                  disabled={isSavingAddr}
                  className="w-full text-center py-2.5 rounded-xl bg-[#002a22] hover:bg-[#003d32] text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isSavingAddr ? "Saving..." : "💾 Save Address"}
                </button>
              </div>
            )}

            {/* Address List */}
            <div className="space-y-2.5">
              {(!userProfile?.addresses || userProfile.addresses.length === 0) ? (
                <div className="text-center py-6 bg-white border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-semibold italic">
                  No saved addresses found. Add your address to speed up booking checkout.
                </div>
              ) : (
                userProfile.addresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className={`bg-white border rounded-2xl p-4 shadow-3xs flex items-start justify-between gap-3 text-xs ${
                      addr.isDefault 
                        ? "border-[#cb9f5a] ring-1 ring-[#cb9f5a]/20 bg-[#cb9f5a]/2" 
                        : "border-slate-200/80"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold uppercase text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                          {addr.type === "Home" ? "🏠 Home" : addr.type === "Office" ? "🏢 Office" : "📍 Other"}
                        </span>
                        {addr.isDefault && (
                          <span className="font-extrabold uppercase text-[8px] bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full text-emerald-800 animate-pulse">
                            ⭐ Default
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-700 break-words leading-relaxed">{addr.address}</p>
                      {addr.landmark && (
                        <p className="text-[10px] text-slate-500 font-bold">Landmark: {addr.landmark}</p>
                      )}
                      <p className="text-[10px] text-[#cb9f5a] font-extrabold uppercase">{addr.city} - {addr.pincode}</p>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 items-end">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[9px] font-extrabold text-slate-450 hover:text-emerald-700 bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          title="Set as Default Address for Bookings"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                        title="Delete Saved Address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Security & Account Login Info */}
          <div className="pt-2 border-t border-[#cb9f5a]/10 space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#002a22] uppercase tracking-wider flex items-center gap-1.5">
                <span>🔐 Security &amp; Access</span>
              </h4>
              {isAdmin && (
                <button
                  onClick={() => setShowChangePasswordForm((v) => !v)}
                  className="text-[10px] text-[#cb9f5a] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showChangePasswordForm ? "Cancel" : "Admin Password"}
                </button>
              )}
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                📱
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-[#002a22]">
                    {userProfile?.phone ? `+91 ${userProfile.phone}` : "Mobile OTP Login"}
                  </span>
                  <span className="text-[9px] font-bold uppercase bg-emerald-600 text-white px-1.5 py-0.2 rounded-md">
                    Verified
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800 font-medium mt-0.5 leading-snug">
                  Fast, secure 1-click login enabled via carrier SMS OTP. No passwords required.
                </p>
              </div>
            </div>

            {isAdmin && showChangePasswordForm && (
              <form onSubmit={handleChangePassword} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs space-y-3">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Current Admin Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#cb9f5a] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">New Admin Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#cb9f5a] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full text-center py-2.5 rounded-xl bg-[#002a22] hover:bg-[#cb9f5a] text-[#cb9f5a] hover:text-[#002a22] border border-[#cb9f5a]/30 text-xs font-black transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isUpdatingPassword ? "Updating..." : "Update Admin Password"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-5 border-t border-[#C89B3C]/20 bg-white space-y-2.5">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate({ to: "/admin" });
              }}
              className="w-full text-center py-2.5 rounded-xl border border-[#C89B3C]/35 hover:bg-gold/5 text-xs font-black text-[#C89B3C] cursor-pointer flex items-center justify-center gap-1.5"
            >
              👑 Admin Dashboard Panel
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (userProfile) {
                sessionStorage.setItem("user_authenticated", "true");
                localStorage.setItem("user_authenticated", "true");
                sessionStorage.setItem("user_profile", JSON.stringify(userProfile));
                localStorage.setItem("user_profile", JSON.stringify(userProfile));
                if (userProfile.email) {
                  sessionStorage.setItem("user_email", userProfile.email);
                  localStorage.setItem("user_email", userProfile.email);
                }
                if (userProfile.phone) {
                  sessionStorage.setItem("user_phone", userProfile.phone);
                  localStorage.setItem("user_phone", userProfile.phone);
                }
                if (userProfile.name) {
                  sessionStorage.setItem("user_name", userProfile.name);
                  localStorage.setItem("user_name", userProfile.name);
                }
              }
              onClose();
              navigate({ to: "/my-bookings" });
            }}
            className="w-full text-center py-2.5 rounded-xl bg-white border border-[#C89B3C]/30 hover:border-[#C89B3C] text-[#002a22] text-xs font-bold transition-all cursor-pointer font-sans"
          >
            🗓️ View My Booking History
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full text-center py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
          >
            🚪 Log Out of Account
          </button>
        </div>
      </div>
    </>
  );
};
