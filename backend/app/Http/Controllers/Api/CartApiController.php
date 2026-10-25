<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArPincode;
use App\Models\ArCart;
use App\Services\CartService;
use App\Services\OfferService;
use App\Services\ShippingService;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Cart API for the Next.js storefront. No session state: who is asking comes
 * from the Sanctum Bearer token, and which cart from `type` (retail|wholesale,
 * retail when left out).
 *
 *   Guest or Bearer:
 *     POST   /api/cart/add     { type, product_id, variation_id?, qty, current_qty? }
 *     POST   /api/cart/price   { type, items: [{ product_id, variation_id?, qty }], coupon? }
 *   Bearer only (auth:sanctum):
 *     GET    /api/cart?type=&coupon=
 *     POST   /api/cart/sync    { type, items: [...] }   — merge a browser cart in after login
 *     PATCH  /api/cart/{cartId} { qty }                 — sets the quantity; 0 removes
 *     DELETE /api/cart/{cartId}
 *
 * A guest's retail cart lives in the browser. The API stores nothing for it:
 * `add` checks stock and hands back the priced line for the browser to keep,
 * and `price` re-prices the whole browser cart (to open the drawer, or after
 * a quantity change). Wholesale needs a login, so a guest gets 401 there.
 *
 * `price` and `index` also return `offers` for a retail cart (see
 * OfferService::summary): the milestone progress, free-shipping progress,
 * the coupon sent as `coupon` (applied or why not), the featured coupons and
 * the total after discounts. Wholesale gets `offers: null`.
 *
 * Both also return, for either type (see ShippingService):
 *   items[].shipping_free / weight   per line (product_shipping_free; retail only)
 *   shipping   { amount, weight, free, threshold, ... } — by weight, from ar_shipping_charges
 *   gst        { rate, amount } — 5% of the subtotal for wholesale, 0 for retail
 *   payable    what the order comes to: retail offers.total + shipping;
 *              wholesale subtotal + gst + shipping. Checkout bills this figure.
 *
 * Every response is { status: "success"|"error", message, ... }, with a 4xx
 * status on errors, like the auth/account endpoints.
 */
class CartApiController extends Controller
{
    public function __construct(private CartService $cart, private OfferService $offers, private ShippingService $shipping)
    {
    }

    /** GET /api/cart?type=retail|wholesale&coupon= — the logged-in user's cart. */
    public function index(Request $request): JsonResponse
    {
        $type = $this->type($request);

        return $this->ok($this->withOffers($this->cart->forUser($request->user()->user_id, $type), $request));
    }
    public function getStateCity(Request $request)
{
    $request->validate([
        'value' => 'required|digits:6',
    ]);

    $address = ArPincode::where('Pincode', $request->value)->first();

    if (!$address) {
        return response()->json([
            'status' => false,
            'message' => 'Pincode not found',
            'data' => null
        ], 404);
    }

    return response()->json([
        'status' => true,
        'message' => 'State and city fetched successfully',
        'data' => $address
    ], 200);
}
    /**
     * POST /api/cart/add — adds `qty` of a piece.
     *
     * Logged in: stored in that user's `type` cart, and the whole cart comes
     * back. Guest: nothing is stored; `current_qty` (what the browser's cart
     * already holds of this line) is counted in the stock check, and the
     * priced `line` comes back for the browser to keep.
     */
    public function add(Request $request): JsonResponse
    {
        $type = $this->type($request);
        $data = $request->validate([
            'product_id'   => 'required|integer',
            'variation_id' => 'nullable|integer',
            'qty'          => 'required|numeric|gt:0',
            'current_qty'  => 'nullable|numeric|min:0',
        ]);
        $productId = (int) $data['product_id'];
        $variationId = !empty($data['variation_id']) ? (int) $data['variation_id'] : null;
        $qty = (float) $data['qty'];

        $user = $this->viewer($request);

        if (!$user) {
            if ($type === CartService::WHOLESALE) {
                return $this->error('Please log in to add wholesale products to cart.', 401);
            }

            $line = $this->cart->check($productId, $variationId, (float) ($data['current_qty'] ?? 0) + $qty, $type);
            if ($line['error']) {
                return $this->error($line['error'], 422, ['line' => $line]);
            }

            return $this->ok(['line' => $line], 'Added to cart');
        }

        $row = $this->cart->findRow($user->user_id, $type, $productId, $variationId);
        $line = $this->cart->check($productId, $variationId, (float) ($row->cart_qty ?? 0) + $qty, $type, $row?->cart_id);
        if ($line['error']) {
            return $this->error($line['error'], 422, ['line' => $line]);
        }

        // check() drops a variation a simple product doesn't have, so store what it settled on.
        $row = $this->cart->store($user->user_id, $type, $productId, $line['variation_id'], $line['qty'], $row);
        $line['cart_id'] = (int) $row->cart_id;

        return $this->ok(['line' => $line] + $this->cart->forUser($user->user_id, $type), 'Added to cart');
    }

    /**
     * POST /api/cart/price — prices a guest's browser cart. Lines that can't be
     * bought as they stand come back with an `error` and are left out of the
     * totals; the request itself still succeeds.
     */
    public function price(Request $request): JsonResponse
    {
        $type = $this->type($request);
        $data = $request->validate($this->itemRules());

        if ($type === CartService::WHOLESALE && !$this->viewer($request)) {
            return $this->error('Please log in to see your wholesale cart.', 401);
        }

        return $this->ok($this->withOffers($this->cart->forGuest($data['items'] ?? [], $type), $request));
    }

    /**
     * Adds `offers` (retail only), `shipping`, `gst` and `payable` to a cart
     * payload, and `shipping_free` / `weight` to its lines. A coupon that no
     * longer fits (cart went under its minimum, say) doesn't fail the request;
     * it comes back with `applied: false` and the reason.
     */
    private function withOffers(array $payload, Request $request): array
    {
        $request->validate(['coupon' => 'nullable|string|max:50']);

        $type = $payload['type'];
        $subtotal = (float) $payload['totals']['subtotal'];
        $payload['items'] = $this->shipping->annotate($payload['items'], $type);
        $shipping = $this->shipping->quote($payload['items'], $subtotal, $type);
        $gst = $this->shipping->gst($subtotal, $type);

        $payload['offers'] = $type === CartService::RETAIL
            ? ['shipping' => $shipping] + $this->offers->summary(
                $payload['items'], $subtotal, $request->input('coupon'), $this->viewer($request),
            )
            : null;
        $payload['shipping'] = $shipping;
        $payload['gst'] = $gst;
        $payload['payable'] = round((float) ($payload['offers']['total'] ?? $subtotal) + $gst['amount'] + $shipping['amount'], 2);

        return $payload;
    }

    /**
     * POST /api/cart/sync — after login, merges the cart the browser held
     * while logged out into the account's `type` cart. A line already in the
     * account keeps the larger of the two quantities. Lines that fail the
     * stock check are skipped and listed in `skipped`, so the browser can say
     * why they didn't come across.
     */
    public function sync(Request $request): JsonResponse
    {
        $type = $this->type($request);
        $data = $request->validate($this->itemRules());
        $userId = $request->user()->user_id;
        $skipped = [];

        DB::transaction(function () use ($data, $type, $userId, &$skipped) {
            foreach ($data['items'] ?? [] as $item) {
                $productId = (int) $item['product_id'];
                $variationId = !empty($item['variation_id']) ? (int) $item['variation_id'] : null;

                $row = $this->cart->findRow($userId, $type, $productId, $variationId);
                $qty = max((float) ($row->cart_qty ?? 0), (float) $item['qty']);
                $line = $this->cart->check($productId, $variationId, $qty, $type, $row?->cart_id);

                if ($line['error']) {
                    $skipped[] = $line;
                    continue;
                }
                $this->cart->store($userId, $type, $productId, $line['variation_id'], $line['qty'], $row);
            }
        });

        return $this->ok($this->cart->forUser($userId, $type) + ['skipped' => $skipped], 'Cart synced');
    }

    /** PATCH /api/cart/{cartId} { qty } — sets a line's quantity; 0 or less removes it. */
    public function update(Request $request, int $cartId): JsonResponse
    {
        $data = $request->validate(['qty' => 'required|numeric']);
        $row = $this->ownRow($request, $cartId);
        $type = $row->cart_is_wholesale ? CartService::WHOLESALE : CartService::RETAIL;
        $qty = (float) $data['qty'];

        if ($qty <= 0) {
            $row->delete();

            return $this->ok($this->cart->forUser($row->cart_user_id, $type), 'Removed from cart');
        }

        $item = $this->cart->itemFromRow($row);
        $line = $this->cart->check($item['product_id'], $item['variation_id'], $qty, $type, $item['cart_id']);
        if ($line['error']) {
            return $this->error($line['error'], 422, ['line' => $line]);
        }

        $row->cart_qty = $line['qty'];
        $row->save();

        return $this->ok(['line' => $line] + $this->cart->forUser($row->cart_user_id, $type), 'Cart updated');
    }

    /** DELETE /api/cart/{cartId} */
    public function remove(Request $request, int $cartId): JsonResponse
    {
        $row = $this->ownRow($request, $cartId);
        $type = $row->cart_is_wholesale ? CartService::WHOLESALE : CartService::RETAIL;
        $row->delete();

        return $this->ok($this->cart->forUser($row->cart_user_id, $type), 'Removed from cart');
    }

    /**
     * The Bearer token's user on a route that also takes guests (no
     * auth:sanctum middleware). No token means a guest; a token that doesn't
     * resolve is a 401 rather than a silent fall back to guest, so an expired
     * login doesn't quietly start filling a browser cart instead.
     */
    private function viewer(Request $request)
    {
        $user = $request->user('sanctum');

        if (!$user && $request->bearerToken()) {
            throw new HttpResponseException($this->error('Your session has expired. Please log in again.', 401));
        }

        return $user;
    }

    /** The cart row `cartId`, if it belongs to the logged-in user — otherwise a 404. */
    private function ownRow(Request $request, int $cartId): ArCart
    {
        $row = ArCart::where('cart_id', $cartId)
            ->where('cart_user_id', $request->user()->user_id)
            ->first();

        if (!$row) {
            throw new HttpResponseException($this->error('This item is no longer in your cart.', 404));
        }

        return $row;
    }

    private function type(Request $request): string
    {
        $request->validate(['type' => 'nullable|in:' . implode(',', CartService::TYPES)]);

        return $request->input('type') ?: CartService::RETAIL;
    }

    private function itemRules(): array
    {
        return [
            'items'                => 'present|array|max:100',
            'items.*.product_id'   => 'required|integer',
            'items.*.variation_id' => 'nullable|integer',
            'items.*.qty'          => 'required|numeric|gt:0',
        ];
    }

    private function ok(array $data, string $message = 'ok'): JsonResponse
    {
        return response()->json(['status' => 'success', 'message' => $message] + $data);
    }

    private function error(string $message, int $code, array $data = []): JsonResponse
    {
        return response()->json(['status' => 'error', 'message' => $message] + $data, $code);
    }
}
