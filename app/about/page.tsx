import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import JsonLd from "@/components/seo/JsonLd";
import { CountUp, Thread } from "@/components/about/AboutMotion";
import { site } from "@/lib/site";
import { breadcrumbLd, graph, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Our Story",
  description: `${site.name} began in 1995 as one small shop in Jaipur, run by Saroj herself. Thirty years of quality cotton, 30,000+ orders delivered, and a family promise that hasn't changed.`,
  path: "/about",
});

const CDN = "https://saroj-textile-store.b-cdn.net/";
/** Fabric photographs from the storefront's own categories (3:4 portraits). */
const SWATCH = {
  ajrakh: CDN + "category/17934477967332.webp",
  jaipur: CDN + "category/17934407095820.webp",
  kalamkari: CDN + "category/17934469044951.webp",
  garden: CDN + "category/17934447436525.webp",
  jugal: CDN + "category/17934453928552.webp",
  paisley: CDN + "category/17934465371734.webp",
  stack: CDN + "media/49111793255085.webp",
  craft: CDN + "media/48761793254796.webp",
};

const FAN = [
  { src: SWATCH.kalamkari, alt: "Kalamkari cotton" },
  { src: SWATCH.ajrakh, alt: "Ajrakh hand block print" },
  { src: SWATCH.jaipur, alt: "Jaipur cotton" },
  { src: SWATCH.garden, alt: "Flower garden print" },
  { src: SWATCH.paisley, alt: "Paisley print" },
];

const CHAPTERS = [
  {
    year: "1995",
    title: "One small shop in Jaipur",
    text: "Saroj, the heart and soul of our venture, set up a small shop with nothing but her determination and love for high-quality cotton fabrics.",
    img: SWATCH.jaipur,
  },
  {
    year: "Every role",
    title: "A mother who did it all",
    text: "As a dedicated mother, Saroj handled every aspect of the business with unmatched grit, from purchasing the finest materials to personally selling them day in and day out.",
    img: SWATCH.ajrakh,
  },
  {
    year: "Quality first",
    title: "When the market went cheap, she didn't",
    text: "Her unwavering focus on quality, even when cheaper and low-quality fabrics flooded the market, set Saroj Textile apart and earned her a name for the best cotton in town.",
    img: SWATCH.kalamkari,
  },
  {
    year: "Next generation",
    title: "Aakash takes it online",
    text: "Saroj's son Aakash saw a future beyond the walls of the shop. With his vision and knowledge of technology, he brought Saroj Textile online, and our fabrics began reaching homes across the country.",
    img: SWATCH.jugal,
  },
  {
    year: "Today",
    title: "A family of thousands",
    text: "More than 50,000 followers on Instagram and over 30,000 successful orders delivered. We still rarely receive a complaint — the standard Saroj set on day one.",
    img: SWATCH.garden,
  },
];

const PROMISES = [
  {
    no: "01",
    title: "Quality Fabrics",
    text: "Every fabric is chosen with precision and care: pure, breathable cotton that is soft on the skin and holds its colour wash after wash.",
    img: SWATCH.paisley,
    icon: <><path d="M12 3 4 7v6c0 4.5 3.4 7.6 8 8 4.6-.4 8-3.5 8-8V7Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  },
  {
    no: "02",
    title: "Laconic Design",
    text: "Simplicity refined. Prints with a clear, timeless character, rooted in Jaipur's block-printing tradition, that let what you make speak for itself.",
    img: SWATCH.ajrakh,
    icon: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 12h16M12 4v16" /><circle cx="12" cy="12" r="3" /></>,
  },
  {
    no: "03",
    title: "Cut to Every Size",
    text: "From a single metre to bulk bolts, cut to the length you need — for a dupatta, a kurta, a quilt or a whole collection.",
    img: SWATCH.jugal,
    icon: <><path d="M3 15 15 3l6 6L9 21z" /><path d="M8 10l2 2M11 7l2 2M14 4l1 1" /></>,
  },
];

const RIBBON = ["Pure cotton", "Hand block printed", "Jaipur since 1995", "30,000+ orders", "Cut to the metre", "Family run"];

/**
 * /about — Saroj Textile's story. A dark hero with a fanned deck of the shop's
 * own fabrics, the founding year cut out of fabric, a timeline whose thread
 * draws itself as you scroll, the numbers, the three promises and a welcome.
 * Overrides the CMS page the [slug] route would otherwise render here.
 */
export default function AboutPage() {
  return (
    <main id="main" className="ab">
      {/* ================= HERO ================= */}
      <section className="ab-hero" aria-labelledby="ab-title">
        <div className="ab-hero__in st-wrap">
          <div className="ab-hero__copy">
            <nav className="ab-crumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link><span aria-hidden="true">/</span><span>Our story</span>
            </nav>
            <p className="ab-kicker ab-in" style={{ "--i": 0 } as React.CSSProperties}>Our story · Jaipur</p>
            <h1 id="ab-title" className="ab-hero__title">
              <span className="ab-line"><span style={{ "--i": 1 } as React.CSSProperties}>We are</span></span>
              <span className="ab-line"><span style={{ "--i": 2 } as React.CSSProperties}><em>Saroj</em> Textile</span></span>
            </h1>
            <p className="ab-hero__lede ab-in" style={{ "--i": 4 } as React.CSSProperties}>
              More than just a business — a family-driven legacy built on passion, dedication and an unwavering commitment to quality.
            </p>
            <a href="#ab-origin" className="ab-scroll ab-in" style={{ "--i": 5 } as React.CSSProperties}>
              <span className="ab-scroll__dot" aria-hidden="true" />Read our story
            </a>
          </div>

          <div className="ab-fan" aria-hidden="true">
            {FAN.map((f, i) => (
              <div key={f.src} className="ab-fan__card" style={{ "--k": i - 2 } as React.CSSProperties}>
                <Image src={f.src} alt={f.alt} fill sizes="(max-width:900px) 40vw, 260px" priority={i === 2} />
              </div>
            ))}
            <svg className="ab-seal" viewBox="0 0 200 200">
              <defs><path id="ab-seal-path" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" /></defs>
              <circle cx="100" cy="100" r="96" />
              <text><textPath href="#ab-seal-path">SAROJ TEXTILE · JAIPUR · ESTABLISHED · SINCE ·</textPath></text>
              <text x="100" y="96" textAnchor="middle" className="ab-seal__est">EST.</text>
              <text x="100" y="124" textAnchor="middle" className="ab-seal__yr">1995</text>
            </svg>
          </div>
        </div>

        <div className="ab-ribbon" aria-hidden="true">
          <div className="ab-ribbon__track">
            {[0, 1].map((copy) => (
              <span key={copy}>
                {RIBBON.map((w) => <span key={w}>{w}<i>✦</i></span>)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ORIGIN ================= */}
      <section id="ab-origin" className="ab-origin" aria-labelledby="ab-origin-h">
        <div className="st-wrap ab-origin__in">
          <div className="ab-origin__year">
            <Reveal as="p" className="ab-kicker ab-kicker--ink">Established</Reveal>
            <Reveal delay={1} className="ab-bigyear" aria-label="1995">
              <span style={{ backgroundImage: `url(${SWATCH.stack})` }}>19</span>
              <span style={{ backgroundImage: `url(${SWATCH.stack})` }}>95</span>
            </Reveal>
            <Reveal delay={2} className="ab-origin__photo">
              <Image src={SWATCH.stack} alt="Folded stacks of printed Jaipur cotton" fill sizes="(max-width:900px) 90vw, 40vw" />
              <span className="ab-origin__tag">Where it began — Jaipur</span>
            </Reveal>
          </div>

          <div className="ab-origin__copy">
            <Reveal as="h2" className="ab-h2" id="ab-origin-h">It started with <em>one woman</em> and a love for good cotton.</Reveal>
            <Reveal delay={1} className="ab-prose ab-prose--drop">
              <p>
                At Saroj Textile, we are more than just a business; we are a family-driven legacy built on passion,
                dedication, and an unwavering commitment to quality. Our journey began in the vibrant city of Jaipur,
                where Saroj, the heart and soul of our venture, set up a small shop with nothing but her determination
                and love for high-quality cotton fabrics.
              </p>
              <p>
                As a dedicated mother, Saroj handled every aspect of the business with unmatched grit, from purchasing
                the finest materials to personally selling them day in and day out.
              </p>
            </Reveal>
            <Reveal delay={2} as="blockquote" className="ab-aside">
              She believed in fabrics that not only <em>looked</em> good but also <em>felt</em> good.
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= QUOTE ================= */}
      <section className="ab-quote" aria-label="What Saroj believed">
        <div className="ab-quote__bg" aria-hidden="true">
          {[SWATCH.ajrakh, SWATCH.garden, SWATCH.paisley, SWATCH.jugal, SWATCH.kalamkari, SWATCH.jaipur].map((s) => (
            <div key={s} style={{ backgroundImage: `url(${s})` }} />
          ))}
        </div>
        <div className="st-wrap ab-quote__in">
          <span className="ab-quote__mark" aria-hidden="true">“</span>
          <Reveal as="p" className="ab-quote__text">
            Fabrics that not only look good, but also <em>feel good</em> — offering long-lasting comfort to every customer.
          </Reveal>
          <Reveal as="p" delay={1} className="ab-quote__by">— Saroj, founder</Reveal>
        </div>
      </section>

      {/* ================= TIMELINE ================= */}
      <section className="ab-time" aria-labelledby="ab-time-h">
        <div className="st-wrap">
          <header className="ab-head">
            <Reveal as="p" className="ab-kicker ab-kicker--ink">The thread</Reveal>
            <Reveal as="h2" delay={1} className="ab-h2" id="ab-time-h">Three decades, <em>one promise</em>.</Reveal>
          </header>

          <Thread className="ab-thread">
            <span className="ab-thread__line" aria-hidden="true"><span /></span>
            <ol className="ab-thread__list">
              {CHAPTERS.map((c, i) => (
                <li key={c.title} className={`ab-step${i % 2 ? " ab-step--r" : ""}`}>
                  <span className="ab-step__knot" data-knot aria-hidden="true" />
                  <Reveal className="ab-step__card">
                    <div className="ab-step__img">
                      <Image src={c.img} alt="" fill sizes="(max-width:900px) 30vw, 180px" />
                    </div>
                    <div className="ab-step__body">
                      <span className="ab-step__year">{c.year}</span>
                      <h3>{c.title}</h3>
                      <p>{c.text}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </Thread>
        </div>
      </section>

      {/* ================= NUMBERS ================= */}
      <section className="ab-nums" aria-label="Saroj Textile in numbers">
        <div className="st-wrap ab-nums__grid">
          <div className="ab-num">
            <strong><CountUp to={1995} group={false} /></strong>
            <span>The year Saroj opened her shop</span>
          </div>
          <div className="ab-num">
            <strong><CountUp to={50000} suffix="+" /></strong>
            <span>Followers on Instagram</span>
          </div>
          <div className="ab-num">
            <strong><CountUp to={30000} suffix="+" /></strong>
            <span>Successful orders delivered</span>
          </div>
          <div className="ab-num">
            <strong>Rarely</strong>
            <span>a complaint — our proudest number</span>
          </div>
        </div>
      </section>

      {/* ================= WHO WE ARE ================= */}
      <section className="ab-who" aria-labelledby="ab-who-h">
        <div className="st-wrap ab-who__in">
          <div className="ab-who__art">
            <Reveal className="ab-who__a">
              <Image src={SWATCH.craft} alt="Hand block printed fabric goods from Jaipur" fill sizes="(max-width:900px) 70vw, 34vw" />
            </Reveal>
            <Reveal delay={2} className="ab-who__b">
              <Image src={SWATCH.garden} alt="Flower garden printed cotton" fill sizes="(max-width:900px) 40vw, 18vw" />
            </Reveal>
            <span className="ab-who__stamp" aria-hidden="true">Mother<br />&amp; son</span>
          </div>
          <div className="ab-who__copy">
            <Reveal as="p" className="ab-kicker ab-kicker--ink">Who we are</Reveal>
            <Reveal as="h2" delay={1} className="ab-h2" id="ab-who-h">Saroj&rsquo;s legacy, <em>Aakash&rsquo;s</em> vision.</Reveal>
            <Reveal delay={2} className="ab-prose">
              <p>
                As time went on, Aakash, Saroj&rsquo;s son, joined the family business. He recognised the potential to take
                Saroj Textile beyond the walls of their small shop, and with his vision and knowledge of technology he
                brought it online — reaching more customers, offering our premium fabrics nationwide and building a strong
                online presence.
              </p>
              <p>
                Despite the growing competition, where many sell fabrics at lower prices with compromised quality, we remain
                steadfast in our commitment to excellence. Our family&rsquo;s promise is simple: to keep providing high-quality
                cotton fabrics you can trust, with the same passion and care that Saroj instilled from the very beginning.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= QUALITY ================= */}
      <section className="ab-qual" aria-labelledby="ab-qual-h">
        <div className="st-wrap">
          <header className="ab-head ab-head--split">
            <div>
              <Reveal as="p" className="ab-kicker">Quality is our priority</Reveal>
              <Reveal as="h2" delay={1} className="ab-h2 ab-h2--light" id="ab-qual-h">Made to be <em>worn, washed</em> and loved.</Reveal>
            </div>
            <Reveal as="p" delay={2} className="ab-qual__lede">
              Our team brings together prints that are perfect for the season, with a variety of ways to inspire your next look.
            </Reveal>
          </header>
          <div className="ab-qual__grid">
            {PROMISES.map((p, i) => (
              <Reveal key={p.no} delay={((i % 3) + 1) as 1 | 2 | 3} className="ab-card">
                <div className="ab-card__img" style={{ backgroundImage: `url(${p.img})` }} aria-hidden="true" />
                <span className="ab-card__no" aria-hidden="true">{p.no}</span>
                <svg className="ab-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p.icon}</svg>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WELCOME ================= */}
      <section className="ab-end" aria-labelledby="ab-end-h">
        <div className="ab-end__mosaic" aria-hidden="true">
          {[SWATCH.paisley, SWATCH.jaipur, SWATCH.ajrakh, SWATCH.garden, SWATCH.kalamkari, SWATCH.jugal, SWATCH.stack, SWATCH.paisley].map((s, i) => (
            <div key={i} style={{ backgroundImage: `url(${s})` }} />
          ))}
        </div>
        <div className="ab-end__in st-wrap">
          <Reveal as="p" className="ab-kicker">Thank you for being a part of our journey</Reveal>
          <Reveal as="h2" delay={1} className="ab-end__title" id="ab-end-h">
            Welcome to the <em>Saroj Textile</em> family.
          </Reveal>
          <Reveal delay={2} className="ab-end__cta">
            <Link href="/shop" className="ab-btn ab-btn--solid">Shop the fabrics <Icon name="right" size={16} strokeWidth={1.8} /></Link>
            <a href={site.social.find((s) => s.includes("instagram"))} target="_blank" rel="noopener noreferrer" className="ab-btn">
              Join 50,000+ on Instagram
            </a>
          </Reveal>
        </div>
      </section>

      <JsonLd data={graph([breadcrumbLd([{ name: "Home", path: "/" }, { name: "Our story", path: "/about" }])])} />
    </main>
  );
}
