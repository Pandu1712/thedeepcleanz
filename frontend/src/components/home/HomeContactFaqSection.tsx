import React, { useState } from "react";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle2,
  User,
  Check,
  Star,
  MessageCircle,
  Loader2,
  Send,
  Map as MapIcon,
} from "lucide-react";
import { ADMIN_API_URL } from "@/api/admin-api";

export default function HomeContactFaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactService, setContactService] = useState("Full House Deep Cleaning");
  const [contactMessage, setContactMessage] = useState("");
  const [contactTouched, setContactTouched] = useState({ name: false, phone: false });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  const isContactNameValid =
    contactName.trim().length >= 2 && /^[A-Za-z\s]{2,60}$/.test(contactName.trim());
  const isContactPhoneValid = /^[6-9]\d{9}$/.test(contactPhone.replace(/\D/g, ""));

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactTouched({ name: true, phone: true });

    if (!contactName.trim()) {
      toast.error("Please enter your name (letters only)");
      return;
    }
    if (!isContactNameValid) {
      toast.error("Name must contain letters only (at least 2 characters)");
      return;
    }
    if (!contactPhone.trim()) {
      toast.error("Please enter your 10-digit mobile number");
      return;
    }
    if (!isContactPhoneValid) {
      toast.error("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9");
      return;
    }

    setIsSubmittingContact(true);
    const toastId = toast.loading("Submitting your request to our concierge...", { id: "contact-submit" });

    try {
      const res = await fetch(`${ADMIN_API_URL}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName.trim(),
          phone: contactPhone.trim(),
          service: contactService,
          message: contactMessage.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Thank you! Our deep cleaning concierge will call you within 15 minutes.", {
          id: toastId,
          duration: 5000,
        });
        setContactName("");
        setContactPhone("");
        setContactMessage("");
        setContactTouched({ name: false, phone: false });
      } else {
        toast.error("Could not send your request right now. Please try calling directly.", {
          id: toastId,
        });
      }
    } catch (err) {
      toast.error("Could not send your request. Please call our direct helpline.", {
        id: toastId,
      });
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
      <section
        id="contact"
        className="relative overflow-hidden bg-[#fcfbfa] border-t border-[#f1ede6] py-16 md:py-20 text-[#002a22]"
      >
        {/* Subtle Luxury Glow Blobs */}
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#cb9f5a]/3 blur-3xl pointer-events-none" />
        <div className="absolute -left-48 bottom-0 h-96 w-96 rounded-full bg-[#cb9f5a]/3 blur-3xl pointer-events-none" />

        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 lg:grid-cols-12 lg:px-8 relative z-10">
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#cb9f5a] font-extrabold px-3 py-1.5 bg-[#cb9f5a]/5 rounded-lg border border-[#cb9f5a]/15 inline-block">
                Get In Touch
              </span>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold leading-tight text-[#002a22]">
                Ready for a <span className="text-[#cb9f5a] block sm:inline">Spotless Space?</span>
              </h2>
              <p className="mt-3 max-w-md text-xs sm:text-sm text-[#002a22]/70 leading-relaxed font-sans font-medium">
                Book a premium deep cleaning service today or reach out for customized quotes. Our
                customer support team responds within minutes.
              </p>
            </div>

            <div className="space-y-4 font-sans mt-2">
              {/* Card 1: Phone Support */}
              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-[#f1ede6] hover:border-[#cb9f5a]/30 hover:bg-[#faf8f5]/50 transition-all duration-300 shadow-2xs hover:shadow-sm group">
                <div className="flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl bg-[#cb9f5a]/5 text-[#cb9f5a] border border-[#cb9f5a]/20 group-hover:scale-105 transition-transform duration-300">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#cb9f5a]">
                    Phone Support
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-[#002a22] mt-0.5 whitespace-nowrap">
                    <span className="whitespace-nowrap font-mono tracking-tight select-all">+91 99663 46347</span>
                  </p>
                  <p className="text-[9px] text-[#002a22]/60 font-semibold mt-0.5">
                    Mon - Sun: 8:00 AM - 8:00 PM
                  </p>
                </div>
              </div>

              {/* Card 2: Email support */}
              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-[#f1ede6] hover:border-[#cb9f5a]/30 hover:bg-[#faf8f5]/50 transition-all duration-300 shadow-2xs hover:shadow-sm group">
                <div className="flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl bg-[#cb9f5a]/5 text-[#cb9f5a] border border-[#cb9f5a]/20 group-hover:scale-105 transition-transform duration-300">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#cb9f5a]">
                    Email Inquiries
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-[#002a22] mt-0.5">
                    thedeepcleanerz.info@gmail.com
                  </p>
                  <p className="text-[9px] text-[#002a22]/60 font-semibold mt-0.5">
                    Response Time: Under 15 Minutes
                  </p>
                </div>
              </div>

              {/* Card 3: Address support */}
              <div className="flex gap-4 p-5 rounded-2xl bg-white border border-[#f1ede6] hover:border-[#cb9f5a]/30 hover:bg-[#faf8f5]/50 transition-all duration-300 shadow-2xs hover:shadow-sm group">
                <div className="flex-shrink-0 grid h-10 w-10 place-items-center rounded-xl bg-[#cb9f5a]/5 text-[#cb9f5a] border border-[#cb9f5a]/20 group-hover:scale-105 transition-transform duration-300">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#cb9f5a]">
                    Headquarters Address
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-[#002a22] mt-0.5">
                    Arundelpet, Guntur, AP
                  </p>
                  <p className="text-[9px] text-[#002a22]/60 font-semibold mt-0.5">
                    Pincode: 522002
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Premium Request Callback Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleContactSubmit}
              noValidate
              className="bg-white rounded-3xl p-6 md:p-8 border border-[#f1ede6] shadow-md hover:shadow-lg transition-shadow duration-300 space-y-5 relative"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-[#002a22]">
                    Request a Quick Callback
                  </h3>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#007A48] bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#007A48] animate-pulse" />
                    15-Min Response
                  </span>
                </div>
                <p className="text-xs text-[#002a22]/60 mt-1 font-medium font-sans">
                  Leave your details and our senior cleaning concierge in Guntur will contact you shortly.
                </p>
              </div>

              <div className="space-y-4 font-sans text-xs">
                {/* 1. Name Field */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={contactName}
                      onChange={(e) => {
                        // Strict filter: letters and spaces only
                        const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                        setContactName(val);
                      }}
                      onBlur={() => setContactTouched((prev) => ({ ...prev, name: true }))}
                      className={`w-full rounded-xl border bg-[#faf8f5] pl-10 pr-10 py-3.5 text-xs text-[#002a22] placeholder:text-[#002a22]/35 outline-none font-semibold transition-all ${
                        contactTouched.name && !isContactNameValid
                          ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                          : contactName && isContactNameValid
                          ? "border-emerald-500/80 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
                          : "border-[#f1ede6] focus:border-[#cb9f5a] focus:bg-white focus:ring-1 focus:ring-[#cb9f5a]/20"
                      }`}
                    />
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#002a22]/40" />
                    {contactName && isContactNameValid && (
                      <Check className="absolute right-3.5 top-3.5 h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  {contactTouched.name && !isContactNameValid && (
                    <p className="text-[10px] text-red-600 font-semibold mt-1 animate-in fade-in duration-200">
                      ⚠️ Please enter letters only (minimum 2 characters, no numbers).
                    </p>
                  )}
                </div>

                {/* 2. Mobile Phone Number Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[9px] font-bold text-slate-400">
                      {contactPhone.length}/10 Digits
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center gap-1 text-[#002a22]/60 font-bold border-r border-slate-200 pr-2">
                      <Phone className="h-3.5 w-3.5 text-[#002a22]/40" />
                      <span className="text-[11px]">+91</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      value={contactPhone}
                      onChange={(e) => {
                        // Strict filter: numbers only, max 10 digits
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setContactPhone(val);
                      }}
                      onBlur={() => setContactTouched((prev) => ({ ...prev, phone: true }))}
                      className={`w-full rounded-xl border bg-[#faf8f5] pl-20 pr-10 py-3.5 text-xs text-[#002a22] placeholder:text-[#002a22]/35 outline-none font-semibold transition-all ${
                        contactTouched.phone && !isContactPhoneValid
                          ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                          : contactPhone.length === 10 && isContactPhoneValid
                          ? "border-emerald-500/80 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
                          : "border-[#f1ede6] focus:border-[#cb9f5a] focus:bg-white focus:ring-1 focus:ring-[#cb9f5a]/20"
                      }`}
                    />
                    {contactPhone.length === 10 && isContactPhoneValid && (
                      <Check className="absolute right-3.5 top-3.5 h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  {contactTouched.phone && !isContactPhoneValid && (
                    <p className="text-[10px] text-red-600 font-semibold mt-1 animate-in fade-in duration-200">
                      ⚠️ Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.
                    </p>
                  )}
                </div>

                {/* 3. Service Required Field */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Service Required
                  </label>
                  <div className="relative">
                    <select
                      value={contactService}
                      onChange={(e) => setContactService(e.target.value)}
                      className="w-full rounded-xl border border-[#f1ede6] bg-[#faf8f5] pl-10 pr-8 py-3.5 text-xs text-[#002a22] font-semibold outline-none focus:border-[#cb9f5a] focus:bg-white focus:ring-1 focus:ring-[#cb9f5a]/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Full House Deep Cleaning">🏠 Full House Deep Cleaning</option>
                      <option value="Furnished Apartment Cleaning">🛋️ Furnished Apartment Cleaning</option>
                      <option value="Vacant / Moving Flat Cleaning">📦 Vacant / Moving Flat Cleaning</option>
                      <option value="Bungalow / Villa Deep Sanitation">🏡 Bungalow / Villa Deep Sanitation</option>
                      <option value="Kitchen Deep Degreasing">🍳 Kitchen Deep Degreasing</option>
                      <option value="Bathroom Sanitization & Descaling">🚿 Bathroom Sanitization & Descaling</option>
                      <option value="Sofa & Upholstery Shampooing">🛋️ Sofa & Upholstery Shampooing</option>
                      <option value="Carpet & Mattress Deep Cleaning">🧹 Carpet & Mattress Deep Cleaning</option>
                      <option value="Commercial Post-Construction Clean">🏢 Commercial Post-Construction Clean</option>
                      <option value="Other Custom Cleaning Requirement">✨ Other Custom Cleaning Requirement</option>
                    </select>
                    <Star className="absolute left-3.5 top-3.5 h-4 w-4 text-[#002a22]/40 pointer-events-none" />
                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#002a22]/40 pointer-events-none" />
                  </div>
                </div>

                {/* 4. Message / Note Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Message / Special Requests <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <span className="text-[9px] font-bold text-slate-400">
                      {contactMessage.length}/300
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      rows={3}
                      maxLength={300}
                      placeholder="Share your requirements (e.g. 3 BHK in Arundelpet, prefer weekend slot)..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full rounded-xl border border-[#f1ede6] bg-[#faf8f5] pl-10 pr-4 py-3 text-xs text-[#002a22] placeholder:text-[#002a22]/35 outline-none focus:border-[#007A48] focus:bg-white focus:ring-1 focus:ring-[#007A48]/20 transition-all resize-none font-semibold"
                    />
                    <MessageCircle className="absolute left-3.5 top-3.5 h-4 w-4 text-[#002a22]/40" />
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#007A48] hover:bg-[#005B36] py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#007A48]/30 hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmittingContact ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Request & Get 15-Min Callback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* OFFICE LOCATION GOOGLE MAPS EMBED */}
        <div className="mx-auto max-w-[1400px] px-5 lg:px-8 mt-12 relative z-10">
          <div className="rounded-3xl overflow-hidden border border-[#f1ede6] shadow-md hover:shadow-lg transition-all duration-300 h-80 w-full relative group">
            {/* Absolute overlay visual hint */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 bg-[#002a22] border border-[#cb9f5a]/30 rounded-full text-[10px] font-bold text-white shadow-md">
              <MapIcon className="h-3.5 w-3.5 text-[#cb9f5a]" />
              <span>Headquarters Location Map</span>
            </div>

            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3829.2945379659127!2d80.438992875141!3d16.307887884406753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTbCsDE4JzI4LjQiTiA4MMKwMjYnMjkuNiJF!5e0!3m2!1sen!2sin!4v1784366519525!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="TheDeep CleanerZ Office Location"
              className="grayscale-[30%] contrast-[105%] group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </div>
      </section>

  );
}
