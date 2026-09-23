"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const CDN = "https://saroj-textile-store.b-cdn.net/products/";
const PIC = "https://picsum.photos/seed/";

/* Five drifting columns behind the opening hero; each is listed twice so the loop is seamless. */
const COLUMNS = [
  ["48621785565568", "711785564464", "97721785569096"],
  ["42621785568665", "13001785568370", "67951785568205"],
  ["12091782565773", "47691780986642", "94351785567420"],
  ["47191782732714", "71911780379169", "8731780988074"],
  ["62201785562941", "2201780380811", "16601783765066"],
];

const SWATCHES = [
  { slug: "ajrakh-collection", title: "Ajrakh", img: "48621785565568", alt: "Teal and blue Ajrakh printed cotton" },
  { slug: "kalamkari", title: "Kalamkari", img: "42621785568665", alt: "Teal green and mustard Kalamkari cotton" },
  { slug: "jaipur-cotton", title: "Jaipuri Cotton", img: "81901780987621", alt: "White base butta printed cotton" },
  { slug: "indigo", title: "Indigo", img: "13001785568370", alt: "Navy indigo Kalamkari paisley print" },
  { slug: "patola-prints", title: "Patola", img: "97721785569096", alt: "Leaf green polka patola printed cotton" },
  { slug: "flower-garden-collection", title: "Flower Garden", img: "12091782565773", alt: "White base floral Kalamkari Jaipuri cotton" },
];

const ROLL: { t: string; cls?: string }[] = [
  { t: "Blue Pottery", cls: "hi" }, { t: "मीनाकारी", cls: "hc-dv" }, { t: "Bagru Block" },
  { t: "Lac & Brass", cls: "hi" }, { t: "संगमरमर जाली", cls: "hc-dv" }, { t: "Kathputli" },
];

const FACES = [
  { name: "Blue Pottery", hi: "नीली मिट्टी", lane: "Kot Jewar", n: 46, img: PIC + "saroj-craft-pottery/700/900", alt: "Blue pottery from Kot Jewar", swap: "Blue pottery vase, cobalt floral, plain backdrop" },
  { name: "Meenakari", hi: "मीनाकारी", lane: "Johari Bazaar", n: 28, img: PIC + "saroj-craft-meena/700/900", alt: "Meenakari enamel work", swap: "Meenakari enamel plate, macro, raking light" },
  { name: "Bagru Block", hi: "बगरू छपाई", lane: "Bagru village", n: 63, img: CDN + "48561785562288.webp", alt: "Mustard and dark block Ajrakh print", swap: "Wooden Bagru blocks stacked, or a block mid-stamp" },
  { name: "Lac & Brass", hi: "लाख और पीतल", lane: "Tripolia Bazaar", n: 34, img: PIC + "saroj-craft-brass/700/900", alt: "Lac and brass work from Tripolia Bazaar", swap: "Brass vessels or lac bangle stack, warm light" },
  { name: "Marble Jali", hi: "संगमरमर जाली", lane: "Kishanpole", n: 19, img: PIC + "saroj-craft-marble/700/900", alt: "Carved marble jali", swap: "Carved marble jali screen, backlit so the lattice reads" },
  { name: "Kathputli", hi: "कठपुतली", lane: "Shilpgram", n: 22, img: PIC + "saroj-craft-puppet/700/900", alt: "Kathputli puppets", swap: "Kathputli puppets hung in a row against a plain wall" },
];

const BOLTS = [
  { name: "Ajrakh", desc: "Resist-printed in indigo and madder, both sides, sixteen steps.", price: "from ₹150 / m", img: "63141785559833", alt: "Red over-dye Ajrakh block printed cotton" },
  { name: "Jaipuri Cotton", desc: "Sanganeri butti and jaal on soft mill cotton. The everyday one.", price: "from ₹129 / m", img: "47691780986642", alt: "Pink base jaal printed Jaipuri cotton" },
  { name: "Kalamkari", desc: "Pen-drawn paisley and vine, vegetable dyed. Colour holds after wash.", price: "from ₹160 / m", img: "94351785567420", alt: "Red multicolour paisley Kalamkari print" },
  { name: "Patola", desc: "Polka and patch patola, printed on pure cotton for everyday suits.", price: "from ₹160 / m", img: "97721785569096", alt: "Leaf green polka patola printed cotton" },
  { name: "Indigo", desc: "Dabu mud-resist over natural indigo. Deepens with every wash.", price: "from ₹150 / m", img: "2201780380811", alt: "Indigo blue base bindu and stripes Ajrakh print" },
];

const STEPS = [
  { i: "I", title: "Quartz, not clay", tag: "300", img: PIC + "saroj-make-clay/800/600", alt: "Quartz paste prepared by hand", swap: "Quartz paste being kneaded — hands and material, close" },
  { i: "II", title: "The hand decides", tag: "400", img: PIC + "saroj-make-paint/800/600", alt: "Motif painted freehand with a fine brush", swap: "Brush painting a motif freehand, over-the-shoulder crop" },
  { i: "III", title: "Fire, then enamel", tag: "450", img: PIC + "saroj-make-kiln/800/600", alt: "Pieces loaded into the kiln", swap: "Kiln mouth open, pieces going in — warm light" },
  { i: "IV", title: "Wrapped in our own cloth", tag: "350", img: CDN + "711785564464.webp", alt: "Leaf green tree jaal Ajrakh cotton used as wrapping", swap: "A pot being wrapped in an Ajrakh offcut — signature shot, shoot it properly" },
];

type Voice = { q: string; ini: string; who: string; role: string };
const VOICES_A: Voice[] = [
  { q: "Fabric quality is very good — loved the kurta fabrics.", ini: "SS", who: "Santosh Selam", role: "Verified buyer" },
  { q: "Excellent communication, and outstanding fabrics.", ini: "TP", who: "Tarun P.", role: "Verified buyer" },
  { q: "Well packed parcel, and the quality beat what I expected.", ini: "SU", who: "Suhana", role: "Verified buyer" },
  { q: "My customer loved it. Please add more rayon prints.", ini: "SO", who: "Sonam", role: "Reseller" },
  { q: "Quality was just awesome, well beyond what I expected.", ini: "AI", who: "Amutha Indraraj", role: "Verified buyer" },
];
const VOICES_B: Voice[] = [
  { q: "Excellent quality — so soft and flowy.", ini: "KS", who: "Keerthana S.", role: "Verified buyer" },
  { q: "Loved the colour and the texture. Very elegant.", ini: "DR", who: "Divya R.", role: "Verified buyer" },
  { q: "Super soft cotton — ideal for our weather.", ini: "LT", who: "Lakshmi T.", role: "Verified buyer" },
  { q: "Stitched a dress from this fabric and it turned out lovely.", ini: "DL", who: "Devi L.", role: "Verified buyer" },
  { q: "Prints are beautiful, and the colours stay after washing.", ini: "AP", who: "Anitha P.", role: "Verified buyer" },
];

function VoiceCard({ v }: { v: Voice }) {
  return (
    <div className="hc-voice">
      <div className="hc-voice__stars">★★★★★</div>
      <p>{v.q}</p>
      <div className="hc-voice__who">
        <span className="hc-voice__ini">{v.ini}</span>
        <div><b>{v.who}</b><br /><small>{v.role}</small></div>
      </div>
    </div>
  );
}

/**
 * /handicraft — the standalone handicraft landing page, section for section.
 * Every interactive bit (wheel, fan, rail depth, video banner, parallax) is
 * plain DOM work in one effect, as in the original page, so the markup and
 * class toggles stay identical to the design.
 */
export default function HandicraftPage() {
  const root = useRef<HTMLElement>(null);

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
        stage.setPointerCapture(e.pointerId); stopAuto(); wheel.classList.add("drag");
      }) as EventListener);
      listen(stage, "pointermove", ((e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - startX; moved = Math.abs(dx);
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

    /* making rail depth */
    (() => {
      const rail = $("#rail");
      if (!rail || RM) return;
      const steps = $$(".hc-step", rail);
      let raf: number | null = null;
      const paint = () => {
        const r = rail.getBoundingClientRect(), mid = r.left + r.width / 2;
        steps.forEach((s) => {
          const b = s.getBoundingClientRect();
          const d = Math.max(-1.4, Math.min(1.4, (b.left + b.width / 2 - mid) / (r.width / 2)));
          s.style.transform = "perspective(1100px) rotateY(" + d * -13 + "deg) translateZ(" + -Math.abs(d) * 62 + "px) scale(" + (1 - Math.abs(d) * 0.05) + ")";
          s.style.opacity = String(1 - Math.abs(d) * 0.34);
        });
        raf = null;
      };
      const req = () => { if (!raf) raf = requestAnimationFrame(paint); };
      listen(rail, "scroll", req, { passive: true });
      on("resize", req);
      const t = window.setTimeout(paint, 220);
      cleanups.push(() => { clearTimeout(t); if (raf) cancelAnimationFrame(raf); });
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
          {COLUMNS.map((col, c) => (
            <div className="hcol" key={c}>
              <div className="hcol__in">
                {[...col, ...col].map((id, i) => <img key={i} src={CDN + id + ".webp"} alt="" />)}
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
              <figure className="hc-plate hc-plate--l ph m-0" data-swap="Blue pottery vases on a workshop ledge, side light">
                <img src={PIC + "saroj-pottery-a/600/800"} alt="Blue pottery pieces from Kot Jewar" width={600} height={800} />
                <figcaption className="hc-plate__cap">Blue Pottery</figcaption>
              </figure>
              <figure className="hc-plate hc-plate--c ph m-0" data-swap="Hero shot: artisan's hands mid-work, shallow depth of field">
                <img src={PIC + "saroj-hands-main/900/1125"} alt="An artisan at work in a Jaipur workshop" width={900} height={1125} />
                <figcaption className="hc-plate__cap">The workshop, Jhotwara</figcaption>
              </figure>
              <figure className="hc-plate hc-plate--r ph m-0" data-swap="Ajrakh bolt half-unrolled">
                <img src={CDN + "63141785559833.webp"} alt="Red over-dye Ajrakh block printed cotton" width={600} height={800} />
                <figcaption className="hc-plate__cap">Ajrakh, on the bolt</figcaption>
              </figure>
            </div>
          </div>

          <div className="hc-hero__strip fade f4">
            {SWATCHES.map((s) => (
              <Link key={s.slug} href={`/shop/${s.slug}`} className="hc-swatch ph" title={s.title}>
                <img src={CDN + s.img + ".webp"} alt={s.alt} loading="lazy" />
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

      {/* ================= WHEEL ================= */}
      <section className="hc-sec" id="wheel">
        <div className="hc-wrap">
          <div className="hc-wheel-head">
            <div className="hc-eyebrow mid rv">The Kaarigar Wheel</div>
            <h2 className="hc-h2 rv" data-d="1">Six crafts.<br />One turn of the wheel.</h2>
            <p className="hc-lede rv" data-d="2" style={{ textAlign: "center" }}>
              Every discipline we&apos;ve taken on, and the lane in Jaipur it comes out of.
            </p>
          </div>

          <div className="hc-stage rv" data-d="2" id="stage" role="group" aria-label="Craft categories, draggable carousel" tabIndex={0}>
            <div className="hc-wheel" id="wheelEl">
              {FACES.map((f, i) => (
                <article className="hc-face" key={f.name}>
                  <div className="hc-face__card">
                    <div className="hc-face__ph ph" data-swap={f.swap}>
                      <img src={f.img} alt={f.alt} loading="lazy" />
                    </div>
                    <div className="hc-face__body">
                      <span className="hc-face__num">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="hc-face__name">{f.name}</h3>
                      <p className="hc-face__hi hc-dv">{f.hi}</p>
                      <p className="hc-face__meta">{f.lane} · <b>{f.n} pieces</b></p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="hc-ctrl rv">
            <button className="hc-arrow" id="prev" aria-label="Previous craft">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <div className="hc-dots" id="dots">
              {FACES.map((f, i) => (
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

      {/* ================= VIDEO BANNER ================= */}
      <section className="hc-vbanner" id="film">
        <div className="hc-vbanner__frame" id="vFrame">
          <video
            className="hc-vbanner__vid"
            id="vBanner"
            data-src="https://saroj-textile-store.b-cdn.net/products/99751775717907.mp4"
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
              <div><span>21</span><small>Collections</small></div>
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
                <h4 id="fanName">{BOLTS[0].name}</h4>
                <p id="fanDesc">{BOLTS[0].desc}</p>
                <b id="fanPrice">{BOLTS[0].price}</b>
              </div>

              <div className="hc-fan__inner" id="fanInner">
                {BOLTS.map((b) => (
                  <button key={b.name} className="hc-bolt" data-name={b.name} data-desc={b.desc} data-price={b.price} aria-label={`Show ${b.name}`}>
                    <img src={CDN + b.img + ".webp"} alt={b.alt} loading="lazy" />
                    <span className="hc-bolt__lbl">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="hc-fantabs" id="fanTabs">
              {BOLTS.map((b) => <button key={b.name} type="button" className="hc-fantab">{b.name}</button>)}
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAKING ================= */}
      <section className="hc-sec" id="making">
        <div className="hc-wrap">
          <div className="hc-eyebrow rv">Four stages, in order</div>
          <h2 className="hc-h2 rv" data-d="1">From earth<br />to shelf.</h2>
          <p className="hc-lede rv" data-d="2">Nothing here is moulded in a factory. This is the actual route a piece takes before it reaches your door.</p>
        </div>
        <div className="hc-wrap">
          <div className="hc-rail" id="rail">
            {STEPS.map((s) => (
              <article className="hc-step" key={s.i}>
                <div className="hc-step__ph ph" data-swap={s.swap}>
                  <span className="hc-step__i">{s.i}</span>
                  <img src={s.img} alt={s.alt} loading="lazy" />
                </div>
                <div className="hc-step__body">
                  <h4>{s.title}</h4>
                  <span className="hc-step__tag">{s.tag}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VOICES ================= */}
      <section className="hc-voices">
        <div className="hc-wrap hc-voices__head">
          <div className="hc-eyebrow rv">576 reviews, cloth side</div>
          <h2 className="hc-h2 rv" data-d="1">What they said<br />about the cloth.</h2>
          <p className="hc-lede rv" data-d="2">The handicraft reviews start now. These are from the years that got us here.</p>
        </div>

        <div className="hc-vrow hc-vrow--a" aria-hidden="true">
          {[...VOICES_A, ...VOICES_A].map((v, i) => <VoiceCard key={i} v={v} />)}
        </div>
        <div className="hc-vrow hc-vrow--b" aria-hidden="true">
          {[...VOICES_B, ...VOICES_B].map((v, i) => <VoiceCard key={i} v={v} />)}
        </div>
      </section>
    </main>
  );
}
