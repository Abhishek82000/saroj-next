"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/components/shell/StoreProvider";
import { priceCartRemote, sameLine, type CartCharges, type CartTotals } from "@/lib/cart";
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
  const { cart, mode, reprice, user, coupon, expireSession } = useStore();
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [offers, setOffers] = useState<CartOffers | null>(null);
  /* Shipping, wholesale GST and the payable total — both modes. */
  const [charges, setCharges] = useState<CartCharges | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);
  /* Bumped to ask again after a failed call — otherwise shipping sits on "Calculating…" for good. */
  const [retry, setRetry] = useState(0);

  /* Only the pieces and quantities matter — not the prices this call itself writes back. */
  const key = cart.map((l) => `${l.productId ?? l.id}:${l.variationId ?? ""}:${l.qty}`).join("|");
  const token = user?.token;
  /* Coupons are a retail offer. */
  const code = mode === "retail" ? coupon : null;

  useEffect(() => {
    if (!active) return;
    const priced = cart.filter((l) => l.productId);
    if (!priced.length) { setTotals(null); setOffers(null); setCharges(null); setErrors({}); return; }
    let live = true;
    let again: ReturnType<typeof setTimeout> | undefined;
    setChecking(true);
    const t = setTimeout(async () => {
      const r = await priceCartRemote(mode, priced, token, code);
      if (!live) return;
      setChecking(false);
      if (!r.ok) {
        /* The saved login is dead: drop it, and the token change re-prices as a guest. */
        if (r.expired) expireSession();
        else if (retry < 3) again = setTimeout(() => setRetry((n) => n + 1), 2500 * (retry + 1));
        return;
      }
      reprice(mode, r.items);
      setErrors(Object.fromEntries(priced.flatMap((l) => {
        const e = r.items.find((s) => sameLine(l, s))?.error;
        return e ? [[l.id, e]] : [];
      })));
      /* Server totals only describe the whole cart when every line was priced there. */
      const whole = priced.length === cart.length;
      setTotals(whole ? r.totals : null);
      setOffers(whole ? r.offers : null);
      setCharges(whole ? r.charges : null);
    }, 350);
    return () => { live = false; clearTimeout(t); clearTimeout(again); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, key, mode, token, code, retry]);

  /* A changed cart, login or coupon starts the retries over. */
  useEffect(() => { setRetry(0); }, [key, mode, token, code]);

  return { totals, offers, charges, errors, checking, hasErrors: Object.keys(errors).length > 0 };
}
