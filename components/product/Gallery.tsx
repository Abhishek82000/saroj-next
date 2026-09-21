"use client";
import Image from "next/image";
import { useState } from "react";
import Portal from "@/components/ui/Portal";
import { useTransition } from "@/components/ui/useMounted";
import type { Product } from "@/lib/types";

/** Sticky photo column with hover zoom, thumbnails and a click-through lightbox. */
export default function Gallery({ p }: { p: Product }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [light, setLight] = useState(false);
  const [broken, setBroken] = useState<Record<number, true>>({});
  const { render, shown } = useTransition(light, 320);
  const shot = p.images[i];
  // A CMS label ("New", "Trending") when the product came from the API,
  // otherwise the catalogue's own freshness flag.
  const label = p.live?.label ?? (p.fresh > 30 ? "New" : null);

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
        {/* No discount pill here on purpose. It would be frozen at the default
            variation's price while the one in the buy box — inches away, and
            correct — follows the chosen variant, so the two disagreed. The
            label doesn't vary by variant, so it stays. */}
        <div className="st-gal__flag">
          {label && <span className="new">{label}</span>}
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
