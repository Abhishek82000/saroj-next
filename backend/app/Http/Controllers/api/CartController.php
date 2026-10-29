<?php
namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\ArPromos;
use App\Models\ArTransactions;
use App\Models\ArTempTransactions;
use Carbon\Carbon;
use Session;
use DB;

class CartController extends Controller
{
    public function couponList()
    {
        $currDateTime = date("Y-m-d");

        $resCouponsData = ArPromos::where('promo_status', 1)->where('promo_featured', 1)
            ->where('promo_valid_to', '>=', $currDateTime)
            ->get();
            $formattedPromos = [];
        
            foreach ($resCouponsData as $promo) {
                $formattedPromos[] = [
                    'code' => $promo->promo_coupon_code,
                    'summary' => $promo->promo_name,
                    'description' => $promo->promo_description,
                ];
            }
        
            return response()->json([
                'promotions' => $formattedPromos
            ]);
    }

    public function couponApplied(Request $request)
    {
        $code = $request->input('code');
        $orderId = $request->input('order_id');

        if (!$orderId) {
            return response()->json([
                "failure_code" => "INVALID_PROMOTION",
                "failure_reason" => "Order ID is missing."
            ]);
        }

        $tempTransObj = ArTempTransactions::where('temp_trans_order_id', $orderId)->first();

        if (!$tempTransObj) {
            return response()->json([
                "failure_code" => "INVALID_PROMOTION",
                "failure_reason" => "Transaction not found for the given order ID."
            ]);
        }

        $orderAmount = $tempTransObj->temp_trans_amt;

        $promo = ArPromos::where('promo_coupon_code', $code)
            ->where('promo_status', 1)
            ->whereDate('promo_valid_from', '<=', now())
            ->whereDate('promo_valid_to', '>=', now())
            ->first();

        if (!$promo) {
            return response()->json([
                "failure_code" => "INVALID_PROMOTION",
                "failure_reason" => "Invalid or expired coupon."
            ]);
        }
        if ($orderAmount < $promo->promo_minimum_purchase) {
            return response()->json([
                "failure_code" => "REQUIREMENT_NOT_MET",
                "failure_reason" => "Minimum order amount not met for this coupon."
            ]);
        }
        $discount = 0;
        if ($promo->promo_discount_in == 1) { 
            $discount = ($orderAmount * $promo->promo_amount) / 100;
            if ($promo->promo_max_amount) {
                $discount = min($discount, $promo->promo_max_amount);
            }
        } else { 
            $discount = $promo->promo_amount;
        }

        $promotion = [
            "reference_id" => $orderId,
            "type" => "offer",
            "code" => $promo->promo_coupon_code,
            "value" =>  (int) $discount * 100,
            "value_type" => "fixed_amount",
            "description" => $promo->promo_description
        ];
        
        return response()->json([
            'promotion' => $promotion
        ]);
    }

}