"use client";
import Link from "next/link";
import Drawer, { DrawerClose } from "@/components/ui/Drawer";
import Icon from "@/components/ui/Icon";
import { useStore } from "./StoreProvider";
import { inr, unitLabel } from "@/lib/site";
import { useCartPrice } from "@/components/cart/useCartPrice";
import { CartProgress, CouponBox } from "@/components/cart/Offers";
import CartRecent from "./CartRecent";

export default function CartDrawer() {
  const {
    cart, cartOpen, setCartOpen, setQty, remove, subtotal, say,
    mode, otherCount, switchMode, href, user, openLogin,
  } = useStore();
  const wholesale = mode === "wholesale";
  const close = () => setCartOpen(false);
  const other = wholesale ? "retail" : "wholesale";
  /* Fresh prices — and the retail cart's offers — while the drawer is open. */
  const { totals, offers, errors, hasErrors } = useCartPrice(cartOpen);
  const saved = offers?.discount ?? 0;

  return (
    <Drawer open={cartOpen} onClose={close} label={wholesale ? "Your wholesale cart" : "Your cart"} className="st-cartdrawer">
      <CartRecent open={cartOpen} onPick={close} />
      <div className="st-cart__head">
        <div>
          <span className="st-eyebrow">{wholesale ? "Wholesale" : "Jhotwara counter"}</span>
          <h2 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "1.5rem", margin: ".25rem 0 0", lineHeight: 1 }}>
            {wholesale ? "Wholesale cart" : "Your cart"}
          </h2>
        </div>
        <DrawerClose onClose={close} label="Close cart" />
      </div>

      {otherCount > 0 && (
        <button type="button" className="st-cart__other"
          onClick={() => { close(); switchMode(other); }}>
          You also have {otherCount} {otherCount === 1 ? "item" : "items"} in your {other} cart — <u>switch to {other}</u>
        </button>
      )}

      {/* The milestone offer's progress when one is running, otherwise free shipping's. */}
      {!wholesale && cart.length > 0 && <CartProgress offers={offers} compact />}

      <div className="st-cart__body">
        {cart.length === 0 ? (
          <div className="st-cart__empty">
            <Icon name="cart" size={34} strokeWidth={1.3} />
            <h3 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "1.4rem", margin: "0 0 .5rem" }}>
              Nothing in here yet
            </h3>
            <p>
              {wholesale
                ? "Wholesale fabric starts at 10 metres — pick a category and add your lengths."
                : "Fabric is cut to any length from one metre, so start wherever you like."}
            </p>
            {wholesale && !user && (
              <button type="button" className="st-btn" style={{ marginBottom: ".6rem" }}
                onClick={() => { close(); openLogin("Log in to add wholesale products to cart"); }}>
                Log in to order
              </button>
            )}
            <Link href={href("/shop")} className="st-btn st-btn--solid" onClick={close}>Browse the counter</Link>
          </div>
        ) : (
          <div className="st-lines">
            {cart.map((l) => (
              <div className="st-line" key={l.id}>
                <div className="st-line__ph">
                  {/* Plain <img>: cart thumbs are tiny and change constantly. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.image} alt="" />
                </div>
                <div className="st-line__t">
                  {l.href ? <Link href={l.href} className="st-line__n" onClick={close}>{l.name}</Link>
                          : <span className="st-line__n">{l.name}</span>}
                  <small className="st-line__m">
                    {inr(l.price)} · {unitLabel(l.unit)}{wholesale ? " · +GST" : ""}
                  </small>
                  {errors[l.id] && <small className="st-co__err">{errors[l.id]}</small>}
                  <div className="st-line__foot">
                    <span className="st-qty">
                      <button type="button" aria-label="Less" onClick={() => {
                        const next = l.qty - l.step;
                        if (l.minQty && next < l.minQty) return say(`Wholesale minimum is ${l.minQty} m`);
                        setQty(l.id, next);
                      }}>−</button>
                      <span>{l.qty}{l.unit === "metre" ? " m" : ""}</span>
                      <button type="button" onClick={() => setQty(l.id, l.qty + l.step)} aria-label="More">+</button>
                    </span>
                    <span className="st-line__p">{inr(l.price * l.qty)}</span>
                  </div>
                </div>
                <button type="button" className="st-line__x" onClick={() => remove(l.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="st-cart__foot">
          <div className="st-cart__sum">
            <small>{saved > 0 ? "Total after offers" : "Subtotal"}</small>
            <b>
              {saved > 0 && <s className="st-cart__was">{inr(totals?.subtotal ?? subtotal)}</s>}
              {inr(offers?.total ?? totals?.subtotal ?? subtotal)}
            </b>
          </div>
          {saved > 0 && <p className="st-cart__note st-cart__saved">You save {inr(saved)} with offers.</p>} 
          {hasErrors && <p className="st-cart__note st-co__err">Remove the unavailable items to check out.</p>}
                    
          {hasErrors
            ? <button type="button" className="st-btn mt-2 st-btn--solid" disabled>Go to checkout</button>
            : <Link href={href("/checkout")} className="st-btn st-btn--solid" onClick={close}>Go to checkout</Link>}
          <Link href={href("/cart")} className="st-btn" onClick={close}>View cart</Link>
        </div>
      )}
    </Drawer>
  );
}
