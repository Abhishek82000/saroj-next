"use client";
import Link from "next/link";
import { useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { bySlug } from "@/lib/products";
import { inr } from "@/lib/site";

const slugs = [
  "red-over-dye-with-blue-block-printed-ajrakh-cotton-fabric",
  "teal-pastel-green-with-blue-ajrakh-printed-cotton-fabric",
  "neavy-blue-base-indigo-printed-kalamkari-paisley-print",
  "maroon-base-with-cream-paisley-printed-jaipuri-cotton-fabric",
  "leaf-green-polka-patola-in-red-ajrakh-cotton-printed-fabric",
];

/** Bolts fanned out like a swatch book; the active one lifts clear. */
export default function FabricFan() {
  const [active, setActive] = useState(3);
  const bolts = slugs.map((s) => bySlug[s]).filter(Boolean);
  const spread = 15;
  const current = bolts[active];

  return (
    <section className="st-sec st-cloth" id="cloth">
      <div className="st-wrap st-cloth__grid">
        <div>
          <Reveal className="st-eyebrow">House one, still standing</Reveal>
          <Reveal as="h2" delay={1} className="st-h2">Fabrics, by the metre.</Reveal>
          <Reveal as="p" delay={2} className="st-lede">
            Cut to any length from one metre. Forty-two inches wide, a hundred grams to the metre,
            and the wholesale rate starts at fifty.
          </Reveal>

          <div className="st-cloth__stats">
            <div><span>₹80</span><small>Wholesale from</small></div>
            <div><span>42″</span><small>Width</small></div>
            <div><span>1 m</span><small>Minimum cut</small></div>
          </div>

          <div className="st-cloth__cta">
            <Link href="/shop?craft=fabric" className="st-btn st-btn--light">Browse the fabric</Link>
            <a href="https://www.sarojtextile.com/wholesale-fabric" className="st-btn st-btn--light">Wholesale</a>
          </div>
        </div>

        <div className="st-fan">
          <div className="st-fan__inner">
            {bolts.map((b, i) => {
              const off = i - (bolts.length - 1) / 2;
              const on = i === active;
              return (
                <button key={b.slug} className={`st-bolt${on ? " on" : ""}`}
                  aria-label={b.name} aria-pressed={on}
                  onClick={() => setActive(i)}
                  onPointerEnter={(e) => { if (e.pointerType !== "touch") setActive(i); }}
                  style={{
                    transform: `rotate(${off * spread}deg) translateY(${on ? -34 : Math.abs(off) * 6}px) translateZ(${on ? 70 : -Math.abs(off) * 26}px) scale(${on ? 1.06 : 1})`,
                    zIndex: on ? 9 : 5 - Math.abs(off),
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.images[0].src} alt="" />
                  <span className="st-bolt__lbl">{b.material}</span>
                </button>
              );
            })}
          </div>
          {current && (
            <div className="st-fan__out">
              <h3>{current.short}</h3>
              <p>{current.material}</p>
              <b>{inr(current.price)} per metre</b>
            </div>
          )}
        </div>
      </div>

      <div className="st-wrap">
        <div className="st-fantabs">
          {bolts.map((b, i) => (
            <button key={b.slug} className={`st-fantab${i === active ? " on" : ""}`} onClick={() => setActive(i)}>
              {b.short}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
