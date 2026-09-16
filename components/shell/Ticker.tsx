import { getMarquee } from "@/lib/nav";
import { site } from "@/lib/site";

/** The marquee above the nav. Duplicated once so the loop is seamless. */
export default async function Ticker() {
  const marquee = await getMarquee();

  return (
    <div className="st-top" aria-hidden="true">
      <ul>
        {marquee
          ? [marquee, marquee].map((text, i) => <li key={i}>{text}</li>)
          : [...site.ticker, ...site.ticker].map(([lead, strong], i) => <li key={i}>{lead}<b>{strong}</b></li>)}
      </ul>
    </div>
  );
}
