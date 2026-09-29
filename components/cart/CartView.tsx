"use client";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { inr, site, unitLabel } from "@/lib/site";
import type { CartLine } from "@/lib/types";
import type { CartTotals } from "@/lib/cart";
import { useCartPrice } from "@/components/cart/useCartPrice";
import CouponBox from "@/components/cart/CouponBox";

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

/** The amount to pay: the subtotal less any coupon (retail only), plus shipping. */
export const payable = (subtotal: number, couponDiscount = 0, shipping = 0) => Math.max(0, subtotal - couponDiscount) + shipping;

/** "1,220.00" — the totals read in rupees with paise, like the storefront's own checkout. */
const amt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * The money breakdown, shared by the cart and checkout — laid out like the
 * storefront's checkout: Total MRP, Total Discount | Subtotal | Coupon
 * Discount | Shipping Amount | (GST) | Total Amount. `server` is the server's
 * own totals (POST /api/cart/price) when it priced the whole cart. Retail: GST
 * included, a coupon may apply. Wholesale: no coupon, GST added on the invoice.
 * `shipping` stays null until the shipping API gives an amount.
 */
export function Totals({ subtotal: local, wholesale, server, shipping = null }: {
  subtotal: number; wholesale: boolean; server?: CartTotals | null; shipping?: number | null;
}) {
  const { coupon } = useStore();
  const subtotal = server?.subtotal ?? local;
  const mrp = server?.mrp ?? subtotal;
  const mrpOff = server?.discount ?? Math.max(0, mrp - subtotal);
  const off = wholesale ? 0 : coupon?.discount ?? 0;
  const free = !wholesale && subtotal >= site.freeShippingOver;
  const ship = free ? 0 : shipping;
  return (
    <dl className="st-tot">
      <div className="st-tot__grp">
        <div><dt>Total MRP</dt><dd>{amt(mrp)}</dd></div>
        <div><dt>Total Discount</dt><dd>{mrpOff > 0 ? `-${amt(mrpOff)}` : amt(0)}</dd></div>
      </div>
      <div><dt>Subtotal</dt><dd>{amt(subtotal)}</dd></div>
      {!wholesale && <div><dt>Coupon Discount</dt><dd className={off > 0 ? "st-co__free" : ""}>{off > 0 ? `-${amt(off)}` : amt(0)}</dd></div>}
      <div>
        <dt>Shipping Amount</dt>
        <dd>{ship == null ? <small>Calculated on your address</small> : ship === 0 ? <span className="st-co__free">Free</span> : amt(ship)}</dd>
      </div>
      {wholesale && <div><dt>GST</dt><dd><small>Added on the invoice</small></dd></div>}
      <div className="st-tot__grand">
        <dt>{wholesale ? "Total Amount (before GST)" : "Total Amount"}</dt>
        <dd>{inr(payable(subtotal, off, ship ?? 0))}</dd>
      </div>
    </dl>
  );
}

/**
 * /cart (and /wholesale-fabric/cart) — the current mode's cart as a full page:
 * every line with its quantity, and the totals with the way on to checkout.
 * Retail is open to guests; the wholesale cart needs a login.
 */
export default function CartView() {
  const { cart, remove, subtotal, shortOfFreeShipping, mode, href, user, hydrated, openLogin, otherCount, switchMode } = useStore();
  const wholesale = mode === "wholesale";
  const other = wholesale ? "retail" : "wholesale";
  const { totals, errors, hasErrors } = useCartPrice(hydrated && !(wholesale && !user));

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
              {!wholesale && (
                <p className={`st-co__ship${shortOfFreeShipping <= 0 ? " done" : ""}`}>
                  <Icon name="truck" size={16} />
                  {shortOfFreeShipping <= 0
                    ? <span><b>Shipping is on us</b> on this order.</span>
                    : <span><b>{inr(shortOfFreeShipping)}</b> more for free shipping.</span>}
                </p>
              )}
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
              <CouponBox subtotal={totals?.subtotal ?? subtotal} />
              <Totals subtotal={subtotal} wholesale={wholesale} server={totals} />
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
