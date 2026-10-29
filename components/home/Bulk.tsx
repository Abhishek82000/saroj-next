import Image from "next/image";
import Link from "@/components/ui/SiteLink";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/lib/site";

/* Stand-in until the photography is on the CDN.
   SWAP: a tall shot of handicraft packed in bulk — stacked pottery, boxed brass, gift sets. */
const PHOTO = { src: "https://picsum.photos/seed/saroj-bulk-craft/900/1200", alt: "Jaipur handicraft packed in bulk for an order" };

/* The three ways to order in quantity: what it is, and the minimum. */
const options = [
  { n: "01", title: "Wholesale fabric", min: "50", unit: "metres",
    copy: "From ₹80 a meter on any print in the book, cut to the lengths you need. Mix prints within one order, and every invoice carries GST for your books." },
  { n: "02", title: "Wedding & return gifts", min: "50", unit: "pieces",
    copy: "Meenakari, brass and blue pottery in matched sets, wrapped in our own block-printed cloth. We put names on the tags — give us six weeks’ notice so every piece matches." },
  { n: "03", title: "Corporate & export", min: "1", unit: "sample",
    copy: "Repeatable runs for brands and buyers abroad. You sign off a sample before anything goes into production, and we handle the export documentation and freight." },
];

/**
 * Home: bulk & gifting — one photo of handicraft in quantity, the options beside it.
 * Spaced like every other section; the photo keeps its shape (square on phones; on laptops most of the screen high, beside the words).
 */
export default function Bulk() {
  return (
    <section className="st-bulk" id="bulk" aria-labelledby="bulk-title">
      <Reveal className="st-bulk__art">
        <Image src={PHOTO.src} alt={PHOTO.alt} fill sizes="(max-width:900px) 100vw, 50vw" className="st-bulk__img" />
        <span className="st-bulk__stamp" aria-hidden="true">50+<small>pieces</small></span>
      </Reveal>

      <div className="st-bulk__body">
        <Reveal className="st-eyebrow">Larger orders</Reveal>
        <Reveal as="h2" delay={1} className="st-h2" id="bulk-title">Bulk &amp; <em>gifting.</em></Reveal>
        <Reveal as="p" delay={2} className="st-lede">
          Everything on the shelf can be made in quantity. Tell us the number and the date and we’ll
          tell you honestly whether the lane can hold it.
        </Reveal>

        <Reveal as="ul" delay={3} className="st-bulk__list">
          {/* Native accordion: the shared name keeps one open at a time, no JS needed. */}
          {options.map((o, i) => (
            <li key={o.n}>
              <details name="bulk-options" open={i === 0}>
                <summary>
                  <span className="st-bulk__n">{o.n}</span>
                  <h3>{o.title}</h3>
                  <span className="st-bulk__min">
                    <b>{o.min}</b>
                    <small>{o.unit}</small>
                  </span>
                  <span className="st-bulk__toggle" aria-hidden="true" />
                </summary>
                <p>{o.copy}</p>
              </details>
            </li>
          ))}
        </Reveal>

        <Reveal delay={4} className="st-bulk__cta">
          <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="st-bulk__wa">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1.1Z" /></svg>
            WhatsApp the counter
          </a>
          <Link href="/shop" className="st-btn">See what’s available</Link>
        </Reveal>
      </div>
    </section>
  );
}
