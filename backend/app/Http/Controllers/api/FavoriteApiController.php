<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArUserFavProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class FavoriteController extends Controller
{
    /** POST /api/favorites/toggle  { product_id } — replaces addtofav (which already toggled despite the name). */
    public function toggle(Request $request): JsonResponse
    {
        $customer = Session::get('AR_USER');
        $productId = $request->product_id;

        if (!$customer || !$productId) {
            return response()->json(['success' => false, 'data' => ['message' => 'failed']], 400);
        }

        $fav = ArUserFavProduct::where('ufp_user_id', $customer->user_id)
            ->where('ufp_product_id', $productId)
            ->first();

        if ($fav) {
            $fav->delete();
            $notification = '';
        } else {
            ArUserFavProduct::create([
                'ufp_user_id'    => $customer->user_id,
                'ufp_product_id' => $productId,
                'ufp_status'     => 1,
            ]);
            $notification = 'favourite';
        }

        return response()->json(['success' => true, 'data' => [
            'message' => 'ok',
            'notification' => $notification,
            'count' => ArUserFavProduct::where('ufp_user_id', $customer->user_id)->count(),
        ]]);
    }

    /** DELETE /api/favorites/{product_id} */
    public function remove(Request $request, int $productId): JsonResponse
    {
        $customer = Session::get('AR_USER');
        if (!$customer) {
            return response()->json(['success' => false, 'data' => ['message' => 'failed']], 400);
        }

        ArUserFavProduct::where('ufp_user_id', $customer->user_id)
            ->where('ufp_product_id', $productId)
            ->delete();

        return response()->json(['success' => true, 'data' => [
            'message' => 'ok',
            'notification' => '',
            'count' => ArUserFavProduct::where('ufp_user_id', $customer->user_id)->count(),
        ]]);
    }

    /**
     * POST /api/favorites/move-from-cart  { product_id, variationid? }
     *
     * NOTE: ported as-is from movetowishlist(), but the original has a
     * pre-existing bug worth flagging: it decrements the guest
     * CART_SESSION quantity unconditionally, then reads
     * Session::get('AR_USER') and writes to ArUserFavProduct keyed by
     * $customer->user_id — i.e. it edits the *guest* cart but favorites
     * the *logged-in* user's list. If a guest (no AR_USER) calls this,
     * $customer->user_id will fatal-error. Confirm whether this endpoint
     * is only ever called for logged-in users with items still sitting in
     * CART_SESSION (e.g. pre-login cart), since as written it doesn't
     * handle a true guest.
     */
    public function moveFromCart(Request $request): JsonResponse
    {
        $customer = Session::get('AR_USER');
        if (!$customer) {
            return response()->json(['success' => false, 'data' => ['message' => 'failed', 'notification' => 'Login required']], 400);
        }

        $key = $request->variationid > 0
            ? $request->product_id . '####' . $request->variationid
            : (string) $request->product_id;

        $cartSession = Session::get('CART_SESSION', []);
        if (isset($cartSession[$key])) {
            $cartSession[$key] -= 1;
            if ($cartSession[$key] <= 0) {
                unset($cartSession[$key]);
            }
            Session::put('CART_SESSION', $cartSession);
        }
        Session::forget('CART_COUPON');

        $exists = ArUserFavProduct::where('ufp_user_id', $customer->user_id)
            ->where('ufp_product_id', $request->product_id)
            ->exists();

        if (!$exists) {
            ArUserFavProduct::create([
                'ufp_user_id'    => $customer->user_id,
                'ufp_product_id' => $request->product_id,
                'ufp_status'     => 1,
            ]);
        }

        return response()->json(['success' => true, 'data' => ['message' => 'ok']]);
    }
}
