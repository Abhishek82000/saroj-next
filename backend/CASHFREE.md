# Checkout — Cashfree API ⇄ Next.js

Retail checks out as a guest or logged in; wholesale needs a login and pays
online or by bank transfer. Both go through one controller.

## Install (Laravel side)

| File here | Where it goes |
|---|---|
| `app/Http/Controllers/Api/CashfreeApiController.php` | same path, new file |
| `routes/api-cashfree.php` | paste the three routes into `routes/api.php`, above any `cart/{id}` routes |
| `config/services-cashfree.php` | add the `cashfree` entry to `config/services.php` |
| `database/migrations/2026_10_02_…_add_checkout_columns_to_transactions.php` | same path, then `php artisan migrate` |

`.env`:

```
CASHFREE_APP_ID=…
CASHFREE_SECRET_KEY=…
CASHFREE_ENV=sandbox            # production when live
CASHFREE_FRONTEND_URL=https://www.sarojtextile.com
```

Then `php artisan config:clear`.

The controller reads the Bearer token through the `sanctum` guard (`GUARD`
at the top of the class) — change it if `/api/auth/me` uses another.

## Endpoints

```
POST /api/cart/paynow                      place the order
GET  /api/cart/payment-status/{order_no}   paid | failed | pending | awaiting_transfer
                                           ?t=<receipt_token> adds the receipt (items, totals,
                                           delivery) for the thank-you page — the token comes back
                                           from paynow and rides on Cashfree's return URL
POST /api/cashfree/webhook                 Cashfree → us (signed), the order's notify_url
```

## Flow

1. **Pay Now** posts the form + cart. The server prices the cart again by
   dispatching `POST /api/cart/price` in-process — same prices, offers and
   coupon as the cart page showed. If its total is more than ₹1 off the
   page's, the order is refused (409) instead of billed differently.
2. Guest: matched to the account on that mobile, or a new account is made
   (so the orders are there at their next login). Logged in: the token is the
   buyer, and the typed address is saved on the account.
3. The order (`trans_status = 0`) and its lines are written.
   - **online** → a Cashfree order is created; the response carries
     `payment_session_id`, and the browser opens Cashfree's checkout with the JS SDK.
   - **bank** (wholesale) → order placed, cart cleared, emails sent; the team
     marks it paid by hand when the transfer lands.
4. Cashfree returns the buyer to `/checkout/status?order_id=…` (or the
   `/wholesale-fabric` twin). That page calls `payment-status`, which **asks
   Cashfree** (`GET /pg/orders/{id}` + `/payments`) — the URL itself proves
   nothing. The webhook does the same for buyers who close the tab.
5. First caller to see `PAID` (with a matching amount) settles the order
   under a row lock: status 1, stock taken off (never below 0), the server
   cart of that kind cleared, emails sent. Exactly once.

## Fixed from the Blade CashFreeController

- The amount came from the browser (`paymentAmount`); now the server prices it.
- Stock used `abs(stock - qty)` — overselling turned stock positive. Variation
  stock was looked up by the product id. Now `GREATEST(stock - qty, 0)` on the
  variation actually sold (`td_variation_id`).
- The order email looked up `trans_id = <order number>`, so it never had an order.
- A guest checking out with a registered mobile had that account's cart wiped
  before paying. The cart is now cleared only once the order is paid or placed.
- API version 2022-01-01 (`payment_link`) → 2023-08-01 (`payment_session_id` + JS SDK).
- **Keys were hard-coded** in the old controller, so they now sit in
  `CashFreeController.php` / `CashFreeApiController.php` on the server and in
  any copy of them. Rotate them in the Cashfree dashboard and keep the new
  ones only in `.env`.

## Not done here

- Shipping is billed as ₹0, as the checkout page shows it ("calculated on
  your address"). If `offers.total` from `/api/cart/price` already includes
  shipping, that's what is charged.
- A failed payment leaves its order at status 2; trying again makes a new order.
