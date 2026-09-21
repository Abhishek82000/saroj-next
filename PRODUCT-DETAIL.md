# Product detail — Laravel API ⇄ Next.js

The Blade template decides a lot in PHP: which price column to read, how the
length dropdown steps, whether the cart is a login gate, whether GST is extra.
All of that now happens in **one place** — the API controller — and ships as
plain data. React never re-derives a business rule.

## Backend

| File | What to do |
|---|---|
| `app/Http/Controllers/Api/ProductApiDetailController.php` | Replace the existing one |
| `routes/api.php` | Add the four routes from `routes-api.php` |

### Endpoints

```
GET  /api/products/{slug}              retail detail
GET  /api/wholesale/products/{slug}    wholesale detail
POST /api/products/{id}/variation      price + image + stock for a combination
GET  /api/products/cards?ids=1,2,3     rail cards, for "recently viewed"
```

### What changed from the version you sent

The old controller returned names and images but none of the numbers the page
actually needs. It now returns:

- **`price`** — mrp, selling, discount, `gst_extra`. Picks the wholesale
  columns in wholesale mode and falls back to the variation price exactly as
  the Blade's `??` chain does. The `100 - (selling * 100) / mrp` division is
  guarded; a zero MRP on a draft row currently throws in the template.
- **`cut`** — `{ mode, min, max, step, unit }` where mode is `length`,
  `quantity` or `enquiry`, straight off `product_style_type` 1 / 4 / other.
  `min` respects `product_wh_min_qty` and the "raise the floor when lgap > 1"
  rule; `step` is `product_lgap`.
- **`variants`** — every attribute group with its terms resolved and the
  default picked, so the client needs no second call per attribute.
- **`reviews`** — average, the five-bar breakdown and the written reviews.
- **`promo`**, **`coupons`**, **`faqs`**, **`related`**, **`category_rails`**,
  **`in_carts`**, **`label`**, **`tabs`**, **`wholesale`** cross-link info.

Two things I kept for parity but would move:

1. `reviewSummary()` writes `product_rating` and `product_review` on every
   page view. A GET shouldn't write — this belongs in a queued job.
2. `recently_viewed` still reads the session. The Next app no longer uses it
   (see below); it's there for the Blade side.

## Frontend

| File | Status |
|---|---|
| `lib/product-api.ts` | new — fetch + mapping |
| `lib/product-page.ts` | new — shared `resolveProduct` and metadata |
| `lib/types.ts` | extended with the live shapes |
| `app/product/[slug]/page.tsx` | rewritten |
| `app/wholesale/product/[slug]/page.tsx` | new |
| `components/product/ProductView.tsx` | new — shared body |
| `components/product/BuyBox.tsx` | rewritten |
| `components/product/VariantPicker.tsx` | new |
| `components/product/Reviews.tsx` | new |
| `components/product/Countdown.tsx` | new |
| `components/product/LiveViewers.tsx` | new |
| `components/product/RecentlyViewed.tsx` | new |
| `components/product/Tabs.tsx` | rewritten |
| `components/product/CutPicker.tsx` | wholesale nudge gated |
| `styles/product.css` | additions |

The UI is unchanged — same gallery, same metre picker with its slider and
garment chips, same tabs, same sticky bar. Only the data behind it moved.

### Environment

```
API_URL=https://www.sarojtextile.com
NEXT_PUBLIC_LOGIN_URL=https://www.sarojtextile.com/login
```

`API_URL` is the only one needed for data. Browser calls (the variant picker,
the recently-viewed rail) go to **this app's own origin** and are forwarded by
the rewrites in `next.config.ts`. That means **no CORS config on Laravel**, and
the API host never reaches the client bundle.

### Rendering

- `/product/[slug]` — the static catalogue is prerendered; live products render
  on demand and cache for five minutes.
- `/wholesale/product/[slug]` — always dynamic and `noindex`, so trade pricing
  doesn't compete with the retail page in search.
- Recently viewed is client-side. It has to be: a per-person rail can't live in
  a statically cached page. The ids are in `localStorage` and the cards come
  from `/api/products/cards` on mount.

### Behaviour by style type

| `product_style_type` | Buy box |
|---|---|
| 1 | Length picker — stepper, slider and garment chips, stepping by `product_lgap` |
| 4 | No cart. WhatsApp enquiry button with the product name and URL prefilled |
| anything else | Quantity stepper, clamped to stock |

Variable products (`product_type` 1) get the picker above whichever of those
applies; changing a swatch re-fetches price, image and stock rather than
trusting anything cached in the page.

### Two bugs found on the way

1. **`.st-step` was claimed by two components.** The home page's "Making"
   process cards and the product quantity stepper both used it, and the card's
   `flex-direction: column` was leaking in and stacking the −/+ buttons
   vertically. The stepper is now `.st-qty-step`. Worth grepping for other
   collisions.
2. **Client fetches can't read `API_URL`.** Only `NEXT_PUBLIC_*` exists in the
   browser, so the variant picker was silently calling the wrong origin. Hence
   the proxy rewrite.

## Still to wire

- **Add to cart** posts nowhere. The cart is client-side; point it at your cart
  route and the wholesale `addCart(1)` path.
- **Review submission** validates and closes. Needs
  `frontend.products.reviewProccess` as a JSON endpoint, including the image
  upload.
- **Wishlist** is local only. `addtofav` needs an API equivalent.
- **Sign-in gate** links to `NEXT_PUBLIC_LOGIN_URL`. If Next and Laravel don't
  share a session, `requires_login` will always be true — that needs Sanctum
  stateful cookies or a token handed to the Next app.
