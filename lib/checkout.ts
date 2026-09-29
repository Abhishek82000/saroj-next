import type { CartLine } from "./types";
import { isValidEmail, isValidMobile } from "./auth";
import { getOffers, offerDiscount } from "./offers";

/**
 * Checkout — the form the checkout page collects, and the call that turns it
 * into an order. Retail is open to guests (the form is how we know who they
 * are); wholesale is for logged-in accounts only.
 *
 * Tax and offers differ by mode: retail prices include GST and can take a
 * coupon; wholesale prices exclude GST (added on the invoice) and take no coupon.
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

/** City and state for a pincode (GET /api/pincode/<pin>, backed by India Post). */
export async function lookupPincode(pin: string): Promise<{ ok: true; city: string; state: string } | { ok: false; message: string }> {
  try {
    const res = await fetch(`/api/pincode/${pin}`);
    return await res.json();
  } catch {
    return { ok: false, message: "Couldn't look up the pincode — fill in the city and state." };
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
    coupon?: { code: string; discount: number; promoId?: number } | null;
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
    offer: promo ? { promo_id: promo.promoId ?? null, promo_code: promo.code, promo_discount: promoDiscount } : null,
    shipping_amount: o.shipping,
    total_discount: o.mrpDiscount + promoDiscount,
    subtotal: o.subtotal,
    total: Math.max(0, o.subtotal - promoDiscount + o.shipping),
    gst: o.wholesale ? { gstin: f.gstin.trim().toUpperCase(), business_name: f.business.trim() } : null,
  };
}

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; message: string };

export async function placeOrder(
  _form: CheckoutForm, _lines: CartLine[], _opts: { wholesale: boolean; token?: string },
): Promise<PlaceOrderResult> {
  return { ok: false, message: "Ordering isn't connected yet — the order API goes in lib/checkout.ts." };
}

export type CouponResult =
  | { ok: true; code: string; discount: number; promoId: number; message?: string }
  | { ok: false; message: string };

/**
 * Checks a coupon against the retail subtotal using GET /api/offers (see
 * lib/offers.ts): it must exist, be in date and meet its minimum purchase.
 * First-order-only offers can't be verified here — the order API does that.
 */
export async function applyCoupon(code: string, subtotal: number): Promise<CouponResult> {
  const c = code.trim().toUpperCase();
  if (!c) return { ok: false, message: "Enter a coupon code." };
  const offers = await getOffers();
  const o = offers.find((x) => x.code.toUpperCase() === c);
  if (!o) return { ok: false, message: "That code isn't valid or has expired." };
  if (o.min_purchase && subtotal < o.min_purchase) {
    return { ok: false, message: `${o.code} needs an order of ₹${o.min_purchase} or more.` };
  }
  const discount = offerDiscount(o, subtotal);
  if (discount <= 0) return { ok: false, message: `${o.code} doesn't apply to this cart.` };
  return {
    ok: true, code: o.code, discount, promoId: o.id,
    message: o.first_order ? `${o.code} applied — valid on your first order only` : undefined,
  };
}
