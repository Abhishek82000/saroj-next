"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import { crafts } from "@/lib/crafts";
import { products } from "@/lib/products";

const faces = crafts.filter((c) => c.key !== "fabric");

/**
 * Six craft cards arranged on a drum you can drag, swipe or arrow through.
 * The maths: each face sits one STEP of rotation apart, pushed out by a
 * radius derived from the face width so the cards never overlap.
 */
export default function Wheel() {
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const wheel = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const drag = useRef({ active: false, startX: 0, startAngle: 0, moved: 0 });

  const STEP = 360 / faces.length;

  /* Geometry lives in CSS (see home.css) so the drum is already assembled in
     the server HTML. All JS does here is set the rotation. */
  const setAngle = useCallback((deg: number) => {
    angle.current = deg;
    wheel.current?.style.setProperty("--a", deg + "deg");
  }, []);

  const spinTo = useCallback((next: number) => {
    setAngle(next * STEP);
    setIndex(((next % faces.length) + faces.length) % faces.length);
  }, [STEP, setAngle]);

  /* Auto-advance, paused while the pointer is down. */
  useEffect(() => {
    if (dragging) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => spinTo(Math.round(angle.current / STEP) + 1), 5200);
    return () => clearInterval(t);
  }, [dragging, spinTo, STEP]);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { active: true, startX: e.clientX, startAngle: angle.current, moved: 0 };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.abs(dx);
    setAngle(drag.current.startAngle - dx * 0.35);
  };
  const onUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    spinTo(Math.round(angle.current / STEP));
  };

  // return (
  //   <section className="st-sec" id="wheel">
  //     <div className="st-wrap">
  //       <div className="st-wheel-head">
  //         <Reveal className="st-eyebrow mid">The Kaarigar Wheel</Reveal>
  //         <Reveal as="h2" delay={1} className="st-h2">Six crafts.<br />One turn of the wheel.</Reveal>
  //         <Reveal as="p" delay={2} className="st-lede" style={{ textAlign: "center" }}>
  //           Every discipline we’ve taken on, and the lane in Jaipur it comes out of.
  //         </Reveal>
  //       </div>

  //       <div className="st-stage" role="group" tabIndex={0}
  //         aria-label="Craft categories, draggable carousel"
  //         onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
  //         onKeyDown={(e) => {
  //           if (e.key === "ArrowRight") spinTo(Math.round(angle.current / STEP) + 1);
  //           if (e.key === "ArrowLeft") spinTo(Math.round(angle.current / STEP) - 1);
  //         }}>
  //         <div className={`st-wheel${dragging ? " drag" : ""}`} ref={wheel}>
  //           {faces.map((c, i) => {
  //             const n = products.filter((p) => p.craft === c.key).length;
  //             return (
  //               <article className={`st-face${i === index ? " on" : ""}`} key={c.key}
  //                 style={{ "--i": i } as React.CSSProperties}>
  //                 <Link className="st-face__card" href={`/shop?craft=${c.key}`}
  //                   style={{ display: "flex", flexDirection: "column" }}
  //                   onClick={(e) => { if (drag.current.moved > 8) e.preventDefault(); }}>
  //                   <div className="st-face__ph ph">
  //                     <Photo src={c.image} alt={c.name} sizes="260px" />
  //                   </div>
  //                   <div className="st-face__body">
  //                     <span className="st-face__num">{String(i + 1).padStart(2, "0")}</span>
  //                     <h3 className="st-face__name">{c.name}</h3>
  //                     <p className="st-face__hi st-dv">{c.hindi}</p>
  //                     <p className="st-face__meta">{c.lane} · <b>{n} pieces</b></p>
  //                   </div>
  //                 </Link>
  //               </article>
  //             );
  //           })}
  //         </div>
  //       </div>

  //       <Reveal className="st-ctrl">
  //         <button className="st-arrow" aria-label="Previous craft"
  //           onClick={() => spinTo(Math.round(angle.current / STEP) - 1)}>
  //           <Icon name="left" size={16} strokeWidth={1.8} />
  //         </button>
  //         <div className="st-dots">
  //           {faces.map((c, i) => (
  //             <button key={c.key} className={`st-dot${i === index ? " on" : ""}`}
  //               aria-label={`Show ${c.name}`} onClick={() => spinTo(i)} />
  //           ))}
  //         </div>
  //         <button className="st-arrow" aria-label="Next craft"
  //           onClick={() => spinTo(Math.round(angle.current / STEP) + 1)}>
  //           <Icon name="right" size={16} strokeWidth={1.8} />
  //         </button>
  //       </Reveal>
  //       <Reveal as="p" className="st-hint">Drag · swipe · arrow keys</Reveal>
  //     </div>
  //   </section>
  // );
}
