"use client";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { inr, site, unitLabel } from "@/lib/site";
import type { CartLine } from "@/lib/types";

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

/** Subtotal, delivery and total — shared by the cart and checkout pages. */
export function Totals({ subtotal, wholesale }: { subtotal: number; wholesale: boolean }) {
  const free = !wholesale && subtotal >= site.freeShippingOver;
  return (
    <dl className="st-co__totals">
      <div><dt>Subtotal</dt><dd>{inr(subtotal)}</dd></div>
      <div>
        <dt>Delivery</dt>
        <dd>{free ? <b className="st-co__free">Free</b> : "Worked out at checkout"}</dd>
      </div>
      {wholesale && <div><dt>GST</dt><dd>Extra, on the invoice</dd></div>}
      <div className="st-co__grand"><dt>Total</dt><dd>{inr(subtotal)}</dd></div>
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
                  <li key={l.id} className="st-co__line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.image} alt="" className="st-co__ph" />
                    <div className="st-co__lt">
                      {l.href ? <Link href={l.href} className="st-co__n">{l.name}</Link> : <span className="st-co__n">{l.name}</span>}
                      <small>{inr(l.price)} · {unitLabel(l.unit)}{wholesale ? " · +GST" : ""}</small>
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
              <Totals subtotal={subtotal} wholesale={wholesale} />
              <Link href={href("/checkout")} className="st-btn st-btn--solid st-co__go">Proceed to checkout</Link>
              <Link href={href("/shop")} className="st-btn st-co__go">Keep shopping</Link>
              <p className="st-co__safe"><Icon name="shield" size={14} /> Secure checkout{wholesale ? "" : " — no account needed"}</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
