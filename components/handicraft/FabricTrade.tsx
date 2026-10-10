const CDN = "https://saroj-textile-store.b-cdn.net/products/";

type Trade = {
  id: string;
  num: string;
  tone: "light" | "dark";
  title: [string, string];
  /** A line under the heading, when the panel has one. */
  sub?: string;
  body: string[];
  /** The closing line, set apart from the paragraphs. */
  signoff: string;
  stamp: string;
  main: { src: string; alt: string };
  inset: { src: string; alt: string };
};

/* The two ways the shop sells — to you, and to the trade. */
const TRADES: Trade[] = [
  {
    id: "retail",
    num: "01",
    tone: "light",
    title: ["A Little Something", "to Love"],
    body: [
      "At Saroj, we understand that every purchase is more than just a thing to you; it's an experience as well. So we make products that complement your personality and style.",
      "We design products that bring colorful prints, thoughtful designs, and practical functionality together to add charm to your daily life. We design our products to suit every mood, moment, and occasion. From bags for fashion, organizers for lifestyle, and unique journals for your work, we design to make everyday living more colorful.",
      "Explore our range of paper and fabric collections to find your new favorites. Whether you're treating yourself or looking for a gift, get the best designs to make ordinary moments feel a little more special.",
    ],
    signoff: "Bring home a little creativity. Add a little joy. Make every day special.",
    stamp: "Retail · Saroj Textile · Jaipur · ",
    main: { src: CDN + "47691780986642.webp", alt: "Pink base jaal printed Jaipuri cotton" },
    inset: { src: CDN + "94351785567420.webp", alt: "Red multicolour paisley Kalamkari print" },
  },
  {
    id: "wholesale",
    num: "02",
    tone: "dark",
    title: ["Wholesale", "Wonders Await!"],
    sub: "Start your next big collection with the right products!",
    body: [
      "In the handicraft category, we bring together 3 decades of textile industry experience and passion for exploring new possibilities. If you are a reseller looking for an exclusive range of personalized products or gift hampers, we are bringing new designs every day for you to choose from.",
      "We understand that every business has its own vision, customers, and requirements. That's why we offer wholesale ordering and customization options on selected products, subject to minimum order quantities and product specifications.",
      "Our goal is to build lasting business relationships by bringing together product variety, thoughtful designs, and a commitment to quality.",
    ],
    signoff: "Connect with us to discuss bulk requirements and request wholesale pricing.",
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
              <h2 id={`${t.id}-title`} className="hc-h2 rv" data-d="1">{t.title[0]} <em>{t.title[1]}</em></h2>
              {t.sub && <p className="hc-trade__sub rv" data-d="2">{t.sub}</p>}
              {t.body.map((para, i) => (
                <p key={i} className="hc-lede hc-trade__p rv" data-d={Math.min(i + 2, 4)}>{para}</p>
              ))}
              <p className="hc-trade__signoff rv" data-d="4">{t.signoff}</p>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
