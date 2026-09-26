import type { CartLine } from "./types";
import { isValidEmail, isValidMobile } from "./auth";

/**
 * Checkout — the form the checkout page collects, and the call that turns it
 * into an order. Retail is open to guests (the form is how we know who they
 * are); wholesale is for logged-in accounts only.
 *
 * NOT CONNECTED YET: `placeOrder` is a stand-in until the order/payment API
 * is shared. When it is, send `form` + `lines` there (with the Bearer token
 * for a logged-in visitor) and hand back the order id / payment redirect.
 */

export type PaymentMethod = "online" | "cod" | "bank";

export interface CheckoutForm {
  name: string;
  mobile: string;
  email: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  /** Wholesale only — both optional. */
  business: string;
  gstin: string;
  payment: PaymentMethod;
}

export const emptyCheckout = (payment: PaymentMethod): CheckoutForm => ({
  name: "", mobile: "", email: "", address: "", landmark: "", city: "", state: "", pincode: "",
  notes: "", business: "", gstin: "", payment,
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
  if (!f.name.trim()) e.name = "Add your full name.";
  if (!isValidMobile(f.mobile.trim())) e.mobile = "Enter a 10-digit mobile number.";
  if (f.email.trim() && !isValidEmail(f.email.trim())) e.email = "Enter a valid email address.";
  if (!f.address.trim()) e.address = "Add the delivery address.";
  if (!f.city.trim()) e.city = "Add the city.";
  if (!f.state) e.state = "Pick the state.";
  if (!/^\d{6}$/.test(f.pincode.trim())) e.pincode = "Enter a 6-digit pincode.";
  if (wholesale && f.gstin.trim() && !GSTIN.test(f.gstin.trim().toUpperCase())) e.gstin = "That GSTIN doesn't look right.";
  return e;
}

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; message: string };

export async function placeOrder(
  _form: CheckoutForm, _lines: CartLine[], _opts: { wholesale: boolean; token?: string },
): Promise<PlaceOrderResult> {
  return { ok: false, message: "Ordering isn't connected yet — the order API goes in lib/checkout.ts." };
}
