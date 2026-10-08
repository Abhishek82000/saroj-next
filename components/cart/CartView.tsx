"use client";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { CartBodySkeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/components/shell/StoreProvider";
import { inr, unitLabel } from "@/lib/site";
import type { CartLine } from "@/lib/types";
import type { CartTotals } from "@/lib/cart";
import { REWARD, type CartOffers } from "@/lib/offers";
import { useCartPrice } from "@/components/cart/useCartPrice";
import { CartProgress, CouponBox } from "@/components/cart/Offers";

/** One line's − qty + control, holding wholesale lines at their minimum. */
export function LineQty({ l }: { l: CartLine }) {
  const { setQty, say } = useStore();
  return (
    <span className="st-qty">
      <button type="button" aria-label="Less" onClick={() => {
        const next = l.qty - l.step;
        if (l.minQty && next < l.minQty) return say(`Wholesale minimum is ${l.minQty} m`);
        setQty(l.id, next);
      }}>−</button>
      <span>{l.qty}{l.unit === "metre" ? " m" : ""}</span>
      <button type="button" onClick={() => setQty(l.id, l.qty + l.step)} aria-label="More">+</button>
    </span>
  );
}

/** "1,220.00" — the breakdown reads in rupees with paise. */
const amt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** What the order comes to: the server's figure when it priced the cart
    (offers and coupon already taken off), else the plain subtotal. */
export const orderTotal = (subtotal: number, server?: CartTotals | null, offers?: CartOffers | null) =>
  offers?.total ?? server?.subtotal ?? subtotal;

/**
 * The money breakdown, shared by the cart and checkout: Total MRP / Total
 * Discount | Subtotal | offer + coupon | Shipping | (GST) | Total Amount.
 * `server` is the server's own totals and `offers` its retail offers (POST
 * /api/cart/price — milestone, coupon, free gift, free shipping), both there
 * only when it priced the whole cart. Retail: GST included, offers apply.
 * Wholesale: no offers or coupon, GST added on the invoice.
 */
export function Totals({ subtotal: local, wholesale, server, offers }: {
  subtotal: number; wholesale: boolean; server?: CartTotals | null; offers?: CartOffers | null;
}) {
  const subtotal = server?.subtotal ?? local;
  const mrp = server?.mrp ?? subtotal;
  const mrpOff = server?.discount ?? Math.max(0, mrp - subtotal);
  const milestone = wholesale ? null : offers?.milestone;
  const coupon = !wholesale && offers?.coupon?.applied ? offers.coupon : null;
  const gift = milestone?.tiers.find((t) => t.id === milestone.reached_tier_id && t.reward_type === REWARD.product)?.product;
  const free = !wholesale && !!offers?.shipping.free;
  const saved = mrpOff + (wholesale ? 0 : offers?.discount ?? 0);
  return (
    <dl className="st-tot">
      <div className="st-tot__grp">
        <div><dt>Total MRP</dt><dd>{amt(mrp)}</dd></div>
        <div><dt>Total Discount</dt><dd>{mrpOff > 0 ? `-${amt(mrpOff)}` : amt(0)}</dd></div>
      </div>
      <div><dt>Subtotal</dt><dd>{amt(subtotal)}</dd></div>
      {milestone && milestone.discount > 0 && (
        <div><dt>{milestone.name}</dt><dd className="st-co__free">-{amt(milestone.discount)}</dd></div>
      )}
      {!wholesale && (
        <div>
          <dt>Coupon Discount{coupon && <code className="st-co__code">{coupon.code}</code>}</dt>
          <dd className={coupon ? "st-co__free" : ""}>{coupon ? `-${amt(coupon.discount)}` : amt(0)}</dd>
        </div>
      )}
      {gift && <div><dt>Free gift · {gift.name}</dt><dd className="st-co__free">Free</dd></div>}
      <div>
        <dt>Shipping Amount</dt>
        <dd>{free ? <span className="st-co__free">Free</span> : <small>Calculated on your address</small>}</dd>
      </div>
      {wholesale && <div><dt>GST</dt><dd><small>Added on the invoice</small></dd></div>}
      <div className="st-tot__grand">
        <dt>{wholesale ? "Total Amount (before GST)" : "Total Amount"}</dt>
        <dd>{inr(orderTotal(subtotal, server, offers))}</dd>
      </div>
      {saved > 0 && <div className="st-tot__saved st-co__saved"><dt>You save</dt><dd>{inr(saved)} on this order</dd></div>}
    </dl>
  );
}

/**
 * /cart (and /wholesale-fabric/cart) — the current mode's cart as a full page:
 * every line with its quantity, and the totals with the way on to checkout.
 * Retail is open to guests; the wholesale cart needs a login.
 */
export default function CartView() {
  const { cart, remove, subtotal, mode, href, user, hydrated, openLogin, otherCount, switchMode } = useStore();
  const wholesale = mode === "wholesale";
  const other = wholesale ? "retail" : "wholesale";
  const { totals, offers, errors, hasErrors } = useCartPrice(hydrated && !(wholesale && !user));

  return (
    <main id="main" className="st-co__page">
      <div className="st-co__top">
        <div className="st-wrap">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <Link href={href("/")}>Home</Link><span aria-hidden="true">/</span><span>{wholesale ? "Wholesale cart" : "Cart"}</span>
          </nav>
          <div className="st-co__title">
            <h1>{wholesale ? "Wholesale cart" : "Your cart"}{cart.length > 0 && <small>{cart.length} {cart.length === 1 ? "item" : "items"}</small>}</h1>
            <ol className="st-co__steps" aria-label="Progress">
              <li className="on" aria-current="step">Cart</li>
              <li>Details &amp; payment</li>
              <li>Confirmation</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="st-wrap st-co">
        {otherCount > 0 && (
          <button type="button" className="st-cart__other st-co__other" onClick={() => switchMode(other)}>
            You also have {otherCount} {otherCount === 1 ? "item" : "items"} in your {other} cart — <u>switch to {other}</u>
          </button>
        )}

        {!hydrated ? (
          <div aria-busy="true"><CartBodySkeleton /></div>
        ) : wholesale && !user ? (
          <div className="st-co__empty">
            <Icon name="lock" size={32} strokeWidth={1.3} />
            <h2>Log in to see your wholesale cart</h2>
            <p>Wholesale orders are placed from your account.</p>
            <button type="button" className="st-btn st-btn--solid" onClick={() => openLogin("Log in to see your wholesale cart")}>Log in</button>
          </div>
        ) : cart.length === 0 ? (
          <div className="st-co__empty">
            <Icon name="cart" size={32} strokeWidth={1.3} />
            <h2>Nothing in here yet</h2>
            <p>
              {wholesale
                ? "Wholesale fabric starts at 10 metres — pick a category and add your lengths."
                : "Fabric is cut to any length from one metre, so start wherever you like."}
            </p>
            <Link href={href("/shop")} className="st-btn st-btn--solid">Browse the counter</Link>
          </div>
        ) : (
          <div className="st-co__grid">
            <section aria-label="Items">
              {!wholesale && <CartProgress offers={offers} />}
              <ul className="st-co__lines">
                {cart.map((l) => (
                  <li key={l.id} className={`st-co__line${errors[l.id] ? " bad" : ""}`}>
                    {l.href
                      ? <Link href={l.href} className="st-co__ph">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={l.image} alt="" /></Link>
                      : <span className="st-co__ph">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={l.image} alt="" /></span>}
                    <div className="st-co__lt">
                      {l.href ? <Link href={l.href} className="st-co__n">{l.name}</Link> : <span className="st-co__n">{l.name}</span>}
                      <small>{inr(l.price)} · {unitLabel(l.unit)}{wholesale ? " · +GST" : ""}{l.minQty ? ` · min ${l.minQty} m` : ""}</small>
                      {errors[l.id] && <em className="st-co__err">{errors[l.id]} Remove it to continue.</em>}
                      <div className="st-co__lf">
                        <LineQty l={l} />
                        <button type="button" className="st-co__x" onClick={() => remove(l.id)}>Remove</button>
                      </div>
                    </div>
                    <b className="st-co__lp">{inr(l.price * l.qty)}</b>
                  </li>
                ))}
              </ul>
              <Link href={href("/shop")} className="st-co__back st-co__cont">← Continue shopping</Link>
            </section>

            <aside className="st-co__side">
              <h2>Order summary</h2>
              {!wholesale && <CouponBox offers={offers} />}
              <Totals subtotal={subtotal} wholesale={wholesale} server={totals} offers={offers} />
              {hasErrors
                ? <button type="button" className="st-btn st-btn--solid st-co__go" disabled>Remove unavailable items</button>
                : <Link href={href("/checkout")} className="st-btn st-btn--solid st-co__go">Proceed to checkout</Link>}
              <p className="st-co__safe"><Icon name="shield" size={14} /> Secure checkout{wholesale ? "" : " — no account needed"}</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
