"use client";
import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/ui/Reveal";

const SRC = "https://saroj-textile-store.b-cdn.net/products/99751775717907.mp4";
const NOTE =
  "PLACEHOLDER — workshop footage: the wheel turning, brush on a pot, kiln door opening. 12–20s, no cuts, ambient sound.";

/**
 * The frame starts inset and squares off to full bleed as it crosses the
 * viewport. The whole effect is one CSS variable, --p, from 0 to 1.
 */
export default function VideoBanner() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);
  const [failed, setFailed] = useState(false);

  /* Scroll progress → --p. */
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      return;
    }
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const seen = (window.innerHeight - r.top) / (window.innerHeight + r.height);
        el.style.setProperty("--p", String(Math.min(1, Math.max(0, (seen - 0.15) / 0.45))));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* Only fetch the file once the banner is actually near the viewport. */
  useEffect(() => {
    const v = video.current;
    if (!v || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) { v.pause(); setPlaying(false); return; }
        if (!v.src) v.src = SRC;
        v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      },
      { threshold: 0.3 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) { if (!v.src) v.src = SRC; v.play().then(() => setPlaying(true)).catch(() => {}); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = sound;
    setSound(!sound);
  };

  return (
    <section className="st-vbanner" id="film" ref={section}>
      <div className="st-vbanner__frame">
        {failed ? (
          <p style={{
            position: "absolute", inset: 0, display: "grid", placeItems: "center", margin: 0,
            padding: "2rem", textAlign: "center", color: "rgba(255,255,255,.55)",
            fontSize: ".62rem", letterSpacing: ".14em", textTransform: "uppercase",
          }}>{NOTE}</p>
        ) : (
          <video ref={video} className="st-vbanner__vid" muted loop playsInline preload="none"
            aria-label="Fabric moving on the bolt" onError={() => setFailed(true)} />
        )}

        <span className="st-vbanner__cap">Jhotwara · 06:40</span>

        <div className="st-vbanner__ctrl">
          <button className={`st-vctrl${playing ? " is-playing" : ""}`} onClick={toggle}
            aria-label={playing ? "Pause the film" : "Play the film"} aria-pressed={playing}>
            {playing
              ? <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7Z" /></svg>}
          </button>
          <button className={`st-vctrl${sound ? " is-on" : ""}`} onClick={toggleSound}
            aria-label={sound ? "Mute the film" : "Turn sound on"} aria-pressed={sound}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9H4Z" />
              {sound ? <path d="M17 8a6 6 0 0 1 0 8" /> : <path d="m17 9 4 6M21 9l-4 6" />}
            </svg>
          </button>
        </div>

        <div className="st-vbanner__in">
          <Reveal className="st-vbanner__eyebrow"><i /> Filmed at the workshop</Reveal>
          <Reveal as="h2" delay={1}>Six-forty in the morning, before the heat.</Reveal>
          <Reveal as="p" delay={2}>
            The quartz is mixed while it’s still cool enough to work. By nine the brushes are out.
            Nothing on this page was made anywhere else.
          </Reveal>
          <Reveal className="st-vbanner__chips" delay={3}>
            <span>No stock footage</span><span>Same lanes as our cloth</span><span>42 families</span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
