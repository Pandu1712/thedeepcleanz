import { type Service } from "@/data/servicesData";
import { type ServicePlan } from "@/api/admin-api";

export function sanitizeItemList(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item;
      if (typeof item === "object") return item.name || item.title || item.label || "";
      return String(item);
    })
    .filter(Boolean);
}

export function getPlanInclusionsAndExclusions(
  service: Service | any,
  plan?: ServicePlan | any
): {
  inclusions: string[];
  exclusions: string[];
} {
  if (plan?.includes && Array.isArray(plan.includes) && plan.includes.length > 0) {
    return {
      inclusions: sanitizeItemList(plan.includes),
      exclusions:
        plan.excludes && Array.isArray(plan.excludes) && plan.excludes.length > 0
          ? sanitizeItemList(plan.excludes)
          : [
              "Interior cleaning of packed cabinets/wardrobes (unless empty)",
              "Appliance internal motor dismantlement or repair",
              "Severe acid etch or permanent paint scraping",
              "Moving excessively heavy furniture without customer help",
            ],
    };
  }

  const sId = (service?.id || "").toLowerCase();
  const sTitle = (service?.title || "").toLowerCase();
  const pName = (plan?.name || "").toLowerCase();

  // Full House Deep Cleaning
  if (
    sId.includes("house") ||
    sId.includes("home") ||
    sId.includes("villa") ||
    sId.includes("apartment") ||
    sTitle.includes("house") ||
    sTitle.includes("home")
  ) {
    return {
      inclusions: [
        "Deep dusting of all rooms",
        "Floor scrubbing & wet mopping",
        "Fan, light, switchboard & skirting cleaning",
        "Window & grill deep cleaning (inside)",
        "Door, frame & knob cleaning",
        "Kitchen slab, tiles, sink & stove area deep cleaning",
        "Cabinet exterior degreasing",
        "Bathroom deep cleaning (WC, tiles, basin)",
        "Hard-water stain reduction (moderate)",
        "Balcony deep cleaning",
        "Cobweb removal & detailed corner cleaning",
        "Appliance exterior cleaning",
        "Sofa & furniture exterior dusting (no shampoo)",
      ],
      exclusions: [
        "Interior cleaning of cabinets/wardrobes",
        "Chimney cleaning or motor degreasing",
        "Appliance interior cleaning (fridge/microwave/oven)",
        "Sofa, mattress or carpet shampooing",
        "Wall washing or ceiling cleaning",
        "Removal of cement, paint or glue",
        "Heavy limescale/acid stain removal",
        "Electrical, plumbing or repair work",
        "Marble polishing or machine buffing",
      ],
    };
  }

  // Kitchen Deep Cleaning
  if (sId.includes("kitchen") || sTitle.includes("kitchen")) {
    const withChimney = pName.includes("with chimney") || pName.includes("occupied");
    const isEmpty = pName.includes("empty") || pName.includes("flat");

    if (isEmpty) {
      return {
        inclusions: [
          "Complete empty modular cabinet interior & exterior wipedown",
          "Kitchen slab, granite countertop & tiles deep scrubbing",
          "Stainless steel sink & chrome faucet limescale removal",
          "Exhaust fan, ceiling fan & switchboards deep cleaning",
          "Floor scrubbing, chemical degreasing & wet mopping",
          "Drain pipe hot water flush & cobweb removal",
        ],
        exclusions: [
          "Chimney deep degreasing (choose 'With Chimney' package)",
          "Cleaning utensils, dishes or packed food containers",
          "Permanent construction cement or wall paint scraping",
          "Plumbing repair work or pipe replacement",
        ],
      };
    }

    return {
      inclusions: [
        ...(withChimney
          ? ["Chimney exterior degreasing & baffle filter power wash"]
          : []),
        "Gas stove, burner tops & control knob detailed scrub",
        "Exhaust fan & ceiling fan blade deep degreasing",
        "Kitchen tiles backsplash & oil grout stain removal",
        "Countertop & sink hard-water limescale removal",
        "Modular cabinet exterior degreasing & handle shine",
        "Floor degreasing, chemical scrub & mop",
        "Cobweb removal & switchboard sanitization",
        "Sink drain pipe hot water flush & odour elimination",
        "Appliance exterior wipe (Microwave / Refrigerator)",
      ],
      exclusions: [
        ...(!withChimney
          ? ["Chimney filter or motor cleaning (choose 'With Chimney' option)"]
          : []),
        "Interior cleaning of packed cabinets/drawers with utensils inside",
        "Appliance interior steam cleaning (available as add-on)",
        "Wall washing or ceiling scrubbing",
        "Plumbing repairs, pipe replacement or gas leak fixes",
        "Permanent chemical acid stain removal from marble",
      ],
    };
  }

  // Bathroom Deep Cleaning
  if (
    sId.includes("bath") ||
    sId.includes("toilet") ||
    sId.includes("washroom") ||
    sTitle.includes("bathroom")
  ) {
    return {
      inclusions: [
        "Commode (WC) & toilet seat inside-out descaling & clinical sanitization",
        "Wall tiles stain removal & grout line scrubbing",
        "Floor tiles mechanical scrubbing & yellow stain reduction",
        "Washbasin, vanity counter & mirror crystal shine",
        "Shower head, taps & chrome fittings limescale removal",
        "Exhaust fan, door, geyser exterior & window wipe",
        "Drain cover descaling & anti-odour treatment",
      ],
      exclusions: [
        "Removal of severe etched acid burns on marble or stone floors",
        "Silicone sealant replacement or grout re-filling",
        "Plumbing pipe blockage clearing or tap replacement",
        "Washing personal toiletries or clothes",
      ],
    };
  }

  // Sofa / Carpet / Mattress
  if (
    sId.includes("sofa") ||
    sId.includes("carpet") ||
    sId.includes("mattress") ||
    sId.includes("upholstery") ||
    sTitle.includes("sofa")
  ) {
    return {
      inclusions: [
        "High-power commercial vacuuming for dust mite & allergen extraction",
        "Fabric-specific foam shampooing & stain spot treatment",
        "Deep extraction moisture vacuuming (dries in 2–4 hours)",
        "Anti-bacterial sanitization & fabric deodorization",
        "Cushion sides & base crevice deep cleaning",
      ],
      exclusions: [
        "Removal of permanent ink, turmeric, oil or bleach burn stains",
        "Torn fabric, stitching or cushion foam repair",
        "Leather re-dyeing or leather scratch repair",
        "Washing loose cushion covers with machine wash",
      ],
    };
  }

  // Default fallback
  return {
    inclusions: [
      "Complete clinical sanitization of targeted area",
      "Removal of stubborn grease, grime & sticky residue",
      "Food-safe anti-bacterial disinfection & deodorization",
      "Exterior wipe of fittings, frames & switchboards",
      "Final supervisor quality check & customer sign-off",
    ],
    exclusions: [
      "Internal mechanical or electrical hardware repairs",
      "Removal of permanent construction paint, cement or glue",
      "Wall washing or ceiling repainting",
      "Moving excessively heavy furniture without customer assistance",
    ],
  };
}

export function resolveServicePlans(service: any): ServicePlan[] {
  if (!service) return [];

  let rawPlans: any[] = [];
  if (Array.isArray(service.plans)) {
    rawPlans = service.plans;
  } else if (typeof service.plans === "string") {
    try {
      const parsed = JSON.parse(service.plans);
      if (Array.isArray(parsed)) rawPlans = parsed;
    } catch (e) {}
  }

  // If service has 2 or more custom plans defined, use them
  if (rawPlans.length > 1) {
    return rawPlans.map((p: any) => ({
      name: p?.name || "Standard Plan",
      price: typeof p?.price === "number" ? p.price : service.price || 0,
      duration: p?.duration || "2 - 3 hours",
      description: p?.description || p?.desc || service.desc || "",
      includes: Array.isArray(p?.includes)
        ? sanitizeItemList(p.includes)
        : Array.isArray(service.sub)
          ? sanitizeItemList(service.sub)
          : [],
      excludes: Array.isArray(p?.excludes) ? sanitizeItemList(p.excludes) : [],
    }));
  }

  const basePrice = Number(service.price) || 1499;
  const sTitle = (service.title || "").toLowerCase();
  const sId = (service.id || "").toLowerCase();

  // Full House / Vacant / Furnished / Villa Plans (3 Tiers)
  if (
    sId.includes("house") ||
    sId.includes("vacant") ||
    sId.includes("furnished") ||
    sId.includes("villa") ||
    sId.includes("bhk") ||
    sTitle.includes("vacant") ||
    sTitle.includes("furnished") ||
    sTitle.includes("bhk") ||
    sTitle.includes("house")
  ) {
    const isVacant = sId.includes("vacant") || sTitle.includes("vacant");
    const expressPrice = basePrice;
    const classicPrice = Math.max(expressPrice + 500, Math.round((basePrice * 1.38) / 50) * 50);
    const premiumPrice = Math.max(classicPrice + 700, Math.round((basePrice * 1.75) / 50) * 50);

    return [
      {
        name: "Express Clean",
        price: expressPrice,
        duration: "2 - 3 hours",
        description: isVacant
          ? "Essential move-in wipe down, floor scrubbing, bathroom sanitization and empty cabinet dust wipe."
          : "Essential deep dusting of rooms, floor scrubbing, bathroom descaling & kitchen counters degreasing.",
        includes: [
          "Deep dusting of all rooms & cobweb removal",
          "Dry & wet floor scrubbing with eco-friendly agents",
          "Bathroom descaling, sanitization & WC polish",
          "Kitchen platform, sink, tiles & stove wipedown",
          isVacant
            ? "Inside-out dust wipedown of empty wardrobes"
            : "Balcony wash & window glass surface wipe",
        ],
        excludes: [
          "Single-disc heavy machine floor scrub",
          "Hospital-grade high-temperature steam sterilization",
          "Interior cabinet wet washing with utensils inside",
        ],
      },
      {
        name: "Classic Deep Clean",
        price: classicPrice,
        duration: "4 - 5 hours",
        description: isVacant
          ? "Comprehensive move-in deep cleaning with single-disc machine floor scrub and inside-out cabinet detailing."
          : "Comprehensive deep clean with machine floor buffing, window channels detailing & kitchen degreasing.",
        includes: [
          "All Express Clean inclusions",
          "Single-disc mechanical floor scrubbing & buffing",
          "All empty wardrobes & kitchen modular cabinets washed inside-out",
          "Window channels, glass tracks, sliders & balcony deep wash",
          "Kitchen exhaust fan & chimney exterior deep degreasing",
          "Multi-bathroom deep tile limescale removal",
        ],
        excludes: [
          "High-temperature steam disinfection (Included in Premium)",
          "Upholstery / sofa foam shampooing",
        ],
      },
      {
        name: "Premium Sanitized",
        price: premiumPrice,
        duration: "5 - 7 hours",
        description: "Hospitality-grade clinical deep clean with 140°C steam sterilization, germicidal fogging & protective surface sealant.",
        includes: [
          "All Classic Deep Clean inclusions",
          "140°C High-temperature steam disinfection for bathrooms & kitchen",
          "Paint specks, minor cement residue & hard adhesive spot removal",
          "Hospital-grade anti-bacterial fogging & odor neutralizing",
          "Protective surface shine & chrome fittings sealant application",
        ],
        excludes: [
          "Permanent structural acid etched stain removal from raw marble",
          "Electrical appliance internal motor repairs",
        ],
      },
    ];
  }

  // Kitchen Deep Cleaning (3 Tiers)
  if (sId.includes("kitchen") || sTitle.includes("kitchen")) {
    const p1 = basePrice;
    const p2 = Math.max(p1 + 400, Math.round((basePrice * 1.35) / 50) * 50);
    const p3 = Math.max(p2 + 500, Math.round((basePrice * 1.7) / 50) * 50);

    return [
      {
        name: "Standard Kitchen",
        price: p1,
        duration: "2 - 3 hours",
        description: "Deep scrubbing of countertop, stovetop, wall tiles backsplash, sink and floor degreasing.",
        includes: [
          "Countertop, sink & faucet hard-water limescale removal",
          "Gas stove burner tops, knobs & tray detailed scrub",
          "Kitchen wall tiles backsplash oil & grout degreasing",
          "Modular cabinet exterior wipedown & floor mop",
        ],
        excludes: [
          "Chimney baffle filter power wash",
          "Interior cabinet cleaning with utensils inside",
        ],
      },
      {
        name: "Kitchen with Chimney",
        price: p2,
        duration: "3 - 4 hours",
        description: "Complete kitchen deep clean with chimney hood degreasing, baffle filter wash & exhaust fan scrub.",
        includes: [
          "All Standard Kitchen inclusions",
          "Chimney hood degreasing & baffle filter power wash",
          "Exhaust fan & ceiling fan blade deep degreasing",
          "Refrigerator & microwave exterior clinical wipe",
          "Drain pipe hot water flush & odor elimination",
        ],
        excludes: [
          "Interior steam disinfection (Included in Premium)",
        ],
      },
      {
        name: "Ultra Steam Kitchen",
        price: p3,
        duration: "4 - 5 hours",
        description: "Ultimate clinical kitchen overhaul with steam sterilization, inside-out empty cabinets & appliance degreasing.",
        includes: [
          "All Kitchen with Chimney inclusions",
          "140°C High-temp steam sterilization on tiles & sink",
          "Inside-out wipedown of empty modular cabinets & drawers",
          "Microwave & Refrigerator interior clinical steam wipe",
          "Anti-microbial counter polish & drain sanitization",
        ],
        excludes: [
          "Chimney motor dismantling or electrical repair",
        ],
      },
    ];
  }

  // Bathroom Deep Cleaning (3 Tiers)
  if (sId.includes("bath") || sId.includes("toilet") || sTitle.includes("bath")) {
    const p1 = basePrice;
    const p2 = Math.max(p1 + 300, Math.round((basePrice * 1.45) / 50) * 50);
    const p3 = Math.max(p2 + 400, Math.round((basePrice * 1.9) / 50) * 50);

    return [
      {
        name: "Express Bathroom",
        price: p1,
        duration: "40 - 50 mins",
        description: "Essential manual descaling, WC sanitization, washbasin shine and floor scrubbing.",
        includes: [
          "Commode (WC) inside-out descaling & sanitization",
          "Washbasin, mirror & chrome taps limescale removal",
          "Floor tiles manual scrubbing & drain wash",
        ],
        excludes: [
          "Single-disc mechanical wall buffing",
          "Steam sanitization",
        ],
      },
      {
        name: "Classic Deep Clean",
        price: p2,
        duration: "60 - 80 mins",
        description: "Intensive multi-chemical bathroom deep descaling with wall grout scrubbing & exhaust fan wipe.",
        includes: [
          "All Express Bathroom inclusions",
          "Wall tiles stain removal & grout line scrub",
          "Shower partition glass hard-water mark reduction",
          "Exhaust fan, geyser exterior & door wipedown",
          "Anti-odour enzyme drain flush",
        ],
        excludes: [
          "Steam sterilization (Included in Premium)",
        ],
      },
      {
        name: "Intensive Steam Sanitize",
        price: p3,
        duration: "80 - 100 mins",
        description: "Clinical-grade bathroom restoration with 140°C steam disinfection, silicone mold treatment & nano-sealant.",
        includes: [
          "All Classic Deep Clean inclusions",
          "140°C Steam sterilization across WC, tiles & corners",
          "Shower glass hydrophobic nano-coating",
          "Tile grout bleaching & stubborn yellow stain treatment",
          "Germicidal anti-bacterial fogging",
        ],
        excludes: [
          "Permanent acid etch damage on marble floors",
        ],
      },
    ];
  }

  // Sofa / Carpet / Mattress Cleaning (3 Tiers)
  if (
    sId.includes("sofa") ||
    sId.includes("carpet") ||
    sId.includes("mattress") ||
    sTitle.includes("sofa") ||
    sTitle.includes("carpet") ||
    sTitle.includes("mattress")
  ) {
    const p1 = basePrice;
    const p2 = Math.max(p1 + 400, Math.round((basePrice * 1.35) / 50) * 50);
    const p3 = Math.max(p2 + 500, Math.round((basePrice * 1.7) / 50) * 50);

    return [
      {
        name: "Standard Shampoo",
        price: p1,
        duration: "45 - 60 mins",
        description: "High-power dry vacuuming, fabric foam shampooing and moisture extraction.",
        includes: [
          "Commercial dry vacuuming to remove dust mites",
          "Eco-friendly fabric foam shampooing",
          "Moisture extraction (dries within 2–4 hours)",
        ],
        excludes: [
          "Steam sanitization",
          "Anti-allergen sanitization",
        ],
      },
      {
        name: "Deep Stain Extraction",
        price: p2,
        duration: "60 - 75 mins",
        description: "Intensive spot treatment for food/oil stains, deep extraction and anti-odor deodorization.",
        includes: [
          "All Standard Shampoo inclusions",
          "Heavy spot stain treatment for stubborn marks",
          "Fabric deodorizing & freshness infusion",
          "Cushion sides & crevice deep detailing",
        ],
        excludes: [
          "Steam sanitization",
        ],
      },
      {
        name: "Ultra Steam & Anti-Allergen",
        price: p3,
        duration: "75 - 90 mins",
        description: "Complete steam sterilization, 99.9% dust mite eradication and fabric protection coat.",
        includes: [
          "All Deep Stain Extraction inclusions",
          "140°C High-temp steam disinfection",
          "99.9% Dust mite & microbial allergen eradication",
          "Fabric color brightening & fiber shield application",
        ],
        excludes: [
          "Permanent ink or chemical bleach burns",
        ],
      },
    ];
  }

  // Generic 3-Tier fallback
  const p1 = basePrice;
  const p2 = Math.max(p1 + 300, Math.round((basePrice * 1.35) / 50) * 50);
  const p3 = Math.max(p2 + 400, Math.round((basePrice * 1.7) / 50) * 50);

  return [
    {
      name: "Express Plan",
      price: p1,
      duration: "40 - 60 min",
      description: service.desc || "Complete deep sanitization and scrubbing of targeted area.",
      includes: Array.isArray(service.sub) ? sanitizeItemList(service.sub) : [
        "Complete clinical sanitization of targeted area",
        "Removal of stubborn grease, grime & sticky residue",
        "Exterior wipe of fittings, frames & switchboards",
      ],
      excludes: [
        "Single-disc mechanical floor scrub",
        "Steam sterilization",
      ],
    },
    {
      name: "Classic Plan",
      price: p2,
      duration: "60 - 90 min",
      description: "Comprehensive deep scrubbing with high-grade chemical degreasing & detailed stain removal.",
      includes: [
        "All Express Plan features",
        "Intensive mechanical scrub & stain extraction",
        "Detailed corner, grill & edge detailing",
        "Anti-bacterial deodorization",
      ],
      excludes: [
        "Steam sterilization",
      ],
    },
    {
      name: "Premium Plan",
      price: p3,
      duration: "90 - 120 min",
      description: "Hospitality-grade clinical overhaul with steam disinfection, sanitizing fog & protective finish.",
      includes: [
        "All Classic Plan features",
        "140°C High-temp steam sterilization",
        "Food-safe anti-microbial protection shield",
        "Supervisor quality inspection & sign-off",
      ],
      excludes: [
        "Structural replacement or mechanical hardware repair",
      ],
    },
  ];
}
