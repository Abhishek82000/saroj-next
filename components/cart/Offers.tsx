"use client";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { applyCouponRemote, REWARD, type CartOffers, type Milestone, type OfferCard } from "@/lib/offers";
import { inr, site } from "@/lib/site";

/**
 * The retail cart's offers — used by the cart drawer, the cart page and checkout.
 *
 *   <CartProgress>  the cart-milestone bar when a milestone offer is running,
 *                   otherwise the free-shipping bar.
 *   <CouponBox>     the applied coupon, a code field, and the featured coupons
 *                   with how far the cart is from each.
 *
 * Both read `offers` from useCartPrice (POST /api/cart/price). Until that
 * answers, the shipping bar runs on the local estimate (site.freeShippingOver).
 */

export function CartProgress({ offers, compact = false }: { offers: CartOffers | null; compact?: boolean }) {
  if (offers?.milestone) return <MilestoneBar m={offers.milestone} compact={compact} />;
  return <ShippingBar offers={offers} compact={compact} />;
}

function ShippingBar({ offers, compact }: { offers: CartOffers | null; compact: boolean }) {
  const { shortOfFreeShipping, subtotal } = useStore();
  const s = offers?.shipping;
  if (s && !s.threshold && !s.prepaid_free) return null; // no free-shipping rule set up
  const short = s ? s.short_by : shortOfFreeShipping;
  const reached = s ? !!s.threshold && s.short_by <= 0 : short <= 0;
  const prepaidOnly = !reached && !!s?.prepaid_free;
  const free = reached || prepaidOnly;
  const progress = free ? 1 : s ? s.progress : Math.min(1, subtotal / site.freeShippingOver);
  const text = prepaidOnly
    ? <><b>Free shipping</b> on every prepaid order.</>
    : reached
      ? compact ? <><b>Shipping is on us.</b> Cut and posted from Jhotwara in two working days.</> : <><b>Shipping is on us</b> on this order.</>
      : <><b>{inr(short)}</b> more and the shipping is on us.</>;

  if (!compact) {
    return (
      <p className={`st-co__ship${free ? " done" : ""}`}>
        <Icon name="truck" size={16} /><span>{text}</span>
      </p>
    );
  }
  return (
    <div className={`st-ship${free ? " done" : ""}`}>
      <p>{text}</p>
      <div className="st-ship__bar"><div className="st-ship__fill" style={{ width: `${progress * 100}%` }} /></div>
    </div>
  );
}

function MilestoneBar({ m, compact }: { m: Milestone; compact: boolean }) {
  const top = m.tiers[m.tiers.length - 1]?.min_amount || 1;
  const reached = m.tiers.find((t) => t.id === m.reached_tier_id) ?? null;
  const done = !m.next && !!reached;
  const giftTier = reached?.reward_type === REWARD.product ? reached : null;
  const codeTier = reached?.reward_type === REWARD.coupon && reached.coupon_code ? reached : null;
  // Each tier gets an equal column with its dot centred over its label, so the
  // fill runs dot to dot rather than in proportion to the rupee amount.
  const n = m.tiers.length || 1;
  const at = (i: number) => (i + 0.5) / n;
  const seg = m.tiers.findIndex((t) => m.amount < t.min_amount);
  const fill = seg < 0 ? 1 : (() => {
    const from = seg > 0 ? m.tiers[seg - 1].min_amount : 0;
    const span = m.tiers[seg].min_amount - from || 1;
    const start = seg > 0 ? at(seg - 1) : 0;
    return start + (at(seg) - start) * Math.min(1, Math.max(0, m.amount - from) / span);
  })();

  return (
    <div className={`st-ms${compact ? "" : " st-ms--page"}${done ? " done" : ""}`}>
      <p className="st-ms__msg">
        <Icon name={giftTier ? "gift" : "tag"} size={15} />
        <span>
          {m.message ?? (
            m.next
              ? <>{reached && <>Unlocked <b className="st-ms__ok">{reached.label}</b> · </>}Add <b>{inr(m.next.short_by)}</b> more to unlock <b>{m.next.label}</b></>
              : reached ? <>You&apos;ve unlocked <b className="st-ms__ok">{reached.label}</b>{m.discount > 0 && <> — saving {inr(m.discount)}</>}</> : null
          )}
        </span>
      </p>
      <div className="st-ms__track" role="progressbar" aria-label={m.name}
        aria-valuemin={0} aria-valuemax={top} aria-valuenow={Math.min(m.amount, top)}>
        <div className="st-ms__fill" style={{ width: `${fill * 100}%` }} />
        {m.tiers.map((t, i) => (
          <i key={t.id} className={t.unlocked ? "on" : ""} style={{ left: `${at(i) * 100}%` }} />
        ))}
      </div>
      <ol className="st-ms__tiers" style={{ gridTemplateColumns: `repeat(${m.tiers.length}, minmax(0,1fr))` }}>
        {m.tiers.map((t) => (
          <li key={t.id} className={t.unlocked ? "on" : ""}>
            <b>{t.unlocked && <Icon name="check" size={11} strokeWidth={2.4} />}{inr(t.min_amount)}</b>
            <span>{t.label}</span>
          </li>
        ))}
      </ol>
      {codeTier && <UnlockedCode code={codeTier.coupon_code!} />}
      {giftTier?.product && (
        <p className="st-ms__gift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={giftTier.product.image} alt="" />
          <span><b>Free gift:</b> {giftTier.product.name} — packed with your order.</span>
        </p>
      )}
    </div>
  );
}

/** A milestone tier whose reward is a coupon code: show it and apply it in one tap. */
function UnlockedCode({ code }: { code: string }) {
  const { coupon } = useStore();
  const { apply, busy, error } = useApplyCoupon();
  const on = coupon?.toUpperCase() === code.toUpperCase();
  return (
    <>
      <p className="st-ms__code">
        <span>Your code <code>{code}</code></span>
        <button type="button" className="st-cp__btn" disabled={busy || on} onClick={() => apply(code)}>
          {on ? "Applied" : busy ? "…" : "Apply"}
        </button>
      </p>
      {error && <em className="st-co__err" role="alert">{error}</em>}
    </>
  );
}

/** Applies a code to the retail cart: checked by POST /api/offers/apply, then remembered. */
function useApplyCoupon() {
  const { cart, user, setCoupon, say } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async (code: string) => {
    if (!code.trim()) { setError("Enter a coupon code."); return false; }
    setBusy(true);
    setError(null);
    const r = await applyCouponRemote(code, cart, user?.token);
    setBusy(false);
    if (!r.ok) { setError(r.message); return false; }
    setCoupon(r.offers?.coupon?.code ?? code.trim().toUpperCase());
    say(r.message);
    return true;
  };

  return { apply, busy, error, clearError: () => setError(null) };
}

export function CouponBox({ offers, compact = false }: { offers: CartOffers | null; compact?: boolean }) {
  const { coupon, setCoupon, say } = useStore();
  const { apply, busy, error, clearError } = useApplyCoupon();
  const [code, setCode] = useState("");
  const current = offers?.coupon ?? null;
  const list = offers?.available ?? [];

  const remove = () => { setCoupon(null); say("Coupon removed"); };

  const cards = list.length > 0 && (
    <ul className="st-cp__list">
      {list.map((o) => <CouponCard key={o.id} o={o} on={coupon?.toUpperCase() === o.code.toUpperCase()} busy={busy} apply={apply} />)}
    </ul>
  );

  return (
    <div className={`st-cp${compact ? " st-cp--compact" : ""}`}>
      {coupon ? (
        <div className={`st-cp__on${current && !current.applied ? " warn" : ""}`}>
          <Icon name="tag" size={16} />
          <span>
            <b>{coupon}</b>
            <small>
              {!current ? "Checking…" : current.applied ? <>You save <b>{inr(current.discount)}</b></> : current.message}
            </small>
          </span>
          <button type="button" className="st-co__x" onClick={remove}>Remove</button>
        </div>
      ) : (
        <form className="st-cp__form" onSubmit={async (e) => { e.preventDefault(); if (await apply(code)) setCode(""); }}>
          <label className="visually-hidden" htmlFor={compact ? "cp-code-d" : "cp-code"}>Coupon code</label>
          <input id={compact ? "cp-code-d" : "cp-code"} value={code} placeholder="Coupon code" autoComplete="off"
            onChange={(e) => { setCode(e.target.value.toUpperCase()); if (error) clearError(); }} />
          <button type="submit" className="st-cp__btn" disabled={busy}>{busy ? "…" : "Apply"}</button>
        </form>
      )}
      {error && <em className="st-co__err" role="alert">{error}</em>}

      {cards && (compact
        ? <details className="st-cp__more"><summary>{list.length} {list.length === 1 ? "offer" : "offers"} available <Icon name="down" size={13} /></summary>{cards}</details>
        : <><h3 className="st-cp__h">Available offers</h3>{cards}</>)}
    </div>
  );
}

function CouponCard({ o, on, busy, apply }: { o: OfferCard; on: boolean; busy: boolean; apply: (code: string) => Promise<boolean> }) {
  const short = o.short_by ?? 0;
  const terms = [
    o.min_purchase ? `On orders over ${inr(o.min_purchase)}` : null,
    o.first_order ? "First order only" : null,
    o.weekday ? `${o.weekday}s only` : null,
    o.cashback ? "Cashback" : null,
  ].filter(Boolean).join(" · ");

  return (
    <li className={`st-cp__card${on ? " on" : ""}${o.eligible === false ? " off" : ""}`}>
      <div>
        <code>{o.code}</code>
        <b>{o.headline}</b>
        {o.description && <p>{o.description}</p>}
        {terms && <small>{terms}</small>}
        {!on && short > 0 && <small className="st-cp__short">Add {inr(short)} more to use this</small>}
        {!on && o.eligible && !!o.saves && <small className="st-cp__save">Saves {inr(o.saves)} on this cart</small>}
      </div>
      <button type="button" className="st-cp__btn" disabled={on || busy || o.eligible === false} onClick={() => apply(o.code)}>
        {on ? "Applied" : "Apply"}
      </button>
    </li>
  );
}
