/**
 * Cashfree's hosted checkout. POST /api/cart/paynow hands back a
 * `payment_session_id`; Cashfree's JS SDK (v3) turns that into its payment
 * page, and sends the buyer back to /checkout/status?order_id=… when done
 * (the return URL is set server-side — CashfreeApiController).
 */

type CashfreeMode = "sandbox" | "production";

interface CashfreeInstance {
  checkout(o: { paymentSessionId: string; redirectTarget?: "_self" | "_blank" | "_top" | "_modal" }):
    Promise<{ error?: { message?: string } } | undefined>;
}

declare global {
  interface Window { Cashfree?: (o: { mode: CashfreeMode }) => CashfreeInstance }
}

const SDK = "https://sdk.cashfree.com/js/v3/cashfree.js";
let loading: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (window.Cashfree) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { loading = null; s.remove(); reject(new Error("sdk")); };
    document.head.appendChild(s);
  });
  return loading;
}

/** Leaves for Cashfree's payment page. Only comes back (with a message) when it couldn't. */
export async function openCashfree(paymentSessionId: string, mode: CashfreeMode): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await loadSdk();
    const r = await window.Cashfree!({ mode }).checkout({ paymentSessionId, redirectTarget: "_self" });
    if (r?.error) return { ok: false, message: r.error.message ?? "Couldn't open the payment page — please try again." };
    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn't load the payment page — check your connection and try again." };
  }
}
