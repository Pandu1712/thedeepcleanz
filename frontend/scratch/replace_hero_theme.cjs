const fs = require('fs');

const filePath = 'c:\\Users\\User\\Downloads\\thedeepcleanz\\frontend\\src\\routes\\index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStart = '{/* HERO SECTION - LUXURY DARK EMERALD & GOLD THEME */}';
const startIndex = content.indexOf(targetStart);

if (startIndex === -1) {
  console.error("Could not find HERO SECTION start comment");
  process.exit(1);
}

const targetEnd = '{/* Right Column: High-End Hero Showcase Card */}';
const endIndex = content.indexOf(targetEnd);

if (endIndex === -1) {
  console.error("Could not find HERO SECTION right column showcase card comment");
  process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

const newHeroContent = `
      {/* HERO SECTION - LIGHT CHAMPAGNE & GOLD LUXURY THEME */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#F4EDE0] to-[#EBE2CF] text-[#002a22] py-10 sm:py-14 md:py-16 border-b border-[#cb9f5a]/30"
      >
        {/* Ambient background radial glow effects */}
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-[#cb9f5a]/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 -right-32 h-96 w-96 rounded-full bg-[#cb9f5a]/10 blur-[130px] pointer-events-none" />
        <div className="absolute top-10 right-1/4 h-64 w-64 rounded-full bg-[#cb9f5a]/10 blur-[100px] pointer-events-none" />

        {/* Decorative Grid Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cb9f5a0d_1px,transparent_1px),linear-gradient(to_bottom,#cb9f5a0d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-8 z-10">
          <div className="grid gap-10 lg:grid-cols-12 items-center">
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              {/* Premium Pill Badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[#cb9f5a]/40 bg-[#cb9f5a]/10 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#cb9f5a] backdrop-blur-md shadow-sm animate-fade-in-left"
                style={{ animationDelay: "100ms" }}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#cb9f5a] animate-pulse" />
                <span>INDIA'S #1 RATED LUXURY CLEANING SERVICE</span>
              </div>

              {/* Main Headline */}
              <h1
                className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-[#002a22] animate-fade-in-left"
                style={{ animationDelay: "200ms" }}
              >
                Spotless Spaces,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5be7a] via-[#cb9f5a] to-[#f5d089] font-serif italic font-normal">
                  Happier Places.
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="mt-3 max-w-xl text-xs sm:text-sm text-[#3a4d49] font-medium leading-relaxed animate-fade-in-left"
                style={{ animationDelay: "300ms" }}
              >
                Hospital-grade deep cleaning, hot-water extraction, and eco-friendly sanitization engineered by background-verified specialists for premium homes & corporate spaces.
              </p>

              {/* Trust Feature Badges */}
              <div
                className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg animate-fade-in-left"
                style={{ animationDelay: "400ms" }}
              >
                <div className="flex items-center gap-2.5 rounded-2xl border border-[#cb9f5a]/30 bg-white/60 backdrop-blur-md p-2.5 shadow-sm transition-transform hover:scale-[1.02]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#cb9f5a]/10 text-[#cb9f5a] font-bold text-sm shrink-0 border border-[#cb9f5a]/30">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-[11px] font-bold text-[#002a22]">Verified</div>
                    <div className="text-[9px] text-[#cb9f5a] font-semibold">Professionals</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl border border-[#cb9f5a]/30 bg-white/60 backdrop-blur-md p-2.5 shadow-sm transition-transform hover:scale-[1.02]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-sm shrink-0 border border-emerald-500/20">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-[11px] font-bold text-[#002a22]">100% Eco</div>
                    <div className="text-[9px] text-emerald-600 font-semibold">Biological</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl border border-[#cb9f5a]/30 bg-white/60 backdrop-blur-md p-2.5 shadow-sm transition-transform hover:scale-[1.02]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#cb9f5a]/10 text-[#cb9f5a] font-bold text-sm shrink-0 border border-[#cb9f5a]/30">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-[11px] font-bold text-[#002a22]">On-Time</div>
                    <div className="text-[9px] text-[#cb9f5a] font-semibold">Guaranteed</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Promo */}
              <div
                className="mt-6 flex flex-wrap gap-3.5 items-center w-full animate-fade-in-left"
                style={{ animationDelay: "500ms" }}
              >
                <a
                  href="#categories"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#cb9f5a] via-[#e5be7a] to-[#cb9f5a] px-7 py-3.5 text-xs font-black uppercase tracking-wider text-[#002a22] shadow-[0_10px_30px_-5px_rgba(203,159,90,0.5)] transition-all hover:scale-105 active:scale-95 hover:shadow-[0_15px_40px_-5px_rgba(203,159,90,0.7)] cursor-pointer"
                >
                  <span>Book Your Service</span>
                  <ArrowRight className="h-4 w-4 text-[#002a22]" />
                </a>
                <a
                  href="#categories"
                  className="inline-flex items-center gap-2 rounded-full border border-[#cb9f5a]/30 bg-white/80 hover:bg-[#002a22]/5 px-6 py-3.5 text-xs font-bold text-[#002a22] shadow-3xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Explore Packages</span>
                  <ArrowRight className="h-4 w-4 text-[#cb9f5a]" />
                </a>
              </div>

              {/* Live Rating & Stats Footprint */}
              <div
                className="mt-6 pt-5 border-t border-[#cb9f5a]/25 flex items-center gap-6 text-xs text-[#3a4d49] font-semibold animate-fade-in-left"
                style={{ animationDelay: "600ms" }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex text-[#cb9f5a]">
                    {"★".repeat(5)}
                  </div>
                  <span className="font-bold text-[#002a22]">4.9/5.0</span>
                  <span className="text-[10px] text-slate-500">(2,800+ Reviews)</span>
                </div>
                <div className="h-3 w-px bg-[#cb9f5a]/30" />
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#002a22]">Guntur & 25+</span>
                  <span className="text-[10px] text-slate-500">AP Cities</span>
                </div>
              </div>
            </div>

            `;

fs.writeFileSync(filePath, before + newHeroContent + after, 'utf8');
console.log("Successfully replaced hero section background and style to light champagne!");
