"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { plates as homePlates, swatches as homeSwatches } from "@/components/home/Hero";
import type { HandicraftData, HcBolt, HcFace, HcPlate, HcSlide, HcSwatch } from "@/lib/handicraft";
import FabricStrip from "./FabricStrip";
import Rail from "@/components/product/Rail";
import Reels from "@/components/home/Reels";
import Voices from "@/components/home/Voices";
import { products } from "@/lib/products";

const CDN = "https://saroj-textile-store.b-cdn.net/products/";
const PIC = "https://picsum.photos/seed/";

/* Everything below is the page's own copy, used wherever /api/handicraft-data comes back short. */

/* Five drifting columns behind the opening hero; each is listed twice so the loop is seamless. */
const COLUMN_IMAGES = [
  "48621785565568", "711785564464", "97721785569096",
  "42621785568665", "13001785568370", "67951785568205",
  "12091782565773", "47691780986642", "94351785567420",
  "47191782732714", "71911780379169", "8731780988074",
  "62201785562941", "2201780380811", "16601783765066",
].map((id) => CDN + id + ".webp");

const PLATES: HcPlate[] = homePlates.map((p) => ({ href: `/shop/${p.slug}`, src: p.src, cap: p.cap, alt: p.alt }));
const SWATCHES: HcSwatch[] = homeSwatches.map(([file, title, slug]) => ({ href: `/shop/${slug}`, src: CDN + file + ".webp", title }));
const PLATE_CLS = ["hc-plate--l", "hc-plate--c", "hc-plate--r"];

const ROLL: { t: string; cls?: string }[] = [
  { t: "Blue Pottery", cls: "hi" }, { t: "मीनाकारी", cls: "hc-dv" }, { t: "Bagru Block" },
  { t: "Lac & Brass", cls: "hi" }, { t: "संगमरमर जाली", cls: "hc-dv" }, { t: "Kathputli" },
];

const FACES: HcFace[] = [
  { name: "Blue Pottery", hi: "नीली मिट्टी", meta: "Kot Jewar", count: "46 pieces", img: PIC + "saroj-craft-pottery/700/900", alt: "Blue pottery from Kot Jewar", swap: "Blue pottery vase, cobalt floral, plain backdrop" },
  { name: "Meenakari", hi: "मीनाकारी", meta: "Johari Bazaar", count: "28 pieces", img: PIC + "saroj-craft-meena/700/900", alt: "Meenakari enamel work", swap: "Meenakari enamel plate, macro, raking light" },
  { name: "Bagru Block", hi: "बगरू छपाई", meta: "Bagru village", count: "63 pieces", img: CDN + "48561785562288.webp", alt: "Mustard and dark block Ajrakh print", swap: "Wooden Bagru blocks stacked, or a block mid-stamp" },
  { name: "Lac & Brass", hi: "लाख और पीतल", meta: "Tripolia Bazaar", count: "34 pieces", img: PIC + "saroj-craft-brass/700/900", alt: "Lac and brass work from Tripolia Bazaar", swap: "Brass vessels or lac bangle stack, warm light" },
  { name: "Marble Jali", hi: "संगमरमर जाली", meta: "Kishanpole", count: "19 pieces", img: PIC + "saroj-craft-marble/700/900", alt: "Carved marble jali", swap: "Carved marble jali screen, backlit so the lattice reads" },
  { name: "Kathputli", hi: "कठपुतली", meta: "Shilpgram", count: "22 pieces", img: PIC + "saroj-craft-puppet/700/900", alt: "Kathputli puppets", swap: "Kathputli puppets hung in a row against a plain wall" },
];

const BOLTS: HcBolt[] = [
  { name: "Ajrakh", desc: "Resist-printed in indigo and madder, both sides, sixteen steps.", price: "from ₹150 / m", img: CDN + "63141785559833.webp", alt: "Red over-dye Ajrakh block printed cotton" },
  { name: "Jaipuri Cotton", desc: "Sanganeri butti and jaal on soft mill cotton. The everyday one.", price: "from ₹129 / m", img: CDN + "47691780986642.webp", alt: "Pink base jaal printed Jaipuri cotton" },
  { name: "Kalamkari", desc: "Pen-drawn paisley and vine, vegetable dyed. Colour holds after wash.", price: "from ₹160 / m", img: CDN + "94351785567420.webp", alt: "Red multicolour paisley Kalamkari print" },
  { name: "Patola", desc: "Polka and patch patola, printed on pure cotton for everyday suits.", price: "from ₹160 / m", img: CDN + "97721785569096.webp", alt: "Leaf green polka patola printed cotton" },
  { name: "Indigo", desc: "Dabu mud-resist over natural indigo. Deepens with every wash.", price: "from ₹150 / m", img: CDN + "2201780380811.webp", alt: "Indigo blue base bindu and stripes Ajrakh print" },
];

/* The home page shows the same eight when its feed is empty. */
const fresh = [...products].sort((a, b) => b.fresh - a.fresh).slice(0, 8);

const CAT = "https://saroj-textile-store.b-cdn.net/category/";
const FABRIC_SLIDES: HcSlide[] = [
  ["Ajrakh Collection", "ajrakh-collection", "17855740415801.webp"],
  ["Jaipur Cotton", "jaipur-cotton", "17808346283546.webp"],
  ["Kalamkari", "kalamkari", "17855703751571.webp"],
  ["Indigo Prints", "indigo", "17704503359781.webp"],
  ["Paisley Prints", "paisley-prints", "17855703206077.webp"],
  ["Patola & Patch Prints", "patola-prints", "17855704741310.webp"],
  ["Flower Garden Collection", "flower-garden-collection", "17753697832243.webp"],
  ["Hakoba And Dobby", "hakoba-and-dobby", "17808342608853.webp"],
].map(([name, slug, file]) => ({ name, href: `/shop/${slug}`, img: CAT + file }));

const VIDEO = { src: "https://saroj-textile-store.b-cdn.net/products/99751775717907.mp4", name: "", href: "" };

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const countWord = (n: number) => WORDS[n] ?? String(n);

/**
 * /handicraft — the standalone handicraft landing page, section for section.
 * Every interactive bit (wheel, fan, rail depth, video banner, parallax) is
 * plain DOM work in one effect, as in the original page, so the markup and
 * class toggles stay identical to the design.
 */
export default function HandicraftPage({ data }: { data: HandicraftData }) {
  const root = useRef<HTMLElement>(null);

  /* Each section takes the API's picks only when there are enough to fill its layout. */
  const images = data.columnImages.length >= 15 ? data.columnImages : COLUMN_IMAGES;
  const columns = Array.from({ length: 5 }, (_, c) => images.slice(c * 3, c * 3 + 3));
  const plates = data.plates.length === 3 ? data.plates : PLATES;
  const swatches = data.swatches.length >= 3 ? data.swatches : SWATCHES;
  const faces = data.faces.length >= 3 ? data.faces : FACES;
  const fabricSlides = data.fabricSlides.length >= 3 ? data.fabricSlides : FABRIC_SLIDES;
  const bolts = data.bolts.length >= 3 ? data.bolts : BOLTS;
  const video = data.video ?? VIDEO;
  const collections = data.collections || 21;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = el) => c.querySelector(s) as T | null;
    const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = el) => Array.from(c.querySelectorAll(s)) as T[];
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(t: K, fn: (e: WindowEventMap[K]) => void) => {
      window.addEventListener(t, fn, { passive: true });
      cleanups.push(() => window.removeEventListener(t, fn));
    };
    const listen = (node: EventTarget, t: string, fn: EventListener, opts?: AddEventListenerOptions | boolean) => {
      node.addEventListener(t, fn, opts);
      cleanups.push(() => node.removeEventListener(t, fn, opts));
    };
    const observe = (io: IntersectionObserver, node: Element) => { io.observe(node); cleanups.push(() => io.disconnect()); };

    /* image fade-in + readable fallback */
    $$<HTMLImageElement>(".ph img").forEach((img) => {
      const fail = () => {
        img.removeAttribute("data-loading");
        img.style.display = "none";
        const host = img.closest<HTMLElement>(".ph");
        if (host && !host.querySelector(".ph-fallback")) {
          const s = document.createElement("span");
          s.className = "ph-fallback";
          s.textContent = host.dataset.swap || img.alt || "Photo";
          s.style.cssText = "position:absolute;inset:0;display:grid;place-items:center;padding:1rem;text-align:center;" +
            "font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;color:#6C7A82;";
          host.appendChild(s);
        }
      };
      if (img.complete) { if (img.naturalWidth === 0 && img.getAttribute("loading") !== "lazy") fail(); return; }
      img.setAttribute("data-loading", "");
      listen(img, "load", () => img.removeAttribute("data-loading"));
      listen(img, "error", fail);
    });

    const litT = window.setTimeout(() => $("#hero")?.classList.add("lit"), 100);
    cleanups.push(() => clearTimeout(litT));

    /* reveal */
    (() => {
      const items = $$(".rv");
      if (!("IntersectionObserver" in window) || RM) { items.forEach((e) => e.classList.add("in")); return; }
      const io = new IntersectionObserver((en) => {
        en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0.13, rootMargin: "0px 0px -7% 0px" });
      items.forEach((e) => io.observe(e));
      cleanups.push(() => io.disconnect());
    })();

    /* hero plates parallax */
    (() => {
      const row = $("#platesRow");
      if (!row || RM) return;
      let tx = 0, ty = 0, cx = 0, cy = 0, sy = 0, raf: number | null = null;
      const loop = () => {
        cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
        row.style.transform = "rotateY(" + cx + "deg) rotateX(" + (cy + sy) + "deg)";
        raf = Math.abs(tx - cx) > 0.04 || Math.abs(ty - cy) > 0.04 ? requestAnimationFrame(loop) : null;
      };
      const push = () => { if (!raf) raf = requestAnimationFrame(loop); };
      on("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        tx = (e.clientX / window.innerWidth - 0.5) * 13;
        ty = -(e.clientY / window.innerHeight - 0.5) * 8; push();
      });
      on("deviceorientation", (e) => {
        if (e.gamma == null) return;
        tx = Math.max(-14, Math.min(14, e.gamma * 0.45));
        ty = Math.max(-8, Math.min(8, ((e.beta || 45) - 45) * -0.22)); push();
      });
      on("scroll", () => { sy = Math.max(-6, Math.min(6, window.scrollY * 0.012)); push(); });
      cleanups.push(() => { if (raf) cancelAnimationFrame(raf); });
    })();

    /* Kaarigar wheel */
    (() => {
      const wheel = $("#wheelEl"), stage = $("#stage"), dots = $("#dots");
      if (!wheel || !stage || !dots) return;
      const faces = $$(".hc-face", wheel), N = faces.length, STEP = 360 / N;
      const dotEls = $$(".hc-dot", dots);
      let radius = 0, angle = 0, dragging = false, startX = 0, startAngle = 0, moved = 0;
      let auto: number | null = null;

      const apply = (animate: boolean) => {
        wheel.classList.toggle("drag", !animate);
        wheel.style.transform = "translateZ(" + -radius + "px) rotateY(" + -angle + "deg)";
        const live = ((Math.round(angle / STEP) % N) + N) % N;
        faces.forEach((f, i) => f.classList.toggle("on", i === live));
        dotEls.forEach((d, i) => d.classList.toggle("on", i === live));
      };
      const measure = () => {
        const w = stage.clientWidth;
        const fw = Math.min(300, Math.max(196, w * (w < 640 ? 0.6 : 0.29)));
        wheel.style.setProperty("--fw", fw + "px");
        radius = Math.round((fw + (w < 640 ? 24 : 52)) / (2 * Math.tan(Math.PI / N)));
        faces.forEach((f, i) => { f.style.transform = "rotateY(" + i * STEP + "deg) translateZ(" + radius + "px)"; });
        apply(false);
      };
      const goTo = (i: number, animate = true) => { angle = i * STEP; apply(animate); };
      const startAuto = () => { if (RM || auto) return; auto = window.setInterval(() => goTo(Math.round(angle / STEP) + 1), 4800); };
      const stopAuto = () => { if (auto) { clearInterval(auto); auto = null; } };
      cleanups.push(stopAuto);

      dotEls.forEach((d, i) => listen(d, "click", () => { stopAuto(); goTo(i); startAuto(); }));

      listen(stage, "pointerdown", ((e: PointerEvent) => {
        dragging = true; moved = 0; startX = e.clientX; startAngle = angle;
        stopAuto(); wheel.classList.add("drag");
      }) as EventListener);
      listen(stage, "pointermove", ((e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - startX; moved = Math.abs(dx);
        /* Capture only once it's really a drag — capturing on pointerdown would
           retarget the click to the stage, and a tap on a card's link would go nowhere. */
        if (moved > 4 && !stage.hasPointerCapture(e.pointerId)) stage.setPointerCapture(e.pointerId);
        angle = startAngle - dx * 0.35; apply(false);
      }) as EventListener);
      const release = () => { if (!dragging) return; dragging = false; goTo(Math.round(angle / STEP)); startAuto(); };
      listen(stage, "pointerup", release);
      listen(stage, "pointercancel", release);
      listen(stage, "lostpointercapture", release);
      listen(stage, "click", (e) => { if (moved > 8) e.preventDefault(); }, true);

      const next = $("#next"), prev = $("#prev");
      if (next) listen(next, "click", () => { stopAuto(); goTo(Math.round(angle / STEP) + 1); startAuto(); });
      if (prev) listen(prev, "click", () => { stopAuto(); goTo(Math.round(angle / STEP) - 1); startAuto(); });
      listen(stage, "keydown", ((e: KeyboardEvent) => {
        if (e.key === "ArrowRight") { e.preventDefault(); stopAuto(); goTo(Math.round(angle / STEP) + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); stopAuto(); goTo(Math.round(angle / STEP) - 1); }
      }) as EventListener);

      if ("IntersectionObserver" in window) {
        observe(new IntersectionObserver((en) => en.forEach((e) => (e.isIntersecting ? startAuto() : stopAuto())), { threshold: 0.35 }), stage);
      } else startAuto();

      measure();
      let rt: number | undefined;
      on("resize", () => { clearTimeout(rt); rt = window.setTimeout(measure, 140); });
      cleanups.push(() => clearTimeout(rt));
    })();

    /* fabric fan */
    (() => {
      const inner = $("#fanInner"), tabHost = $("#fanTabs");
      if (!inner || !tabHost) return;
      const bolts = $$<HTMLButtonElement>(".hc-bolt", inner), n = bolts.length, spread = 15;
      const tabs = $$(".hc-fantab", tabHost);
      const nameEl = $("#fanName"), descEl = $("#fanDesc"), priceEl = $("#fanPrice");
      let active = 0;

      const layout = () => {
        bolts.forEach((b, i) => {
          const off = i - (n - 1) / 2;
          const lift = i === active ? -34 : Math.abs(off) * 6;
          const z = i === active ? 70 : -Math.abs(off) * 26;
          const sc = i === active ? 1.06 : 1;
          b.style.transform = "rotate(" + off * spread + "deg) translateY(" + lift + "px) translateZ(" + z + "px) scale(" + sc + ")";
          b.style.zIndex = String(i === active ? 9 : 5 - Math.abs(off));
          b.classList.toggle("on", i === active);
        });
      };
      const select = (i: number) => {
        active = i;
        if (nameEl) nameEl.textContent = bolts[i].dataset.name ?? "";
        if (descEl) descEl.textContent = bolts[i].dataset.desc ?? "";
        if (priceEl) priceEl.textContent = bolts[i].dataset.price ?? "";
        tabs.forEach((t, k) => t.classList.toggle("on", k === i));
        layout();
      };

      bolts.forEach((b, i) => {
        if (tabs[i]) listen(tabs[i], "click", () => select(i));
        listen(b, "click", (e) => { e.preventDefault(); select(i); });
        listen(b, "pointerenter", ((e: PointerEvent) => { if (e.pointerType !== "touch") select(i); }) as EventListener);
      });

      layout();
      if (!RM) bolts.forEach((b) => { b.style.opacity = "0"; });
      let opened = false;
      const timers: number[] = [];
      cleanups.push(() => timers.forEach(clearTimeout));
      const open = () => {
        if (opened) return; opened = true;
        bolts.forEach((b, i) => timers.push(window.setTimeout(() => { b.style.opacity = "1"; }, i * 80)));
        select(0);
      };
      if ("IntersectionObserver" in window) {
        observe(new IntersectionObserver((en, o) => {
          en.forEach((e) => { if (e.isIntersecting) { open(); o.disconnect(); } });
        }, { threshold: 0.28 }), inner);
      } else open();
    })();

    /* video banner — frame opens on scroll, video parallaxes, lazy src */
    (() => {
      const sec = $("#film"), frame = $("#vFrame"), vid = $<HTMLVideoElement>("#vBanner");
      const playBtn = $("#vPlay"), muteBtn = $("#vMute");
      if (!sec || !frame || !vid || !playBtn || !muteBtn) return;
      vid.muted = true;
      let loaded = false, raf: number | null = null;
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      const AUTO = !RM && !conn?.saveData;

      const load = () => {
        if (loaded) return; loaded = true;
        vid.src = vid.dataset.src ?? "";
        listen(vid, "error", () => { frame.style.background = "linear-gradient(160deg,#16212B,#0B1116)"; });
      };
      const paint = () => {
        const r = sec.getBoundingClientRect(), vh = window.innerHeight;
        /* 0 when the section is still low on screen, 1 once it's settled in view */
        const p = 1 - Math.min(1, Math.max(0, (r.top - vh * 0.12) / (vh * 0.62)));
        sec.style.setProperty("--p", p.toFixed(3));
        /* gentle counter-drift so the footage doesn't feel pinned */
        const mid = (r.top + r.height / 2 - vh / 2) / vh;
        vid.style.transform = "translateY(" + (mid * -26).toFixed(1) + "px)";
        raf = null;
      };
      const req = () => { if (!raf) raf = requestAnimationFrame(paint); };
      on("scroll", req);
      on("resize", req);
      paint();
      cleanups.push(() => { if (raf) cancelAnimationFrame(raf); vid.pause(); });

      const setPlaying = (v: boolean) => playBtn.classList.toggle("is-playing", v);
      const play = () => vid.play().then(() => setPlaying(true)).catch(() => {});
      listen(playBtn, "click", () => {
        load();
        if (vid.paused) play(); else { vid.pause(); setPlaying(false); }
      });
      listen(muteBtn, "click", () => {
        load();
        vid.muted = !vid.muted;
        muteBtn.classList.toggle("is-on", !vid.muted);
        if (!vid.muted && vid.paused) play();
      });

      if ("IntersectionObserver" in window) {
        observe(new IntersectionObserver((en) => {
          en.forEach((e) => {
            if (e.isIntersecting) { load(); if (AUTO) play(); }
            else if (!vid.paused) { vid.pause(); setPlaying(false); }
          });
        }, { threshold: 0.3 }), frame);
      } else load();
    })();

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <main id="main" className="hc" ref={root}>
      <section className="hero" id="top">
        <div className="hero__cols" aria-hidden="true">
          {columns.map((col, c) => (
            <div className="hcol" key={c}>
              <div className="hcol__in">
                {[...col, ...col].map((src, i) => <img key={i} src={src} alt="" />)}
              </div>
            </div>
          ))}
        </div>
        <div className="hero__scrim" />
        <div className="hero__content">
          <div className="hero__ey rv">Saroj Textile · Jaipur · Est. Block &amp; Dye</div>
          <h1>
            <span className="maskrow"><span>The craft</span></span>{" "}
            <span className="maskrow"><span>of <span className="italic">Jaipur.</span></span></span>
          </h1>
        </div>
        <div className="hero__scroll" aria-hidden="true"><span>Scroll</span><span className="l" /></div>
      </section>
{/* ================= WHEEL ================= */}
      <section className="hc-sec" id="wheel">
        <div className="hc-wrap">
          <div className="hc-wheel-head">
            <div className="hc-eyebrow mid rv">The Kaarigar Wheel</div>
            <h2 className="hc-h2 rv" data-d="1">{countWord(faces.length)} crafts.<br />One turn of the wheel.</h2>
            <p className="hc-lede rv" data-d="2" style={{ textAlign: "center" }}>
              Every discipline we&apos;ve taken on, and the lane in Jaipur it comes out of.
            </p>
          </div>

          <div className="hc-stage rv" data-d="2" id="stage" role="group" aria-label="Craft categories, draggable carousel" tabIndex={0}>
            <div className="hc-wheel" id="wheelEl">
              {faces.map((f, i) => {
                const card = (
                  <>
                    <div className="hc-face__ph ph" data-swap={f.swap ?? f.alt}>
                      <img src={f.img} alt={f.alt} loading="lazy" />
                    </div>
                    <div className="hc-face__body">
                      <span className="hc-face__num">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="hc-face__name">{f.name}</h3>
                      {f.hi && <p className="hc-face__hi hc-dv">{f.hi}</p>}
                      <p className="hc-face__meta">{f.meta}{f.count && <> · <b>{f.count}</b></>}</p>
                    </div>
                  </>
                );
                return (
                  <article className="hc-face" key={f.name}>
                    {/* A drag that ends on a card is swallowed by the stage's click guard, so only a real tap navigates. */}
                    {f.href
                      ? <Link href={f.href} className="hc-face__card" draggable={false}>{card}</Link>
                      : <div className="hc-face__card">{card}</div>}
                  </article>
                );
              })}
            </div>
          </div>

          <div className="hc-ctrl rv">
            <button className="hc-arrow" id="prev" aria-label="Previous craft">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <div className="hc-dots" id="dots">
              {faces.map((f, i) => (
                <button key={f.name} className="hc-dot" type="button" aria-label={`Show craft ${i + 1}`} />
              ))}
            </div>
            <button className="hc-arrow" id="next" aria-label="Next craft">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <p className="hc-hint rv">Drag · swipe · arrow keys</p>
        </div>
      </section>
      {/* ================= HERO ================= */}
      <section className="hc-hero" id="hero">
        <div className="hc-wrap">
          <div className="hc-hero__type">
            <div className="hc-eyebrow fade f1">A second house opens · Jaipur</div>
            <h1 className="hc-hero__title">
              <span className="ln"><span>Woven, then</span></span>
              <span className="ln"><span>Fired &amp; <em>ढाला</em></span></span>
            </h1>
            <p className="hc-hero__sub fade f2">
              The lanes that print our Ajrakh also throw the pottery and beat the brass.{" "}
              <b>Handicraft is on the shelf now</b> — sitting beside the cloth it was always made next to.
            </p>
            <div className="hc-hero__cta fade f3">
              <Link href="/shop?craft=pottery" className="hc-btn hc-btn--solid">Shop handicraft</Link>
              <a href="#cloth" className="hc-btn">Fabrics, as always</a>
            </div>
          </div>

          <div className="hc-plates fade f4">
            <div className="hc-plates__row" id="platesRow">
              {plates.map((p, i) => (
                <Link key={PLATE_CLS[i]} href={p.href} className={`hc-plate ${PLATE_CLS[i]} ph`} data-swap={p.alt}>
                  <img src={p.src} alt={p.alt} />
                  <span className="hc-plate__cap">{p.cap}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="hc-hero__strip fade f4">
            {swatches.map((s) => (
              <Link key={s.href} href={s.href} className="hc-swatch-item" title={s.title}>
                <span className="hc-swatch ph">
                  <img src={s.src} alt={s.title} loading="lazy" />
                </span>
                <span className="hc-swatch__label">{s.title}</span>
              </Link>
            ))}
          </div>

          <p className="hc-hero__note fade f4">Six crafts · 212 pieces · one counter in Jhotwara</p>
        </div>
      </section>

      <div className="hc-roll" aria-hidden="true">
        <ul>
          {[...ROLL, ...ROLL].map((r, i) => <li key={i} className={r.cls}>{r.t}</li>)}
        </ul>
      </div>

      

      {/* ================= VIDEO BANNER ================= */}
      <section className="hc-vbanner" id="film">
        <div className="hc-vbanner__frame" id="vFrame">
          <video
            className="hc-vbanner__vid"
            id="vBanner"
            data-src={video.src}
            muted loop playsInline preload="none"
            aria-label="Fabric moving on the bolt"
          />

          <span className="hc-vbanner__cap">Jhotwara · 06:40</span>

          <div className="hc-vbanner__ctrl">
            <button className="hc-vctrl" id="vPlay" aria-label="Play or pause the film">
              <svg className="ico-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7Z" /></svg>
              <svg className="ico-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
            </button>
            <button className="hc-vctrl" id="vMute" aria-label="Turn sound on or off">
              <svg className="ico-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="m17 9 4 6M21 9l-4 6" /></svg>
              <svg className="ico-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M17 8a6 6 0 0 1 0 8" /></svg>
            </button>
          </div>

          <div className="hc-vbanner__in">
            <div className="hc-vbanner__eyebrow"><i /> Filmed at the workshop</div>
            <h2>Six-forty in the morning, before the heat.</h2>
            <p>The quartz is mixed while it&apos;s still cool enough to work. By nine the brushes are out. Nothing on this page was made anywhere else.</p>
            <div className="hc-vbanner__chips">
              <span>No stock footage</span><span>Same lanes as our cloth</span><span>42 families</span>
            </div>
            {video.href && (
              <div className="hc-hero__cta" style={{ justifyContent: "flex-start" }}>
                <Link href={video.href} className="hc-btn hc-btn--light">Shop this print</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= FABRIC HOUSE ================= */}
      <section className="hc-sec hc-cloth" id="cloth">
        <div className="hc-wrap hc-cloth__grid">
          <div>
            <div className="hc-eyebrow rv">The house that built this</div>
            <h2 className="hc-h2 rv" data-d="1">Still, and always,<br />cloth.</h2>
            <p className="hc-lede rv" data-d="2">Handicraft is the new wing. The looms are the load-bearing wall. Pick a bolt — every one is on the shelf today, retail or wholesale.</p>
            <div className="hc-cloth__stats rv" data-d="2">
              <div><span>{collections}</span><small>Collections</small></div>
              <div><span>₹80</span><small>Wholesale / metre</small></div>
              <div><span>576</span><small>Reviews</small></div>
            </div>
            <div className="hc-cloth__cta rv" data-d="3">
              <Link href="/shop/jaipur-cotton" className="hc-btn hc-btn--light">Shop fabrics</Link>
              <Link href="/wholesale-fabric" className="hc-btn hc-btn--light">Wholesale from ₹80</Link>
            </div>
          </div>

          <div className="rv" data-d="2">
            <div className="hc-fan">
              <div className="hc-fan__out" aria-live="polite">
                <h4 id="fanName">{bolts[0].name}</h4>
                <p id="fanDesc">{bolts[0].desc}</p>
                <b id="fanPrice">{bolts[0].price}</b>
              </div>

              <div className="hc-fan__inner" id="fanInner">
                {bolts.map((b) => (
                  <button key={b.name} className="hc-bolt" data-name={b.name} data-desc={b.desc} data-price={b.price} aria-label={`Show ${b.name}`}>
                    <img src={b.img} alt={b.alt} loading="lazy" />
                    <span className="hc-bolt__lbl">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="hc-fantabs" id="fanTabs">
              {bolts.map((b) => <button key={b.name} type="button" className="hc-fantab">{b.name}</button>)}
            </div>
          </div>
        </div>

        {/* Every fabric collection, drifting past under the fan. */}
        <FabricStrip slides={fabricSlides} />
      </section>

      {/* ================= SHOP RAILS — the same tag and category rails as the home page ================= */}
      {data.rails.length > 0
        ? data.rails.map((r) => <Rail key={r.id} id={r.id} eyebrow="Off the kiln and off the loom" heading={r.heading} items={r.items} />)
        : <Rail id="new" eyebrow="Off the kiln and off the loom" heading="New this week." items={fresh} />}

      {/* ================= REELS — handicraft on film, shoppable like the home page ================= */}
      {/* Hidden rather than falling back: the home page's built-in reels are all fabric. */}
      {data.reels.length > 0 && <Reels items={data.reels} />}

      {/* ================= VOICES — the home page's review wall, fed by the API's testimonials ================= */}
      <Voices items={data.voices} />
    </main>
  );
}
