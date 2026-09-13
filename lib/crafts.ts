import type { Craft } from "./types";

const CDN = "https://saroj-textile-store.b-cdn.net/products/";
const PIC = "https://picsum.photos/seed/";

/** The six disciplines on the shelf, plus the fabric house they sit beside. */
export const crafts: Craft[] = [
  { key: "pottery", name: "Blue Pottery", hindi: "नीली मिट्टी", lane: "Kot Jewar", image: PIC + "saroj-craft-pottery/200/200" },
  { key: "meena",   name: "Meenakari",    hindi: "मीनाकारी",     lane: "Johari Bazaar", image: PIC + "saroj-craft-meena/200/200" },
  { key: "bagru",   name: "Bagru Block",  hindi: "बगरू छपाई",    lane: "Bagru village", image: CDN + "48561785562288.webp" },
  { key: "brass",   name: "Lac & Brass",  hindi: "लाख और पीतल",  lane: "Tripolia Bazaar", image: PIC + "saroj-craft-brass/200/200" },
  { key: "marble",  name: "Marble Jali",  hindi: "संगमरमर जाली", lane: "Kishanpole", image: PIC + "saroj-craft-marble/200/200" },
  { key: "puppet",  name: "Kathputli",    hindi: "कठपुतली",      lane: "Shilpgram", image: PIC + "saroj-craft-puppet/200/200" },
  { key: "fabric",  name: "Fabric",       hindi: "कपड़ा",         lane: "By the metre", image: CDN + "48621785565568.webp" },
];

export const craftBy = Object.fromEntries(crafts.map((c) => [c.key, c])) as Record<string, Craft>;

export const materials = [
  "Clay", "Enamel on brass", "Brass", "Lac", "Marble", "Mango wood",
  "Cotton", "Mul cotton", "Cotton silk",
];
