import { site } from "@/lib/site";

/** The marquee above the nav. Duplicated so the loop is seamless. */
export default function Ticker() {
  const lines = [...site.ticker, ...site.ticker, ...site.ticker, ...site.ticker];

  return (
    <div className="st-top" aria-hidden="true">
      <ul data-marquee>
        {lines.map(([lead, strong], i) => <li key={i}>{lead}<b>{strong}</b></li>)}
      </ul>
    </div>
  );
}
