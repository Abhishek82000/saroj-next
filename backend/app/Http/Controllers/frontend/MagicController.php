<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArUniqueIds;
use App\Models\ArProduct;
use App\Models\ArProductVariation;
use App\Models\ArUsers;
use App\Models\ArUserAddress;
use App\Models\ArPromos;
use App\Models\ArTransactions;
use App\Models\ArShippingRate;
use App\Models\ArShippingPincode;
use App\Models\ArThemeAdmin;
use App\Models\ArTempTransactions;
use App\Models\ArTransactionDetails;
use App\Models\ArCart;
use App\Mail\sendingEmail;
use DB;
use Hash;
use Session;

class MagicController extends Controller
{
    public function createorder(Request $request)
    {
        $adminSettings = ArThemeAdmin::first();
        $requestdata = $request->all();
        $cartSummary = $this->cartSummary();
        if(isset($cartSummary['cart_data'])){
            $tempOrder = new ArTempTransactions();
            $tempOrder->temp_trans_order_id = self::getUniqueId(3);
            $resCouponInfo = Session::get('CART_COUPON');
            $userlogin = Session::get("AR_USER");
            if (!empty($userlogin) && isset($userlogin->user_id)) {
                $tempOrder->temp_trans_user_id = $userlogin->user_id;
            } else {
                $tempOrder->temp_trans_user_id = 0;
            }
            $temporder_cartdata = [];
            $temporder_cartdata['cart_summery'] = $cartSummary;
            $temporder_cartdata['cart_items'] = self::getCartData();
            $tempOrder->temp_order_coupon_id = isset($resCouponInfo)?$resCouponInfo['promo_id']:'0';
            $tempOrder->temp_order_cart_data = json_encode($temporder_cartdata);
            $tempOrder->temp_trans_amt = $cartSummary['rawtotalAmount'];
            $tempOrder->temp_user_ip = $request->ip();
        
            if ($tempOrder->save()) {
                $resRazorpay = self::razorpayOrderCreateRequest($tempOrder);
                if ($resRazorpay['status'] == "success") {
                    $resData = $resRazorpay['data'];
                    $tempOrder->temp_payment_response = json_encode($resData);
                    $tempOrder->temp_payment_request = json_encode($resRazorpay['request']);
                    $tempOrder->temp_cf_payment_id = $resData->id;
                    if (isset($resData->id) && $tempOrder->save()) {
                        $razorpayItems = [];
                        $razorpayItems['key'] = $adminSettings->admin_razorpay_key;
                        $razorpayItems['amount'] = $tempOrder->temp_trans_amt*100;
                        $razorpayItems['currency'] = "₹";
                        $razorpayItems['name'] = "Madhrri";
                        $razorpayItems['description'] = "Madhrri";
                        $razorpayItems['image'] = (isset($adminSettings->favicon) && $adminSettings->favicon != '')? env('SETTING_IMAGE').$adminSettings->favicon:url('/').'/public'.env('NO_IMAGE');
                        $razorpayItems['order_id'] = $resData->id;
                        $razorpayItems['callback_url'] = '';
                        $razorpayItems['notes'] = '';
                        $razorpayItems['theme'] = '#b19361';
                        $razorpayItems['prefill_name'] = $userlogin['user_fname']??'';
                        $razorpayItems['prefill_email'] = $userlogin['user_email']??'';
                        $razorpayItems['prefill_contact'] = $userlogin['user_mobile']??'';
                        $razorpayItems['trasn_order_id'] = '';
                        
                        return response()->json(['status' => 'success', 'message' => 'Order Placed Successfully!', 'razorpayItems' => $razorpayItems], 200);
                    } else {
                        return response()->json(['status' => 'error', 'message' => 'Something Went Wrong. Please try again!1'], 200);
                    }
                } else {
                    return response()->json(['status' => 'error', 'message' => 'Something Went Wrong. Please try again!2'], 200);
                }
                                
            } else {
                return false;
            }
        } else {
            return response()->json(['status' => 'error', 'message' => 'Something Went Wrong. Please try again!3'], 200);
        }
    }
    
    protected function razorpayOrderCreateRequest($tempOrder)
    {
        $userlogin = Session::get("AR_USER");
        $adminSettings = ArThemeAdmin::first();
        $lineItems = [];

        // Helper function to build line item
        $buildLineItem = function ($product, $variation = null, $quantity = 1) {
            $price = $variation ? $variation->pv_price : $product->product_price;
            $offerPrice = $variation ? $variation->pv_sellingprice : $product->product_selling_price;
            $sku = $variation->pv_sku ?? $product->product_sku;
            $image = $variation->pv_image ?? $product->product_image;

            return [
                "sku" => $sku ?? '',
                "variant_id" => $product->product_category_name ?? '',
                "other_product_codes" => [
                    "upc" => '',
                    "ean" => '',
                    "unspsc" => ''
                ],
                "price" => (int)($price * 100),
                "offer_price" => (int)($offerPrice * 100),
                "tax_amount" => 0,
                "quantity" => (int)$quantity,
                "name" => $product->product_name,
                "description" => $product->product_name ?? '',
                "weight" => 100,
                "dimensions" => [
                    "length" => 100,
                    "width" => 100,
                    "height" => 100
                ],
                "image_url" => $image,
                "product_url" => env('APP_URL') . 'product/' . $product->product_slug,
                "notes" => []
            ];
        };

        if (!empty($userlogin) && isset($userlogin['user_id'])) {
            // Logged-in user cart
            $resCartData = ArCart::where('cart_user_id', $userlogin['user_id'])
                ->with(['cartProduct', 'cartVariationProduct'])
                ->get();

            foreach ($resCartData as $cart) {
                $product = $cart->cartProduct;
                if (!$product) continue;

                $variation = ($cart->cart_variation_id > 0) ? $cart->cartVariationProduct : null;
                $lineItems[] = $buildLineItem($product, $variation, $cart->cart_qty);
            }
        } else {
            // Guest user cart
            $resCartData = Session::get('CART_SESSION', []);
            foreach ($resCartData as $product_id => $cartQty) {
                $pid = explode("####", trim($product_id));
                $product = ArProduct::find($pid[0]);
                if (!$product) continue;

                $variation = ($product->product_type == 1 && isset($pid[1]))
                    ? ArProductVariation::find($pid[1])
                    : null;

                if ($product->product_type == 1 && !$variation) continue;

                $lineItems[] = $buildLineItem($product, $variation, $cartQty);
            }
        }

        // Prepare Razorpay payload
        $amount = round($tempOrder->temp_trans_amt * 100); // Convert to paisa
        $aryPostData = [
            "amount" => (int)$amount,
            "currency" => "INR",
            "receipt" => $tempOrder->temp_trans_order_id,
            "payment_capture" => 1,
            "line_items_total" => (int)$amount,
            "line_items" => $lineItems,
            "notes" => [
                "customer_name" => $userlogin['user_fname']??'',
                "customer_email" => $userlogin['user_email']??'',
                "customer_phone" => $userlogin['user_mobile']??'',
                "shipping_address" => '',
                "product_type" => "MagicCheckout"
            ],
        ];
        if (env('RAZORPAY_MAGIC_CHECKOUT') === 'true') {
            $aryPostData['magic_checkout'] = [
                "enable" => true,
                "enable_coupons" => true,
                "coupon_config" => [
                    "url" => 'https://www.madhrri.com/api/coupon-list'
                ]
            ];
        }

        $postFields = json_encode($aryPostData, JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
        $authToken = $adminSettings->admin_razorpay_key . ":" . $adminSettings->admin_razorpay_secret;

        // Send request to Razorpay
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => "https://api.razorpay.com/v1/orders",
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_USERPWD => $authToken,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Content-Length: ' . strlen($postFields)
            ],
            CURLOPT_POSTFIELDS => $postFields,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_RETURNTRANSFER => true
        ]);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return [
                'status' => "error",
                'message' => "cURL Error: " . $error
            ];
        }

        $res = json_decode($response);

        if (isset($res->status) && $res->status === 'created') {
            return [
                'status' => "success",
                'data' => $res,
                'request' => $aryPostData
            ];
        } else {
            return [
                'status' => "error",
                'message' => "Razorpay order creation failed. Please try again.",
                'response' => $res
            ];
        }
    }

    public static function cartSummary()
    {
        $taxExclude = false;
        $summary = [];
        $price = 0;
        $sellingPrice = 0;
        $taxAmount = 0;
        $discount = 0;
        $subTotal = 0;
        $totalWeight = 0;
        $qty = 0;

        $userLogin = Session::get("AR_USER");

        if (!empty($userLogin) && isset($userLogin['user_id'])) {
            // Logged-in user cart
            $resCartData = ArCart::where('cart_user_id', $userLogin['user_id'])->with(['cartProduct', 'cartVariationProduct'])->get();

            foreach ($resCartData as $cart) {
                $product = $cart->cartProduct;

                if (!$product) continue;

                $qty += $cart->cart_qty;
                $taxAmount += (($product->product_selling_price * $cart->cart_qty) * $product->product_tax_rate / 100);

                if ($cart->cart_variation_id > 0 && $cart->cartVariationProduct) {
                    $variation = $cart->cartVariationProduct;

                    $price += $variation->pv_price * $cart->cart_qty;
                    $sellingPrice += $variation->pv_sellingprice * $cart->cart_qty;
                    $discount += $variation->pv_discount * $cart->cart_qty;
                    $subTotal += $variation->pv_sellingprice * $cart->cart_qty;
                    $totalWeight += (float) $variation->pv_weight;
                } else {
                    $price += $product->product_price * $cart->cart_qty;
                    $sellingPrice += $product->product_selling_price * $cart->cart_qty;
                    $discount += $product->product_discount * $cart->cart_qty;
                    $subTotal += $product->product_selling_price * $cart->cart_qty;
                    $totalWeight += (float) $product->product_weight;
                }
            }

        } else {
            // Guest user cart
            $resCartData = Session::get('CART_SESSION', []);

            foreach ($resCartData as $product_id => $cartQty) {
                $pid = explode("####", trim($product_id));
                $product = ArProduct::find($pid[0]);

                if (!$product) continue;

                $qty += $cartQty;
                $taxAmount += (($product->product_selling_price * $cartQty) * $product->product_tax_rate / 100);

                if ($product->product_type == 0) {
                    $price += $product->product_price * $cartQty;
                    $sellingPrice += $product->product_selling_price * $cartQty;
                    $discount += $product->product_discount * $cartQty;
                    $subTotal += $product->product_selling_price * $cartQty;
                    $totalWeight += (float) $product->product_weight;
                } else {
                    $variation = ArProductVariation::find($pid[1]);

                    if (!$variation) continue;

                    $price += $variation->pv_price * $cartQty;
                    $sellingPrice += $variation->pv_sellingprice * $cartQty;
                    $discount += $variation->pv_discount * $cartQty;
                    $subTotal += $variation->pv_sellingprice * $cartQty;
                    $totalWeight += (float) $variation->pv_weight;
                }
            }
        }

        $discountAmount = $discount;
        $totalAmount = $sellingPrice;

        // Apply coupon if any
        $cartCoupon = Session::get('CART_COUPON');
        $couponAmount = 0;
        $couponCode = "";

        if (!empty($cartCoupon)) {
            $couponAmount = $cartCoupon['discountAmount'] ?? 0.00;
            $couponCode = $cartCoupon['promo_code'] ?? '';
            $totalAmount -= $couponAmount;
        }

        // Prepare summary
        $summary['subTotal'] = "₹" . number_format($price, 2);
        $summary['discountAmount'] = "₹" . number_format($discountAmount, 2);
        $summary['couponAmount'] = $couponAmount > 0 ? "- ₹" . number_format($couponAmount, 2) : "₹0.00";
        $summary['totalAmount'] = "₹" . number_format($totalAmount, 2);
        $summary['couponCode'] = $couponCode;
        $summary['totalWeight'] = $totalWeight;

        // Raw values (for logic or further calculation)
        $summary['rawsubTotal'] = $price;
        $summary['rawdiscountAmount'] = $discountAmount;
        $summary['rawcouponAmount'] = $couponAmount;
        $summary['rawtotalAmount'] = $totalAmount;
        $summary['qty'] = $qty;
        $summary['taxExclude'] = $taxExclude;
        $summary['rawtaxamount'] = $taxAmount;
        $summary['rawsellingTotal'] = $sellingPrice;
        $summary['sellingTotal'] = "₹" . number_format($sellingPrice, 2);
        $summary['taxamount'] = "₹" . number_format($taxAmount, 2);
        $summary['cart_data'] = self::getCartData();

        return $summary;
    }
    
    public function getpaymentstatus($id)
    {
        $endpoint = "https://api.razorpay.com/v1/orders/" . $id;
        $adminSettings = ArThemeAdmin::first();
        $authToken = $adminSettings->admin_razorpay_key.":".$adminSettings->admin_razorpay_secret;
        $headers = [];
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $endpoint);
        curl_setopt($ch, CURLOPT_USERPWD, $authToken);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $returnData = curl_exec($ch);
        curl_close($ch);
        if ($returnData != "") {
            return json_decode($returnData, true); 
        }
        return null;
    }
    public function getpaymentmethod($id)
    {
        $endpoint = "https://api.razorpay.com/v1/orders/" . $id . "/payments";
        $adminSettings = ArThemeAdmin::first();
        $authToken = $adminSettings->admin_razorpay_key.":".$adminSettings->admin_razorpay_secret;
        $headers = [];
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $endpoint);
        curl_setopt($ch, CURLOPT_USERPWD, $authToken);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $response = curl_exec($ch);
        curl_close($ch);
        if ($response) {
            $data = json_decode($response, true);
            if (!empty($data['items']) && isset($data['items'][0]['method'])) {
                return $data['items'][0]['method'];
            }
        }
        return null;
    }
    
    public function MagicCheckoutProcess(Request $request)
    {
        $razorpayPaymentMethod = self::getpaymentmethod($request->razorpay_order_id);
        $razorpayPaymentStatus = self::getpaymentstatus($request->razorpay_order_id);

        $tempOrder = ArTempTransactions::where("temp_trans_order_id", $razorpayPaymentStatus['receipt'])->first();
        $tempCartData = json_decode($tempOrder->temp_order_cart_data);
        $cartSummary = $tempCartData->cart_summery;
        $userDetails = $razorpayPaymentStatus['customer_details'] ?? [];
        $shipping = $userDetails['shipping_address'] ?? [];
        $billing = $userDetails['billing_address'] ?? [];

        // Handle user creation/retrieval
        $userId = null;
        if ($tempOrder->temp_trans_user_id > 0) {
            $userObj = ArUsers::where("user_id", $tempOrder->temp_trans_user_id)->first();
            $userId = $userObj->user_id;
        } else {
            $userExist = ArUsers::where("user_mobile", $userDetails['contact'])->first();
            if ($userExist) {
                if($userExist->user_profile_status == 0){
                    $userExist->user_fname = $userDetails['name']??'';
                    $userExist->user_email = $userDetails['email']??'';
                    $userExist->user_status = 1;
                    $userExist->user_profile_status = 1;
                    $userExist->save();
                }
                $userId = $userExist->user_id;
            } else {
                $user = new ArUsers;
                $user->user_unique_id = self::getUniqueId(7);
                $user->user_fname = $userDetails['name']??'';
                $user->user_email = $userDetails['email']??'';
                $user->user_mobile = $userDetails['contact'];
                $user->user_status = 1;
                $user->user_profile_status = 1;
                $user->save();
                $userId = $user->user_id;
            }
        }
        // Create main transaction
        $aryMainTransaction = new ArTransactions;
        $aryMainTransaction->trans_datetime = date('Y-m-d H:i:s');
        $aryMainTransaction->trans_order_number = $tempOrder->temp_trans_order_id;
        $aryMainTransaction->trans_amt = number_format($razorpayPaymentStatus['amount_paid'] / 100, 2, '.', '');
        $aryMainTransaction->trans_currency = "₹";
        $aryMainTransaction->trans_method = $razorpayPaymentMethod ?? '';
        $aryMainTransaction->trans_shipping_amount = isset($razorpayPaymentStatus['shipping_fee']) ? ($razorpayPaymentStatus['shipping_fee'] / 100) : 0;
        $aryMainTransaction->trans_status = 1;
        $aryMainTransaction->trans_ref_id = $razorpayPaymentStatus['id'];
        $aryMainTransaction->trans_cashfree_response = json_encode($razorpayPaymentStatus);
        $aryMainTransaction->trans_cart_response = $tempOrder->temp_order_cart_data;
        
        $billingCountry = strtolower($billing['country'] ?? '');
        $shippingCountry = strtolower($shipping['country'] ?? '');

        $aryMainTransaction->trans_billing_address = trim(
            ($billing['line1'] ?? '') . ' ' .
            ($billing['line2'] ?? '') . ' ' .
            ($billing['city'] ?? '') . ' ' .
            ($billing['state'] ?? '') . ' ' .
            (($billingCountry === 'in') ? 'India' : ($billing['country'] ?? '')) . ' ' .
            ($billing['zipcode'] ?? '')
        );

        $aryMainTransaction->trans_delivery_address = trim(
            ($shipping['line1'] ?? '') . ' ' .
            ($shipping['line2'] ?? '') . ' ' .
            ($shipping['city'] ?? '') . ' ' .
            ($shipping['state'] ?? '') . ' ' .
            (($shippingCountry === 'in') ? 'India' : ($shipping['country'] ?? '')) . ' ' .
            ($shipping['zipcode'] ?? '')
        );

        $aryMainTransaction->trans_city = $shipping['city'] ?? '';
        $aryMainTransaction->trans_pincode = $shipping['zipcode'] ?? '';
        $aryMainTransaction->trans_state = $shipping['state'] ?? '';
        $aryMainTransaction->trans_country = ($shipping['country'] == 'in')? 'India':$shipping['country'];
        $aryMainTransaction->trans_user_email = $userDetails['email'] ?? '';
        $aryMainTransaction->trans_user_id = $userId;
        $aryMainTransaction->trans_user_name = $shipping['name'] ?? '';
        $aryMainTransaction->trans_user_mobile = $userDetails['contact'] ?? '';

        // Assuming $cartSummary is available - you might need to retrieve this from somewhere
        $aryMainTransaction->trans_discount_amount = isset($cartSummary->rawdiscountAmount) ? number_format($cartSummary->rawdiscountAmount, 2, '.', '') : 0.00;
        $aryMainTransaction->trans_coupon_id = $tempOrder->temp_order_coupon_id;
        $aryMainTransaction->trans_coupon_code = $cartSummary->couponCode ?? '';
        $aryMainTransaction->trans_coupon_dis_amt = isset($cartSummary->rawcouponAmount) ? number_format($cartSummary->rawcouponAmount, 2, '.', '') : 0.00;
        $aryMainTransaction->trans_shippment_data = '';
        $aryMainTransaction->trans_payment_status = ($razorpayPaymentStatus['status'] == 'paid') ? 1 : 0;
        $aryMainTransaction->save();
        
        $intTransId = $aryMainTransaction->trans_id;

        // Process cart items
        if ($tempOrder->temp_trans_user_id > 0) {
            foreach ($tempCartData->cart_items as $label) {
                $rowProductInfo = ArProduct::where('product_id', $label->cart_product_id)->first();
                $this->processCartItem($rowProductInfo, $intTransId, $userId, $shipping, $label->cart_product_id, $label->cart_qty, $label->cart_variation_id);
            }
            
        } else {
            foreach ((array)$tempCartData->cart_items as $product_id => $cartQty) {
                $prodCartId = explode("####", trim($product_id));
                $rowProductInfo = ArProduct::where('product_id', $prodCartId[0])->first();
                $this->processCartItem($rowProductInfo, $intTransId, $userId, $shipping, $prodCartId[0], $cartQty, $prodCartId[1] ?? null);
            }
        }
        ArCart::where('cart_user_id', $aryMainTransaction->trans_user_id)->delete();
        // Handle session data
        Session::put('TRANSACTION_ID', $aryMainTransaction->trans_order_number);  
        Session::save();
        Session::forget('CART_SESSION');
        Session::forget('CART_COUPON');       
        
        $redirectUrl = $razorpayPaymentStatus['status'] == 'paid'
            ? route('frontend.cart.thankyou', $aryMainTransaction->trans_order_number)
            : route('frontend.cart.paymentcancel', $aryMainTransaction->trans_order_number);

        return response()->json([
            'status' => 'success',
            'message' => 'Order Placed Successfully!',
            'redirectUrl' => $redirectUrl
        ], 200);
    }

    private function processCartItem($item, $transId, $userId, $shipping, $productId, $qty = null, $variationId = null)
    {
        $aryPostData = new ArTransactionDetails;
        $aryPostData->td_trans_id = $transId;
        $aryPostData->td_seller_id = $userId;
        
        if (is_object($item)) {
            // Handle object format (logged in user)
            $pid = $productId;
            $aryPostData->td_item_id = $pid;
            $aryPostData->td_item_title = $item->product_name; 
            
            if ($item->product_type == 0) {
                $product = $item;
                $variationId = null;
            } else {
                $product = ArProductVariation::where('pv_id', $variationId)->first();
            }
        } else {
            // Handle array format (guest user)
            $pid = $productId;
            $aryPostData->td_item_id = $pid;
            $aryPostData->td_item_title = $item->product_name;
            
            if ($item->product_type == 0) {
                $product = $item;
            } else {
                $productVariation = ArProductVariation::where('pv_id', $variationId)->first();
            }
        }
        
        // Common fields
        $aryPostData->td_city = $shipping['city'] ?? '';
        $aryPostData->td_pincode = $shipping['zipcode'] ?? '';
        $aryPostData->td_state = $shipping['state'] ?? '';
        $aryPostData->td_item_hsn = $product->product_saccode ?? '';
        $aryPostData->td_tax_id = $product->product_tax_id ?? '';
        $aryPostData->td_country = ($shipping['country'] == 'in')? 'India':$shipping['country'];
        $aryPostData->td_item_image = isset($product->product_image) && $product->product_image != '' ? $product->product_image : url('/').'/public'.env('NO_IMAGE');
        
        if ($variationId === null) {
            // Standard product
            $aryPostData->td_item_net_price = $product->product_price;
            $aryPostData->td_item_sellling_price = $product->product_selling_price;
            $aryPostData->td_item_qty = $qty;
            $aryPostData->td_item_total = $qty * $product->product_selling_price;
            $aryPostData->td_item_weight = $product->product_weight ?? 0.200;
            $aryPostData->td_item_length = $product->product_length ?? 20;
            $aryPostData->td_item_width = $product->product_width ?? 10;
            $aryPostData->td_item_height = $product->product_height ?? 10;
            $aryPostData->td_item_sku = $product->product_sku;
            
            // Update stock
            $newQty = $product->product_stock - $qty;
            ArProduct::where('product_id', $pid)->update(['product_stock' => abs($newQty)]);
        } else {
            // Variant product
            $aryPostData->td_item_net_price = $product->pv_price;
            $aryPostData->td_item_sellling_price = $product->pv_sellingprice;
            $aryPostData->td_item_qty = $qty;
            $aryPostData->td_item_total = $qty * $product->pv_sellingprice;
            $aryPostData->td_item_weight = $product->pv_weight ?? 0.200;
            $aryPostData->td_item_length = $product->pv_length ?? 20;
            $aryPostData->td_item_width = $product->pv_width ?? 10;
            $aryPostData->td_item_height = $product->pv_height ?? 10;
            $aryPostData->td_item_sku = $product->pv_sku;
            
            // Handle variations
            $variation = explode(',', $product->pv_variation_extra);
            if (count($variation) > 0) {
                $aryPostData->td_item_unit = $variation[0] ?? '';
                $aryPostData->td_item_color = $variation[1] ?? '';
                $aryPostData->td_item_img = $variation[2] ?? '';
            }
            
            // Update variant stock
            $newQty = $product->pv_quantity - $qty;
            ArProductVariation::where('pv_id', $variationId)->update(['pv_quantity' => abs($newQty)]);
        }
        
        $aryPostData->save();
    }
    public static function getCartData()
    {
        $userLogin = Session::get("AR_USER");
        if (!empty($userLogin) && isset($userLogin['user_id'])) {
            $cartData = ArCart::where('cart_user_id', $userLogin['user_id'])
                ->with('cartProduct')
                ->get()
                ->toArray(); 
        } else {
            $cartData = Session::get('CART_SESSION', []);
        }
        return $cartData;
    }
    public function getUniqueId($id)
    {
        $rowUniqueId = ArUniqueIds::where('ui_id', $id)->first();
        $intCurrentCounter = $rowUniqueId->ui_current + 1;
        $strCategoryId = $rowUniqueId->ui_prefix . $intCurrentCounter;
        ArUniqueIds::where('ui_id', $id)->update(['ui_current' => $intCurrentCounter]);
        return $strCategoryId;
    }
}