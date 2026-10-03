"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { WHOLESALE_MIN_METRES, wholesaleCategoryHref } from "@/lib/wholesale";
import type { WholesaleCollection } from "@/lib/wholesalePage";

/** How long each bolt stays out before the next one rolls (ms) — also the thread's fill time in CSS. */
const DWELL = 7000;
const CLOTH_SIZES = "(min-width:960px) 34vw, 86vw";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "Open a bolt." — the wholesale collections as cloth on a cutting table.
 *
 * The index on the left reads like a swatch ledger. Picking one rolls its
 * bolt down from the dowel: the roll travels down and leaves the print
 * unrolled behind it, over the last one. A kraft trade tag on a string swings
 * in with the name, the trade terms and the way in. The cloth sways, tilts
 * towards the pointer and catches a sheen where it points, and the room
 * glows in the print's own colours.
 *
 * It moves on by itself — the stitched thread under the active name is the
 * timer — and stops while the pointer or focus is inside, while it's off
 * screen, when paused, and for good under prefers-reduced-motion. Keyboard:
 * the index is a tablist (arrows / Home / End). Touch: swipe the cloth.
 */
export default function BoltTable({ collections }: { collections: WholesaleCollection[] }) {
  const n = collections.length;
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [hold, setHold] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [inView, setInView] = useState(false);
  /* The first bolt waits to unroll until the table is on screen. */
  const [seen, setSeen] = useState(false);
  const [still, setStill] = useState(false);
  const activeRef = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipe = useRef<number | null>(null);

  const go = useCallback((i: number) => {
    const next = ((i % n) + n) % n;
    if (next === activeRef.current) return;
    setPrev(activeRef.current);
    activeRef.current = next;
    setActive(next);
  }, [n]);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const node = root.current;
    if (!node || !("IntersectionObserver" in window)) { setInView(true); setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting);
      if (e.isIntersecting) setSeen(true);
    }, { threshold: 0.3 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  /* Phones: keep the active chip in view without moving the page. */
  useEffect(() => {
    const row = chips.current;
    const tab = tabs.current[active];
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2, behavior: still ? "auto" : "smooth" });
  }, [active, still]);

  const auto = n > 1 && !still;
  const running = auto && inView && !hold && !userPaused;

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = ((to % n) + n) % n;
    go(next);
    tabs.current[next]?.focus();
  };

  /* The cloth leans towards the pointer and the sheen follows it. Written straight to CSS vars — no re-render. */
  const onMove = (e: React.PointerEvent) => {
    const el = tilt.current;
    if (!el || e.pointerType !== "mouse" || still) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const el = tilt.current;
    if (!el) return;
    for (const v of ["--rx", "--ry", "--mx", "--my"]) el.style.removeProperty(v);
  };

  const c = collections[active];

  return (
    <div
      ref={root}
      className={`bt${seen ? " bt--seen" : ""}${still ? " bt--still" : ""}${running ? "" : " bt--held"}`}
      style={{ "--dwell": `${DWELL}ms` } as React.CSSProperties}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setHold(true); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") setHold(false); }}
      onFocus={() => setHold(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHold(false); }}
    >
      {/* the room takes on the print's colours */}
      <div className="bt-glow" aria-hidden="true">
        {collections.map((k, i) => (
          <span key={k.id} className={i === active ? "on" : ""}>
            <Image src={k.banner} alt="" fill sizes="96px" />
          </span>
        ))}
      </div>

      <div className="bt-grid">
        {/* ---------- the ledger ---------- */}
        <div className="bt-index" role="tablist" aria-label="Collections" aria-orientation="vertical" ref={chips}>
          {collections.map((k, i) => {
            const on = i === active;
            return (
              <button
                key={k.id}
                ref={(el) => { tabs.current[i] = el; }}
                type="button"
                role="tab"
                id={`bt-tab-${k.id}`}
                aria-selected={on}
                aria-controls="bt-panel"
                tabIndex={on ? 0 : -1}
                className={`bt-idx${on ? " on" : ""}`}
                onClick={() => go(i)}
                onKeyDown={(e) => onKey(e, i)}
              >
                <span className="bt-idx__no" data-no={pad(i + 1)} aria-hidden="true">{pad(i + 1)}</span>
                <span className="bt-idx__name">{k.heading}</span>
                <span className="bt-idx__sw" aria-hidden="true"><Image src={k.banner} alt="" fill sizes="64px" /></span>
                <span className="bt-idx__stitch" aria-hidden="true" />
                {on && auto && (
                  <span
                    key={`${active}`}
                    className="bt-idx__thread"
                    aria-hidden="true"
                    onAnimationEnd={(e) => { if (e.animationName === "btThread") go(active + 1); }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ---------- the table ---------- */}
        <div
          className="bt-stage"
          id="bt-panel"
          role="tabpanel"
          aria-labelledby={`bt-tab-${c.id}`}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onPointerDown={(e) => { if (e.pointerType !== "mouse") swipe.current = e.clientX; }}
          onPointerUp={(e) => {
            if (swipe.current === null) return;
            const dx = e.clientX - swipe.current;
            swipe.current = null;
            if (Math.abs(dx) > 44) go(active + (dx < 0 ? 1 : -1));
          }}
        >
          <div className="bt-tilt" ref={tilt}>
            <span className="bt-rod" aria-hidden="true" />
            <div className="bt-hang">
              {collections.map((k, i) => {
                const on = i === active;
                const was = i === prev && !on;
                return (
                  <div key={k.id} className={`bt-cloth${on ? " on" : ""}${was ? " was" : ""}`} aria-hidden={!on}>
                    <Link href={wholesaleCategoryHref(k.slug)} className="bt-cloth__sheet" tabIndex={on ? 0 : -1}
                      aria-label={`Shop ${k.heading} wholesale`} draggable={false}>
                      <Image src={k.banner} alt={k.heading} fill sizes={CLOTH_SIZES} priority={i === 0} draggable={false} />
                      <span className="bt-cloth__folds" />
                      <span className="bt-cloth__sheen" />
                      <span className="bt-cloth__stitch" />
                    </Link>
                    {/* the bolt itself, rolling down and leaving the cloth behind */}
                    <span className="bt-cloth__roll" aria-hidden="true">
                      <Image src={k.banner} alt="" fill sizes={CLOTH_SIZES} draggable={false} />
                    </span>
                  </div>
                );
              })}
              <span className="bt-clips" aria-hidden="true"><i /><i /><i /><i /></span>
            </div>

            {/* the trade tag — remounted per bolt so it swings in afresh */}
            <div className="bt-tag" key={c.id}>
              <span className="bt-tag__no">No. {pad(active + 1)} <small>/ {pad(n)}</small></span>
              <h3>{c.heading}</h3>
              {c.blurb && <p>{c.blurb}</p>}
              <ul className="bt-tag__terms">
                <li>{WHOLESALE_MIN_METRES} m min.</li>
                <li>Cut to length</li>
                <li>GST invoice</li>
              </ul>
              <Link href={wholesaleCategoryHref(c.slug)} className="bt-tag__go">
                Open the bolt <Icon name="right" size={15} strokeWidth={2} />
              </Link>
            </div>
          </div>

          {n > 1 && (
            <div className="bt-ctrl">
              <button type="button" onClick={() => go(active - 1)} aria-label="Previous collection"><Icon name="left" size={18} /></button>
              <span className="bt-ctrl__count" aria-live="polite">
                <b key={active}>{pad(active + 1)}</b><i>/</i>{pad(n)}
              </span>
              <button type="button" onClick={() => go(active + 1)} aria-label="Next collection"><Icon name="right" size={18} /></button>
              {auto && (
                <button type="button" className="bt-ctrl__play" onClick={() => setUserPaused((p) => !p)}
                  aria-label={userPaused ? "Play the collections" : "Pause the collections"} aria-pressed={userPaused}>
                  {userPaused
                    ? <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
                    : <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
