"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { Totals, orderTotal } from "@/components/cart/CartView";
import { useCartPrice } from "@/components/cart/useCartPrice";
import { CouponBox } from "@/components/cart/Offers";
import {
  buildPayNowPayload, emptyCheckout, lookupPincode, placeOrder, validateCheckout,
  type CheckoutForm, type PaymentMethod,
} from "@/lib/checkout";
import { getMe } from "@/lib/auth";
import { inr, unitLabel } from "@/lib/site";

/** Payment choices, shown as an accordion above "Pay Now": the chosen one opens to say what happens next. */
const PAYMENTS: Record<"retail" | "wholesale", { key: PaymentMethod; title: string; note: string }[]> = {
  retail: [
    { key: "online", title: "UPI, All Cards, NetBanking, Wallets",
      note: "After clicking “Pay Now”, you will be redirected to PhonePe — UPI, All Cards, NetBanking, Wallets to complete your purchase securely." },
  ],
  wholesale: [
    { key: "online", title: "UPI, All Cards, NetBanking",
      note: "After clicking “Pay Now”, you will be redirected to PhonePe to complete your payment securely." },
    { key: "bank", title: "Bank Transfer (NEFT / RTGS)", note: "We'll send our bank details with the order confirmation; the order is processed once the payment lands." },
  ],
};

type Errors = Partial<Record<keyof CheckoutForm, string>>;
type PinState = "idle" | "loading" | "ok" | "fail";

/**
 * /checkout (and /wholesale-fabric/checkout) — laid out like the storefront's
 * own checkout: Contact (mobile), Billing Details (name, email), Delivery
 * Details (address; state and city fill in from the pincode; a delivery
 * phone, or "same as above"), then payment. The order sits on the right (on a
 * phone, in a fold-out at the top). Retail checks out as a guest; wholesale
 * needs a login. Placing the order goes through `placeOrder` in lib/checkout.ts.
 */
export default function CheckoutView() {
  const { cart, subtotal, mode, href, user, hydrated, openLogin, say, coupon, updateUser } = useStore();
  const wholesale = mode === "wholesale";
  const payments = PAYMENTS[mode];
  const [f, setF] = useState<CheckoutForm>(() => emptyCheckout(payments[0].key));
  const [errs, setErrs] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState<{ state: PinState; message?: string }>({ state: "idle" });
  const { totals, offers, errors, hasErrors } = useCartPrice(hydrated && !(wholesale && !user));
  const total = orderTotal(subtotal, totals, offers);

  /* The account's saved address, for the pincode lookup below to fall back on. */
  const savedAddress = useRef(user?.address);
  savedAddress.current = user?.address;

  /* A logged-in visitor's details fill in whatever is still blank. The address
     is only there once the account has one — a new account (registered with
     just a name and email) leaves those fields empty to be typed in. City and
     state follow from the pincode. */
  useEffect(() => {
    if (!user) return;
    const [first, ...rest] = (user.name === user.mobile ? "" : user.name).split(" ");
    const a = user.address;
    setF((p) => ({
      ...p,
      mobile: p.mobile || user.mobile,
      firstName: p.firstName || first,
      lastName: p.lastName || rest.join(" "),
      email: p.email || user.email,
      address: p.address || a?.address || "",
      landmark: p.landmark || a?.landmark || "",
      pincode: p.pincode || a?.pincode || "",
    }));
  }, [user]);

  /* GET /api/auth/me: the server's copy of the address, if it has one. */
  const token = user?.token;
  const userMobile = user?.mobile;
  useEffect(() => {
    if (!token || !userMobile) return;
    let live = true;
    getMe(token, userMobile).then((r) => { if (live && r.ok && r.user.address) updateUser({ address: r.user.address }); });
    return () => { live = false; };
  }, [token, userMobile, updateUser]);

  /* A full pincode looks up its city and state (POST /api/get-state-city).
     Found: they fill in and stay locked. Not found: the two become ordinary
     text fields to type into. A changed pincode clears the old pair. */
  useEffect(() => {
    setF((p) => (p.city || p.state ? { ...p, city: "", state: "" } : p));
    if (!/^[1-9]\d{5}$/.test(f.pincode)) { setPin({ state: "idle" }); return; }
    let live = true;
    setPin({ state: "loading" });
    lookupPincode(f.pincode).then((r) => {
      if (!live) return;
      if (r.ok) {
        setF((p) => ({ ...p, city: r.city, state: r.state }));
        setErrs((p) => ({ ...p, city: undefined, state: undefined, pincode: undefined }));
        setPin({ state: "ok" });
      } else {
        const a = savedAddress.current;
        if (a?.pincode === f.pincode) setF((p) => ({ ...p, city: p.city || a.city, state: p.state || a.state }));
        setPin({ state: "fail", message: r.message });
      }
    });
    return () => { live = false; };
  }, [f.pincode]);

  const update = (patch: Partial<CheckoutForm>) => {
    setF((p) => ({ ...p, ...patch }));
    setErrs((p) => {
      const next = { ...p };
      for (const k of Object.keys(patch) as (keyof CheckoutForm)[]) delete next[k];
      return next;
    });
  };
  const digits = (v: string, n: number) => v.replace(/\D/g, "").slice(0, n);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) { say("Some items are no longer available — remove them from the cart first"); return; }
    const found = validateCheckout(f, wholesale);
    setErrs(found);
    const first = Object.keys(found)[0];
    if (first) { document.getElementById(`co-${first}`)?.focus(); return; }
    setBusy(true);
    /* The address just typed becomes the account's, so the next checkout starts with it. */
    if (user) {
      updateUser({ address: {
        address: f.address.trim(), landmark: f.landmark.trim(), pincode: f.pincode.trim(),
        state: f.state.trim(), city: f.city.trim(),
      } });
    }
    /* Pay Now → POST /api/cart/paynow. The amounts are the ones on screen;
       the server prices the order again and bills its own. */
    const applied = !wholesale && offers?.coupon?.applied ? offers.coupon : null;
    const r = await placeOrder(buildPayNowPayload(f, cart, {
      wholesale,
      loggedIn: !!user,
      coupon: applied ? { code: applied.code, id: applied.id, discount: applied.discount } : null,
      subtotal: totals?.subtotal ?? subtotal,
      totalDiscount: (totals?.discount ?? 0) + (wholesale ? 0 : offers?.discount ?? 0),
      shipping: 0,
      finalAmount: total,
    }), user?.token);
    setBusy(false);
    if (!r.ok) { say(r.message); return; }
    /* Online payment: the gateway's page (PhonePe) takes over. */
    if (r.redirectUrl) { window.location.href = r.redirectUrl; return; }
    say(r.orderId ? `Order ${r.orderId} placed` : r.message);
  };

  /** One input with a floating label: it sits inside the field and lifts above the text once there is some. */
  const input = (
    k: keyof CheckoutForm, placeholder: string,
    props: React.InputHTMLAttributes<HTMLInputElement> & { onValue?: (v: string) => string } = {},
  ) => {
    const { onValue, ...rest } = props;
    return (
      <div className={`st-cf${errs[k] ? " bad" : ""}${rest.readOnly ? " ro" : ""}`}>
        <input id={`co-${k}`} placeholder=" " value={String(f[k] ?? "")} aria-invalid={!!errs[k]}
          onChange={(e) => update({ [k]: onValue ? onValue(e.target.value) : e.target.value })} {...rest} />
        <label htmlFor={`co-${k}`}>{placeholder}</label>
        {rest.readOnly && <Icon name="lock" size={14} />}
        {errs[k] && <em className="st-co__err">{errs[k]}</em>}
      </div>
    );
  };

  const head = (
    <div className="st-co__top">
      <div className="st-wrap">
        <nav className="st-crumb" aria-label="Breadcrumb">
          <Link href={href("/")}>Home</Link><span aria-hidden="true">/</span>
          <Link href={href("/cart")}>{wholesale ? "Wholesale cart" : "Cart"}</Link><span aria-hidden="true">/</span>
          <span>Checkout</span>
        </nav>
        <ol className="st-co__steps" aria-label="Progress">
          <li className="done"><Link href={href("/cart")}>Cart</Link></li>
          <li className="on" aria-current="step">Details &amp; payment</li>
          <li>Confirmation</li>
        </ol>
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

  const lines = (
    <ul className="st-co__mini">
      {cart.map((l) => (
        <li key={l.id}>
          <span className="st-co__mph">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.image} alt="" />
            <i>{l.qty}{l.unit === "metre" ? "m" : ""}</i>
          </span>
          <span className="st-co__mn">
            {l.name}
            <small>{inr(l.price)} · {unitLabel(l.unit)}</small>
            {errors[l.id] && <em className="st-co__err">{errors[l.id]}</em>}
          </span>
          <b>{inr(l.price * l.qty)}</b>
        </li>
      ))}
    </ul>
  );

  /* Locked until a lookup fails — then they're for typing into. */
  const stateCityLocked = pin.state !== "fail";

  return (
    <main id="main" className="st-co__page st-co__page--split">
      <div className="st-co__bar">
        <div className="st-wrap">
          <ol className="st-co__steps" aria-label="Progress">
            <li className="done"><Link href={href("/cart")}>Cart</Link></li>
            <li className="on" aria-current="step">Details &amp; payment</li>
            <li>Confirmation</li>
          </ol>
          <span className="st-co__secure"><Icon name="lock" size={14} /> Secure checkout</span>
        </div>
      </div>

      {/* Phones: the order folds out above the form. */}
      <details className="st-co__msum">
        <summary>
          <span><Icon name="cart" size={16} /> Show order summary</span>
          <b>{inr(total)}</b>
        </summary>
        <div className="st-wrap">{lines}<Totals subtotal={subtotal} wholesale={wholesale} server={totals} offers={offers} /></div>
      </details>

      <form className="st-co st-co--split" onSubmit={submit} noValidate>
        <div className="st-co__grid">
          <div className="st-co__form">
            {!wholesale && !user && (
              <p className="st-co__guest">
                <Icon name="user" size={15} /> Checking out as a guest ·{" "}
                <button type="button" onClick={() => openLogin("Log in to fill in your details")}>Log in</button> to fill in your details
              </p>
            )}

            <section className="st-co__sec">
              <h2><b>1</b>Contact</h2>
              {input("mobile", "Mobile number", {
                type: "tel", inputMode: "numeric", autoComplete: "tel-national", maxLength: 10,
                onValue: (v) => digits(v, 10),
              })}
              <p className="st-co__hint">Order updates are sent to this number.</p>
            </section>

            <section className="st-co__sec">
              <h2><b>2</b>Billing Details</h2>
              <div className="st-co__row">
                {input("firstName", "First Name", { autoComplete: "given-name" })}
                {input("lastName", "Last Name", { autoComplete: "family-name" })}
              </div>
              {input("email", "Email (optional)", { type: "email", autoComplete: "email" })}
              {wholesale && (
                <div className="st-co__row">
                  {input("business", "Business name (optional)", { autoComplete: "organization" })}
                  {input("gstin", "GSTIN (optional)", { maxLength: 15, style: { textTransform: "uppercase" }, onValue: (v) => v.toUpperCase() })}
                </div>
              )}
            </section>

            <section className="st-co__sec">
              <h2><b>3</b>Delivery Details</h2>
              {input("address", "Address", { autoComplete: "address-line1" })}
              {input("landmark", "Apartment/Landmark etc. (optional)", { autoComplete: "address-line2" })}
              <div className="st-co__row">
                {input("country", "Country", { readOnly: true, tabIndex: -1 })}
                <div className="st-co__pin">
                  {input("pincode", "Pincode", {
                    inputMode: "numeric", autoComplete: "postal-code", maxLength: 6,
                    onValue: (v) => digits(v, 6),
                  })}
                  {pin.state === "loading" && <small className="st-co__pinnote">Finding city…</small>}
                  {pin.state === "fail" && <small className="st-co__pinnote bad">{pin.message}</small>}
                </div>
              </div>
              <div className="st-co__row">
                {input("state", "State", { readOnly: stateCityLocked, autoComplete: "address-level1" })}
                {input("city", "City", { readOnly: stateCityLocked, autoComplete: "address-level2" })}
              </div>
              {input("deliveryPhone", "Phone Number for Delivery", {
                type: "tel", inputMode: "numeric", maxLength: 10,
                value: f.sameAsContact ? f.mobile : f.deliveryPhone,
                readOnly: f.sameAsContact,
                onValue: (v) => digits(v, 10),
              })}
              <label className="st-co__check">
                <input type="checkbox" checked={f.sameAsContact}
                  onChange={(e) => update({ sameAsContact: e.target.checked, deliveryPhone: e.target.checked ? "" : f.mobile })} />
                <span>Same as above</span>
              </label>
              <div className="st-cf">
                <textarea id="co-notes" rows={3} value={f.notes} onChange={(e) => update({ notes: e.target.value })} placeholder=" " />
                <label htmlFor="co-notes">Order notes (optional) — cutting or delivery</label>
              </div>
            </section>

          </div>

          <aside className="st-co__side">
            <h2>Your order</h2>
            {lines}
            {!wholesale && <CouponBox offers={offers} compact />}
            <Totals subtotal={subtotal} wholesale={wholesale} server={totals} offers={offers} />

            <div className="st-pay" role="radiogroup" aria-label="Payment method">
              {payments.map((p) => (
                <div key={p.key} className={`st-pay__opt${f.payment === p.key ? " on" : ""}`}>
                  <label>
                    <input type="radio" name="payment" value={p.key} checked={f.payment === p.key}
                      onChange={() => update({ payment: p.key })} />
                    <span>{p.title}</span>
                    <Icon name={p.key === "online" ? "lock" : "shield"} size={16} strokeWidth={1.8} />
                  </label>
                  {f.payment === p.key && (
                    <div className="st-pay__body">
                      <span className="st-pay__chips" aria-hidden="true">
                        {(p.key === "online" ? ["UPI", "Visa", "Mastercard", "RuPay", "NetBanking"] : ["NEFT", "RTGS", "IMPS"]).map((c) => <i key={c}>{c}</i>)}
                      </span>
                      <p>{p.note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="st-co__terms">
              I have read and agree to the website <Link href="/terms-conditions">terms and conditions</Link> and{" "}
              <Link href="/privacy-policy">privacy policy</Link>.
            </p>
            {hasErrors && <p className="st-co__err" style={{ marginBottom: ".8rem" }}>Some items are no longer available. <Link href={href("/cart")}>Fix your cart</Link>.</p>}
            <button type="submit" className="st-btn st-btn--solid st-co__pay" disabled={busy || hasErrors}>
              {busy ? "Placing order…" : f.payment === "online" ? <>Pay {inr(total)} <Icon name="right" size={15} strokeWidth={2} /></> : "Place Order"}
            </button>
            <p className="st-co__safe"><Icon name="shield" size={14} /> 100% secure payment · your details stay with us</p>
          </aside>
        </div>
      </form>
    </main>
  );
}
