<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArCategory;
use App\Models\ArUniqueIds;
use App\Models\ArUsers;
use App\Models\ArTransactionDetails;
use App\Models\ArTransactions;
use App\Models\ArThemeAdmin;
use App\Models\ArUserFavProduct;
use App\Models\ArCart;
use App\Models\ArProduct;
use App\Models\OtpVerification;
use App\Mail\sendingEmail;
use App\Services\DelhiveryService;
use App\Models\ArPages;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Hash;
use DB;


class AccountApiController extends Controller
{
    public function orders(Request $request): JsonResponse
    {
        $user = $request->user();

        $orders = ArTransactions::where(
            'trans_user_id',
            $user->user_id
        )
        ->where('trans_payment_status', 1)
        ->orderBy('trans_id', 'DESC')
        ->get();
        $orderStatus = [
                        1 => 'Ready to Ship',
                        4 => 'Delivered',
                        5 => 'Cancelled',
                        6 => 'Shipped',
                    ];
        return response()->json([
            'status' => 'success',
            'orderStatus' => $orderStatus,
            'orders' => $orders,
        ]);
    }
    public function wishlist(Request $request): JsonResponse
    {
        $user = $request->user();

        $productIds = ArUserFavProduct::where(
            'ufp_user_id',
            $user->user_id
        )
        ->pluck('ufp_product_id');

        $products = ArProduct::where(
            'product_status',
            1
        )
        ->whereIn(
            'product_id',
            $productIds
        )
        ->get();

        return response()->json([
            'status' => 'success',
            'products' => $products,
        ]);
    }
    public function toggle(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer',
        ]);

        // Sanctum authenticated user
        $user = $request->user();
        $productId = $request->product_id;
        $isWholesale = $request->is_wholesale;
        $fav = ArUserFavProduct::where('ufp_user_id', $user->user_id)
            ->where('ufp_product_id', $productId)
            ->where('ufp_wholesale', $isWholesale)
            ->first();
        if ($fav) {
            // Already favourite → remove
            $fav->delete();
            $notification = '';
            $action = 'removed';
        } else {
            // Not favourite → add
            $fav = new ArUserFavProduct();
            $fav->ufp_user_id = $user->user_id;
            $fav->ufp_product_id = $productId;
            $fav->ufp_wholesale = $isWholesale;
            // $fav->ufp_status = 1;
            $fav->save();
            $notification = 'favourite';
            $action = 'added';
        }

        $wholesaleCount = ArUserFavProduct::where('ufp_user_id', $user->user_id)
            ->where('ufp_wholesale', 1)
            ->count();
        $retailCount = ArUserFavProduct::where('ufp_user_id', $user->user_id)
            ->where('ufp_wholesale', 0)
            ->count();

        return response()->json([
            'status' => true,
            'message' => 'Wishlist updated successfully',
            'action' => $action,
            'notification' => $notification,
            'retailCount' => $retailCount,
            'wholesaleCount' => $wholesaleCount,
        ], 200);
    }
    /**
     * Remove product from wishlist
     */
    public function remove(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer',
        ]);
        $user = $request->user();
        $isWholesale = $request->is_wholesale;
        $deleted = ArUserFavProduct::where('ufp_user_id', $user->user_id)
            ->where('ufp_product_id', $request->product_id)
            ->where('ufp_wholesale', $isWholesale)
            ->delete();

        $wholesaleCount = ArUserFavProduct::where('ufp_user_id', $user->user_id)
            ->where('ufp_wholesale', 1)
            ->count();
        $retailCount = ArUserFavProduct::where('ufp_user_id', $user->user_id)
            ->where('ufp_wholesale', 0)
            ->count();

        return response()->json([
            'status' => true,
            'message' => $deleted
                ? 'Product removed from wishlist'
                : 'Product was not in wishlist',
            'action' => 'removed',
            'retailCount' => $retailCount,
            'wholesaleCount' => $wholesaleCount,
        ], 200);
    }
    public function orderView(Request $request,string $orderNumber): JsonResponse {

        $user = $request->user();

        $order = ArTransactions::where(
            'trans_order_number',
            $orderNumber
        )
        ->where(
            'trans_user_id',
            $user->user_id
        )
        ->with('items')
        ->first();

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => 'Order not found.',
            ], 404);
        }

        $trackingData = null;

        if (!empty($order->trans_waybill)) {

            $delhivery = app(
                \App\Services\DelhiveryService::class
            );

            $trackingResult = $delhivery->trackShipment(
                $order->trans_waybill
            );

            if ($trackingResult['status']) {
                $trackingData =
                    $trackingResult['shipments'][0] ?? null;
            }
        }

        return response()->json([
            'status' => 'success',
            'order' => $order,
            'tracking' => $trackingData,
        ]);
    }
    
    public function cancelOrder(Request $request,int $orderId): JsonResponse {

        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();

        $order = ArTransactions::where(
            'trans_id',
            $orderId
        )
        ->where(
            'trans_user_id',
            $user->user_id
        )
        ->where(
            'trans_payment_status',
            1
        )
        ->first();

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => 'Order not found.',
            ], 404);
        }

        if (in_array($order->trans_status, [4, 5, 6])) {
            return response()->json([
                'status' => 'error',
                'message' => 'This order cannot be cancelled.',
            ], 422);
        }

        $order->trans_status = 5;
        $order->trans_cancel_reason = $request->reason;
        $order->trans_cancellation_date = now()->toDateString();

        $order->save();

        // Send customer/admin emails here.

        return response()->json([
            'status' => 'success',
            'message' => 'Order cancelled successfully.',
        ]);
    }
    public function countData(Request $request): JsonResponse
    {
        $user = $request->user();
        $wishlistCount = ArUserFavProduct::where(
            'ufp_user_id',
            $user->user_id
        )
        ->count();
        $retailCartCount = ArCart::where(
            'cart_user_id',
            $user->user_id
        )->where('cart_is_wholesale', 0)
        ->count();
        $wholesaleCartCount = ArCart::where(
            'cart_user_id',
            $user->user_id
        )->where('cart_is_wholesale', 1)
        ->count();

        return response()->json([
            'status' => 'success',
            'wishlistCount' => $wishlistCount,
            'retailCartCount' => $retailCartCount,
            'wholesaleCartCount' => $wholesaleCartCount,
        ]);
    }
    private function userResponse(ArUsers $user): array
    {
        return [
            'id' => $user->user_id,
            'name' => $user->user_fname,
            'email' => $user->user_email,
            'mobile' => $user->user_mobile,
            'email_verified' => (bool) $user->user_email_status,
        ];
    }
}
