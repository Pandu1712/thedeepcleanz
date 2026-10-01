import React from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CheckoutFormData, SavedAddress } from "./types";

interface CheckoutAddressStepProps {
  form: CheckoutFormData;
  setForm: React.Dispatch<React.SetStateAction<CheckoutFormData>>;
  savedAddresses: SavedAddress[];
  setSavedAddresses: React.Dispatch<React.SetStateAction<SavedAddress[]>>;
  showAddressForm: boolean;
  setShowAddressForm: (val: boolean) => void;
  editingAddressId: string | null;
  setEditingAddressId: (val: string | null) => void;
  newAddrType: string;
  setNewAddrType: (val: string) => void;
  isLocating: boolean;
  detectLocation: () => void;
}

export const CheckoutAddressStep: React.FC<CheckoutAddressStepProps> = ({
  form,
  setForm,
  savedAddresses,
  setSavedAddresses,
  showAddressForm,
  setShowAddressForm,
  editingAddressId,
  setEditingAddressId,
  newAddrType,
  setNewAddrType,
  isLocating,
  detectLocation,
}) => {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#002A22]">
              Service Delivery Address
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Where should our verified cleaning specialists arrive?
            </p>
          </div>
        </div>
        {savedAddresses.length > 0 && !showAddressForm && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {savedAddresses.length} Saved Address{savedAddresses.length > 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* Location Actions: GPS Auto-Detect vs Manual Entry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={detectLocation}
          disabled={isLocating}
          className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 transition-all flex items-center gap-2.5 cursor-pointer text-left shadow-3xs"
        >
          <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            {isLocating ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </div>
          <div>
            <span className="text-xs font-extrabold block">
              {isLocating ? "Detecting GPS..." : "📍 Auto-Detect via Device GPS"}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium block">
              Pinpoints exact doorstep coordinates
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setEditingAddressId(null);
            setShowAddressForm(true);
          }}
          className={`p-3 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer text-left ${
            showAddressForm && !editingAddressId
              ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 shadow-3xs"
              : "border-slate-200 bg-[#F8FAF9] hover:bg-slate-100 text-[#002A22]"
          }`}
        >
          <div className="h-8 w-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-extrabold block">
              ✏️ Enter Address Manually
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              Flat, Door No, Landmark &amp; Pincode
            </span>
          </div>
        </button>
      </div>

      {/* Saved Addresses List */}
      {!showAddressForm && savedAddresses.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Choose From Saved Addresses:
          </span>
          {savedAddresses.map((addr) => {
            const isSelected = form.address === addr.address;
            return (
              <div
                key={addr.id}
                onClick={() => {
                  setForm((f) => ({
                    ...f,
                    address: addr.address,
                    landmark: addr.landmark || "",
                    city: addr.city || "Guntur",
                    pincode: addr.pincode || "",
                    gpsCoords: addr.gpsCoords || f.gpsCoords,
                    mapsLink: addr.mapsLink || f.mapsLink,
                  }));
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/30 shadow-xs"
                    : "bg-[#F8FAF9] border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {addr.type === "Office" ? "🏢" : addr.type === "Current Location" ? "📍" : "🏠"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-[#002A22]">
                          {addr.type || "Home"}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Selected ✓
                          </span>
                        )}
                        {addr.gpsCoords && (
                          <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded">
                            GPS Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        {addr.address}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {addr.landmark ? `${addr.landmark}, ` : ""}{addr.city} - {addr.pincode}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      type="button"
                      title="Delete Address"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = savedAddresses.filter((a) => a.id !== addr.id);
                        setSavedAddresses(updated);
                        try {
                          localStorage.setItem("thedeepcleanz_saved_addresses", JSON.stringify(updated));
                        } catch (err) {}
                        if (form.address === addr.address) {
                          if (updated.length > 0) {
                            setForm((f) => ({
                              ...f,
                              address: updated[0].address,
                              landmark: updated[0].landmark || "",
                              city: updated[0].city || "Guntur",
                              pincode: updated[0].pincode || "",
                            }));
                          } else {
                            setForm((f) => ({ ...f, address: "", landmark: "", pincode: "" }));
                            setShowAddressForm(true);
                          }
                        }
                        toast.success("Address removed.");
                      }}
                      className="text-xs text-slate-400 hover:text-rose-600 p-1 cursor-pointer bg-transparent border-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Address Input Form */}
      {showAddressForm && (
        <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-slate-200 space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#002A22]">
              {editingAddressId ? "Edit Address" : "Enter Delivery Address Details"}
            </span>
            <div className="flex gap-1">
              {["Home", "Office", "Other"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setNewAddrType(tag)}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    newAddrType === tag
                      ? "bg-emerald-800 text-white border-emerald-800"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              House / Flat / Door No. &amp; Building Name <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Flat 302, Sri Sai Residency, 4th Cross Road..."
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 resize-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Area / Landmark
              </label>
              <input
                placeholder="e.g. Near Collectorate Office"
                value={form.landmark}
                onChange={(e) => setForm((prev) => ({ ...prev, landmark: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600 font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="e.g. 522002"
                value={form.pincode}
                onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 font-bold">
              City: {form.city || "Guntur"}
            </span>
            <div className="flex gap-2">
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!form.address.trim() || !form.pincode.trim()) {
                    toast.error("Please enter House/Street address and 6-digit Pincode");
                    return;
                  }
                  const newAddr: SavedAddress = {
                    id: editingAddressId || `addr-${Date.now()}`,
                    type: newAddrType,
                    address: form.address.trim(),
                    landmark: form.landmark.trim(),
                    city: form.city || "Guntur",
                    pincode: form.pincode.trim(),
                    isDefault: savedAddresses.length === 0,
                  };
                  const updated = [newAddr, ...savedAddresses.filter((a) => a.id !== newAddr.id)];
                  setSavedAddresses(updated);
                  try {
                    localStorage.setItem("thedeepcleanz_saved_addresses", JSON.stringify(updated));
                  } catch (e) {}
                  setShowAddressForm(false);
                  toast.success("Address saved & applied!");
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold cursor-pointer border-0 shadow-xs hover:bg-emerald-900"
              >
                Save &amp; Apply Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
