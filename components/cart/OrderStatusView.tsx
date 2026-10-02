"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import ThankYouView from "@/components/cart/ThankYouView";
import { getPaymentStatus, type OrderPaymentStatus } from "@/lib/checkout";

/** Orders whose cart this device has already emptied — so coming back to the page later doesn't wipe a new cart. */
const CLEARED_KEY = "saroj.cleared-orders";
/** A pending payment is asked about this many times, this far apart, before the page stops and offers a button. */
const TRIES = 6;
const GAP = 3000;

function firstClear(order: string): boolean {
  try {
    const done = JSON.parse(window.localStorage.getItem(CLEARED_KEY) ?? "[]") as string[];
    if (done.includes(order)) return false;
    window.localStorage.setItem(CLEARED_KEY, JSON.stringify([...done, order].slice(-20)));
  } catch { /* storage off: clearing twice is harmless enough */ }
  return true;
}

type View =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "order"; order: OrderPaymentStatus; gaveUp: boolean };

/**
 * /checkout/status?order_id=… (and its /wholesale-fabric twin) — where
 * Cashfree sends the buyer back, and where a bank-transfer order lands.
 * The server asks Cashfree before it answers (GET /api/cart/payment-status),
 * so this page is also what settles the order. Paid or placed: the cart
 * empties. Failed: the cart is still there to try again.
 */
export default function OrderStatusView() {
  const params = useSearchParams();
  const orderId = params.get("order_id") ?? "";
  /* The receipt token — on Cashfree's return URL, or added by checkout for a bank transfer. */
  const receiptToken = params.get("t") ?? undefined;
  const { href, clearCart, hydrated } = useStore();
  const [view, setView] = useState<View>({ kind: "loading" });
  const tries = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const check = useCallback(async () => {
    clearTimeout(timer.current);
    const r = await getPaymentStatus(orderId, receiptToken);
    if (!r.ok) {
      setView({ kind: "error", message: r.notFound ? "We couldn't find that order." : r.message });
      return;
    }
    const pending = r.order.state === "pending";
    tries.current += 1;
    const gaveUp = pending && tries.current >= TRIES;
    setView({ kind: "order", order: r.order, gaveUp });
    if (pending && !gaveUp) timer.current = setTimeout(check, GAP);
  }, [orderId, receiptToken]);

  useEffect(() => {
    if (!orderId) { setView({ kind: "error", message: "No order to show." }); return; }
    check();
    return () => clearTimeout(timer.current);
  }, [orderId, check]);

  /* Paid, or placed for bank transfer: the order has the cart now. */
  const order = view.kind === "order" ? view.order : null;
  useEffect(() => {
    if (!hydrated || !order || (order.state !== "paid" && order.state !== "awaiting_transfer")) return;
    if (firstClear(order.orderNumber)) clearCart(order.wholesale ? "wholesale" : "retail");
  }, [hydrated, order, clearCart]);

  const again = () => { tries.current = 0; setView({ kind: "loading" }); check(); };

  /* Paid or placed: the thank-you page takes the whole screen. */
  if (order && (order.state === "paid" || order.state === "awaiting_transfer")) return <ThankYouView order={order} />;

  let body: React.ReactNode;
  if (view.kind === "loading") {
    body = <><Icon name="clock" size={32} strokeWidth={1.3} /><h2>Checking your payment…</h2><p>This takes a few seconds.</p></>;
  } else if (view.kind === "error") {
    body = <><Icon name="help" size={32} strokeWidth={1.3} /><h2>Something's not right</h2><p>{view.message}</p>
      <button type="button" className="st-btn st-btn--solid" onClick={again}>Try again</button></>;
  } else {
    const o = view.order;
    const no = <b>{o.orderNumber}</b>;
    switch (o.state) {
      case "failed":
        body = <><Icon name="close" size={32} strokeWidth={1.3} /><h2>Payment didn&apos;t go through</h2>
          <p>Nothing was charged for order {no}. Your cart is still here — try again, or pick another way to pay.</p>
          <Link href={href("/checkout")} className="st-btn st-btn--solid">Back to checkout</Link></>;
        break;
      default:
        body = view.gaveUp
          ? <><Icon name="clock" size={32} strokeWidth={1.3} /><h2>Still waiting on the bank</h2>
              <p>Order {no} hasn&apos;t been confirmed yet. If money left your account it will be — check again in a minute.</p>
              <button type="button" className="st-btn st-btn--solid" onClick={again}>Check again</button></>
          : <><Icon name="clock" size={32} strokeWidth={1.3} /><h2>Confirming your payment…</h2>
              <p>Waiting for the bank to confirm order {no}. Please don&apos;t close this page.</p></>;
    }
  }

  return (
    <main id="main">
      <div className="st-co__top">
        <div className="st-wrap">
          <ol className="st-co__steps" aria-label="Progress">
            <li className="done">Cart</li>
            <li className="done">Details &amp; payment</li>
            <li className="on" aria-current="step">Confirmation</li>
          </ol>
        </div>
      </div>
      <div className="st-wrap st-co"><div className="st-co__empty" aria-live="polite">{body}</div></div>
    </main>
  );
}
