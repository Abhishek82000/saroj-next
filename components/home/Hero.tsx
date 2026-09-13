"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Photo from "@/components/ui/Photo";

const CDN = "https://saroj-textile-store.b-cdn.net/products/";
const PIC = "https://picsum.photos/seed/";

const plates = [
  { cls: "st-plate--l", src: PIC + "saroj-pottery-a/600/800", cap: "Blue Pottery", alt: "Blue pottery pieces from Kot Jewar", note: "Blue pottery vases on a workshop ledge, side light" },
  { cls: "st-plate--c", src: PIC + "saroj-hands-main/900/1125", cap: "The workshop, Jhotwara", alt: "An artisan at work in a Jaipur workshop", note: "Hero shot: artisan's hands mid-work, shallow depth of field" },
  { cls: "st-plate--r", src: CDN + "63141785559833.webp", cap: "Ajrakh, on the bolt", alt: "Red over-dye Ajrakh block printed cotton", note: "Ajrakh bolt half-unrolled" },
];

const swatches = [
  ["48621785565568", "Ajrakh", "teal-pastel-green-with-blue-ajrakh-printed-cotton-fabric"],
  ["42621785568665", "Kalamkari", "teal-green-and-mustard-paisley-printed-kalamkari-cotton-fabric"],
  ["81901780987621", "Jaipuri Cotton", "white-shade-base-with-butta-printed-cotton-fabric-3"],
  ["13001785568370", "Indigo", "neavy-blue-base-indigo-printed-kalamkari-paisley-print"],
  ["97721785569096", "Patola", "leaf-green-polka-patola-in-red-ajrakh-cotton-printed-fabric"],
  ["12091782565773", "Flower Garden", "white-shade-base-with-floral-print-kalamkari-jaipuri-cotton-fabric"],
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
          <div className="st-eyebrow fade f1">A second house opens · Jaipur</div>
          <h1 className="st-hero__title">
            <span className="ln"><span>Woven, then</span></span>
            <span className="ln"><span>Fired &amp; <em>ढाला</em></span></span>
          </h1>
          <p className="st-hero__sub fade f2">
            The lanes that print our Ajrakh also throw the pottery and beat the brass.
            <b> Handicraft is on the shelf now</b> — sitting beside the cloth it was always made next to.
          </p>
          <div className="st-hero__cta fade f3">
            <Link href="/shop?craft=pottery" className="st-btn st-btn--solid">Shop handicraft</Link>
            <Link href="/shop?craft=fabric" className="st-btn">Fabrics, as always</Link>
          </div>
        </div>

        <div className="st-plates fade f4">
          <div className="st-plates__row" ref={row}>
            {plates.map((p) => (
              <figure key={p.cls} className={`st-plate ${p.cls} ph`} style={{ margin: 0 }}>
                <Photo src={p.src} alt={p.alt} note={p.note} priority sizes="(max-width:900px) 40vw, 340px" />
                <figcaption className="st-plate__cap">{p.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="st-hero__strip fade f4">
          {swatches.map(([file, title, slug]) => (
            <Link key={file} href={`/product/${slug}`} className="st-swatch ph" title={title}>
              <Photo src={CDN + file + ".webp"} alt={title} sizes="60px" />
            </Link>
          ))}
        </div>

        <p className="st-hero__note fade f4">Six crafts · 212 pieces · one counter in Jhotwara</p>
      </div>
    </section>
  );
}
