"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { site } from "@/lib/site";
import { WHOLESALE_MIN_METRES, wholesaleCategoryHref } from "@/lib/wholesale";
import type { WholesaleCollection } from "@/lib/wholesalePage";

/** How much the loupe magnifies. */
const ZOOM = 2.6;
const TURN_MS = 900;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "Also in the book" — the second set of collections as a merchant's swatch
 * book. It lies closed until it scrolls into view, then the cloth cover
 * swings open on its spine. Each page has the print taped in as a pinked
 * swatch with a trade stamp; over a swatch, a brass loupe shows the cloth up
 * close at full resolution (the reason a buyer opens a swatch book at all).
 *
 * Two collections make one spread. More than two: the arrows turn the page.
 * An odd one out leaves a ruled notes page with a line to the counter.
 * Phones: the pages stack as ring-bound cards. Reduced motion: it's simply open.
 */
export default function SwatchBook({ collections }: { collections: WholesaleCollection[] }) {
  const spreads = Math.ceil(collections.length / 2);
  const [spread, setSpread] = useState(0);
  const [turn, setTurn] = useState<"next" | "prev" | null>(null);
  const [open, setOpen] = useState(false);
  const [still, setStill] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStill(reduce);
    const node = root.current;
    if (reduce || !node || !("IntersectionObserver" in window)) { setOpen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOpen(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(node);
    return () => { io.disconnect(); clearTimeout(timer.current); };
  }, []);

  /* A leaf turns over the spine; the spread changes under it halfway through. */
  const flip = (dir: "next" | "prev") => {
    if (turn) return;
    const to = spread + (dir === "next" ? 1 : -1);
    if (to < 0 || to >= spreads) return;
    if (still) { setSpread(to); return; }
    setTurn(dir);
    timer.current = setTimeout(() => {
      setSpread(to);
      timer.current = setTimeout(() => setTurn(null), TURN_MS / 2);
    }, TURN_MS / 2);
  };

  const pages: (WholesaleCollection | null)[] = [...collections];
  if (pages.length % 2) pages.push(null);

  return (
    <div ref={root} className={`sb${open ? " sb--open" : ""}${still ? " sb--still" : ""}`} style={{ "--turn": `${TURN_MS}ms` } as React.CSSProperties}>
      <div className="sb-book">
        <span className="sb-ribbon" aria-hidden="true" />
        <div className="sb-spread">
          {pages.map((c, i) => {
            const side = i % 2 ? "r" : "l";
            const here = Math.floor(i / 2) === spread;
            return c
              ? <Page key={c.id} c={c} no={i + 1} side={side} here={here} />
              : <NotesPage key="notes" no={i + 1} here={here} />;
          })}
        </div>
        {/* the cover, lying on the right page until the book opens */}
        <div className="sb-cover" aria-hidden="true">
          <div className="sb-cover__front">
            <span className="sb-cover__foil">
              <small>Saroj Textile · Jaipur</small>
              <b>Swatch Book</b>
              <i>Wholesale edition</i>
            </span>
          </div>
          <div className="sb-cover__back" />
        </div>
        {turn && <span className={`sb-leaf sb-leaf--${turn}`} aria-hidden="true"><i /><i /></span>}
      </div>

      {spreads > 1 && (
        <div className="sb-nav">
          <button type="button" onClick={() => flip("prev")} disabled={spread === 0} aria-label="Previous pages"><Icon name="left" size={18} /></button>
          <span aria-live="polite">Pages {pad(spread * 2 + 1)}–{pad(Math.min(spread * 2 + 2, pages.length))}</span>
          <button type="button" onClick={() => flip("next")} disabled={spread === spreads - 1} aria-label="Next pages"><Icon name="right" size={18} /></button>
        </div>
      )}
    </div>
  );
}

function Page({ c, no, side, here }: { c: WholesaleCollection; no: number; side: "l" | "r"; here: boolean }) {
  const href = wholesaleCategoryHref(c.slug);
  return (
    <article className={`sb-page sb-page--${side}${here ? " here" : ""}`} aria-labelledby={`sb-h-${c.id}`}>
      <header className="sb-page__top">
        <span>p. {pad(no)}</span>
        <span>Swatch No. {c.id}</span>
      </header>

      <Swatch c={c} href={href} />

      <div className="sb-page__body">
        <h3 id={`sb-h-${c.id}`}><Link href={href}>{c.heading}</Link></h3>
        {c.blurb
          ? <p>{c.blurb}</p>
          : <p className="sb-page__note">Every shade of this one is on the full card at the counter — ask for it before you order.</p>}
        <ul className="sb-page__spec">
          <li><b>{WHOLESALE_MIN_METRES} m</b> minimum</li>
          <li><b>Cut</b> to length</li>
          <li><b>GST</b> invoice</li>
        </ul>
        <Link href={href} className="sb-page__go">Turn to the collection <Icon name="right" size={15} strokeWidth={2} /></Link>
      </div>
      <span className="sb-page__ear" aria-hidden="true" />
    </article>
  );
}

/** The taped-in swatch, and the loupe that reads it. Mouse / pen only — touch scrolls. */
function Swatch({ c, href }: { c: WholesaleCollection; href: string }) {
  const box = useRef<HTMLAnchorElement>(null);

  const move = (e: React.PointerEvent) => {
    const el = box.current;
    if (!el || e.pointerType === "touch") return;
    const img = el.querySelector("img");
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    /* Where the photo actually sits in the box (object-fit: cover), magnified. */
    const iw = img?.naturalWidth || 3, ih = img?.naturalHeight || 4;
    const s = Math.max(r.width / iw, r.height / ih);
    const dw = iw * s, dh = ih * s;
    const ox = (r.width - dw) / 2, oy = (r.height - dh) / 2;
    const R = 75;
    el.style.setProperty("--lx", `${x}px`);
    el.style.setProperty("--ly", `${y}px`);
    el.style.setProperty("--bs", `${dw * ZOOM}px ${dh * ZOOM}px`);
    el.style.setProperty("--bp", `${R - (x - ox) * ZOOM}px ${R - (y - oy) * ZOOM}px`);
    el.classList.add("lens");
  };
  const leave = () => box.current?.classList.remove("lens");

  return (
    <Link href={href} ref={box} className="sb-sw" aria-label={`Shop ${c.heading} wholesale`}
      onPointerMove={move} onPointerLeave={leave} draggable={false}
      style={{ "--src": `url("${c.banner}")` } as React.CSSProperties}>
      <span className="sb-sw__cloth">
        <Image src={c.banner} alt={c.heading} fill sizes="(min-width:960px) 30vw, 80vw" draggable={false} />
      </span>
      <span className="sb-sw__tape sb-sw__tape--a" aria-hidden="true" />
      <span className="sb-sw__tape sb-sw__tape--b" aria-hidden="true" />
      <span className="sb-sw__lens" aria-hidden="true" />
      <span className="sb-sw__hint" aria-hidden="true">Look closer</span>
      <svg className="sb-stamp" viewBox="0 0 120 120" aria-hidden="true">
        <defs><path id={`sb-arc-${c.id}`} d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs>
        <circle cx="60" cy="60" r="56" fill="none" strokeWidth="3" />
        <circle cx="60" cy="60" r="33" fill="none" strokeWidth="1.5" />
        <text><textPath href={`#sb-arc-${c.id}`}>WHOLESALE · TRADE RATE · JAIPUR ·</textPath></text>
        <text x="60" y="58" textAnchor="middle" className="sb-stamp__big">{WHOLESALE_MIN_METRES}m</text>
        <text x="60" y="74" textAnchor="middle" className="sb-stamp__sm">MIN.</text>
      </svg>
    </Link>
  );
}

/** The blank page when the count is odd: ruled lines and a word with the counter. */
function NotesPage({ no, here }: { no: number; here: boolean }) {
  return (
    <aside className={`sb-page sb-page--r sb-page--notes${here ? " here" : ""}`}>
      <header className="sb-page__top"><span>p. {pad(no)}</span><span>Notes</span></header>
      <div className="sb-notes">
        <p>More prints are cut every week.</p>
        <a href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Hi, please share your latest wholesale prints.")}`}
          target="_blank" rel="noopener noreferrer" className="sb-page__go">
          Ask the counter for the latest <Icon name="right" size={15} strokeWidth={2} />
        </a>
      </div>
    </aside>
  );
}
