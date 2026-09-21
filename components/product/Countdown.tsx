"use client";
import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** The category-promo timer. Counts to zero, then removes itself. */
export default function Countdown({
  seconds, code, description,
}: { seconds: number; code: string; description: string }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [left]);

  if (left <= 0) return null;

  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;

  return (
    <div className="st-promo">
      <p className="st-promo__head">Offer ends in</p>
      <div className="st-promo__clock" role="timer" aria-live="off">
        {d > 0 && <span><b>{pad(d)}</b><small>days</small></span>}
        <span><b>{pad(h)}</b><small>hrs</small></span>
        <span><b>{pad(m)}</b><small>min</small></span>
        <span><b>{pad(s)}</b><small>sec</small></span>
      </div>
      <p className="st-promo__note">{description}</p>
      <p className="st-promo__code">Use <code>{code}</code></p>
    </div>
  );
}
