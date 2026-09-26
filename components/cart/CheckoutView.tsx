"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { Totals } from "@/components/cart/CartView";
import {
  STATES, emptyCheckout, placeOrder, validateCheckout,
  type CheckoutForm, type PaymentMethod,
} from "@/lib/checkout";
import { inr } from "@/lib/site";

const PAYMENTS: Record<"retail" | "wholesale", { key: PaymentMethod; title: string; note: string }[]> = {
  retail: [
    { key: "online", title: "Pay online", note: "UPI, cards, net banking, wallets" },
    { key: "cod", title: "Cash on delivery", note: "Pay when the parcel arrives" },
  ],
  wholesale: [
    { key: "online", title: "Pay online", note: "UPI, cards, net banking" },
    { key: "bank", title: "Bank transfer", note: "NEFT / RTGS — details sent with the order" },
  ],
};

/**
 * /checkout (and /wholesale-fabric/checkout) — contact, delivery address and
 * payment method on the left, the order on the right. Retail checks out as a
 * guest (this form is all we need); wholesale needs a login. Placing the order
 * goes through `placeOrder` in lib/checkout.ts, which is where the order and
 * payment APIs plug in.
 */
export default function CheckoutView() {
  const { cart, subtotal, mode, href, user, hydrated, openLogin, say } = useStore();
  const wholesale = mode === "wholesale";
  const payments = PAYMENTS[mode];
  const [f, setF] = useState<CheckoutForm>(() => emptyCheckout(payments[0].key));
  const [errs, setErrs] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [busy, setBusy] = useState(false);

  /* A logged-in visitor's details fill in whatever is still blank. */
  useEffect(() => {
    if (!user) return;
    setF((p) => ({
      ...p,
      name: p.name || (user.name === user.mobile ? "" : user.name),
      mobile: p.mobile || user.mobile,
      email: p.email || user.email,
    }));
  }, [user]);

  const set = (k: keyof CheckoutForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const v = k === "mobile" || k === "pincode" ? e.target.value.replace(/\D/g, "") : e.target.value;
    setF((p) => ({ ...p, [k]: v }));
    if (errs[k]) setErrs((p) => ({ ...p, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateCheckout(f, wholesale);
    setErrs(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`co-${first}`)?.focus();
      return;
    }
    setBusy(true);
    const r = await placeOrder(f, cart, { wholesale, token: user?.token });
    setBusy(false);
    say(r.ok ? `Order ${r.orderId} placed` : r.message);
  };

  const field = (k: keyof CheckoutForm, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={`st-field${errs[k] ? " bad" : ""}`}>
      <span>{label}</span>
      <input id={`co-${k}`} value={f[k]} onChange={set(k)} aria-invalid={!!errs[k]} {...props} />
      {errs[k] && <em className="st-co__err">{errs[k]}</em>}
    </label>
  );

  const head = (
    <div className="st-plp__head">
      <div className="st-wrap">
        <nav className="st-crumb" aria-label="Breadcrumb">
          <Link href={href("/")}>Home</Link><span aria-hidden="true">/</span>
          <Link href={href("/cart")}>{wholesale ? "Wholesale cart" : "Cart"}</Link><span aria-hidden="true">/</span>
          <span>Checkout</span>
        </nav>
        <h1>Checkout</h1>
      </div>
    </div>
  );

  if (!hydrated) return <main id="main">{head}<div style={{ minHeight: "50vh" }} aria-busy="true" /></main>;

  if (wholesale && !user) {
    return (
      <main id="main">{head}
        <div className="st-wrap st-co"><div className="st-co__empty">
          <Icon name="lock" size={32} strokeWidth={1.3} />
          <h2>Log in to check out</h2>
          <p>Wholesale orders are placed from your account.</p>
          <button type="button" className="st-btn st-btn--solid" onClick={() => openLogin("Log in to place a wholesale order")}>Log in</button>
        </div></div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main id="main">{head}
        <div className="st-wrap st-co"><div className="st-co__empty">
          <Icon name="cart" size={32} strokeWidth={1.3} />
          <h2>Your cart is empty</h2>
          <p>Add something first, then come back here to check out.</p>
          <Link href={href("/shop")} className="st-btn st-btn--solid">Browse the counter</Link>
        </div></div>
      </main>
    );
  }

  return (
    <main id="main">
      {head}
      <form className="st-wrap st-co" onSubmit={submit} noValidate>
        <div className="st-co__grid">
          <div className="st-co__form">
            {!wholesale && !user && (
              <p className="st-co__guest">
                Checking out as a guest. <button type="button" onClick={() => openLogin("Log in to fill in your details")}>Log in</button> to fill in your details.
              </p>
            )}

            <fieldset className="st-co__card">
              <legend><b>1</b> Contact</legend>
              <div className="st-co__row">
                {field("name", "Full name", { autoComplete: "name", placeholder: "Your name" })}
                {field("mobile", "Mobile", { autoComplete: "tel-national", inputMode: "numeric", maxLength: 10, placeholder: "10-digit number" })}
              </div>
              {field("email", "Email (optional)", { type: "email", autoComplete: "email", placeholder: "For the order confirmation" })}
              {wholesale && (
                <div className="st-co__row">
                  {field("business", "Business name (optional)", { autoComplete: "organization" })}
                  {field("gstin", "GSTIN (optional)", { maxLength: 15, placeholder: "For a GST invoice", style: { textTransform: "uppercase" } })}
                </div>
              )}
            </fieldset>

            <fieldset className="st-co__card">
              <legend><b>2</b> Delivery address</legend>
              {field("address", "House / street / area", { autoComplete: "street-address", placeholder: "Flat, house no., street, area" })}
              {field("landmark", "Landmark (optional)", { placeholder: "Near…" })}
              <div className="st-co__row st-co__row--3">
                {field("city", "City", { autoComplete: "address-level2" })}
                <label className={`st-field${errs.state ? " bad" : ""}`}>
                  <span>State</span>
                  <select id="co-state" value={f.state} onChange={set("state")} aria-invalid={!!errs.state} autoComplete="address-level1">
                    <option value="">Select</option>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  {errs.state && <em className="st-co__err">{errs.state}</em>}
                </label>
                {field("pincode", "Pincode", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 6 })}
              </div>
              <label className="st-field">
                <span>Order notes (optional)</span>
                <textarea id="co-notes" rows={3} value={f.notes} onChange={set("notes")} placeholder="Anything we should know about cutting or delivery" />
              </label>
            </fieldset>

            <fieldset className="st-co__card">
              <legend><b>3</b> Payment</legend>
              <div className="st-co__pay" role="radiogroup" aria-label="Payment method">
                {payments.map((p) => (
                  <label key={p.key} className={`st-co__opt${f.payment === p.key ? " on" : ""}`}>
                    <input type="radio" name="payment" value={p.key} checked={f.payment === p.key}
                      onChange={() => setF((prev) => ({ ...prev, payment: p.key }))} />
                    <span><b>{p.title}</b><small>{p.note}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <aside className="st-co__card st-co__sum">
            <h2>Your order</h2>
            <ul className="st-co__mini">
              {cart.map((l) => (
                <li key={l.id}>
                  <span className="st-co__mph">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.image} alt="" />
                    <i>{l.qty}{l.unit === "metre" ? "m" : ""}</i>
                  </span>
                  <span className="st-co__mn">{l.name}</span>
                  <b>{inr(l.price * l.qty)}</b>
                </li>
              ))}
            </ul>
            <Totals subtotal={subtotal} wholesale={wholesale} />
            <button type="submit" className="st-btn st-btn--solid st-co__go" disabled={busy}>
              {busy ? "Placing order…" : f.payment === "online" ? `Pay ${inr(subtotal)}` : "Place order"}
            </button>
            <Link href={href("/cart")} className="st-co__back">← Back to cart</Link>
            <p className="st-co__safe"><Icon name="shield" size={14} /> Your details are only used for this order.</p>
          </aside>
        </div>
      </form>
    </main>
  );
}
