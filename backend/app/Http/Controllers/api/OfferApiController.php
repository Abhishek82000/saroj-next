<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CartService;
use App\Services\OfferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Offers for the Next.js storefront — retail only.
 *
 *   GET  /api/offers          featured live coupons, the running milestone offer
 *                             and the free-shipping threshold (no cart needed)
 *   POST /api/offers/apply    { code, items: [{ product_id, variation_id?, qty }] }
 *                             checks a coupon against the browser's cart. 200 with
 *                             the priced cart + `offers` when it applies; 422 with
 *                             the reason (and the same payload) when it doesn't.
 *
 * Once applied, the browser keeps the code and sends it as `coupon` on every
 * POST /api/cart/price, which re-checks it and returns `offers` alongside the
 * totals. Guests and Bearer tokens both work; a token lets the per-user and
 * first-order rules see who is asking.
 */
class OfferApiController extends Controller
{
    public function __construct(private CartService $cart, private OfferService $offers)
    {
    }

    /** GET /api/offers */
    public function index(): JsonResponse
    {
        return response()->json([
            'status'    => 'success',
            'message'   => 'ok',
            'offers'    => $this->offers->list(),
            'milestone' => $this->offers->milestoneOffer(),
            'shipping'  => $this->offers->shipping(0),
        ]);
    }

    /** POST /api/offers/apply */
    public function apply(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'                 => 'required|string|max:50',
            'items'                => 'present|array|max:100',
            'items.*.product_id'   => 'required|integer',
            'items.*.variation_id' => 'nullable|integer',
            'items.*.qty'          => 'required|numeric|gt:0',
        ]);

        // A Bearer token that's no longer a session is a 401 (as /api/cart/price answers),
        // not the guest's "Log in to apply this coupon." — so the browser knows to log in again.
        $user = $request->user('sanctum');
        if (!$user && $request->bearerToken()) {
            return response()->json(['status' => 'error', 'message' => 'Your session has expired. Please log in again.'], 401);
        }

        $payload = $this->cart->forGuest($data['items'], CartService::RETAIL);
        $payload['offers'] = $this->offers->summary(
            $payload['items'], $payload['totals']['subtotal'], $data['code'], $user,
        );
        $coupon = $payload['offers']['coupon'];

        return response()->json(
            ['status' => $coupon['applied'] ? 'success' : 'error', 'message' => $coupon['message']] + $payload,
            $coupon['applied'] ? 200 : 422,
        );
    }
}
