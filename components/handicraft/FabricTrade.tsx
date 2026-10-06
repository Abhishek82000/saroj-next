import Link from "next/link";

const CDN = "https://saroj-textile-store.b-cdn.net/products/";

type Trade = {
  id: string;
  num: string;
  tone: "light" | "dark";
  eyebrow: string;
  title: [string, string];
  lede: string;
  points: [string, string][];
  cta: { href: string; label: string };
  alt: { href: string; label: string };
  stamp: string;
  main: { src: string; alt: string };
  inset: { src: string; alt: string };
};

/* The two ways the fabric leaves the shop — by the metre, and by the thaan. */
const TRADES: Trade[] = [
  {
    id: "retail",
    num: "01",
    tone: "light",
    eyebrow: "Retail · by the metre",
    title: ["Cut to your length,", "one print at a time."],
    lede: "Block-printed and hand-dyed in Jaipur, measured off the bolt for a single kurta, a set of cushions or a whole wardrobe. Pick the print, pick the length — we cut it the day you order.",
    points: [["₹129", "per metre, from"], ["40+", "prints on the shelf"], ["1 m", "order by the metre"]],
    cta: { href: "/shop", label: "Shop retail" },
    alt: { href: "#cloth", label: "Browse collections" },
    stamp: "Retail · Saroj Textile · Jaipur · ",
    main: { src: CDN + "47691780986642.webp", alt: "Pink base jaal printed Jaipuri cotton" },
    inset: { src: CDN + "94351785567420.webp", alt: "Red multicolour paisley Kalamkari print" },
  },
  {
    id: "wholesale",
    num: "02",
    tone: "dark",
    eyebrow: "Wholesale · by the thaan",
    title: ["Full rolls for", "the trade."],
    lede: "Boutiques, designers and stores buy the same prints in full thaans, straight from the printing tables. Trade pricing, steady repeats, and stock that ships from the same lanes it was made in.",
    points: [["Thaan", "full rolls & bulk"], ["Trade", "pricing for resellers"], ["Repeat", "the same print, again"]],
    cta: { href: "/wholesale-fabric", label: "Enter wholesale" },
    alt: { href: "/contact", label: "Talk to us" },
    stamp: "Wholesale · Thaan · Trade · ",
    main: { src: CDN + "63141785559833.webp", alt: "Red over-dye Ajrakh block printed cotton" },
    inset: { src: CDN + "2201780380811.webp", alt: "Indigo blue base bindu and stripes Ajrakh print" },
  },
];

/**
 * Retail and wholesale as two full-screen, photo-led panels: a tall
 * photograph with an inset swatch and a turning stamp on one side, the
 * copy on the other. The second panel flips sides and goes dark.
 */
export default function FabricTrade() {
  return (
    <>
      {TRADES.map((t) => (
        <section key={t.id} id={t.id} className={`hc-trade hc-trade--${t.tone}`} aria-labelledby={`${t.id}-title`}>
          <div className="hc-wrap hc-trade__grid">
            <div className="hc-trade__media rv">
              <figure className="hc-trade__main ph"><img src={t.main.src} alt={t.main.alt} loading="lazy" /></figure>
              <figure className="hc-trade__inset ph"><img src={t.inset.src} alt={t.inset.alt} loading="lazy" /></figure>
              <svg className="hc-trade__stamp" viewBox="0 0 120 120" aria-hidden="true">
                <defs><path id={`${t.id}-ring`} d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" /></defs>
                <circle cx="60" cy="60" r="58" />
                <text><textPath href={`#${t.id}-ring`}>{t.stamp + t.stamp}</textPath></text>
                <g className="hc-trade__stamp-c"><text x="60" y="68" textAnchor="middle">{t.num}</text></g>
              </svg>
            </div>

            <div className="hc-trade__copy">
              <span className="hc-trade__num" aria-hidden="true">{t.num}</span>
              <div className="hc-eyebrow rv">{t.eyebrow}</div>
              <h2 id={`${t.id}-title`} className="hc-h2 rv" data-d="1">{t.title[0]} <em>{t.title[1]}</em></h2>
              <p className="hc-lede rv" data-d="2">{t.lede}</p>
              <ul className="hc-trade__pts rv" data-d="3">
                {t.points.map(([big, small]) => <li key={small}><b>{big}</b><small>{small}</small></li>)}
              </ul>
              <div className="hc-trade__cta rv" data-d="4">
                <Link href={t.cta.href} className={`hc-btn hc-btn--solid`}>{t.cta.label}</Link>
                <Link href={t.alt.href} className={`hc-btn${t.tone === "dark" ? " hc-btn--light" : ""}`}>{t.alt.label}</Link>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
