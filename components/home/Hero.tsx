"use client";
import Link from "@/components/ui/SiteLink";
import { useEffect, useRef, useState } from "react";
import Photo from "@/components/ui/Photo";
import { categoryHref } from "@/lib/nav";

const CDN = "https://saroj-textile-store.b-cdn.net/products/";

/** The 3 featured categories — real category names, each linked to its /shop/<slug> listing. */
export const plates = [
  { cls: "st-plate--l", src: CDN + "40661788078255.webp", cap: "Jaipur Cotton", alt: "Maroon base, cream paisley printed Jaipuri cotton fabric", note: "Best-selling Jaipuri cotton print", slug: "jaipur-cotton" },
  { cls: "st-plate--c", src: CDN + "63141785559833.webp", cap: "Ajrakh Collection", alt: "Red over-dye Ajrakh block printed cotton", note: "Ajrakh bolt half-unrolled" , slug: "ajrakh-collection" },
  { cls: "st-plate--r", src: CDN + "94351785567420.webp", cap: "Kalamkari", alt: "Red vibrant multi-colour paisley Kalamkari print", note: "Kalamkari paisley, vibrant multi-colour", slug: "kalamkari" },
];

/** The remaining featured categories, each linked to its /shop/<slug> listing. */
export const swatches = [
  ["42621785568665", "Paisley Prints", "paisley-prints"],
  ["13001785568370", "Indigo Prints", "indigo"],
  ["97721785569096", "Patola & Patch Prints", "patola-prints"],
  ["74021788077426", "Abstract Prints", "abstract-prints"],
  ["41911788077745", "Cotton Kantha", "cotton-kantha"],
  ["34411788077677", "Stripes and Checks", "strips-and-checks"],
];

export default function Hero() {
  const [lit, setLit] = useState(false);
  const row = useRef<HTMLDivElement>(null);

  /* One orchestrated entrance on load, then the page stays still. */
  useEffect(() => {
    const t = setTimeout(() => setLit(true), 100);
    return () => clearTimeout(t);
  }, []);

  /* The plates lean towards the pointer. Skipped on touch and reduced motion. */
  useEffect(() => {
    const el = row.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 14;
        const y = (e.clientY / window.innerHeight - 0.5) * -8;
        el.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className={`st-hero${lit ? " lit" : ""}`} id="hero">
      <div className="st-wrap">
        <div className="st-hero__type">
          <div className="st-eyebrow fade f1">Our Collections</div>
          <h1 className="st-hero__title">
            <span className="ln"><span>Textile Treasure</span></span>
          </h1>
          <p className="st-hero__sub fade f2">
            Unveiling fabrics from tradition to trend that define culture and style.
          </p>
        </div>

        <div className="st-plates fade f4">
          <div className="st-plates__row" ref={row}>
            {plates.map((p) => (
              <Link key={p.cls} href={categoryHref(p.slug)} className={`st-plate ${p.cls} ph`}>
                <Photo src={p.src} alt={p.alt} note={p.note} priority sizes="(max-width:900px) 40vw, 300px" />
                <span className="st-plate__cap">{p.cap}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="st-hero__strip fade f4">
          {/* Two copies so the marquee loops seamlessly; the second is hidden from screen readers and tabbing. */}
          <div className="st-hero__track">
            {[0, 1].map((copy) =>
              swatches.map(([file, title, slug]) => (
                <Link key={`${copy}-${file}`} href={categoryHref(slug)} className="st-swatch-item" title={title}
                  aria-hidden={copy === 1 || undefined} tabIndex={copy === 1 ? -1 : undefined}>
                  <span className="st-hero-swatch ph">
                    <Photo src={CDN + file + ".webp"} alt={copy === 1 ? "" : title} sizes="155px" />
                  </span>
                  <span className="st-swatch__label">{title}</span>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
