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
 * NOT CONNECTED YET: `placeOrder` is a stand-in until the order/payment API
 * is shared. When it is, send `form` + `lines` there (with the Bearer token
 * for a logged-in visitor) and hand back the order id / payment redirect.
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
 * The body POST /api/order/place is to receive (spec agreed with the backend,
 * 2026-09-29). Prices are sent for reference only — the server re-prices the
 * items, re-checks the promo and works out shipping itself, and its numbers win.
 * A logged-in buyer is identified by the Bearer token, so `customer` is sent
 * only for a guest; the delivery address is always sent.
 */
export interface OrderPayload {
  type: "retail" | "wholesale";
  items: { product_id: number; variation_id: number | null; qty: number }[];
  customer: { mobile: string; first_name: string; last_name: string; email: string } | null;
  shipping_address: {
    address: string; landmark: string; country: string; pincode: string; state: string; city: string; phone: string;
  };
  notes: string;
  payment_method: PaymentMethod;
  /** Retail only; always null for wholesale. */
  offer: { promo_id: number | null; promo_code: string; promo_discount: number } | null;
  shipping_amount: number;
  total_discount: number;
  subtotal: number;
  total: number;
  /** Wholesale only. */
  gst: { gstin: string; business_name: string } | null;
}

export function buildOrderPayload(
  f: CheckoutForm, lines: CartLine[],
  o: {
    wholesale: boolean; loggedIn: boolean;
    /** The server's applied coupon (POST /api/cart/price → offers.coupon), retail only. */
    coupon?: { code: string; id: number | null; discount: number } | null;
    subtotal: number; mrpDiscount: number; shipping: number;
  },
): OrderPayload {
  const promo = !o.wholesale && o.coupon ? o.coupon : null;
  const promoDiscount = promo?.discount ?? 0;
  return {
    type: o.wholesale ? "wholesale" : "retail",
    items: lines.filter((l) => l.productId).map((l) => ({ product_id: l.productId!, variation_id: l.variationId ?? null, qty: l.qty })),
    customer: o.loggedIn ? null : {
      mobile: f.mobile.trim(), first_name: f.firstName.trim(), last_name: f.lastName.trim(), email: f.email.trim(),
    },
    shipping_address: {
      address: f.address.trim(), landmark: f.landmark.trim(), country: f.country, pincode: f.pincode.trim(),
      state: f.state.trim(), city: f.city.trim(), phone: (f.sameAsContact ? f.mobile : f.deliveryPhone).trim(),
    },
    notes: f.notes.trim(),
    payment_method: f.payment,
    offer: promo ? { promo_id: promo.id, promo_code: promo.code, promo_discount: promoDiscount } : null,
    shipping_amount: o.shipping,
    total_discount: o.mrpDiscount + promoDiscount,
    subtotal: o.subtotal,
    total: Math.max(0, o.subtotal - promoDiscount + o.shipping),
    gst: o.wholesale ? { gstin: f.gstin.trim().toUpperCase(), business_name: f.business.trim() } : null,
  };
}

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; message: string };

/** `coupon` is the applied code (retail only). Send the code, never a discount:
    the order API re-runs OfferService::summary() on the lines and bills that. */
export async function placeOrder(
  _form: CheckoutForm, _lines: CartLine[], _opts: { wholesale: boolean; token?: string; coupon?: string | null },
): Promise<PlaceOrderResult> {
  return { ok: false, message: "Ordering isn't connected yet — the order API goes in lib/checkout.ts." };
}
