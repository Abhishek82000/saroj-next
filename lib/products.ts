import type { Product, Stock } from "./types";

const CDN = "https://saroj-textile-store.b-cdn.net/products/";
const PIC = "https://picsum.photos/seed/";

/** Fabric is cut off the bolt, so every length is available in half metres. */
const CUT = { min: 1, max: 58, step: 0.5, wholesale: 90 };

const WASH_SPECS = [
  { label: "Width", value: "42 inches", note: "and a little over" },
  { label: "Weight", value: "100 g", note: "per metre" },
  { label: "Cloth", value: "Soft cotton", note: "Jaipuri, hand block" },
  { label: "Cut from", value: "1 metre", note: "up in half metres" },
];

const FABRIC_COPY =
  "Saroj Textile presents traditional Jaipuri cotton print with a fusion of trendy styles and mesmerising colours. Style your kurtis, tops, coats, skirts, dresses, western outfits and more. These designs depict the old vintage soft cotton in the modern way of printing.";

/**
 * Shorthand for a length of printed cotton. Everything about a fabric that
 * doesn't vary — the unit, the cut range, the spec strip, the body copy —
 * is filled in here rather than repeated forty times.
 */
function fabric(
  slug: string,
  name: string,
  file: string,
  price: number,
  mrp: number,
  opts: {
    short?: string;
    material?: string;
    stock?: Stock;
    fresh?: number;
    sold?: number;
    hindi?: string;
    shots?: { src: string; note: string }[];
  } = {},
): Product {
  return {
    slug,
    name,
    short: opts.short ?? name.replace(/ Printed.*$/i, "").replace(/ Cotton Fabric$/i, ""),
    kind: "fabric",
    craft: "fabric",
    material: opts.material ?? "Cotton",
    price,
    mrp,
    unit: "metre",
    stock: opts.stock ?? "in",
    images: opts.shots ?? [{ src: CDN + file + ".webp", note: name }],
    fresh: opts.fresh ?? 20,
    sold: opts.sold ?? 90,
    hindi: opts.hindi,
    cut: CUT,
    description: FABRIC_COPY,
    specs: WASH_SPECS,
  };
}

/** A piece of handicraft, sold whole. */
function craftPiece(
  slug: string,
  name: string,
  craft: string,
  material: string,
  price: number,
  mrp: number,
  unit: string,
  seed: string,
  stock: Stock,
  fresh: number,
  sold: number,
  description: string,
): Product {
  return {
    slug, name, short: name, kind: "craft", craft, material, price, mrp, unit, stock,
    images: [{ src: PIC + seed + "/900/1125", note: name }],
    fresh, sold, description,
  };
}

export const products: Product[] = [
  /* ---------- blue pottery, Kot Jewar ---------- */
  craftPiece("kot-jewar-vase-and-jar", "Kot Jewar vase & jar, cobalt on white", "pottery", "Clay", 1450, 1750, "pair", "saroj-shelf-vase", "in", 9, 41,
    "Thrown in Kot Jewar from the quartz-and-fuller's-earth body that gives blue pottery its ring, then painted freehand in cobalt. Fired once, so no two rims sit exactly alike."),
  craftPiece("blue-pottery-serving-bowl", "Blue pottery serving bowl, 6 inch", "pottery", "Clay", 880, 0, "each", "saroj-new-bowl", "in", 14, 77,
    "Six inches across, glazed inside and out. Food safe, though it will not take a dishwasher or a flame."),
  craftPiece("blue-pottery-soap-dish", "Blue pottery soap dish, lotus rim", "pottery", "Clay", 390, 480, "each", "saroj-pottery-soap", "in", 6, 96,
    "A lotus rim with three drainage notches cut before the glaze went on."),
  craftPiece("blue-pottery-door-knobs", "Blue pottery door knobs, set of four", "pottery", "Clay", 640, 0, "set of 4", "saroj-pottery-knob", "low", 4, 52,
    "Four knobs with brass shanks and screws, sized for standard cupboard doors."),
  craftPiece("blue-pottery-tile-coasters", "Blue pottery tile coasters, cobalt jaal", "pottery", "Clay", 720, 900, "set of 6", "saroj-pottery-tile", "in", 11, 63,
    "Six square tiles with a cork back, each painted with a different section of the jaal."),

  /* ---------- meenakari, Johari Bazaar ---------- */
  craftPiece("meenakari-wall-plate", "Meenakari wall plate, 9 inch", "meena", "Enamel on brass", 2900, 0, "each", "saroj-shelf-plate", "in", 8, 28,
    "Enamel laid into engraved brass and kiln-fired a colour at a time, hottest first. Nine inches, with a fitting on the back for hanging."),
  craftPiece("meenakari-trinket-box", "Meenakari trinket box, peacock", "meena", "Enamel on brass", 1240, 1490, "each", "saroj-new-box", "in", 15, 71,
    "A hinged brass box with a peacock in green and blue enamel on the lid."),
  craftPiece("meenakari-kumkum-bowls", "Meenakari kumkum bowls, pair", "meena", "Enamel on brass", 960, 0, "pair", "saroj-meena-bowl", "low", 5, 44,
    "A pair of small lidded bowls, enamelled inside and out."),
  craftPiece("meenakari-napkin-rings", "Meenakari napkin rings, six", "meena", "Enamel on brass", 1680, 2100, "set of 6", "saroj-meena-ring", "in", 12, 33,
    "Six rings, each enamelled in a different ground colour so a table reads as a set without matching exactly."),

  /* ---------- bagru block, on cloth and off it ---------- */
  craftPiece("bagru-table-runner", "Bagru block table runner, indigo dabu", "bagru", "Cotton", 1150, 1400, "each", "saroj-bagru-runner", "in", 31, 47,
    "Dabu resist printed in Bagru, then dipped in indigo. Six feet by fourteen inches, hemmed by hand."),
  craftPiece("bagru-cushion-covers", "Bagru cushion covers, madder red", "bagru", "Cotton", 1490, 0, "set of 2", "saroj-bagru-cushion", "in", 32, 69,
    "Two sixteen-inch covers with concealed zips, printed in madder over a cream ground."),
  craftPiece("hand-block-napkins", "Hand-block napkins, six", "bagru", "Mul cotton", 840, 1050, "set of 6", "saroj-bagru-napkin", "low", 33, 54,
    "Light mul cotton, mitred corners, and the kind of print that only gets better once it has been washed a few times."),
  craftPiece("bagru-dabu-razai", "Bagru dabu razai, single", "bagru", "Cotton", 3400, 0, "each", "saroj-bagru-razai", "in", 34, 21,
    "A single razai filled with hand-carded cotton, both faces block printed in Bagru."),

  /* ---------- lac and brass, Tripolia Bazaar ---------- */
  craftPiece("brass-diya-hand-beaten", "Brass diya, hand-beaten", "brass", "Brass", 690, 0, "set of 2", "saroj-shelf-diya", "in", 7, 88,
    "Raised from sheet brass over a stake, so the hammer marks are still readable across the bowl."),
  craftPiece("hand-beaten-brass-urli", "Hand-beaten brass urli, 8 inch", "brass", "Brass", 1650, 1950, "each", "saroj-new-brass", "in", 16, 59,
    "Eight inches across and deep enough to float a handful of marigolds."),
  craftPiece("lac-bangles-stack-of-six", "Lac bangles, stack of six", "brass", "Lac", 450, 0, "stack", "saroj-shelf-bangle", "low", 3, 104,
    "Six lac bangles worked warm over a flame and set with mirror chips. Tell us the size you wear and we cut to it."),
  craftPiece("brass-temple-bell", "Brass temple bell, teak handle", "brass", "Brass", 1180, 0, "each", "saroj-brass-bell", "in", 10, 37,
    "Cast brass with a turned teak handle. It holds a note for a good few seconds."),
  craftPiece("lac-coasters-mirror-inlay", "Lac coasters, mirror inlay", "brass", "Lac", 520, 640, "set of 4", "saroj-lac-coaster", "out", 2, 66,
    "Four coasters in coloured lac with mirror inlay around the rim."),

  /* ---------- marble jali, Kishanpole ---------- */
  craftPiece("marble-jali-lamp", "Marble jali lamp", "marble", "Marble", 3200, 0, "each", "saroj-shelf-lamp", "in", 13, 19,
    "A lamp cut from a single block of Makrana marble, the lattice thin enough to glow right through."),
  craftPiece("marble-coasters-jali-edge", "Marble coasters, jali edge", "marble", "Marble", 1150, 1400, "set of 4", "saroj-marble-coaster", "in", 1, 31,
    "Four marble coasters with a pierced jali border and felt on the underside."),
  craftPiece("marble-jali-tealight-cube", "Marble jali tealight cube", "marble", "Marble", 1980, 0, "each", "saroj-marble-cube", "low", 17, 22,
    "A four-inch cube with a different lattice on each face."),

  /* ---------- kathputli, Shilpgram ---------- */
  craftPiece("kathputli-pair-court-dress", "Kathputli pair, Rajasthani court dress", "puppet", "Mango wood", 1340, 1600, "pair", "saroj-craft-puppet", "in", 18, 26,
    "Carved in mango wood, dressed in offcuts from our own printing, strung and ready to hang."),
  craftPiece("kathputli-sawaari-rider", "Single kathputli, sawaari rider", "puppet", "Mango wood", 780, 0, "each", "saroj-puppet-rider", "in", 19, 35,
    "A single rider puppet, about eighteen inches from the top of the turban."),

  /* ---------- the fabric house ---------- */
  fabric("maroon-base-with-cream-paisley-printed-jaipuri-cotton-fabric",
    "Maroon Base with Cream Paisley Printed Jaipuri Cotton Fabric", "40661788078255", 129, 160, {
      short: "Maroon base, cream paisley",
      hindi: "मरून बेस · क्रीम आमी बूटी",
      fresh: 40, sold: 164,
      shots: [
        { src: CDN + "40661788078255.webp", note: "Flat lay, full repeat" },
        { src: PIC + "saroj-maroon-drape/900/1125", note: "PLACEHOLDER — draped over the bolt, side light" },
        { src: PIC + "saroj-maroon-macro/900/1125", note: "PLACEHOLDER — macro of the paisley block" },
        { src: PIC + "saroj-maroon-worn/900/1125", note: "PLACEHOLDER — stitched up as a kurta" },
      ],
    }),
  fabric("pink-shade-base-with-jaal-printed-cotton-fabric", "Pink Shade Base with Jaal Printed Cotton Fabric", "47691780986642", 129, 160, { fresh: 30, sold: 95 }),
  fabric("light-orange-shade-base-with-butta-printed-cotton-fabric", "Light Orange Shade Base with Butta Printed Cotton Fabric", "79471780986971", 129, 160, { fresh: 29, sold: 88 }),
  fabric("white-shade-base-with-butta-printed-cotton-fabric-3", "White Shade Base with Butta Printed Cotton Fabric", "81901780987621", 129, 160, { material: "Mul cotton", fresh: 22, sold: 133 }),
  fabric("wine-shade-base-with-butta-printed-cotton-fabric", "Wine Shade Base with Butta Printed Cotton Fabric", "71561780988511", 129, 160, { fresh: 28, sold: 77 }),
  fabric("black-base-with-mustard-and-peach-multiflower-printed-jaipuri-cotton-fabric", "Black Base with Mustard and Peach Multiflower Printed Jaipuri Cotton Fabric", "63571788078066", 129, 160, { fresh: 38, sold: 61 }),
  fabric("blace-base-with-abstract-white-jaal-printed-jaipuri-cotton-fabric", "Black Base with Abstract White Jaal Printed Jaipuri Cotton Fabric", "74021788077426", 129, 160, { fresh: 36, sold: 118 }),
  fabric("white-and-blue-strips-with-block-printed-jaipuri-cotton-fabric", "White and Blue Stripes with Block Printed Jaipuri Cotton Fabric", "34411788077677", 129, 160, { fresh: 35, sold: 121 }),
  fabric("white-base-with-red-and-yellow-block-printed-kantha-jaipuri-cotton-fabric", "White Base with Red and Yellow Block Printed Kantha Jaipuri Cotton Fabric", "41911788077745", 129, 160, { material: "Mul cotton", fresh: 37, sold: 110 }),
  fabric("maroon-with-green-patola-bird-printed-jaipuri-cotton-fabric", "Maroon with Green Patola Bird Printed Jaipuri Cotton Fabric", "22791788078140", 129, 160, { fresh: 39, sold: 73 }),
  fabric("rust-colour-base-with-white-big-flower-printed-jaipuri-cotton-fabric", "Rust Colour Base with White Big Flower Printed Jaipuri Cotton Fabric", "52161788078207", 129, 160, { fresh: 41, sold: 69 }),
  fabric("navy-blue-base-with-cream-abstract-printed-jaipuri-cotton-fabric", "Navy Blue Base with Cream Abstract Printed Jaipuri Cotton Fabric", "42181788078430", 129, 160, { fresh: 42, sold: 84 }),
  fabric("black-and-rust-colour-patola-bird-printed-jaipuri-cotton-fabric", "Black and Rust Colour Patola Bird Printed Jaipuri Cotton Fabric", "13831788078711", 129, 160, { fresh: 43, sold: 58 }),
  fabric("pink-base-with-orange-and-green-printed-jaipuri-cotton-fabric", "Pink Base with Orange and Green Printed Jaipuri Cotton Fabric", "301788078751", 129, 160, { fresh: 44, sold: 64 }),
  fabric("light-yellow-base-with-pink-and-green-jaal-printed-jaipuri-cotton-fabric", "Light Yellow Base with Pink and Green Jaal Printed Jaipuri Cotton Fabric", "47261788079001", 129, 160, { fresh: 45, sold: 52 }),
  fabric("pink-base-with-white-and-mustard-flower-printed-jaipuri-cotton-fabric", "Pink Base with White and Mustard Flower Printed Jaipuri Cotton Fabric", "46501788079051", 129, 160, { fresh: 46, sold: 57 }),
  fabric("beige-pink-with-teal-blue-jaal-printed-jaipuri-cotton-fabric", "Beige Pink with Teal Blue Jaal Printed Jaipuri Cotton Fabric", "53941788079082", 129, 160, { fresh: 47, sold: 49 }),
  fabric("sky-blue-base-with-orange-butta-printed-jaipuri-cotton-fabric", "Sky Blue Base with Orange Butta Printed Jaipuri Cotton Fabric", "30601788079185", 129, 160, { fresh: 48, sold: 66 }),
  fabric("magenta-pink-base-with-orange-heart-shaped-flower-printed-jaipuri-cotton-fabric", "Magenta Pink Base with Orange Heart Shaped Flower Printed Jaipuri Cotton Fabric", "65241788079231", 129, 160, { fresh: 49, sold: 71 }),

  /* Ajrakh and Kalamkari — the older, heavier end of the shelf */
  fabric("red-over-dye-with-blue-block-printed-ajrakh-cotton-fabric", "Red Over-dye with Blue Block Printed Ajrakh Cotton Fabric", "63141785559833", 150, 180, { fresh: 24, sold: 142 }),
  fabric("teal-pastel-green-with-blue-ajrakh-printed-cotton-fabric", "Teal Pastel Green with Blue Ajrakh Printed Cotton Fabric", "48621785565568", 160, 220, { fresh: 26, sold: 168 }),
  fabric("teal-green-and-mustard-paisley-printed-kalamkari-cotton-fabric", "Teal Green and Mustard Paisley Printed Kalamkari Cotton Fabric", "42621785568665", 160, 220, { fresh: 25, sold: 91 }),
  fabric("neavy-blue-base-indigo-printed-kalamkari-paisley-print", "Navy Blue Base Indigo Printed Kalamkari Paisley Print", "13001785568370", 160, 220, { stock: "low", fresh: 23, sold: 117 }),
  fabric("leaf-green-polka-patola-in-red-ajrakh-cotton-printed-fabric", "Leaf Green Polka Patola in Red Ajrakh Cotton Printed Fabric", "97721785569096", 160, 220, { fresh: 27, sold: 74 }),
  fabric("white-shade-base-with-floral-print-kalamkari-jaipuri-cotton-fabric", "White Shade Base with Floral Print Kalamkari Jaipuri Cotton Fabric", "12091782565773", 160, 220, { material: "Mul cotton", fresh: 21, sold: 126 }),
  fabric("musturd-over-dye-with-red-block-printed-ajrakh-cotton-fabric", "Mustard Over-dye with Red Block Printed Ajrakh Cotton Fabric", "48561785562288", 260, 320, { material: "Cotton silk", fresh: 33, sold: 58 }),
  fabric("red-vibrant-multi-colour-paisley-kalamkari-print", "Red Vibrant Multi-colour Paisley Kalamkari Print", "94351785567420", 160, 220, { fresh: 34, sold: 149 }),
  fabric("leaf-green-base-tree-jaal-printed-ajrakh-cotton-fabric", "Leaf Green Base Tree Jaal Printed Ajrakh Cotton Fabric", "711785564464", 150, 180, { stock: "low", fresh: 32, sold: 108 }),
];

/* ---------- lookups the pages use ---------- */

export const bySlug = Object.fromEntries(products.map((p) => [p.slug, p])) as Record<string, Product>;

export const getProduct = (slug: string): Product | undefined => bySlug[slug];

export const discount = (p: Product) => (p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);

/** Other pieces from the same craft, for the rail under a product. */
export const sameCraft = (p: Product, n = 8) =>
  products.filter((x) => x.craft === p.craft && x.slug !== p.slug).sort((a, b) => b.sold - a.sold).slice(0, n);

/** Best sellers that aren't already on the page. */
export const alsoBought = (p: Product, n = 10) =>
  products.filter((x) => x.slug !== p.slug).sort((a, b) => b.sold - a.sold).slice(0, n);
