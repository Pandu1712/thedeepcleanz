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

  // Full House / Vacant / Furnished / BHK Flat Deep Cleaning
  if (
    sId.includes("house") ||
    sId.includes("home") ||
    sId.includes("villa") ||
    sId.includes("apartment") ||
    sId.includes("vacant") ||
    sId.includes("furnished") ||
    sId.includes("bhk") ||
    sTitle.includes("house") ||
    sTitle.includes("home") ||
    sTitle.includes("vacant") ||
    sTitle.includes("furnished") ||
    sTitle.includes("bhk")
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

  // If service has custom plans defined in DB or Admin (1 or more plans), ALWAYS use them!
  if (rawPlans.length > 0) {
    const defaultIncludes =
      Array.isArray(service.includes) && service.includes.length > 0
        ? sanitizeItemList(service.includes)
        : Array.isArray(service.sub) && service.sub.length > 0
          ? sanitizeItemList(service.sub)
          : [];

    return rawPlans.map((p: any) => ({
      name: p?.name || "Standard Plan",
      price: typeof p?.price === "number" ? p.price : (Number(p?.price) || service.price || 0),
      duration: p?.duration || "2 - 3 hours",
      description: p?.description || p?.desc || service.description || service.desc || "",
      includes:
        Array.isArray(p?.includes) && p.includes.length > 0
          ? sanitizeItemList(p.includes)
          : defaultIncludes,
      excludes: Array.isArray(p?.excludes) ? sanitizeItemList(p.excludes) : [],
    }));
  }

  // If no custom plans defined in DB/Admin, DO NOT invent fake multi-tier packages.
  // Instead, present the service as a single transparent standard plan at basePrice!
  const basePrice =
    typeof service?.price === "number"
      ? service.price
      : Number(service?.price) || 0;

  const defaultIncludes =
    Array.isArray(service.includes) && service.includes.length > 0
      ? sanitizeItemList(service.includes)
      : Array.isArray(service.sub) && service.sub.length > 0
        ? sanitizeItemList(service.sub)
        : [
            "Complete deep sanitization of targeted area",
            "Removal of stubborn grease, grime & sticky residue",
            "Exterior wipe of fittings, frames & switchboards",
          ];

  return [
    {
      name: service.title || "Standard Plan",
      price: basePrice,
      duration: service.duration || "4 - 5 hours",
      description: service.description || service.desc || "Complete clinical-grade deep cleaning and sanitization.",
      includes: defaultIncludes,
      excludes: [
        "Interior cabinet wet washing with utensils inside (unless requested)",
        "Appliance electrical wiring or motor repairs",
        "Permanent chemical acid etch or marble buffing",
      ],
    },
  ];
}

