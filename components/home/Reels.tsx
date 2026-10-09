"use client";

import Link from "@/components/ui/SiteLink";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { useStore } from "@/components/shell/StoreProvider";
import { inr } from "@/lib/site";
import type { Reel } from "@/lib/types";

/**
 * Drape and glaze don't survive a still, so these are short clips shot on the
 * counter. Each one is buyable without leaving the rail.
 */
export default function Reels({ items }: { items?: Reel[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const data = items ?? [];

  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  /* Clips come from the API only — no clips, no section. */
  if (data.length === 0) return null;

  return (
    <section className="st-sec" id="reels" style={{ paddingBlock: "0 clamp(30px,5vw,54px)" }}>
      <div className="st-wrap st-railhead">
        <div>
          <Reveal className="st-eyebrow">See it move</Reveal>
          <Reveal as="h2" delay={1} className="st-h2">Shoppable reels.</Reveal>
        </div>
      </div>

      <div className="st-wrap">
        <div className="st-reels" ref={rail}>
          {data.map((r) => <ReelCard key={r.id} reel={r} />)}
        </div>
      </div>
    </section>
  );
}

function ReelCard({ reel }: { reel: Reel }) {
  const { add, href, mode } = useStore();
  /* Wholesale orders go through the piece's own page (minimums, login), never straight into the retail cart. */
  const wholesale = mode === "wholesale";
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);
  const [failed, setFailed] = useState(false);

  /* Clips load and play only while on screen — five autoplaying videos is a
     lot of bandwidth to spend on someone scrolling past. */
  useEffect(() => {
    const v = video.current;
    if (!v || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) { v.pause(); setPlaying(false); return; }
        if (!v.src) v.src = reel.video;
        v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      },
      { threshold: 0.55 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reel.video]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) { if (!v.src) v.src = reel.video; v.play().then(() => setPlaying(true)).catch(() => {}); }
    else { v.pause(); setPlaying(false); }
  };

  const link = reel.slug ? href(`/product/${reel.slug}`) : reel.href!;

  return (
    <article className={`st-reel${playing ? "" : " paused"}`}>
      <span className={`st-reel__kind${reel.kind === "Handicraft" ? " craft" : ""}`}>{reel.kind}</span>

      {failed ? (
        <p style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center", margin: 0, padding: "1.4rem",
          textAlign: "center", color: "rgba(255,255,255,.5)", fontSize: ".58rem",
          letterSpacing: ".14em", textTransform: "uppercase",
        }}>PLACEHOLDER — {reel.name}</p>
      ) : (
        <video ref={video} muted loop playsInline preload="none" aria-label={reel.name}
          onError={() => setFailed(true)} />
      )}

      <button className="st-reel__play" onClick={toggle} aria-label={playing ? "Pause video" : "Play video"}>
        <span><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7Z" /></svg></span>
      </button>

      <button className={`st-reel__mute${sound ? " is-on" : ""}`}
        onClick={() => { const v = video.current; if (!v) return; v.muted = sound; setSound(!sound); }}
        aria-label={sound ? "Mute" : "Sound on"} aria-pressed={sound}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4Z" />
          {sound ? <path d="M17 8a6 6 0 0 1 0 8" /> : <path d="m17 9 4 6M21 9l-4 6" />}
        </svg>
      </button>

      <div className="st-reel__info">
        {reel.slug
          ? <Link className="st-reel__name" href={link}>{reel.name}</Link>
          : <a className="st-reel__name" href={link}>{reel.name}</a>}
        <div className="st-reel__foot">
          <span className="st-reel__price">
            <b>{inr(reel.price)}</b>{reel.mrp > 0 && <s>{inr(reel.mrp)}</s>}
          </span>
          {wholesale ? (
            <Link className="st-reel__buy" href={link}>View piece</Link>
          ) : <button className="st-reel__buy"
            onClick={() => add({
              id: reel.slug ?? reel.id,
              name: reel.name,
              price: reel.price,
              unit: reel.unit,
              image: reel.image,
              step: reel.unit === "metre" ? 0.5 : 1,
              qty: reel.unit === "metre" ? 2.5 : 1,
              href: reel.slug ? link : undefined,
              productId: reel.productId,
            })}>
            Add to Cart
          </button>}
        </div>
      </div>
    </article>
  );
}
