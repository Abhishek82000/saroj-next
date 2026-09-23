import Link from "next/link";
import type { HcSlide } from "@/lib/handicraft";

/**
 * The fabric collections as a slow, endless strip along the bottom of the
 * dark cloth section — the same drift as the craft roll and the review wall,
 * so it reads as part of the page rather than a carousel bolted on. Hover
 * (or focus) pauses it; the list is rendered twice so the loop never shows a seam.
 */
export default function FabricStrip({ slides }: { slides: HcSlide[] }) {
  if (slides.length === 0) return null;
  const loop = [...slides, ...slides];

  return (
    <div className="hc-fstrip">
      <div className="hc-fstrip__head">
        <span className="hc-fstrip__label">All {slides.length} collections</span>
        <Link href="/shop" className="hc-fstrip__all">Shop every fabric →</Link>
      </div>

      <div className="hc-fstrip__view">
        {/* Duration scales with the count so the drift speed stays the same however many there are. */}
        <ul className="hc-fstrip__track" style={{ animationDuration: `${slides.length * 5}s` }}>
          {loop.map((s, i) => {
            const copy = i >= slides.length;
            const body = (
              <>
                <span className="hc-fstrip__ph"><img src={s.img} alt={copy ? "" : s.name} loading="lazy" draggable={false} /></span>
                <span className="hc-fstrip__name">{s.name}</span>
              </>
            );
            return (
              <li key={i} aria-hidden={copy || undefined}>
                {s.href
                  ? <Link href={s.href} className="hc-fstrip__item" tabIndex={copy ? -1 : undefined}>{body}</Link>
                  : <span className="hc-fstrip__item">{body}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
