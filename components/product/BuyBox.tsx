"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Portal from "@/components/ui/Portal";
import { useStore } from "@/components/shell/StoreProvider";
import CutPicker from "./CutPicker";
import VariantPicker, { type VariantState } from "./VariantPicker";
import LiveViewers from "./LiveViewers";
import Countdown from "./Countdown";
import { productHref } from "@/lib/product-api";
import { coupons as fallbackCoupons, makes } from "@/lib/content";
import { discount } from "@/lib/products";
import { inr, site, unitLabel } from "@/lib/site";
import type { Product, ProductDetail } from "@/lib/types";

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login";

/**
 * Everything interactive on a product page.
 *
 * With a `detail` from the API it follows the Laravel rules exactly: which
 * price column applies, how the length picker steps, whether the cart is a
 * login gate, whether GST is extra. Without one it falls back to the static
 * catalogue so the marketing pages keep working.
 */
export default function BuyBox({ p, detail }: { p: Product; detail?: ProductDetail }) {
  const { add, favs, toggleFav, say } = useStore();
  const live = detail?.live ?? p.live;
  const wholesale = detail?.mode === "wholesale";
  const mode = live?.cut.mode ?? (p.cut ? "length" : "quantity");

  const minQty = live?.cut.min ?? p.cut?.min ?? 1;
  const maxQty = live?.cut.max ?? p.cut?.max ?? 999;
  const stepQty = live?.cut.step ?? p.cut?.step ?? 1;

  /* Wholesale opens at its minimum; retail fabric opens at a useful 3 m. */
  const [qty, setQty] = useState(() => {
    if (mode === "enquiry") return 0;
    if (wholesale) return minQty;
    return mode === "length" ? Math.max(minQty, 3) : minQty;
  });

  const [variant, setVariant] = useState<VariantState | null>(null);
  const [guide, setGuide] = useState(false);
  const [ask, setAsk] = useState(false);
  const [stick, setStick] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);

  /* A chosen variation overrides the price the page was rendered with. */
  const price = variant?.price?.selling ?? live?.price.selling ?? p.price;
  const mrp = variant?.price?.mrp ?? live?.price.mrp ?? p.mrp;
  const off = variant?.price?.discount ?? live?.price.discount ?? discount(p);
  const image = variant?.image ?? p.images[0].src;
  const stockLeft = variant?.stock ?? live?.stock ?? 999;

  const total = price * (qty || 1);
  const saved = !!favs[p.slug];
  const soldOut = stockLeft <= 0 || p.stock === "out";
  const gateCart = detail?.requiresLogin ?? false;

  const coupons = detail
    ? detail.coupons
    : wholesale
      ? []
      : fallbackCoupons.map((c) => ({ code: c.code, description: c.title, valid_to: c.till }));

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

  /* Clamp to whatever the chosen variation actually has on the shelf. */
  useEffect(() => {
    if (mode === "enquiry") return;
    setQty((q) => Math.min(Math.max(q, minQty), Math.max(minQty, stockLeft)));
  }, [stockLeft, minQty, mode]);

  const onVariant = useCallback((state: VariantState) => setVariant(state), []);

  const addThis = () => {
    if (soldOut) { say("Out of stock just now"); return; }
    add({
      id: variant?.variationId ? `${p.slug}#${variant.variationId}` : p.slug,
      name: variant?.combination ? `${p.name} · ${variant.combination}` : p.name,
      price,
      unit: live?.cut.unit ?? p.unit,
      image,
      step: stepQty,
      qty: qty || 1,
      href: productHref(p.slug, wholesale),
    });
  };

  const copy = async (code: string) => {
    try { await navigator.clipboard?.writeText(code); } catch { /* the code is on screen anyway */ }
    setCopied(code); say(`${code} copied`);
    setTimeout(() => setCopied(null), 1800);
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const data = { title: p.name, text: `${inr(price)} ${unitLabel(p.unit)}`, url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share(data); return; } catch { /* dismissed */ }
    }
    try { await navigator.clipboard?.writeText(url); say("Link copied"); }
    catch { say("Copy the address from the bar above"); }
  };

  const enquiryHref = useMemo(() => {
    const url = typeof window !== "undefined" ? window.location.href : site.url;
    return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hi, I'd like to ask about ${p.name} — ${url}`)}`;
  }, [p.name]);

  return (
    <>
      {/* ---------- badges ---------- */}
      {(live?.label || (live?.inCarts ?? 0) > 0) && (
        <div className="st-pd__badges">
          {live?.label && <span className="st-pd__label">{live.label}</span>}
          {live && live.inCarts > 0 && (
            <span className="st-pd__hot">
              Selling fast — <b>{live.inCarts} {live.inCarts === 1 ? "person has" : "people have"}</b> this in their cart
            </span>
          )}
        </div>
      )}

      {/* ---------- price ---------- */}
      <div className="st-price">
        <b>{inr(price)}</b>
        {mrp > price && <s>{inr(mrp)}</s>}
        {off > 0 && <em>{off}% off</em>}
        <small>
          {unitLabel(live?.cut.unit ?? p.unit)} ·{" "}
          {live?.price.gst_extra ? "GST extra" : "inclusive of all taxes"}
        </small>
      </div>

      <div className="st-live">
        <LiveViewers />
        {soldOut && <span><i /> Out of stock</span>}
      </div>

      {detail?.promo && (
        <Countdown seconds={detail.promo.seconds_remaining} code={detail.promo.code}
          description={detail.promo.description} />
      )}

      <hr className="st-rule" />

      {/* ---------- variations ---------- */}
      {detail && live && detail.variants.length > 0 && (
        <VariantPicker productId={live.id} groups={detail.variants} wholesale={wholesale} onChange={onVariant} />
      )}

      {/* ---------- how much ---------- */}
      {mode === "enquiry" ? (
        <div className="st-enquire">
          <p>This one is made to order. Tell us the colours and the print you want and we’ll quote it.</p>
          <a className="st-btn st-btn--solid" href={enquiryHref} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={16} fill="currentColor" strokeWidth={0} /> Enquire on WhatsApp
          </a>
        </div>
      ) : mode === "length" ? (
        <CutPicker
          p={{ ...p, price, cut: { min: minQty, max: maxQty, step: stepQty, wholesale: live?.wholesale.sellingPrice ?? 0 } }}
          value={qty}
          onChange={setQty}
          onOpenGuide={() => setGuide(true)}
        />
      ) : (
        <div className="st-cut">
          <div className="st-cut__row">
            <span className="st-qty-step">
              <button type="button" onClick={() => setQty(Math.max(minQty, qty - stepQty))}
                disabled={qty <= minQty} aria-label="One fewer">−</button>
              <input type="number" min={minQty} max={maxQty} value={qty} aria-label="Quantity"
                onChange={(e) => setQty(Math.max(minQty, Math.min(maxQty, parseInt(e.target.value, 10) || minQty)))} />
              <button type="button" aria-label="One more" onClick={() => {
                if (qty + stepQty > maxQty) { say("That’s all we have in stock"); return; }
                setQty(qty + stepQty);
              }}>+</button>
            </span>
            <span className="st-cut__unit">{live?.cut.unit ?? p.unit}</span>
            <span className="st-cut__sum"><b>{inr(total)}</b><small>{price} × {qty}</small></span>
          </div>
        </div>
      )}

      {/* ---------- the other side of the counter ---------- */}
      {live && mode !== "enquiry" && (
        wholesale ? (
          <p className="st-crosslink">
            Ordering less than {minQty}{live.cut.unit === "metre" ? "m" : " pcs"}?{" "}
            <Link href={productHref(p.slug, false)}>Buy at retail instead</Link>
          </p>
        ) : live.wholesale.available && live.wholesale.sellingPrice > 0 ? (
          <p className="st-crosslink">
            Taking {live.wholesale.minQty || site.wholesaleFrom}{live.cut.unit === "metre" ? "m" : " pcs"} or more?{" "}
            <Link href={productHref(p.slug, true)}>
              Wholesale is {inr(live.wholesale.sellingPrice)} {unitLabel(live.cut.unit)}
            </Link>
          </p>
        ) : null
      )}

      {/* ---------- buy ---------- */}
      {mode !== "enquiry" && (
        <div className="st-buy">
          {gateCart ? (
            <a href={LOGIN_URL} className="st-btn st-btn--solid" style={{ flex: 1 }}>
              Sign in to buy wholesale
            </a>
          ) : (
            <button ref={addRef} type="button" className="st-btn st-btn--solid" disabled={soldOut} onClick={addThis}>
              {soldOut ? "Sold out" : `Add to cart · ${inr(total)}`}
            </button>
          )}
          <button type="button" className={`st-heart${saved ? " on" : ""}`} aria-pressed={saved}
            aria-label="Save to wishlist" onClick={() => toggleFav(p.slug)}>
            <Icon name="heart" size={19} fill={saved ? "currentColor" : "none"} strokeWidth={1.6} />
          </button>
        </div>
      )}

      {live?.wholesale.lFoldNote && (
        <p className="st-cart__note" style={{ marginTop: ".8rem" }}>
          Cut in an L fold, so a metre measures 95–98 cm on the bolt.
        </p>
      )}

      {/* ---------- trust ---------- */}
      <div className="st-trust">
        <div>
          <Icon name="truck" size={17} />
          <b>{detail?.shipping.estimate ?? site.delivery.domestic}</b><small>to your door</small>
        </div>
        {wholesale ? (
          <div>
            <Icon name="shield" size={17} />
            <b>Minimum {detail?.shipping.minimum ?? `${minQty}m`}</b><small>per order</small>
          </div>
        ) : (
          <div>
            <Icon name="shield" size={17} />
            <b>Free over {inr(detail?.shipping.free_shipping_above ?? site.freeShippingOver)}</b><small>shipping</small>
          </div>
        )}
        <div><Icon name="lock" size={17} /><b>Safe checkout</b><small>UPI, cards, COD</small></div>
      </div>

      {/* ---------- coupons ---------- */}
      {coupons.length > 0 && (
        <div className="st-coupons">
          {coupons.slice(0, 4).map((c) => (
            <button type="button" key={c.code} className={`st-coupon${copied === c.code ? " copied" : ""}`}
              onClick={() => copy(c.code)}>
              <b>{c.description}</b>
              <code>{c.code}</code>
              <small>Valid till {c.valid_to} · tap to copy</small>
            </button>
          ))}
        </div>
      )}

      <div className="st-quiet">
        <button type="button" onClick={() => setAsk(true)}><Icon name="help" size={14} strokeWidth={1.6} /> Ask about this</button>
        {mode === "length" && <button type="button" onClick={() => setGuide(true)}><Icon name="ruler" size={14} strokeWidth={1.6} /> Metre guide</button>}
        <button type="button" onClick={share}><Icon name="share" size={14} strokeWidth={1.6} /> Share</button>
      </div>

      {/* ---------- sticky bar ---------- */}
      {mode !== "enquiry" && (
        <Portal>
          <div className={`st-stick${stick && !soldOut ? " on" : ""}`}>
            <div className="st-stick__ph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" />
            </div>
            <div className="st-stick__t">
              <b>{p.short}</b>
              <small>{qty}{mode === "length" ? " m" : ""} · {inr(total)}</small>
            </div>
            {gateCart
              ? <a className="st-btn st-btn--solid" href={LOGIN_URL}>Sign in</a>
              : <button type="button" className="st-btn st-btn--solid" onClick={addThis}>Add to cart</button>}
          </div>
        </Portal>
      )}

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
                onClick={() => { setQty(Math.max(minQty, m.hi)); setGuide(false); say(`Cut set to ${m.hi} m`); }}>
                <td>{m.name}</td>
                <td>{m.lo === m.hi ? `${m.lo} m` : `${m.lo}–${m.hi} m`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <Modal open={ask} onClose={() => setAsk(false)} title="Ask about this">
        <AskForm onSent={() => { setAsk(false); say("Sent — usually answered the same day"); }} say={say} />
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

export function ReviewForm({ onSent, say }: { onSent: () => void; say: (m: string) => void }) {
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
