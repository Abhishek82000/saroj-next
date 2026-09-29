"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/components/shell/StoreProvider";
import { priceCartRemote, sameLine, type CartTotals } from "@/lib/cart";
import type { CartOffers } from "@/lib/offers";

/**
 * Re-prices the current mode's cart from the server (POST /api/cart/price)
 * whenever its pieces, quantities or applied coupon change — prices move,
 * pieces sell out, a coupon stops qualifying. Writes the fresh prices onto
 * the lines and hands back the server's totals, the retail cart's offers
 * (milestone, free shipping, coupon — null for wholesale) and, per line id,
 * any error ("This product is no longer available.").
 * Lines without a product id (static catalogue) keep their local price.
 */
export function useCartPrice(active = true) {
  const { cart, mode, reprice, user, coupon } = useStore();
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [offers, setOffers] = useState<CartOffers | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);

  /* Only the pieces and quantities matter — not the prices this call itself writes back. */
  const key = cart.map((l) => `${l.productId ?? l.id}:${l.variationId ?? ""}:${l.qty}`).join("|");
  const token = user?.token;
  /* Coupons are a retail offer. */
  const code = mode === "retail" ? coupon : null;

  useEffect(() => {
    if (!active) return;
    const priced = cart.filter((l) => l.productId);
    if (!priced.length) { setTotals(null); setOffers(null); setErrors({}); return; }
    let live = true;
    setChecking(true);
    const t = setTimeout(async () => {
      const r = await priceCartRemote(mode, priced, token, code);
      if (!live) return;
      setChecking(false);
      if (!r) return;
      reprice(mode, r.items);
      setErrors(Object.fromEntries(priced.flatMap((l) => {
        const e = r.items.find((s) => sameLine(l, s))?.error;
        return e ? [[l.id, e]] : [];
      })));
      /* Server totals only describe the whole cart when every line was priced there. */
      const whole = priced.length === cart.length;
      setTotals(whole ? r.totals : null);
      setOffers(whole ? r.offers : null);
    }, 350);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, key, mode, token, code]);

  return { totals, offers, errors, checking, hasErrors: Object.keys(errors).length > 0 };
}
