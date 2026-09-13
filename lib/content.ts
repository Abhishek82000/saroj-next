/**
 * Copy that isn't a product: wash care, the questions people ask,
 * the metre guide and the running offers. Kept out of the components so
 * a merchandiser can edit it without touching JSX.
 */

export const washCare: [string, string][] = [
  ["Wash in cool water", "Cool or warm only. Hot water shrinks the cotton and lets the dye run."],
  ["Use a mild detergent", "Skip fabric softener — it dulls the finish on a block print."],
  ["Turn it inside out", "Protects the printed face from agitation in the drum."],
  ["Soak briefly", "Five minutes in cold water with a little mild detergent is plenty."],
  ["Rinse thoroughly", "A few changes of cold water until no detergent is left."],
  ["Dry in the shade", "Hang it out of the sun, or in the evening, so the colour holds."],
  ["Iron lightly", "With or without steam. Don’t press directly onto the block print."],
  ["Wash strong colours separately", "Especially the first time, and especially the deep grounds."],
];

export const photoNotes = [
  "All photographs are shot to look as close as possible to the fabric you’ll receive, but there may be marginal colour variation from the actual product.",
  "We use an all-over print on most of our fabric, so the position of the artwork may differ from what you see in the picture.",
  "A camera or a monitor can’t always match what the eye sees. A slight difference in colour is unavoidable.",
];

export const faq: [string, string][] = [
  ["What is the estimated delivery time?", "5–7 working days within India. International orders take 10–15 working days."],
  ["Is shipping chargeable?", "Shipping is free on orders above ₹2,000. Below that a flat charge applies at checkout."],
  ["Where is my order?", "You can track it with the tracking number in your order details."],
  ["What happens after I place the order?", "You get a confirmation by call, email or SMS, then we cut, pack and ship it."],
  ["Can I cancel, and what about a refund?", "Yes. Card, net banking or wallet payments are refunded to the source account within 10–15 working days of cancellation. COD orders have nothing to refund."],
  ["Is it safe to use my credit or debit card?", "All card payments go through secure, trusted payment gateways."],
  ["Who bears the customs charges?", "On international orders, customs and any additional charges are borne by the customer."],
  ["Do I need an account to order?", "No, you can check out as a guest. An account just saves you re-entering everything next time."],
];

/** From Saroj Textile's own size guide: how much cloth a garment takes at 42 inches wide. */
export interface Make { name: string; lo: number; hi: number }

export const makes: Make[] = [
  { name: "Blouse", lo: 1, hi: 1 },
  { name: "Tube top", lo: 1, hi: 1 },
  { name: "Tunic / top", lo: 1.5, hi: 2 },
  { name: "Scarf", lo: 2, hi: 2 },
  { name: "Crop top", lo: 2, hi: 2 },
  { name: "Short kurta", lo: 2, hi: 2.5 },
  { name: "Trouser", lo: 2, hi: 3 },
  { name: "Salwar", lo: 2.5, hi: 2.5 },
  { name: "Churidar", lo: 2.5, hi: 2.5 },
  { name: "Petticoat", lo: 2.5, hi: 2.5 },
  { name: "Dupatta", lo: 2.5, hi: 2.5 },
  { name: "Stole", lo: 2.5, hi: 2.5 },
  { name: "Kurta", lo: 2.5, hi: 3 },
  { name: "Palazzo", lo: 2.5, hi: 3 },
  { name: "Jumpsuit", lo: 3, hi: 3 },
  { name: "Mini dress", lo: 3, hi: 3 },
  { name: "A-line skirt", lo: 3, hi: 3.5 },
  { name: "Midi dress", lo: 4, hi: 4 },
  { name: "Salwar (full)", lo: 4.5, hi: 5 },
  { name: "Maxi dress", lo: 5, hi: 5 },
  { name: "Saree", lo: 5.5, hi: 5.5 },
];

/** The five offered as one-tap chips next to the length picker. */
export const quickMakes = ["Blouse", "Tunic / top", "Kurta", "A-line skirt", "Saree"];

export const coupons = [
  { code: "FIRST10", title: "10% off your first order", till: "30 Nov 2026" },
  { code: "ABOVE4K", title: "10% off over ₹4,000", till: "26 Nov 2026" },
];
