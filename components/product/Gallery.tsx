"use client";
import Image from "next/image";
import { useState } from "react";
import Portal from "@/components/ui/Portal";
import { useTransition } from "@/components/ui/useMounted";
import { useStore } from "@/components/shell/StoreProvider";
import type { Product } from "@/lib/types";
import { discount } from "@/lib/products";
import { priced } from "@/lib/wholesale";

/** Sticky photo column with hover zoom, thumbnails and a click-through lightbox. */
export default function Gallery({ p }: { p: Product }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [light, setLight] = useState(false);
  const [broken, setBroken] = useState<Record<number, true>>({});
  const { render, shown } = useTransition(light, 320);
  const shot = p.images[i];
  const { mode } = useStore();
  const view = priced(p, mode === "wholesale");
  /* The badge quotes the same saving as the price next to it, in either mode. */
  const off = discount(view.wholesale ? { ...p, price: view.price, mrp: view.mrp } : p);

  return (
    <div className="st-gal">
      <figure className="st-gal__main ph" style={{ margin: 0 }}
        onPointerMove={(e) => {
          if (e.pointerType === "touch") return;
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
          setZoom(true);
        }}
        onPointerLeave={() => setZoom(false)}
        onClick={() => !broken[i] && setLight(true)}>
        {broken[i] ? (
          <span style={{
            position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "1.5rem",
            textAlign: "center", fontSize: ".62rem", letterSpacing: ".14em", textTransform: "uppercase",
            color: "var(--mute)",
          }}>{shot.note}</span>
        ) : (
          <Image src={shot.src} alt={p.name} fill priority sizes="(max-width:940px) 100vw, 620px"
            onError={() => setBroken((b) => ({ ...b, [i]: true }))}
            style={{ objectFit: "cover", transformOrigin: origin, transform: zoom ? "scale(2)" : undefined,
                     transition: zoom ? "transform .12s linear" : "transform .5s var(--ease)" }} />
        )}
        <div className="st-gal__flag">
          {p.fresh > 30 && <span className="new">New</span>}
          {off > 0 && <span className="off">{off}% off</span>}
        </div>
        <span className="st-gal__hint">Hover to zoom · click to open</span>
      </figure>

      {p.images.length > 1 && (
        <div className="st-thumbs" role="group" aria-label="Product photos">
          {p.images.map((s, n) => (
            <button type="button" key={s.src} className={`st-thumb ph${n === i ? " on" : ""}`}
              onClick={() => setI(n)} aria-label={`Photo ${n + 1}`} aria-current={n === i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {render && (
        <Portal>
          <div className={`lightbox${shown ? " in" : ""}`} onClick={() => setLight(false)} role="dialog" aria-label={p.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot.src} alt={p.name} />
          </div>
        </Portal>
      )}
    </div>
  );
}
