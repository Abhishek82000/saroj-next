"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { useStore } from "@/components/shell/StoreProvider";
import { bySlug } from "@/lib/products";
import { inr } from "@/lib/site";
import type { Reel } from "@/lib/types";

const MP4 = "https://saroj-textile-store.b-cdn.net/products/";

const reels: Reel[] = [
  {
    id: "reel-green-yellow-ajrakh",
    video: MP4 + "32401765301609.mp4",
    kind: "Fabric",
    name: "Green base with yellow big flower Ajrakh print",
    price: 150, mrp: 180, unit: "metre",
    image: MP4 + "711785564464.webp",
    href: "https://www.sarojtextile.com/product/green-base-with-yellow-big-flower-ajrakh-print",
  },
  {
    id: "reel-black-bouquet",
    video: MP4 + "99751775717907.mp4",
    kind: "Fabric",
    name: "Black base with white, mustard and rust flower bouquet cotton",
    price: 160, mrp: 190, unit: "metre",
    image: MP4 + "74021788077426.webp",
    slug: "blace-base-with-abstract-white-jaal-printed-jaipuri-cotton-fabric",
  },
  {
    id: "reel-kot-jewar-vase",
    video: MP4 + "59221775639239.mp4",
    kind: "Handicraft",
    name: "Kot Jewar vase, thrown and painted freehand",
    price: 1450, mrp: 1750, unit: "pair",
    image: "https://picsum.photos/seed/saroj-shelf-vase/500/500",
    slug: "kot-jewar-vase-and-jar",
  },
  {
    id: "reel-flower-garden",
    video: MP4 + "32401765301609.mp4",
    kind: "Fabric",
    name: "Black base with white, green and magenta pink flower garden",
    price: 160, mrp: 190, unit: "metre",
    image: MP4 + "63571788078066.webp",
    slug: "black-base-with-mustard-and-peach-multiflower-printed-jaipuri-cotton-fabric",
  },
  {
    id: "reel-meenakari-plate",
    video: MP4 + "99751775717907.mp4",
    kind: "Handicraft",
    name: "Meenakari wall plate, enamel set colour by colour",
    price: 2900, mrp: 0, unit: "each",
    image: "https://picsum.photos/seed/saroj-shelf-plate/500/500",
    slug: "meenakari-wall-plate",
  },
];

/**
 * Drape and glaze don't survive a still, so these are short clips shot on the
 * counter. Each one is buyable without leaving the rail.
 */
export default function Reels({ items }: { items?: Reel[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const data = items && items.length > 0 ? items : reels;

  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="st-sec" id="reels" style={{ paddingBottom: "clamp(30px,5vw,54px)" }}>
      <div className="st-wrap st-railhead">
        <div>
          <Reveal className="st-eyebrow">See it move</Reveal>
          <Reveal as="h2" delay={1} className="st-h2">Shoppable reels.</Reveal>
          <Reveal as="p" delay={2} className="st-lede">
            Drape, weight and glaze don’t survive a still photo. These are shot on the counter,
            no lighting rig.
          </Reveal>
        </div>
        <Reveal delay={2} className="row-gap">
          <button className="st-arrow" onClick={() => nudge(-1)} aria-label="Scroll left">
            <Icon name="left" size={16} strokeWidth={1.8} />
          </button>
          <button className="st-arrow" onClick={() => nudge(1)} aria-label="Scroll right">
            <Icon name="right" size={16} strokeWidth={1.8} />
          </button>
        </Reveal>
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
  const { add } = useStore();
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

  const link = reel.slug ? `/product/${reel.slug}` : reel.href!;
  const product = reel.slug ? bySlug[reel.slug] : undefined;

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
          <button className="st-reel__buy"
            onClick={() => add({
              id: reel.slug ?? reel.id,
              name: reel.name,
              price: reel.price,
              unit: reel.unit,
              image: reel.image,
              step: product?.cut?.step ?? (reel.unit === "metre" ? 0.5 : 1),
              qty: reel.unit === "metre" ? 2.5 : 1,
              href: reel.slug ? link : undefined,
            })}>
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
