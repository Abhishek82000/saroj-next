/**
 * One place for everything that describes the business.
 * Metadata, JSON-LD and the footer all read from here, so a change to the
 * phone number or the free-shipping threshold only happens once.
 */
export const site = {
  name: "Saroj Textile",
  tagline: "Handicraft & hand block printed cotton, Jaipur",
  /** Set NEXT_PUBLIC_SITE_URL in production so canonicals and the sitemap are absolute. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sarojtextile.com",
  locale: "en_IN",
  currency: "INR",
  description:
    "Jaipuri cotton, Ajrakh, Kalamkari and Sanganeri block prints by the metre, alongside blue pottery, meenakari, brass and marble from the lanes that print our cloth.",
  freeShippingOver: 2000,
  wholesaleFrom: 50,
  phone: "+91 95879 86226",
  phoneRaw: "9587986226",
  whatsapp: "919587986226",
  email: "sarojtexpitch@gmail.com",
  address: {
    street: "92-B New Colony, Satya Nagar, Jhotwara",
    city: "Jaipur",
    region: "Rajasthan",
    postalCode: "302012",
    country: "IN",
  },
  geo: { lat: 26.9412, lng: 75.7594 },
  social: [
    "https://www.facebook.com/saroj_textile",
    "https://www.instagram.com/saroj_textile/",
  ],
  /** Shown in the ticker. */
  ticker: [
    ["Free shipping over ", "₹2000"],
    ["Cut to any length from ", "1 metre"],
    ["Wholesale fabric from ", "₹80/m"],
    ["Made in Jaipur · ", "Jhotwara"],
  ] as [string, string][],
  delivery: { domestic: "5–7 working days", international: "10–15 working days" },
} as const;

export const inr = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

/** "metre" reads better with a preposition; "set of 6" does not. */
export const unitLabel = (u: string) => (u === "metre" ? "per metre" : u);
