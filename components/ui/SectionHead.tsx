import Reveal from "@/components/ui/Reveal";

/**
 * The heading over a rail, the reels or the review wall. Titles come from the
 * API as plain text ("New Arrivals", "Ajrakh Collection"), so the styling is
 * worked out here: a small block-print butti leads in, the last word is set
 * apart in italic madder over a brush stroke that draws itself when the
 * heading scrolls in, and a rule with a carved diamond runs on to the edge.
 */
export default function SectionHead({ title, id }: { title: string; id?: string }) {
  const t = title.trim();
  const cut = t.lastIndexOf(" ");
  const lead = cut > 0 ? t.slice(0, cut) : "";
  const last = cut > 0 ? t.slice(cut + 1) : t;

  return (
    <div className="st-sh">
      <Reveal as="h2" delay={1} className="st-h2 st-sh__title" id={id}>
        <svg className="st-sh__butti" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2c2 3 2 5 0 7-2-2-2-4 0-7Zm0 20c-2-3-2-5 0-7 2 2 2 4 0 7ZM2 12c3-2 5-2 7 0-2 2-4 2-7 0Zm20 0c-3 2-5 2-7 0 2-2 4-2 7 0Z" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
        {lead && <>{lead} </>}
        <em className="st-sh__accent">
          {last}
          <svg className="st-sh__brush" viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true">
            <path d="M4 11C40 5 88 3 128 7s58 8 68 2" />
          </svg>
        </em>
      </Reveal>
      <span className="st-sh__rule" aria-hidden="true"><i /></span>
    </div>
  );
}
