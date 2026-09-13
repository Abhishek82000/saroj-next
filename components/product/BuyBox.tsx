"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Portal from "@/components/ui/Portal";
import { useStore } from "@/components/shell/StoreProvider";
import CutPicker from "./CutPicker";
import Tabs from "./Tabs";
import { coupons, makes } from "@/lib/content";
import { discount } from "@/lib/products";
import { inr, site, unitLabel } from "@/lib/site";
import { craftBy } from "@/lib/crafts";
import type { Product } from "@/lib/types";

/**
 * Everything interactive on a product page: the length picker, add to cart,
 * wishlist, coupon copying, share, the metre guide, the tabs and the
 * sticky bar that takes over once the real button scrolls away.
 */
export default function BuyBox({ p }: { p: Product }) {
  const { add, favs, toggleFav, say } = useStore();
  const [qty, setQty] = useState(p.cut ? 3 : 1);
  const [guide, setGuide] = useState(false);
  const [ask, setAsk] = useState(false);
  const [review, setReview] = useState(false);
  const [stick, setStick] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);

  const off = discount(p);
  const total = p.price * qty;
  const saved = !!favs[p.slug];
  const out = p.stock === "out";

  useEffect(() => {
    const el = addRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => setStick(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addThis = () =>
    add({
      id: p.slug, name: p.name, price: p.price, unit: p.unit, image: p.images[0].src,
      step: p.cut?.step ?? 1, qty, href: `/product/${p.slug}`,
    });

  const copy = async (code: string) => {
    try { await navigator.clipboard?.writeText(code); } catch { /* clipboard blocked — the code is on screen anyway */ }
    setCopied(code);
    say(`${code} copied`);
    setTimeout(() => setCopied(null), 1800);
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const data = { title: p.name, text: `${craftBy[p.craft]?.name}, ${inr(p.price)} ${unitLabel(p.unit)}`, url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share(data); return; } catch { /* dismissed */ }
    }
    try { await navigator.clipboard?.writeText(url); say("Link copied"); }
    catch { say("Copy the address from the bar above"); }
  };

  return (
    <>
      <div className="st-price">
        <b>{inr(p.price)}</b>
        {p.mrp > 0 && <s>{inr(p.mrp)}</s>}
        {off > 0 && <em>{off}% off</em>}
        <small>{unitLabel(p.unit)} · inclusive of all taxes</small>
      </div>

      <div className="st-live">
        <span><i /> Selling fast — <b>4 people</b> have this in their carts</span>
        <span><i className="calm" /> Being viewed right now</span>
      </div>

      <hr className="st-rule" />

      {p.cut ? (
        <CutPicker p={p} value={qty} onChange={setQty} onOpenGuide={() => setGuide(true)} />
      ) : (
        <div className="st-cut">
          <div className="st-cut__row">
            <span className="st-step">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="One fewer">−</button>
              <input type="number" min={1} value={qty} aria-label="Quantity"
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))} />
              <button type="button" onClick={() => setQty(qty + 1)} aria-label="One more">+</button>
            </span>
            <span className="st-cut__unit">{p.unit}</span>
            <span className="st-cut__sum"><b>{inr(total)}</b><small>{p.price} × {qty}</small></span>
          </div>
        </div>
      )}

      <div className="st-buy">
        <button ref={addRef} type="button" className="st-btn st-btn--solid" disabled={out} onClick={addThis}>
          {out ? "Sold out" : `Add to cart · ${inr(total)}`}
        </button>
        <button type="button" className={`st-heart${saved ? " on" : ""}`} aria-pressed={saved}
          aria-label="Save to wishlist" onClick={() => toggleFav(p.slug)}>
          <Icon name="heart" size={19} fill={saved ? "currentColor" : "none"} strokeWidth={1.6} />
        </button>
      </div>

      <div className="st-trust">
        <div><Icon name="truck" size={17} /><b>{site.delivery.domestic}</b><small>to your door</small></div>
        <div><Icon name="shield" size={17} /><b>Free over {inr(site.freeShippingOver)}</b><small>shipping</small></div>
        <div><Icon name="lock" size={17} /><b>Safe checkout</b><small>UPI, cards, COD</small></div>
      </div>

      <div className="st-coupons">
        {coupons.map((c) => (
          <button type="button" key={c.code} className={`st-coupon${copied === c.code ? " copied" : ""}`}
            onClick={() => copy(c.code)}>
            <b>{c.title}</b>
            <code>{c.code}</code>
            <small>Valid till {c.till} · tap to copy</small>
          </button>
        ))}
      </div>

      <div className="st-quiet">
        <button type="button" onClick={() => setAsk(true)}><Icon name="help" size={14} strokeWidth={1.6} /> Ask about this</button>
        {p.cut && <button type="button" onClick={() => setGuide(true)}><Icon name="ruler" size={14} strokeWidth={1.6} /> Metre guide</button>}
        <button type="button" onClick={share}><Icon name="share" size={14} strokeWidth={1.6} /> Share</button>
      </div>

      {/* ---------- tabs live below the two columns ---------- */}
      <section className="st-sec" style={{ padding: "clamp(40px,6vw,72px) 0 0" }}>
        <Tabs p={p} onWriteReview={() => setReview(true)} />
      </section>

      {/* ---------- sticky buy bar ---------- */}
      <Portal>
        <div className={`st-stick${stick && !out ? " on" : ""}`}>
          <div className="st-stick__ph">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.images[0].src} alt="" />
          </div>
          <div className="st-stick__t">
            <b>{p.short}</b>
            <small>{qty}{p.cut ? " m" : ""} · {inr(total)}</small>
          </div>
          <button type="button" className="st-btn st-btn--solid" onClick={addThis}>Add to cart</button>
        </div>
      </Portal>

      {/* ---------- metre guide ---------- */}
      <Modal open={guide} onClose={() => setGuide(false)} title="How much do I need?" wide>
        <p className="st-lede" style={{ marginTop: 0 }}>
          At 42 inches wide, these are the lengths our customers usually ask for.
          Tap a row and we’ll set the cut for you.
        </p>
        <table className="st-sizetable">
          <thead><tr><th>What you’re making</th><th>Length</th></tr></thead>
          <tbody>
            {makes.map((m) => (
              <tr key={m.name} style={{ cursor: "pointer" }}
                onClick={() => { setQty(m.hi); setGuide(false); say(`Cut set to ${m.hi} m`); }}>
                <td>{m.name}</td>
                <td>{m.lo === m.hi ? `${m.lo} m` : `${m.lo}–${m.hi} m`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* ---------- ask a question ---------- */}
      <Modal open={ask} onClose={() => setAsk(false)} title="Ask about this fabric">
        <AskForm onSent={() => { setAsk(false); say("Sent — usually answered the same day"); }} say={say} />
      </Modal>

      {/* ---------- write a review ---------- */}
      <Modal open={review} onClose={() => setReview(false)} title="Write a review">
        <ReviewForm onSent={() => { setReview(false); say("Thanks — posting once we’ve read it"); }} say={say} />
      </Modal>
    </>
  );
}

function AskForm({ onSent, say }: { onSent: () => void; say: (m: string) => void }) {
  const [contact, setContact] = useState("");
  const [question, setQuestion] = useState("");
  return (
    <>
      <p className="st-lede" style={{ marginTop: 0 }}>
        Colour, shrinkage, how it takes a dye — ask and someone at the Jhotwara counter answers, usually the same day.
      </p>
      <label className="st-field"><span>Phone or email</span>
        <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="95879 86226" /></label>
      <label className="st-field"><span>Your question</span>
        <textarea rows={4} value={question} onChange={(e) => setQuestion(e.target.value)}
          placeholder="Does the maroon bleed on the first wash?" /></label>
      <button type="button" className="st-btn st-btn--solid w-full"
        onClick={() => {
          if (!question.trim()) return say("Type your question first");
          if (!contact.trim()) return say("Add a phone or email so we can reply");
          onSent();
        }}>Send the question</button>
      <p className="st-cart__note center" style={{ marginTop: ".7rem" }}>
        Or WhatsApp <a href={`https://wa.me/${site.whatsapp}`} style={{ textDecoration: "underline" }}>{site.phone}</a>
      </p>
    </>
  );
}

function ReviewForm({ onSent, say }: { onSent: () => void; say: (m: string) => void }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  return (
    <>
      <label className="st-field"><span>Your rating</span>
        <span style={{ fontSize: "1.6rem", letterSpacing: ".25em", cursor: "pointer" }} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} role="button" tabIndex={0} aria-label={`${i} stars`}
              onMouseEnter={() => setHover(i)} onClick={() => setScore(i)}
              onKeyDown={(e) => { if (e.key === "Enter") setScore(i); }}
              style={{ color: i <= (hover || score) ? "var(--ochre)" : "var(--paper-3)" }}>★</span>
          ))}
        </span>
      </label>
      <label className="st-field"><span>What did you make with it?</span>
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Three metres came out as a kurta with fabric to spare…" /></label>
      <button type="button" className="st-btn st-btn--solid w-full"
        onClick={() => {
          if (!score) return say("Pick a rating first");
          if (!text.trim()) return say("Add a line about the fabric");
          onSent();
        }}>Post review</button>
    </>
  );
}
