import { site } from "@/lib/site";

/** The marquee above the nav. Duplicated once so the loop is seamless. */
export default function Ticker() {
  const items = [...site.ticker, ...site.ticker];
  return (
    <div className="st-top" aria-hidden="true">
      <ul>
        {items.map(([lead, strong], i) => (
          <li key={i}>{lead}<b>{strong}</b></li>
        ))}
      </ul>
    </div>
  );
}
