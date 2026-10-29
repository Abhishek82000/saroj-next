<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArCategory;
use App\Models\ArUniqueIds;
use App\Models\ArUserFavProduct;
use App\Models\ArProduct;
use App\Models\ArProductVariation;
use App\Models\ArUserAddress;
use App\Models\ArPromos;
use App\Models\ArTransactions;
use App\Models\ArShippingRate;
use App\Models\ArShippingPincode;
use App\Models\ArUsers;
use App\Models\ArThemeAdmin;
use App\Models\ArZoneCity;
use App\Models\ArShippingRateAmount;
use App\Models\ArShippingRateWeight;
use App\Models\ArTempTransactions;
use App\Models\ArTransactionDetails;
use App\Models\ArCountries;
use App\Models\ArPincode;
use App\Models\ArShippingAgency;
use App\Models\ArCart;
use App\Traits\ShiprocketTrait;
use App\Mail\sendingEmail;
use DB;
use Hash;
use Session;

class CashFreeController extends Controller
{
    public function createdCashFreeOrderId(Request $request) 
    {
        $checkoutData = $request->all();
        $userSession = Session::get('AR_USER');

        // ✅ Step 1: Get or Create User
        if (!$userSession) {
            $existingUser = ArUsers::where('user_mobile', $request->user_mobile)->first();

            if ($existingUser) {
                $user = $existingUser;
                if($request->trans_is_wholesale == 1){
                    ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $user->user_id)->delete();
                }else{
                    ArCart::where('cart_is_wholesale',0)->where('cart_user_id', $user->user_id)->delete();
                }
            } else {
                $user = new ArUsers;
                $user->user_fname         = $request->user_fname;
                $user->user_lname         = $request->user_lname ?? '';
                $user->user_email         = $request->user_email;
                $user->user_mobile        = $request->user_mobile;
                $user->user_delivery_mobile = $request->user_delivery_mobile ?? null;
                $user->user_address       = $request->user_address ?? '';
                $user->user_city_name     = $request->user_city_name ?? '';
                $user->user_state_name    = $request->user_state_name ?? '';
                $user->user_country_name  = $request->user_country_name ?? '';
                $user->user_pincode       = $request->user_pincode ?? '';
                $user->user_landmark      = $request->user_landmark ?? '';
                $user->user_gstin      = $request->user_gstin ?? '';
                $user->user_status      = 1;
                $user->user_profile_status      = 1;
                $user->user_unique_id     = self::getUniqueId(7);
                $user->save();
                self::saveLoginCart($user->user_id);
            }
            $userId = $user->user_id;
        } else {
            $userId = $userSession->user_id;
            $user = ArUsers::find($userId);
        }

        // ✅ Step 2: Create Main Order (Pending)
        $orderId = self::getUniqueId(3);
        $resCartInfo = [];
        $resCouponInfo = Session::get('CART_COUPON');

        $aryMainTransaction = new ArTransactions;
        $aryMainTransaction->trans_datetime = date('Y-m-d H:i:s');
        $aryMainTransaction->trans_order_number = $orderId;
        $aryMainTransaction->trans_amt = number_format($request->paymentAmount,2,'.','');
        $aryMainTransaction->trans_currency = "₹";
        $aryMainTransaction->trans_method = $request->paymentMethod;
        $aryMainTransaction->trans_gstin = $request->user_gstin ?? '';
        $aryMainTransaction->trans_shipping_amount = number_format($request->trans_shipping_amount,2,'.','');
        $aryMainTransaction->trans_discount_amount = number_format($request->trans_discount_amount,2,'.','');
        $aryMainTransaction->trans_status = 0; // Pending
        $aryMainTransaction->trans_payment_status = 0; // Pending
        $aryMainTransaction->trans_user_id = $userId;
        $aryMainTransaction->trans_user_name = $user->user_fname;
        $aryMainTransaction->trans_user_email = $user->user_email;
        $aryMainTransaction->trans_user_mobile = $user->user_mobile;
        $aryMainTransaction->trans_billing_address = $request->user_address.', '.$request->user_landmark.', '.$request->user_city_name.', '.$request->user_state_name.', '.$request->user_pincode;
        $aryMainTransaction->trans_delivery_address = $request->user_address.', '.$request->user_landmark.', '.$request->user_city_name.', '.$request->user_state_name.', '.$request->user_pincode;
        $aryMainTransaction->trans_city = $request->user_city_name;
        $aryMainTransaction->trans_address_landmark = $request->user_landmark;
        $aryMainTransaction->trans_delivery_mobile = $request->user_delivery_mobile;
        $aryMainTransaction->trans_pincode = $request->user_pincode;
        $aryMainTransaction->trans_state = $request->user_state_name;
        $aryMainTransaction->trans_is_wholesale = $request->trans_is_wholesale ?? 0;
        $aryMainTransaction->trans_country = 'India';
        $aryMainTransaction->trans_coupon_id = isset($resCouponInfo)?$resCouponInfo['promo_id']:'0';
        $aryMainTransaction->trans_coupon_code = isset($resCouponInfo)?$resCouponInfo['promo_code']:'';
        $aryMainTransaction->trans_coupon_dis_amt = isset($resCouponInfo) ? number_format($resCouponInfo['discountAmount'], 2, '.', '') : 0;
        $aryMainTransaction->save();

        $intTransId = $aryMainTransaction->trans_id;

        // ✅ Step 3: Save Cart Items Immediately
        if ($userSession) {
            // Logged-in user → fetch from DB cart
            if($request->trans_is_wholesale == 1){
                $resCartInfo = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userId)->get();
            }else{
                $resCartInfo = ArCart::where('cart_is_wholesale',0)->where('cart_user_id', $userId)->get();
            }
            foreach($resCartInfo as $label) {
                
                $pid = $label->cart_product_id;
                $rowProductInfo = ArProduct::where('product_id',$pid)->with('taxBelongsTo')->first();
                $aryPostData = new ArTransactionDetails;
                $aryPostData->td_trans_id  = $intTransId;
                $aryPostData->td_item_id  = $pid;
                $aryPostData->td_user_id  = $userId;
                $aryPostData->td_item_title  = $rowProductInfo->product_name; 
                $aryPostData->td_city = $request->user_city_name;
                $aryPostData->td_pincode = $request->user_pincode;
                $aryPostData->td_state = $request->user_state_name;
                $aryPostData->td_item_hsn = $rowProductInfo->product_saccode;
                $aryPostData->td_tax_id = $rowProductInfo->product_tax_id;
                $aryPostData->td_gst = $rowProductInfo->taxBelongsTo->gst_tax_percentage ?? 5;
                $aryPostData->td_country = 'India';
                $aryPostData->td_item_qty  = $label->cart_qty;

                if ($rowProductInfo->product_type == 0) {
                    $aryPostData->td_item_image  = ($rowProductInfo->product_image!='') ? $rowProductInfo->product_image : env('NO_IMAGE');
                    if($label->cart_is_wholesale == 1){
                        $productPrice = $rowProductInfo->product_wh_mrp_price;
                        $sellingPrice = $rowProductInfo->product_wh_selling_price;
                    }else{
                        $productPrice = $rowProductInfo->product_price;
                        $sellingPrice = $rowProductInfo->product_selling_price;
                    }
                    $aryPostData->td_item_net_price  = $productPrice;
                    $aryPostData->td_item_sellling_price  = $sellingPrice;
                    $aryPostData->td_item_total  = $label->cart_qty * $sellingPrice;
                } else {
                    $variationProduct = ArProductVariation::where('pv_id',$label->cart_variation_id)->first();
                    if($label->cart_is_wholesale == 1){
                        $productPrice = $rowProductInfo->product_wh_mrp_price;
                        $sellingPrice = $rowProductInfo->product_wh_selling_price;
                    }else{
                        $productPrice = $variationProduct->pv_price;
                        $sellingPrice = $variationProduct->pv_sellingprice;
                    } 
                    $aryPostData->td_item_net_price  = $productPrice;
                    $aryPostData->td_item_sellling_price  = $sellingPrice;
                    $aryPostData->td_item_total  = $label->cart_qty * $sellingPrice;
                    $aryPostData->td_item_image  = ($variationProduct->pv_image!='') ? $variationProduct->pv_image : $rowProductInfo->product_image;
                    $variation = explode(',',$variationProduct->pv_variation_extra);
                    if (count($variation)>0) {
                        $aryPostData->td_item_unit  = $variation[0] ?? '';
                        $aryPostData->td_item_color  = $variation[1] ?? '';
                        $aryPostData->td_item_img  = $variation[2] ?? '';
                    }
                    $aryPostData->td_item_sku  = $variationProduct->pv_sku;
                }
                $aryPostData->save();
            }
        } else {
            // Guest user → fetch from Session cart
            $sessionCart = Session::get('CART_SESSION', []);

            foreach ($sessionCart as $key => $qty) {
                $parts = explode("##", $key);
                $pid = $parts[0];
                $variationId = isset($parts[1]) ? $parts[1] : null;

                $rowProductInfo = ArProduct::where('product_id',$pid)->first();

                $aryPostData = new ArTransactionDetails;
                $aryPostData->td_trans_id  = $intTransId;
                $aryPostData->td_item_id  = $pid;
                $aryPostData->td_user_id  = $userId;
                $aryPostData->td_item_title  = $rowProductInfo->product_name; 
                $aryPostData->td_city = $request->user_city_name;
                $aryPostData->td_pincode = $request->user_pincode;
                $aryPostData->td_state = $request->user_state_name;
                $aryPostData->td_item_hsn = $rowProductInfo->product_saccode;
                $aryPostData->td_tax_id = $rowProductInfo->product_tax_id;
                $aryPostData->td_gst = $rowProductInfo->taxBelongsTo->gst_tax_percentage ?? 5;
                $aryPostData->td_country = 'India';
                $aryPostData->td_item_qty  = $qty;

                if ($variationId) {
                    // Variation product
                    $variationProduct = ArProductVariation::where('pv_id',$variationId)->first(); 
                    $aryPostData->td_item_net_price  = $variationProduct->pv_price;
                    $aryPostData->td_item_sellling_price  = $variationProduct->pv_sellingprice;
                    $aryPostData->td_item_total  = $qty * $variationProduct->pv_sellingprice;
                    $aryPostData->td_item_image  = ($variationProduct->pv_image!='') ? $variationProduct->pv_image : $rowProductInfo->product_image;
                    $variation = explode(',',$variationProduct->pv_variation_extra);
                    if (count($variation)>0) {
                        $aryPostData->td_item_unit  = $variation[0] ?? '';
                        $aryPostData->td_item_color  = $variation[1] ?? '';
                        $aryPostData->td_item_img  = $variation[2] ?? '';
                    }
                    $aryPostData->td_item_sku  = $variationProduct->pv_sku;
                } else {
                    // Simple product
                    $aryPostData->td_item_image  = ($rowProductInfo->product_image!='') ? $rowProductInfo->product_image : env('NO_IMAGE');
                    $aryPostData->td_item_net_price  = $rowProductInfo->product_price;
                    $aryPostData->td_item_sellling_price  = $rowProductInfo->product_selling_price;
                    $aryPostData->td_item_total  = $qty * $rowProductInfo->product_selling_price;
                }

                $aryPostData->save();
            }
        }

        // ✅ Step 4: Create Cashfree Order
        $resCashfree = self::postOrderCurl(
            $aryMainTransaction->trans_amt,
            $aryMainTransaction->trans_order_number,
            $userId
        );

        if (isset($resCashfree) && isset($resCashfree->payment_link)) {
            return response()->json([
                'notification'   => 'Order created successfully',
                'message'        => 'ok',
                'row_temp_trans' => $resCashfree->payment_link
            ], 200);
        } else {
            return response()->json([
                'notification' => 'Order did not create. Please try again',
                'message'      => 'failed'
            ], 200);
        }
    }

    public function getUniqueId($id)
    { 
        $rowUniqueId = ArUniqueIds::where('ui_id',$id)->first();
        $intCurrentCounter = $rowUniqueId->ui_current+1;
        $strCustomeId = $rowUniqueId->ui_prefix.sprintf('%04d',$intCurrentCounter);
        ArUniqueIds::where('ui_id',$id)->update(['ui_current'=>$intCurrentCounter]);
        return $strCustomeId;
    }

    public function success(Request $request)
    {
        $client = new \GuzzleHttp\Client();
        $response = $client->request('GET','https://api.cashfree.com/pg/orders/'. $request->order_id .'/payments',[
            'headers' => [
                'accept' => 'application/json',
                'x-api-version' => '2023-08-01',
                'x-client-id' => '945057711083630e4d417d5d2d750549',
                'x-client-secret' => 'cfsk_ma_prod_9d9749fb45a1666cee6ff93034ae27c9_16689382'
            ]
        ]);

        $paymentresponse = $response->getBody();
        $casfreeRes = json_decode($paymentresponse);

        $order = ArTransactions::where('trans_order_number',$request->order_id)->first();

        if (isset($casfreeRes[0]) && $casfreeRes[0]->payment_status == 'SUCCESS') {
            $order->trans_status = 1;
            $order->trans_payment_status = 1;
            $order->trans_ref_id = $casfreeRes[0]->cf_payment_id;
            if (isset($casfreeRes[0]->payment_method)) {
                $methodArray = (array) $casfreeRes[0]->payment_method;
                $methodName = array_key_first($methodArray); // e.g. "upi"
                $order->trans_method = $methodName;
            }
            $order->trans_cashfree_response = $paymentresponse;
            $order->save();

            // ✅ Reduce stock only on success
            foreach($order->items as $d) {
                if ($d->product->product_type == 0) {
                    $qty = $d->product->product_stock - $d->td_item_qty;
                    ArProduct::where('product_id',$d->td_item_id)->update(['product_stock'=>abs($qty)]);
                } else {
                    $variation = ArProductVariation::find($d->td_item_id);
                    $qty = $variation->pv_quantity - $d->td_item_qty;
                    ArProductVariation::where('pv_id',$variation->pv_id)->update(['pv_quantity'=>abs($qty)]);
                }
            }
            $rowAdminData = ArThemeAdmin::first();
            $rowTransData = ArTransactions::where('trans_id',$request->order_id)->with(['items'])->first();
            try {
                $details = [
                    'subject' => 'Your Order Placed Successfully',
                    'rowTransData' => $rowTransData,
                    'template' =>'frontend.emails.order_placed', 
                ];
                \Mail::to($details['rowTransData']['trans_user_email'])->send(new sendingEmail($details));
                $details1 = [
                    'subject' => 'New order received.',
                    'rowTransData' => $rowTransData,
                    'template' =>'frontend.emails.order_placed', 
                ];
            \Mail::to($rowAdminData->administration_email)->send(new sendingEmail($details1));
            
            } catch (\Exception $e) {                  
            //   return $e->getMessage();
            }
            // ✅ Clear cart
            if($request->trans_is_wholesale == 1){
                ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $order->trans_user_id)->delete();
            }else{
                ArCart::where('cart_is_wholesale',0)->where('cart_user_id', $order->trans_user_id)->delete();
            }
            Session::forget('CART_SESSION');
            Session::forget('CART_COUPON');
            Session::put('TRANSACTION_ID',$order->trans_order_number);

            return redirect()->route('frontend.cart.thankyou');                
        } 
        elseif (isset($casfreeRes[0]) && $casfreeRes[0]->payment_status == 'FAILED') {
            $order->trans_status = 2;
            $order->trans_payment_status = 2;
            $order->trans_cashfree_response = $paymentresponse;
            $order->save();

            Session::put('TRANSACTION_ID',$order->trans_order_number);  
            Session::forget('CART_COUPON');       
            return redirect()->route('frontend.cart.paymentcancel');
        } 
        else {
            Session::flash('payment_pending', 'Your payment is not completed. Please try again.');
            return redirect()->route('front.cart.index');   
        }
    }

    protected function postOrderCurl($amount, $orderID, $userId)
    {
        $rowUserData = ArUsers::where('user_id', $userId)->first();
    
        //  $url = "https://sandbox.cashfree.com/pg/orders";  
        $url = "https://api.cashfree.com/pg/orders";
    
        $headers = array(
            "Content-Type: application/json",
            "x-api-version: 2022-01-01",
            "x-client-id: " . '945057711083630e4d417d5d2d750549',
            "x-client-secret: " . 'cfsk_ma_prod_9d9749fb45a1666cee6ff93034ae27c9_16689382'
        );
    
        $data = json_encode([
        'order_id' =>  $orderID,
        // 'order_amount' => 1,
        'order_amount' => $amount,
        "order_currency" => "INR",
        "customer_details" => [
        "customer_id" => $rowUserData->user_unique_id,
        "customer_name" => $rowUserData->user_fname,
        "customer_email" => $rowUserData->user_email,
        "customer_phone" => $rowUserData->user_mobile,
            ],
            "order_meta" => [
                "return_url" => 'https://www.sarojtextile.com/cashfree/payments/success/?order_id={order_id}&order_token={order_token}'
            ]
        ]);
    
        $curl = curl_init($url);
    
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
    
        $resp = curl_exec($curl);
        curl_close($curl);
    
        // Check if the response is valid JSON
        return $cashfreeResponse = json_decode($resp);
    
        if (json_last_error() == JSON_ERROR_NONE) {
            // Check if the payment_link property exists
            if (property_exists($cashfreeResponse, 'payment_link')) {
            return response()->json([]);
                return redirect()->to($cashfreeResponse->payment_link);
            } else {
                // Handle the case where payment_link is not present
                return response()->json(['error' => 'Payment link not found in the Cashfree API response.']);
            }
        } else {
            // Handle the case where the response is not valid JSON
            return response()->json(['error' => 'Invalid JSON response from the Cashfree API.']);
        }
    }

    public function saveLoginCart($userId)
    {           
        if($userId>0){
            $user = ArUsers::where('user_id',$userId)->first();
            $cartSession = Session::get('CART_SESSION');
            if($cartSession){
                foreach($cartSession as $product_id=>$qty)
                {
                     $pid = explode("####",trim($product_id));

                     $cartItem = ArCart::where('cart_user_id',$user->user_id)->where('cart_product_id',$pid[0])->first();
                    if(empty($cartItem)){                        
                        $cartItem = new ArCart;
                        $cartItem->cart_qty += $qty;
                    }elseif(isset($pid[1]) && $cartItem->cart_variation_id == $pid[1]){
                        $cartItem->cart_qty += $qty;
                    }else{
                        $cartItem->cart_qty += $qty;
                    }
                    $cartItem->cart_user_id = $user->user_id;
                    $cartItem->cart_product_id = $pid[0];

                    if (isset($pid[1]) && $pid[1] > 0) {
                        $variation = ArProductVariation::find($pid[1]);
                        if ($variation) {
                            $cartItem->cart_variation_id = $variation->pv_id;
                        } 
                    } else {
                        $cartItem->cart_variation_id = 0;
                    }
                    $cartItem->save();                    
                }
                // Session::forget('CART_SESSION');
            }

        }
    }
}