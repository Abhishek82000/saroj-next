import Link from "@/components/ui/SiteLink";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/lib/site";

/* Each option is an order docket off the counter pad: what it is, what's included, and the minimum. */
const cards = [
  { n: "01", title: "Wholesale fabric", copy: "From ₹80 a metre at fifty metres and up, on any print in the book.",
    list: ["Cut to your lengths", "Mixed prints allowed", "GST invoice"], min: "50", unit: "metres", stamp: ["₹80", "per metre"] },
  { n: "02", title: "Wedding & return gifts", copy: "Meenakari, brass and pottery in matched sets, wrapped in our own cloth.",
    list: ["50 pieces and up", "Names on the tags", "Six weeks' notice"], min: "50", unit: "pieces", stamp: ["Gift", "wrapped"] },
  { n: "03", title: "Corporate & export", copy: "Repeatable runs with a signed-off sample before anything goes into production.",
    list: ["Sample first", "Export documentation", "Freight arranged"], min: "1", unit: "sample", stamp: ["Export", "ready"] },
];

export default function Bulk() {
  return (
    <section className="st-sec st-bulk" id="bulk">
      <div className="st-wrap">
        <div className="st-bulk__head">
          <div>
            <Reveal className="st-eyebrow">Larger orders</Reveal>
            <Reveal as="h2" delay={1} className="st-h2">Bulk &amp; <em>gifting.</em></Reveal>
          </div>
          <Reveal as="p" delay={2} className="st-lede">
            Everything on the shelf can be made in quantity. Tell us the number and the date and we’ll
            tell you honestly whether the lane can hold it.
          </Reveal>
        </div>

        <div className="st-bulk__grid">
          {cards.map((c) => (
            <article className="st-bulkcard" key={c.n}>
              <div className="st-bulkcard__top">
                <span>Docket</span>
                <span className="st-bulkcard__n">No. {c.n}</span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.copy}</p>
              <ul>{c.list.map((l) => <li key={l}>{l}</li>)}</ul>
              <div className="st-bulkcard__min">
                <span>Minimum</span>
                <b>{c.min}<small>{c.unit}</small></b>
              </div>
              <span className="st-bulkcard__stamp" aria-hidden="true">{c.stamp[0]}<small>{c.stamp[1]}</small></span>
            </article>
          ))}
        </div>

        <div className="st-bulk__cta">
          <p><b>Got a number and a date?</b> Send it over — we reply the same day.</p>
          <div>
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="st-bulk__wa">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1.1Z" /></svg>
              WhatsApp the counter
            </a>
            <Link href="/shop" className="st-btn">See what’s available</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
