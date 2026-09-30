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
 *   user             logged in → null, the server takes the buyer from the
 *                    token (the browser holds no user id); guest → the
 *                    contact + billing fields from the form
 *   shipping_address the delivery address (always)
 *   coupon_id / coupon_code / coupon_discount   the applied coupon, retail only
 *   total_discount   MRP discount + offers + coupon
 *   shipping_amount
 *   final_amount     what the page showed as payable
 *
 * The amounts are what the page showed — the server must price the products
 * and re-check the coupon itself and bill its own figures.
 *
 * On 2026-09-30 the route isn't deployed yet (404), so the response shape is
 * unseen: an order id / number is read from whichever key carries one, and a
 * payment URL (PhonePe), if the response has one, is followed.
 */
export interface PayNowPayload {
  type: "retail" | "wholesale";
  products: { product_id: number; variation_id: number | null; qty: number; price: number; line_total: number; name: string }[];
  user: { mobile: string; first_name: string; last_name: string; email: string } | null;
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
    wholesale: boolean; loggedIn: boolean;
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
    user: o.loggedIn ? null : {
      mobile: f.mobile.trim(), first_name: f.firstName.trim(), last_name: f.lastName.trim(), email: f.email.trim(),
    },
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
  | { ok: true; orderId: string | null; redirectUrl: string | null; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/** POST /api/cart/paynow. */
export async function placeOrder(payload: PayNowPayload, token?: string): Promise<PlaceOrderResult> {
  try {
    const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch("/api/cart/paynow", { method: "POST", headers, body: JSON.stringify(payload), credentials: "same-origin" });
    const json = (await res.json().catch(() => ({}))) as { status?: string; message?: string; errors?: Record<string, string[]> };
    if (res.status === 404) return { ok: false, message: "Ordering isn't switched on yet — /api/cart/paynow isn't live on the server." };
    if (!res.ok || json.status === "error") {
      const first = json.errors ? Object.values(json.errors)[0]?.[0] : undefined;
      return { ok: false, message: first ?? json.message ?? "Couldn't place the order — please try again.", fieldErrors: json.errors };
    }
    const id = findScalar(json, /^(order_no|order_number|order_id|orderid|id)$/i);
    return {
      ok: true,
      orderId: id,
      redirectUrl: findString(json, /redirect|payment_url|pay_url|checkout_url/i) ?? null,
      message: json.message ?? "Order placed",
    };
  } catch {
    return { ok: false, message: "Couldn't reach the server — check your connection and try again." };
  }
}

/** Like findString, but a number counts too (an order id is often numeric). */
function findScalar(root: unknown, re: RegExp): string | null {
  let level: unknown[] = [root];
  for (let depth = 0; depth < 4 && level.length; depth++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (!node || typeof node !== "object" || Array.isArray(node)) continue;
      for (const [k, v] of Object.entries(node)) {
        if ((typeof v === "string" || typeof v === "number") && String(v).trim() && re.test(k)) return String(v);
        if (v && typeof v === "object") next.push(v);
      }
    }
    level = next;
  }
  return null;
}
