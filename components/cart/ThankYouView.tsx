"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { readOrderSnapshot, type OrderPaymentStatus, type ReceiptItem } from "@/lib/checkout";
import { inr, site } from "@/lib/site";

/**
 * The thank-you page — shown by OrderStatusView once an order is paid (or,
 * wholesale, placed for bank transfer). A carved block comes down and prints
 * the seal, a handful of block-print motifs scatter, then the receipt
 * unrolls like a length of cloth and the order's journey draws itself in.
 * All of it stands still under prefers-reduced-motion.
 *
 * The details come from the order's receipt (only for whoever placed it —
 * the receipt token); product photos from the cart this device ordered.
 */

const METHODS: Record<string, string> = {
  upi: "UPI", credit_card: "Credit card", debit_card: "Debit card", card: "Card", net_banking: "Net banking",
  netbanking: "Net banking", wallet: "Wallet", app: "Wallet", pay_later: "Pay later", cardless_emi: "Cardless EMI",
  emi: "EMI", bank_transfer: "Bank transfer (NEFT / RTGS)", cashfree: "Online",
};
const methodLabel = (m: string) => METHODS[m.toLowerCase()] ?? m.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** `n` working days (Mon–Sat) after `from`. */
function addWorkingDays(from: Date, n: number) {
  const d = new Date(from);
  while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) n--; }
  return d;
}
const day = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const parseWhen = (s?: string) => {
  const t = s ? new Date(/^\d{4}-\d\d-\d\d \d/.test(s) ? s.replace(" ", "T") : s) : new Date();
  return Number.isNaN(t.getTime()) ? new Date() : t;
};

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Counts up to `to` once the seal is down. */
function useCountUp(to: number, delay = 900, ms = 1300) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (reduced()) { setV(to); return; }
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      setV(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    /* rAF stalls in a background tab — land on the figure regardless. */
    const done = setTimeout(() => { cancelAnimationFrame(raf); setV(to); }, delay + ms + 300);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
  }, [to, delay, ms]);
  return v;
}

/* ---------- the block-print motifs the confetti is cut from ---------- */

const BUTI = [0, 72, 144, 216, 288].map((a) => {
  const r = (a * Math.PI) / 180;
  return [10 + 5 * Math.sin(r), 10 - 5 * Math.cos(r)];
});
const MOTIFS = [
  <g key="buti">{BUTI.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.3} />)}<circle cx={10} cy={10} r={2} fill="var(--paper)" /></g>,
  <path key="paisley" d="M11 1.5c4.5 4 7 8.5 4.6 13.2A5.2 5.2 0 0 1 6 12.3C6 8.6 9.6 7.4 11 1.5Z" />,
  <path key="diamond" d="M10 1.5 18.5 10 10 18.5 1.5 10Z" />,
  <circle key="ring" cx={10} cy={10} r={6.5} fill="none" stroke="currentColor" strokeWidth={3} />,
  <path key="leaf" d="M2 18C2 8 8 2 18 2 18 12 12 18 2 18Z" />,
];
const INKS = ["var(--cobalt)", "var(--teal)", "var(--lac)", "var(--ochre)"];

function Confetti() {
  const [pieces, setPieces] = useState<React.CSSProperties[] | null>(null);
  useEffect(() => {
    if (reduced()) return;
    setPieces(Array.from({ length: 44 }, (_, i) => ({
      "--dx": `${(Math.random() - 0.5) * 92}vw`,
      "--up": `${-60 - Math.random() * 160}px`,
      "--rot": `${(Math.random() - 0.5) * 900}deg`,
      "--sz": `${10 + Math.random() * 14}px`,
      "--dl": `${1.05 + Math.random() * 0.25}s`,
      "--du": `${2.6 + Math.random() * 1.6}s`,
      color: INKS[i % INKS.length],
    } as React.CSSProperties)));
    const t = setTimeout(() => setPieces(null), 5200);
    return () => clearTimeout(t);
  }, []);
  if (!pieces) return null;
  return (
    <div className="ty-confetti" aria-hidden="true">
      {pieces.map((style, i) => (
        <svg key={i} viewBox="0 0 20 20" style={style} fill="currentColor">{MOTIFS[i % MOTIFS.length]}</svg>
      ))}
    </div>
  );
}

/** The carved block coming down, and the seal it leaves. */
function Stamp({ waiting }: { waiting: boolean }) {
  const petals = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return <circle key={i} cx={80 + 58 * Math.cos(a)} cy={80 + 58 * Math.sin(a)} r={9} />;
  });
  return (
    <div className={`ty-stamp${waiting ? " ty-stamp--wait" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 160 160" overflow="visible">
        <circle className="ty-stamp__ripple" cx="80" cy="80" r="62" />
        <g className="ty-stamp__print">
          <g className="ty-stamp__petals">{petals}</g>
          <circle cx="80" cy="80" r="52" />
          <circle className="ty-stamp__dots" cx="80" cy="80" r="43" />
          {waiting
            ? <path className="ty-stamp__mark" d="M80 56v26l16 10" />
            : <path className="ty-stamp__mark" d="M57 82l16 16 31-34" />}
        </g>
        <g className="ty-stamp__block">
          <rect x="62" y="-34" width="36" height="40" rx="12" className="ty-wood ty-wood--dark" />
          <rect x="10" y="2" width="140" height="148" rx="16" className="ty-wood" />
          <path d="M22 30c30-6 80 6 116-2M22 70c40 8 70-6 116 4M22 112c34-6 76 8 116-2" className="ty-grain" />
          <rect x="10" y="140" width="140" height="10" rx="4" className="ty-wood__face" />
        </g>
      </svg>
    </div>
  );
}

function ItemPhoto({ src, name }: { src: string | null; name: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="ty-item__ph">
      {src && !broken
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} />
        : <i>{name.charAt(0)}</i>}
    </span>
  );
}

export default function ThankYouView({ order }: { order: OrderPaymentStatus }) {
  const { user, href } = useStore();
  const r = order.receipt;
  const bank = order.state === "awaiting_transfer";
  const amount = useCountUp(order.amount);
  const [copied, setCopied] = useState(false);

  const first = (r?.name || (user && user.name !== user.mobile ? user.name : "")).trim().split(" ")[0];

  /* Items: the receipt's, with this device's photos where it has them; the snapshot alone otherwise. */
  const items: (ReceiptItem & { photo: string | null })[] = useMemo(() => {
    const snap = readOrderSnapshot(order.orderNumber) ?? [];
    if (r?.items.length) {
      return r.items.map((it, i) => {
        const match = snap.find((s) => s.name === it.name) ?? snap[i];
        return { ...it, photo: match?.image || (it.image?.startsWith("http") ? it.image : null) };
      });
    }
    return snap.map((s) => ({
      name: s.name, image: s.image, variant: null, qty: s.qty, mrp: s.price, price: s.price,
      total: Math.round(s.price * s.qty * 100) / 100, photo: s.image,
    }));
  }, [order.orderNumber, r]);

  const mrpTotal = items.reduce((a, it) => a + (it.mrp || it.price) * it.qty, 0);
  const saved = r ? r.discount : Math.max(0, mrpTotal - order.amount);
  const placed = parseWhen(r?.placedAt);
  const [lo, hi] = (site.delivery.domestic.match(/\d+/g) ?? ["5", "7"]).map(Number);
  const eta = `${day(addWorkingDays(placed, lo))} – ${day(addWorkingDays(placed, hi ?? lo))}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(order.orderNumber); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };
  const wa = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hi Saroj Textile, about my order ${order.orderNumber}: `)}`;

  const steps = bank
    ? [
        { t: "Order placed", s: placed.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }), state: "done" },
        { t: "Awaiting your transfer", s: "Bank details are in your email", state: "now" },
        { t: "Cut, folded & packed", s: "Once the payment lands", state: "" },
        { t: "Shipped to you", s: "Tracking by SMS & email", state: "" },
      ]
    : [
        { t: "Payment received", s: placed.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }), state: "done" },
        { t: "Cut, folded & packed", s: "In Jhotwara, Jaipur · within 1–2 days", state: "now" },
        { t: "Shipped", s: "Tracking by SMS & email", state: "" },
        { t: "At your door", s: `Expected ${eta}`, state: "" },
      ];

  return (
    <main id="main" className={`ty${bank ? " ty--bank" : ""}`}>
      <Confetti />
      <div className="ty__steps">
        <div className="st-wrap">
          <ol className="st-co__steps" aria-label="Progress">
            <li className="done">Cart</li>
            <li className="done">Details &amp; payment</li>
            <li className="done" aria-current="step">Confirmation</li>
          </ol>
        </div>
      </div>

      <section className="ty__hero st-wrap">
        <Stamp waiting={bank} />
        <p className="ty__hindi" lang="hi">धन्यवाद</p>
        <h1 className="ty__title">
          <span>{bank ? "Order placed" : "Thank you"}{first ? `, ${first}` : ""}!</span>
        </h1>
        <p className="ty__lead">
          {bank
            ? <>Your wholesale order is in. Transfer the amount below (plus GST) and we start cutting the moment it lands.</>
            : <>Your order is confirmed and already on its way to our printing tables in Jaipur.{r?.email ? <> A confirmation is on its way to <b>{r.email}</b>.</> : null}</>}
        </p>
        <div className="ty__chips">
          <button type="button" className="ty-chip" onClick={copy} aria-label={`Copy order number ${order.orderNumber}`}>
            <small>Order no.</small><b>{order.orderNumber}</b>
            <span className="ty-chip__copy">{copied ? <><Icon name="check" size={13} strokeWidth={2.4} /> Copied</> : "Copy"}</span>
          </button>
          <div className="ty-chip ty-chip--amt">
            <small>{bank ? "To transfer" : "Paid"}</small>
            <b>{inr(amount)}</b>
            {order.wholesale && <span className="ty-chip__note">+ GST</span>}
          </div>
        </div>
      </section>

      <div className="st-wrap ty__grid">
        {items.length > 0 && (
          <section className="ty-receipt" aria-label="Receipt">
            <header className="ty-receipt__head">
              <span><b>Saroj Textile</b><small>Jhotwara, Jaipur</small></span>
              <span className="ty-receipt__no"><small>Receipt</small>{order.orderNumber}</span>
            </header>
            <ul className="ty-receipt__items">
              {items.map((it, i) => (
                <li key={i} className="ty-item" style={{ "--i": i } as React.CSSProperties}>
                  <ItemPhoto src={it.photo} name={it.name} />
                  <span className="ty-item__n">
                    {it.name}
                    <small>{it.variant ? `${it.variant} · ` : ""}{it.qty} × {inr(it.price)}{it.price === 0 ? " · free gift" : ""}</small>
                  </span>
                  <b>{it.total === 0 ? "Free" : inr(it.total)}</b>
                </li>
              ))}
            </ul>
            <dl className="ty-receipt__tot">
              {saved > 0 && <div><dt>Total MRP</dt><dd>{inr(mrpTotal)}</dd></div>}
              {saved > 0 && <div><dt>Discount{r?.couponCode ? <code>{r.couponCode}</code> : null}</dt><dd className="ty-off">−{inr(saved)}</dd></div>}
              <div><dt>Shipping</dt><dd>{r && r.shipping > 0 ? inr(r.shipping) : <span className="ty-off">Free</span>}</dd></div>
              {order.wholesale && <div><dt>GST</dt><dd><small>On the invoice</small></dd></div>}
              <div className="ty-receipt__grand"><dt>{bank ? "Amount due" : "Amount paid"}</dt><dd>{inr(order.amount)}</dd></div>
            </dl>
            {r && (
              <p className="ty-receipt__pay">
                <Icon name="lock" size={13} /> {methodLabel(r.paymentMethod)}
                {r.paymentRef && <> · Ref <code>{r.paymentRef}</code></>}
              </p>
            )}
            {saved > 0 && <div className="ty-saved" aria-label={`You saved ${inr(saved)}`}><small>You saved</small>{inr(saved)}</div>}
          </section>
        )}

        <div className="ty__side">
          <section className="ty-card ty-journey">
            <h2><Icon name="truck" size={18} /> What happens next</h2>
            <ol>
              {steps.map((s, i) => (
                <li key={i} className={s.state} style={{ "--i": i } as React.CSSProperties}>
                  <span className="ty-journey__dot">{s.state === "done" ? <Icon name="check" size={12} strokeWidth={3} /> : null}</span>
                  <b>{s.t}</b><small>{s.s}</small>
                </li>
              ))}
            </ol>
          </section>

          {r && (
            <section className="ty-card ty-ship">
              <h2><Icon name="pin" size={18} /> Delivering to</h2>
              <p><b>{r.name}</b><br />{r.deliveryAddress}</p>
              <p className="ty-ship__meta">
                <span><Icon name="phone" size={13} /> {r.deliveryPhone || r.mobile}</span>
                {r.gstin && <span><Icon name="tag" size={13} /> GSTIN {r.gstin}</span>}
              </p>
            </section>
          )}

          <a className="ty-card ty-help" href={wa} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={22} fill="currentColor" strokeWidth={0} />
            <span><b>Questions about your order?</b><small>WhatsApp us — we usually reply within the hour.</small></span>
            <Icon name="right" size={16} />
          </a>
        </div>
      </div>

      <div className="st-wrap ty__acts">
        {user && <Link href={`/account/orders/${encodeURIComponent(order.orderNumber)}`} className="st-btn st-btn--solid">Track your order</Link>}
        <Link href={href("/shop")} className={`st-btn${user ? "" : " st-btn--solid"}`}>Continue shopping</Link>
      </div>
    </main>
  );
}
