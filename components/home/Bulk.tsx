import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/lib/site";

const cards = [
  ["01", "Wholesale fabric", "From ₹80 a metre at fifty metres and up, on any print in the book.",
    ["Cut to your lengths", "Mixed prints allowed", "GST invoice"]],
  ["02", "Wedding & return gifts", "Meenakari, brass and pottery in matched sets, wrapped in our own cloth.",
    ["50 pieces and up", "Names on the tags", "Six weeks' notice"]],
  ["03", "Corporate & export", "Repeatable runs with a signed-off sample before anything goes into production.",
    ["Sample first", "Export documentation", "Freight arranged"]],
];
 
export default function Bulk() {
  return (
    <section className="st-sec st-bulk" id="bulk">
      <div className="st-wrap">
        <Reveal className="st-eyebrow">Larger orders</Reveal>
        <Reveal as="h2" delay={1} className="st-h2">Bulk &amp; gifting.</Reveal>
        <Reveal as="p" delay={2} className="st-lede">
          Everything on the shelf can be made in quantity. Tell us the number and the date and we’ll
          tell you honestly whether the lane can hold it.
        </Reveal>

        <div className="st-bulk__grid">
          {cards.map(([n, title, copy, list]) => (
            <div className="st-bulkcard" key={n as string}>
              <span className="st-bulkcard__n">{n}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <ul>{(list as string[]).map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          ))}
        </div>

        <div className="st-bulk__cta">
          <a href={`https://wa.me/${site.whatsapp}`} className="st-btn st-btn--light">WhatsApp the counter</a>
          <Link href="/shop" className="st-btn st-btn--light">See what’s available</Link>
        </div>
      </div>
    </section>
  );
}
