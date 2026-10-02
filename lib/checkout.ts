import type { CartLine } from "./types";
import { isValidEmail, isValidMobile } from "./auth";
import { site } from "./site";

/**
 * Checkout — the form the checkout page collects, and the call that turns it
 * into an order. Retail is open to guests (the form is how we know who they
 * are); wholesale is for logged-in accounts only.
 *
 * Tax and offers differ by mode: retail prices include GST and can take a
 * coupon; wholesale prices exclude GST (added on the invoice) and take no coupon.
 * Coupons and offers are worked out on the server (lib/offers.ts).
 *
 * "Pay Now" posts to /api/cart/paynow — see `buildPayNowPayload` / `placeOrder` below.
 */

/** No cash on delivery — retail pays online; wholesale online or by bank transfer. */
export type PaymentMethod = "online" | "bank";

/**
 * Laid out like the storefront's own checkout: a contact mobile, billing
 * name + email, and a delivery address whose state and city fill in from the
 * pincode, with its own delivery phone ("same as above" copies the contact one).
 */
export interface CheckoutForm {
  /** Contact — the order's mobile (OTP / updates). */
  mobile: string;
  /** Billing details. */
  firstName: string;
  lastName: string;
  email: string;
  /** Delivery details. */
  address: string;
  landmark: string;
  country: string;
  pincode: string;
  state: string;
  city: string;
  deliveryPhone: string;
  /** "Same as above": the delivery phone is the contact mobile. */
  sameAsContact: boolean;
  notes: string;
  /** Retail only — an applied coupon code. */
  coupon: string;
  /** Wholesale only — both optional. */
  business: string;
  gstin: string;
  payment: PaymentMethod;
}

export const emptyCheckout = (payment: PaymentMethod): CheckoutForm => ({
  mobile: "", firstName: "", lastName: "", email: "",
  address: "", landmark: "", country: "India", pincode: "", state: "", city: "",
  deliveryPhone: "", sameAsContact: true, notes: "", coupon: "", business: "", gstin: "", payment,
});

export const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Field → message for everything wrong with the form; empty when it's good to go. */
export function validateCheckout(f: CheckoutForm, wholesale: boolean): Partial<Record<keyof CheckoutForm, string>> {
  const e: Partial<Record<keyof CheckoutForm, string>> = {};
  if (!isValidMobile(f.mobile.trim())) e.mobile = "Enter a 10-digit mobile number.";
  if (!f.firstName.trim()) e.firstName = "Add your first name.";
  if (f.email.trim() && !isValidEmail(f.email.trim())) e.email = "Enter a valid email address.";
  if (!f.address.trim()) e.address = "Add the delivery address.";
  if (!/^[1-9]\d{5}$/.test(f.pincode.trim())) e.pincode = "Enter a 6-digit pincode.";
  if (!f.state.trim()) e.state = "Add the state.";
  if (!f.city.trim()) e.city = "Add the city.";
  if (!f.sameAsContact && !isValidMobile(f.deliveryPhone.trim())) e.deliveryPhone = "Enter a 10-digit phone for delivery.";
  if (wholesale && f.gstin.trim() && !GSTIN.test(f.gstin.trim().toUpperCase())) e.gstin = "That GSTIN doesn't look right.";
  return e;
}

/** First non-empty string under a key matching `re`, breadth-first a few levels down. */
function findString(root: unknown, re: RegExp): string | undefined {
  let level: unknown[] = [root];
  for (let depth = 0; depth < 4 && level.length; depth++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (Array.isArray(node)) { next.push(...node); continue; }
      if (!node || typeof node !== "object") continue;
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === "string" && v.trim() && re.test(k)) return v.trim();
        if (v && typeof v === "object") next.push(v);
      }
    }
    level = next;
  }
  return undefined;
}

export type PincodeResult = { ok: true; city: string; state: string } | { ok: false; notFound: boolean; message: string };

/**
 * City and state for a pincode, for the checkout's delivery address:
 *
 *   POST /api/get-state-city   { value: "<pincode>" }   (the storefront's own)
 *
 * Its response hasn't been seen yet — on 2026-09-29 it 500s ("Class
 * App\Http\Controllers\Api\ArPincode not found", CartApiController.php:60)
 * — so state and city are read from whichever keys say so. While it's
 * broken (any 5xx / network error), GET /api/pincode/<pin> — our India Post
 * lookup (app/api/pincode) — stands in. `notFound` means the pincode really
 * has no match, so the form should let the visitor type city and state.
 */
export async function lookupPincode(pin: string): Promise<PincodeResult> {
  try {
    const res = await fetch(`${site.url}/api/get-state-city`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ value: pin }),
    });
    if (res.status < 500) {
      const json = await res.json().catch(() => ({}));
      const state = findString(json, /state/i);
      const city = findString(json, /city|district/i);
      if (res.ok && state && city) return { ok: true, city, state };
      return { ok: false, notFound: true, message: "We couldn't find that pincode — type the city and state." };
    }
  } catch { /* fall through to the stand-in */ }
  try {
    const res = await fetch(`/api/pincode/${pin}`);
    const r = (await res.json()) as { ok: boolean; city?: string; state?: string; message?: string };
    if (r.ok && r.city && r.state) return { ok: true, city: r.city, state: r.state };
    return { ok: false, notFound: res.status === 404, message: "We couldn't find that pincode — type the city and state." };
  } catch {
    return { ok: false, notFound: false, message: "Couldn't look up the pincode — type the city and state." };
  }
}

/**
 * What "Pay Now" sends — POST /api/cart/paynow (through the /api/cart rewrite,
 * with the Bearer token when logged in):
 *
 *   products         what's being bought: product_id, variation_id, qty, and
 *                    the price shown (reference only)
 *   user             the contact + billing fields from the form. A guest is
 *                    matched (or registered) by this mobile; logged in, the
 *                    buyer is the token and these only name the bill
 *   shipping_address the delivery address (always)
 *   coupon_id / coupon_code / coupon_discount   the applied coupon, retail only
 *   total_discount   MRP discount + offers + coupon
 *   shipping_amount
 *   final_amount     what the page showed as payable
 *
 * The amounts are what the page showed — the server prices the cart again
 * (POST /api/cart/price) and refuses with 409 if its total has moved more
 * than ₹1, rather than billing a different figure.
 *
 * Answers (CashfreeApiController, backend/ in this repo):
 *   200 { order_number, amount, payment: { gateway: "cashfree", mode, payment_session_id } | null }
 *       — `payment` is null for a wholesale bank transfer
 *   401 wholesale without a login · 409 total moved · 422 form / stock · 502 Cashfree refused
 */
export interface PayNowPayload {
  type: "retail" | "wholesale";
  products: { product_id: number; variation_id: number | null; qty: number; price: number; line_total: number; name: string }[];
  user: { mobile: string; first_name: string; last_name: string; email: string };
  shipping_address: {
    address: string; landmark: string; country: string; pincode: string; state: string; city: string; phone: string;
  };
  notes: string;
  payment_method: PaymentMethod;
  coupon_id: number | null;
  coupon_code: string | null;
  coupon_discount: number;
  total_discount: number;
  shipping_amount: number;
  subtotal: number;
  final_amount: number;
  /** Wholesale only. */
  gst: { gstin: string; business_name: string } | null;
}

export function buildPayNowPayload(
  f: CheckoutForm, lines: CartLine[],
  o: {
    wholesale: boolean;
    /** The server's applied coupon (POST /api/cart/price → offers.coupon), retail only. */
    coupon?: { code: string; id: number | null; discount: number } | null;
    subtotal: number;
    /** Everything taken off: MRP discount + offers + coupon. */
    totalDiscount: number;
    shipping: number;
    finalAmount: number;
  },
): PayNowPayload {
  const coupon = !o.wholesale && o.coupon ? o.coupon : null;
  return {
    type: o.wholesale ? "wholesale" : "retail",
    products: lines.filter((l) => l.productId).map((l) => ({
      product_id: l.productId!, variation_id: l.variationId ?? null, qty: l.qty,
      price: l.price, line_total: Math.round(l.price * l.qty * 100) / 100, name: l.name,
    })),
    user: { mobile: f.mobile.trim(), first_name: f.firstName.trim(), last_name: f.lastName.trim(), email: f.email.trim() },
    shipping_address: {
      address: f.address.trim(), landmark: f.landmark.trim(), country: f.country, pincode: f.pincode.trim(),
      state: f.state.trim(), city: f.city.trim(), phone: (f.sameAsContact ? f.mobile : f.deliveryPhone).trim(),
    },
    notes: f.notes.trim(),
    payment_method: f.payment,
    coupon_id: coupon?.id ?? null,
    coupon_code: coupon?.code ?? null,
    coupon_discount: coupon?.discount ?? 0,
    total_discount: o.totalDiscount,
    shipping_amount: o.shipping,
    subtotal: o.subtotal,
    final_amount: o.finalAmount,
    gst: o.wholesale ? { gstin: f.gstin.trim().toUpperCase(), business_name: f.business.trim() } : null,
  };
}

export type PlaceOrderResult =
  | {
      ok: true; orderId: string; message: string;
      /** The thank-you page's key to the order's details (GET payment-status ?t=). */
      receiptToken: string;
      /** Online: open Cashfree with this. Null for a bank transfer — the order is placed already. */
      payment: { sessionId: string; mode: "sandbox" | "production" } | null;
    }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

interface PayNowResponse {
  status?: string;
  message?: string;
  errors?: Record<string, string[]>;
  order_number?: string;
  receipt_token?: string;
  payment?: { gateway: string; mode: "sandbox" | "production"; payment_session_id: string } | null;
}

/** POST /api/cart/paynow. */
export async function placeOrder(payload: PayNowPayload, token?: string): Promise<PlaceOrderResult> {
  try {
    const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${site.url}/api/cart/paynow`, { method: "POST", headers, body: JSON.stringify(payload) });
    const json = (await res.json().catch(() => ({}))) as PayNowResponse;
    if (res.status === 401 && payload.type === "wholesale") return { ok: false, message: "Log in again to place a wholesale order." };
    if (!res.ok || json.status === "error" || !json.order_number) {
      const first = json.errors ? Object.values(json.errors)[0]?.[0] : undefined;
      return { ok: false, message: first ?? json.message ?? "Couldn't place the order — please try again.", fieldErrors: json.errors };
    }
    return {
      ok: true,
      orderId: json.order_number,
      receiptToken: json.receipt_token ?? "",
      payment: json.payment?.payment_session_id ? { sessionId: json.payment.payment_session_id, mode: json.payment.mode } : null,
      message: json.message ?? "Order placed",
    };
  } catch {
    return { ok: false, message: "Couldn't reach the server — check your connection and try again." };
  }
}

/* ---------- after the order: the status / thank-you page ---------- */

/** The cart as it was ordered, kept on this device so the thank-you page has the
    product photos (the order's own images are catalogue filenames). */
export interface OrderSnapshotLine { name: string; image: string; qty: number; unit: string; price: number }
const SNAPSHOT_KEY = "saroj.order-snapshots";

export function saveOrderSnapshot(orderNumber: string, lines: CartLine[]) {
  try {
    const all = JSON.parse(window.localStorage.getItem(SNAPSHOT_KEY) ?? "{}") as Record<string, OrderSnapshotLine[]>;
    const keep = Object.fromEntries(Object.entries(all).slice(-4));
    keep[orderNumber] = lines.map((l) => ({ name: l.name, image: l.image, qty: l.qty, unit: l.unit, price: l.price }));
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(keep));
  } catch { /* storage off: the page falls back to the server's items */ }
}

export function readOrderSnapshot(orderNumber: string): OrderSnapshotLine[] | null {
  try {
    return (JSON.parse(window.localStorage.getItem(SNAPSHOT_KEY) ?? "{}") as Record<string, OrderSnapshotLine[]>)[orderNumber] ?? null;
  } catch { return null; }
}

export type PaymentState = "paid" | "failed" | "pending" | "awaiting_transfer";

export interface ReceiptItem { name: string; image: string | null; variant: string | null; qty: number; mrp: number; price: number; total: number }

/** The order's details — only for whoever placed it (the receipt token). */
export interface OrderReceipt {
  placedAt: string;
  name: string;
  email: string | null;
  mobile: string;
  deliveryAddress: string;
  deliveryPhone: string;
  city: string;
  state: string;
  pincode: string;
  /** "upi", "credit_card", "net_banking", "bank_transfer", … */
  paymentMethod: string;
  paymentRef: string | null;
  discount: number;
  couponCode: string | null;
  couponDiscount: number;
  shipping: number;
  gstin: string | null;
  items: ReceiptItem[];
}

export interface OrderPaymentStatus {
  orderNumber: string;
  state: PaymentState;
  amount: number;
  wholesale: boolean;
  receipt: OrderReceipt | null;
}

interface RawReceipt {
  placed_at: string; name: string; email: string | null; mobile: string; delivery_address: string; delivery_phone: string;
  city: string; state: string; pincode: string; payment_method: string; payment_ref: string | null; discount: number;
  coupon_code: string | null; coupon_discount: number; shipping: number; gstin: string | null; items: ReceiptItem[];
}

const receiptFrom = (r: RawReceipt): OrderReceipt => ({
  placedAt: r.placed_at, name: r.name, email: r.email, mobile: r.mobile,
  deliveryAddress: r.delivery_address, deliveryPhone: r.delivery_phone, city: r.city, state: r.state, pincode: r.pincode,
  paymentMethod: r.payment_method, paymentRef: r.payment_ref,
  discount: Number(r.discount) || 0, couponCode: r.coupon_code, couponDiscount: Number(r.coupon_discount) || 0,
  shipping: Number(r.shipping) || 0, gstin: r.gstin,
  items: (r.items ?? []).map((i) => ({ ...i, qty: Number(i.qty) || 0, mrp: Number(i.mrp) || 0, price: Number(i.price) || 0, total: Number(i.total) || 0 })),
});

/**
 * GET /api/cart/payment-status/<order no>[?t=<receipt token>] — where the
 * return page stands. The server asks Cashfree before answering, so this also
 * settles the order. With the token, a paid / placed order brings its receipt.
 */
export async function getPaymentStatus(orderNumber: string, receiptToken?: string): Promise<{ ok: true; order: OrderPaymentStatus } | { ok: false; notFound: boolean; message: string }> {
  try {
    const qs = receiptToken ? `?t=${encodeURIComponent(receiptToken)}` : "";
    const res = await fetch(`${site.url}/api/cart/payment-status/${encodeURIComponent(orderNumber)}${qs}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as {
      message?: string;
      order?: { order_number: string; payment_status: PaymentState; amount: number; is_wholesale: boolean; receipt?: RawReceipt | null };
    };
    if (!res.ok || !json.order) {
      return { ok: false, notFound: res.status === 404, message: json.message ?? "Couldn't check the payment — please try again." };
    }
    const o = json.order;
    return {
      ok: true,
      order: {
        orderNumber: o.order_number, state: o.payment_status, amount: Number(o.amount) || 0, wholesale: !!o.is_wholesale,
        receipt: o.receipt ? receiptFrom(o.receipt) : null,
      },
    };
  } catch {
    return { ok: false, notFound: false, message: "Couldn't reach the server — check your connection." };
  }
}
