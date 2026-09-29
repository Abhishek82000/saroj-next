"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { applyCoupon } from "@/lib/checkout";
import { getOffers, type Offer } from "@/lib/offers";
import { inr } from "@/lib/site";

/**
 * Discount code + "All Coupons" — retail only (wholesale takes no coupons, and
 * this renders nothing there). Coupons come from GET /api/offers. The applied
 * one lives in the store so the cart page and checkout share it, and it's
 * re-checked whenever the subtotal changes, since the discount depends on it.
 */
export default function CouponBox({ subtotal }: { subtotal: number }) {
  const { mode, coupon, setCoupon } = useStore();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (mode === "retail") getOffers().then(setOffers); }, [mode]);

  /* The subtotal moved — the applied coupon's discount (or eligibility) may have too. */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!coupon) return;
    applyCoupon(coupon.code, subtotal).then((r) => {
      if (r.ok) setCoupon({ code: r.code, discount: r.discount, promoId: r.promoId });
      else { setCoupon(null); setMsg({ ok: false, text: `${coupon.code} was removed — ${r.message}` }); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  if (mode !== "retail") return null;

  /* Not a <form>: on checkout this sits inside the checkout form. */
  const apply = async (c = code) => {
    if (!c.trim() || busy) return;
    setBusy(true);
    const r = await applyCoupon(c, subtotal);
    setBusy(false);
    if (r.ok) {
      setCoupon({ code: r.code, discount: r.discount, promoId: r.promoId });
      setMsg({ ok: true, text: r.message ?? `You save ${inr(r.discount)} with ${r.code}` });
      setCode("");
      setOpen(false);
    } else {
      setMsg({ ok: false, text: r.message });
    }
  };

  return (
    <div className="st-cpn">
      <div className="st-cpn__field">
        <label htmlFor="coupon-code" className="sr-only">Discount code</label>
        <input id="coupon-code" value={code} placeholder="Discount code" autoComplete="off" spellCheck={false}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setMsg(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }} />
        <button type="button" onClick={() => apply()} disabled={busy || !code.trim()}>{busy ? "…" : "Apply"}</button>
      </div>

      {coupon && (
        <div className="st-cpn__on">
          <span className="st-cpn__tag" aria-hidden="true"><Icon name="percent" size={16} strokeWidth={2.2} /></span>
          <b>{coupon.code} Applied</b>
          <small>− {inr(coupon.discount)}</small>
          <button type="button" aria-label={`Remove ${coupon.code}`} onClick={() => { setCoupon(null); setMsg(null); }}>
            <Icon name="trash" size={18} strokeWidth={1.7} />
          </button>
        </div>
      )}

      {msg && <p className={`st-cpn__msg${msg.ok ? " ok" : ""}`} role="status">{msg.text}</p>}

      {offers.length > 0 && (
        <div className={`st-cpn__all${open ? " open" : ""}`}>
          <button type="button" className="st-cpn__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            All Coupons <Icon name="down" size={15} strokeWidth={2} />
          </button>
          {open && (
            <ul>
              {offers.map((o) => {
                const short = o.min_purchase ? subtotal < o.min_purchase : false;
                const on = coupon?.code === o.code;
                return (
                  <li key={o.id} className={on ? "on" : ""}>
                    <div>
                      <code>{o.code}</code>
                      <b>{o.headline || o.name}</b>
                      <small>
                        {o.description}
                        {short && ` · add ${inr(o.min_purchase! - subtotal)} more`}
                      </small>
                    </div>
                    <button type="button" disabled={on || short || busy} onClick={() => apply(o.code)}>
                      {on ? "Applied" : "Apply"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
