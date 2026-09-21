"use client";
import { useMemo, useState } from "react";
import { makes, quickMakes } from "@/lib/content";
import { inr, site } from "@/lib/site";
import type { Product } from "@/lib/types";

/**
 * Fabric is sold by length, so the buy box is a length picker rather than a
 * quantity box: stepper, slider, garment shortcuts, and a running total that
 * says in plain words what the chosen length will actually make.
 */
export default function CutPicker({
  p, value, onChange, onOpenGuide,
}: { p: Product; value: number; onChange: (v: number) => void; onOpenGuide: () => void }) {
  const cut = p.cut!;
  const [live, setLive] = useState(value);

  const set = (v: number) => {
    const clamped = Math.min(cut.max, Math.max(cut.min, Math.round(v * 2) / 2));
    setLive(clamped);
    onChange(clamped);
  };

  const total = p.price * value;

  const fits = useMemo(
    () => makes.filter((m) => value >= m.lo && value <= m.hi + 0.4).map((m) => m.name.toLowerCase()),
    [value],
  );

  return (
    <>
      <div className="st-cut__lbl">
        <h2>How much shall we cut?</h2>
        <button type="button" onClick={onOpenGuide}>How much do I need?</button>
      </div>

      <div className="st-cut">
        <div className="st-cut__row">
          <span className="st-qty-step">
            <button type="button" onClick={() => set(value - cut.step)} disabled={value <= cut.min} aria-label="Half a metre less">−</button>
            <input type="number" inputMode="decimal" min={cut.min} max={cut.max} step={cut.step}
              value={live} aria-label="Length in metres"
              onChange={(e) => setLive(parseFloat(e.target.value))}
              onBlur={(e) => set(parseFloat(e.target.value) || cut.min)} />
            <button type="button" onClick={() => set(value + cut.step)} disabled={value >= cut.max} aria-label="Half a metre more">+</button>
          </span>
          <span className="st-cut__unit">metres</span>
          <span className="st-cut__sum">
            <b>{inr(total)}</b>
            <small>{p.price} × {value} m</small>
          </span>
        </div>

        <div className="st-slider">
          <input type="range" min={cut.min} max={cut.max} step={cut.step} value={value}
            aria-label="Slide to set length" onChange={(e) => set(parseFloat(e.target.value))} />
          <div className="st-slider__ends"><span>{cut.min} m</span><span>{cut.max} m on the bolt</span></div>
        </div>

        <div className="st-cut__makes">
          <p>
            {fits.length
              ? <>At {value} m you can cut a {fits.slice(0, 3).map((name, n, arr) => (
                    <span key={name}><b>{name}</b>{n < arr.length - 1 ? ", a " : "."}</span>
                  ))}</>
              : <span className="none">
                  {value} m — enough for {value > 5.5
                    ? "a saree with plenty over, or two garments."
                    : "a start; nudge it up for a full garment."}
                </span>}
          </p>
        </div>
      </div>

      <div className="st-makes" role="group" aria-label="Cut for a garment">
        {makes.filter((m) => quickMakes.includes(m.name)).map((m) => (
          <button type="button" key={m.name} className={value === m.hi ? "on" : ""} onClick={() => set(m.hi)}>
            {m.name}<small>{m.hi} m</small>
          </button>
        ))}
      </div>

      {/* Nothing to nudge toward when you're already on the wholesale page,
          or when this product has no trade rate. */}
      {cut.wholesale > 0 && cut.wholesale < p.price && (
      <div className="st-whole">
        <p>
          {value >= site.wholesaleFrom
            ? <>At this length the wholesale rate is <b>{inr(cut.wholesale)} a metre</b> — {inr(cut.wholesale * value)} instead of {inr(total)}.</>
            : <>Taking <b>{site.wholesaleFrom} m</b> or more? The wholesale rate is {inr(cut.wholesale)} a metre.</>}
        </p>
        <a href="https://www.sarojtextile.com/wholesale-fabric">Wholesale</a>
      </div>
      )}
    </>
  );
}
