"use client";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { inr, site, unitLabel } from "@/lib/site";
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

/** Subtotal, offers, delivery and total — shared by the cart and checkout pages.
    `server` is the server's own totals and `offers` its retail offers (POST
    /api/cart/price), both there only when it priced the whole cart. */
export function Totals({ subtotal: local, wholesale, server, offers }: {
  subtotal: number; wholesale: boolean; server?: CartTotals | null; offers?: CartOffers | null;
}) {
  const subtotal = server?.subtotal ?? local;
  const free = !wholesale && (offers ? offers.shipping.free : subtotal >= site.freeShippingOver);
  const milestone = offers?.milestone;
  const coupon = offers?.coupon?.applied ? offers.coupon : null;
  const gift = milestone?.tiers.find((t) => t.id === milestone.reached_tier_id && t.reward_type === REWARD.product)?.product;
  const saved = (server?.discount ?? 0) + (offers?.discount ?? 0);
  return (
    <dl className="st-co__totals">
      {server && server.discount > 0 && (
        <>
          <div><dt>MRP total</dt><dd><s>{inr(server.mrp)}</s></dd></div>
          <div><dt>Discount</dt><dd className="st-co__free">− {inr(server.discount)}</dd></div>
        </>
      )}
      <div><dt>Subtotal</dt><dd>{inr(subtotal)}</dd></div>
      {milestone && milestone.discount > 0 && (
        <div><dt>{milestone.name}</dt><dd className="st-co__free">− {inr(milestone.discount)}</dd></div>
      )}
      {coupon && <div><dt>Coupon <code className="st-co__code">{coupon.code}</code></dt><dd className="st-co__free">− {inr(coupon.discount)}</dd></div>}
      {gift && <div><dt>Free gift · {gift.name}</dt><dd className="st-co__free">Free</dd></div>}
      <div>
        <dt>Delivery</dt>
        <dd>{free ? <b className="st-co__free">Free</b> : "Worked out at checkout"}</dd>
      </div>
      {wholesale && <div><dt>GST</dt><dd>Extra, on the invoice</dd></div>}
      <div className="st-co__grand"><dt>Total</dt><dd>{inr(offers?.total ?? subtotal)}</dd></div>
      {saved > 0 && <div className="st-co__saved"><dt>You save</dt><dd>{inr(saved)} on this order</dd></div>}
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
    <main id="main">
      <div className="st-plp__head">
        <div className="st-wrap">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <Link href={href("/")}>Home</Link><span aria-hidden="true">/</span><span>{wholesale ? "Wholesale cart" : "Cart"}</span>
          </nav>
          <h1>{wholesale ? "Wholesale cart" : "Your cart"}</h1>
          {cart.length > 0 && <p>{cart.length} {cart.length === 1 ? "piece" : "pieces"} · cut and posted from Jhotwara</p>}
        </div>
      </div>

      <div className="st-wrap st-co">
        {otherCount > 0 && (
          <button type="button" className="st-cart__other st-co__other" onClick={() => switchMode(other)}>
            You also have {otherCount} {otherCount === 1 ? "item" : "items"} in your {other} cart — <u>switch to {other}</u>
          </button>
        )}

        {!hydrated ? (
          <div style={{ minHeight: "40vh" }} aria-busy="true" />
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.image} alt="" className="st-co__ph" />
                    <div className="st-co__lt">
                      {l.href ? <Link href={l.href} className="st-co__n">{l.name}</Link> : <span className="st-co__n">{l.name}</span>}
                      <small>{inr(l.price)} · {unitLabel(l.unit)}{wholesale ? " · +GST" : ""}</small>
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
            </section>

            <aside className="st-co__card">
              <h2>Order summary</h2>
              {!wholesale && <CouponBox offers={offers} />}
              <Totals subtotal={subtotal} wholesale={wholesale} server={totals} offers={offers} />
              {hasErrors
                ? <button type="button" className="st-btn st-btn--solid st-co__go" disabled>Remove unavailable items</button>
                : <Link href={href("/checkout")} className="st-btn st-btn--solid st-co__go">Proceed to checkout</Link>}
              <Link href={href("/shop")} className="st-btn st-co__go">Keep shopping</Link>
              <p className="st-co__safe"><Icon name="shield" size={14} /> Secure checkout{wholesale ? "" : " — no account needed"}</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
