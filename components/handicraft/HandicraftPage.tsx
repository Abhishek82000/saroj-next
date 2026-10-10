"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import MidBanners from "@/components/home/MidBanners";
import { plates as homePlates, swatches as homeSwatches } from "@/components/home/Hero";
import type { HandicraftData, HcBolt, HcPlate, HcSlide, HcSwatch } from "@/lib/handicraft";
import FabricStrip from "./FabricStrip";
import FabricTrade from "./FabricTrade";
import HandicraftSeo from "./HandicraftSeo";
import Rail from "@/components/product/Rail";
import Reels from "@/components/home/Reels";
import Voices from "@/components/home/Voices";

const CDN = "https://saroj-textile-store.b-cdn.net/products/";

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
/* The jharokha windows: an ogee arch (viewBox 0 0 100 150) — also the mask in styles/handicraft.css (.hj-arch__win). */
const ARCH = "M0 150V58C0 40 10 30 22 24C30 20 38 16 44 9C47 5 49 2 50 0C51 2 53 5 56 9C62 16 70 20 78 24C90 30 100 40 100 58V150Z";
/* The frame is the same arch left open at the sill. */
const ARCH_FRAME = ARCH.slice(0, -1);
const ARCH_SIDES = ["l", "c", "r"];
const ROMAN = ["i", "ii", "iii"];

const BOLTS: HcBolt[] = [
  { name: "Ajrakh", desc: "Resist-printed in indigo and madder, both sides, sixteen steps.", price: "from ₹150 / m", img: CDN + "63141785559833.webp", alt: "Red over-dye Ajrakh block printed cotton" },
  { name: "Jaipuri Cotton", desc: "Sanganeri butti and jaal on soft mill cotton. The everyday one.", price: "from ₹129 / m", img: CDN + "47691780986642.webp", alt: "Pink base jaal printed Jaipuri cotton" },
  { name: "Kalamkari", desc: "Pen-drawn paisley and vine, vegetable dyed. Colour holds after wash.", price: "from ₹160 / m", img: CDN + "94351785567420.webp", alt: "Red multicolour paisley Kalamkari print" },
  { name: "Patola", desc: "Polka and patch patola, printed on pure cotton for everyday suits.", price: "from ₹160 / m", img: CDN + "97721785569096.webp", alt: "Leaf green polka patola printed cotton" },
  { name: "Indigo", desc: "Dabu mud-resist over natural indigo. Deepens with every wash.", price: "from ₹150 / m", img: CDN + "2201780380811.webp", alt: "Indigo blue base bindu and stripes Ajrakh print" },
];

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
  /* The wheel shows the API's handicraft categories only; with none, the section is left out. */
  const faces = data.faces;
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

    /* The second house lights up when it comes into view, not on load — it sits mid-page. */
    (() => {
      const hero = $("#hero");
      if (!hero) return;
      if (!("IntersectionObserver" in window) || RM) { hero.classList.add("lit"); return; }
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { hero.classList.add("lit"); io.disconnect(); } }, { threshold: 0.2 });
      io.observe(hero);
      cleanups.push(() => io.disconnect());
    })();

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
      /* Tilt with the facade's place in the viewport, not the page's scroll — it sits mid-page. */
      on("scroll", () => {
        const r = row.getBoundingClientRect();
        sy = Math.max(-5, Math.min(5, ((r.top + r.height / 2) / window.innerHeight - 0.5) * -8)); push();
      });
      cleanups.push(() => { if (raf) cancelAnimationFrame(raf); });
    })();

    /* Kaarigar wheel */
    (() => {
      const wheel = $("#wheelEl"), stage = $("#stage"), dots = $("#dots");
      if (!wheel || !stage || !dots) return;
      /* The ring always has SLOTS seats, 45° apart, however many crafts there are. Seats are
         given relative to the front card, so the ring needn't be full: only the front card and
         two either side sit on it, the rest wait out of sight and take a seat as it turns.
         A fixed 45° keeps the side cards turned only part-way, so they stay wide and readable —
         sizing the ring to a short list (5 crafts → 72°) turned them nearly edge-on. */
      const SLOTS = 8;
      const faces = $$(".hc-face", wheel), N = faces.length, STEP = 360 / SLOTS;
      const dotEls = $$(".hc-dot", dots), count = $("#wheelCount", dots);
      const mod = (a: number, m: number) => ((a % m) + m) % m;
      let radius = 0, angle = 0, dragging = false, locked = false, startX = 0, startY = 0, startAngle = 0, moved = 0, lastW = 0;
      /* Degrees of turn per pixel dragged — set in measure() so the front card follows the finger 1:1. */
      let dragK = 0.25, lastX = 0, lastT = 0, vel = 0, frame = 0;
      let auto: number | null = null;

      const apply = (animate: boolean) => {
        wheel.classList.toggle("drag", !animate);
        wheel.style.transform = "translateZ(" + -radius + "px) rotateY(" + -angle + "deg)";
        const steps = Math.round(angle / STEP), live = mod(steps, N);
        faces.forEach((f, i) => {
          let d = mod(i - live, N);
          if (d > N / 2) d -= N;
          const seated = Math.abs(d) <= 2;
          f.style.visibility = seated ? "" : "hidden";
          if (seated) f.style.transform = "rotateY(" + (steps + d) * STEP + "deg) translateZ(" + radius + "px)";
          f.classList.toggle("on", d === 0);
        });
        dotEls.forEach((d, i) => d.classList.toggle("on", i === live));
        if (count) count.textContent = String(live + 1).padStart(2, "0") + " / " + String(N).padStart(2, "0");
      };
      const measure = () => {
        const w = stage.clientWidth;
        /* Mobile browsers fire resize as the URL bar shows/hides while scrolling — only re-lay out on a real width change. */
        if (w === lastW) return;
        lastW = w;
        /* A slightly narrower front card on phones leaves room for the side cards to show. */
        const fw = Math.min(300, Math.max(180, w * (w < 640 ? 0.52 : 0.27)));
        wheel.style.setProperty("--fw", fw + "px");
        radius = Math.round((fw + (w < 640 ? 24 : 52)) / (2 * Math.tan(Math.PI / SLOTS)));
        dragK = STEP / (fw + (w < 640 ? 24 : 52));
        apply(false);
      };
      const goTo = (i: number, animate = true) => { angle = i * STEP; apply(animate); };
      const startAuto = () => { if (RM || auto) return; auto = window.setInterval(() => goTo(Math.round(angle / STEP) + 1), 4800); };
      const stopAuto = () => { if (auto) { clearInterval(auto); auto = null; } };
      cleanups.push(stopAuto, () => cancelAnimationFrame(frame));

      dotEls.forEach((d, i) => listen(d, "click", () => { stopAuto(); goTo(i); startAuto(); }));

      const release = () => {
        if (!dragging) return;
        dragging = false;
        cancelAnimationFrame(frame);
        if (locked) {
          /* Land where the flick was heading, and never back on the same card after a real
             swipe — a short quick swipe used to fall short of half a step and spring back. */
          const from = Math.round(startAngle / STEP);
          let to = Math.round((angle - vel * 180 * dragK) / STEP);
          if (to === from && moved > 30) to = from + (angle > startAngle ? 1 : -1);
          goTo(Math.max(from - 2, Math.min(from + 2, to)));
        }
        locked = false;
        startAuto();
      };
      listen(stage, "pointerdown", ((e: PointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        /* Don't touch the wheel yet — a touch may just be the start of a page scroll. */
        dragging = true; locked = false; moved = 0;
        startX = lastX = e.clientX; startY = e.clientY; startAngle = angle; lastT = e.timeStamp; vel = 0;
        stopAuto();
      }) as EventListener);
      listen(stage, "pointermove", ((e: PointerEvent) => {
        if (!dragging) return;
        /* The button came up outside the stage — never spin on a plain hover. */
        if (e.pointerType === "mouse" && e.buttons === 0) { release(); return; }
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!locked) {
          if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
          /* Mostly vertical: it's a scroll, let the page have it. */
          if (Math.abs(dy) >= Math.abs(dx)) { release(); return; }
          /* Capture only once it's really a drag — capturing on pointerdown would
             retarget the click to the stage, and a tap on a card's link would go nowhere. */
          locked = true;
          if (!stage.hasPointerCapture(e.pointerId)) stage.setPointerCapture(e.pointerId);
        }
        moved = Math.abs(dx);
        /* Finger speed in px/ms, smoothed, for the flick on release. */
        const dt = e.timeStamp - lastT;
        if (dt > 0) { vel = vel * 0.6 + ((e.clientX - lastX) / dt) * 0.4; lastX = e.clientX; lastT = e.timeStamp; }
        angle = startAngle - dx * dragK;
        /* Phones fire pointermove several times a frame; lay the wheel out once per frame. */
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => apply(false));
      }) as EventListener);
      listen(stage, "pointerup", release);
      listen(stage, "pointercancel", release);
      /* Only the stage's own capture ending counts. On touch the card under the finger holds an
         implicit capture; taking it over fires lostpointercapture on that card, which bubbles
         here and used to end every touch drag the moment it began. */
      listen(stage, "lostpointercapture", (e) => { if (e.target === stage) release(); });
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
          <div className="hero__ey rv">Saroj Textile · The Art of Jaipur</div>
          <h1 className="rv" data-d="1">
            <span className="maskrow"><span>Good Things</span></span>{" "}
            <span className="maskrow"><span>comes <span className="italic">Handmade!</span></span></span>
          </h1>
          <p className="hero__sub rv" data-d="2">Redesigning everyday essentials with creativity, color, and a handcrafted touch that keeps you connected to Jaipur art.</p>
          <div className="hero__cta rv" data-d="3">
            <Link href={faces.length > 0 ? "#wheel" : "/shop"} className="hc-btn hc-btn--solid">Explore Collection</Link>
            {/* <a href="#wheel" className="hc-btn hc-btn--light">Explore Collection</a> */}
          </div>
        </div>
        <div className="hero__scroll" aria-hidden="true"><span>Scroll</span><span className="l" /></div>
      </section>
{/* ================= WHEEL — only with categories from the API ================= */}
      {faces.length > 0 && (
      <section className="hc-sec pt-5" id="wheel">
        <div className="hc-wrap">
          <div className="hc-wheel-head">
            <div className="hc-eyebrow mid rv">The Collection Wheel</div>
            <h2 className="hc-h2 rv" data-d="1">A Happy Little<br /> World of Handmade</h2>
            <p className="hc-lede rv" data-d="2" style={{ textAlign: "center" }}>
              One shop destination for traditional handmade printed cotton bags, boxes, stationery & journals, lifestyle organisation, and corporate or customised gifting.
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
                      {/* <span className="hc-face__num">{String(i + 1).padStart(2, "0")}</span> */}
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
              {faces.length > 10
                ? <span className="hc-count" id="wheelCount" aria-live="polite">01 / {String(faces.length).padStart(2, "0")}</span>
                : faces.map((f, i) => (
                  <button key={f.name} className="hc-dot" type="button" aria-label={`Show craft ${i + 1}`} />
                ))}
            </div>
            <button className="hc-arrow" id="next" aria-label="Next craft">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </section>
      )}
      {/* ================= TAG RAILS — New Arrivals, Best Seller, … ================= */}
      {data.tagRails.map((r) => <Rail key={r.id} id={r.id} eyebrow="Off the kiln and off the loom" heading={r.heading} items={r.items} />)}
      {/* ================= THE SECOND HOUSE — a jharokha facade under a toran ================= */}
      <section className="hj mb-5" id="hero" aria-labelledby="hj-title">
        <span className="hj__jali" aria-hidden="true" />

        {/* the toran: the prints strung across the doorway, as over every Jaipur door on a festival morning */}
        <nav className="hj-toran" aria-label="Shop by print">
          <div className="hj-toran__track">
            <svg className="hj-toran__cord" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 2Q50 78 100 2" />
            </svg>
            {swatches.slice(0, 8).map((s, i, all) => {
              const x = (i + 0.5) / all.length;
              return (
                <Link key={s.href} href={s.href} className="hj-flag" aria-label={s.title}
                  style={{ "--x": x, "--y": (2 + 152 * x * (1 - x)) / 40, "--i": i } as React.CSSProperties}>
                  <span className="hj-flag__cloth ph" data-swap={s.title}><img src={s.src} alt="" loading="lazy" /></span>
                  <span className="hj-flag__tassel" aria-hidden="true" />
                  <span className="hj-flag__label">{s.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="hc-wrap hj__grid">
          <div className="hj__type">
            <div className="hc-eyebrow fade f1">A second house opens · Jaipur</div>
            <h2 className="hj__title" id="hj-title">
              <span className="ln"><span>Rooted in Textiles.</span></span>
              <span className="ln"><span>Inspired to Create  <em className="hc-dv">More.</em></span></span>
            </h2>
            <p className="hj__sub fade f2">
              After excelling in the textile industry for <b>30 years of dedication and hard work</b>, we are now ready to introduce a new category with the same passion and commitment.
            </p>
            <div className="hc-hero__cta hj__cta fade f3">
              <Link href="/shop" className="hc-btn hc-btn--solid">Shop handicraft</Link>
              <a href="#cloth" className="hc-btn">Fabrics, as always</a>
            </div>
          </div>

          {/* three windows of a jharokha, each framing a piece */}
          <div className="hj__stage fade f2">
            <div className="hj-facade" id="platesRow">
              <svg className="hj-seal" viewBox="0 0 200 200" aria-hidden="true">
                <defs><path id="hj-ring" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" /></defs>
                <circle cx="100" cy="100" r="96" />
                <circle cx="100" cy="100" r="52" />
                <g className="hj-seal__ring"><text><textPath href="#hj-ring">HAND-THROWN · HAND-BEATEN · HAND-PRINTED · </textPath></text></g>
                <text x="100" y="118" textAnchor="middle" className="hj-seal__glyph">हस्त</text>
              </svg>
              {plates.slice(0, 3).map((p, i) => (
                <Link key={p.href + i} href={p.href} className={`hj-arch hj-arch--${ARCH_SIDES[i]}`} style={{ "--i": i } as React.CSSProperties}>
                  <svg className="hj-arch__line hj-arch__line--out" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true"><path d={ARCH_FRAME} /></svg>
                  <svg className="hj-arch__line" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true"><path d={ARCH_FRAME} /></svg>
                  <span className="hj-arch__win ph" data-swap={p.alt}><img src={p.src} alt={p.alt} /></span>
                  <span className="hj-arch__plaque">
                    <small>{ROMAN[i]}</small>
                    <span>{p.cap}</span>
                    <b aria-hidden="true">View →</b>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CATEGORY RAILS — one per stocked category ================= */}
      {data.categoryRails.map((r, n) => (
        <Fragment key={r.id}>
          <Rail id={r.id} eyebrow="Off the kiln and off the loom" heading={r.heading} items={r.items} />
          {/* `middle_slider` banners after the second category rail (or the only one). */}
          {n === Math.min(1, data.categoryRails.length - 1) && <MidBanners slides={data.midSlides} />}
        </Fragment>
      ))}

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
            <h2>Paper and <br/>Fabric Creations.</h2>
            <p>Our range of products is divided into two main categories: Paper creations and Fabric Creations. We bring them together to design products that are as useful as they are delightful.</p>
            <p className="hc-lede rv" data-d="2" style={{ textAlign: "center", fontSize:"16px", fontWeight:"600", marginTop:"4px" }}>A quick reminder that each piece passes a high-quality standard and is made by human hands, not factory lines.
            </p>
            {video.href && (
              <div className="hc-hero__cta" style={{ justifyContent: "flex-start" }}>
                <Link href={video.href} className="hc-btn hc-btn--light">Shop this print</Link>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* ================= FABRIC HOUSE ================= */}
      <section className="hc-sec hc-cloth mb-5" id="cloth">
        <span className="hc-cloth__mark hc-dv" aria-hidden="true">कपड़ा</span>
        <div className="hc-wrap hc-cloth__head">
          <div>
            <div className="hc-eyebrow rv">The house that built this</div>
            <h2 className="hc-h2 rv" data-d="1">Still, and always, <em>cloth.</em></h2>
          </div>
          <div className="hc-cloth__side">
            <p className="hc-lede rv" data-d="2">Handicraft is the new wing. The looms are the load-bearing wall. Pick a bolt — every one is on the shelf today, retail or wholesale.</p>
            <div className="hc-cloth__cta rv" data-d="3">
              <Link href="/shop" className="hc-btn hc-btn--solid">Shop all fabrics</Link>
              <span className="hc-cloth__count"><b>{fabricSlides.length}</b> collections on the line</span>
            </div>
          </div>
        </div>

        {/* Every fabric collection, drifting past under the fan. */}
        <FabricStrip slides={fabricSlides} />
      </section>

      {/* Hidden rather than falling back: the home page's built-in reels are all fabric. */}
      {data.reels.length > 0 && <Reels items={data.reels} />}
      <FabricTrade />
      {/* ================= VOICES — the home page's review wall, fed by the API's testimonials ================= */}
      <Voices items={data.voices} />

      {/* ================= SEO — long-form copy in a fixed-height scroll box ================= */}
      <HandicraftSeo />
    </main>
  );
}
