<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArCategory;
use App\Models\ArUniqueIds;
use App\Models\ArUserFavProduct;
use App\Models\ArProduct;
use App\Models\ArProductVariation;
use App\Models\ArUsers;
use App\Models\ArUserAddress;
use App\Models\ArPromos;
use App\Models\ArTransactions;
use App\Models\ArShippingRate;
use App\Models\ArState;
use App\Models\ArCities;
use App\Models\ArShippingPincode;
use App\Models\ArThemeAdmin;
use App\Models\ArZoneCity;
use App\Models\ArShippingRateAmount;
use App\Models\ArShippingRateWeight;
use App\Models\ArTempTransactions;
use App\Models\ArTransactionDetails;
use App\Models\ArCountries;
use App\Models\ArPincode;
use App\Models\ArShippingCharges;
use App\Models\ArShippingAgency;
use App\Models\ArCart;
use App\Models\ArSeller;
use App\Traits\ShiprocketTrait;
use App\Mail\sendingEmail;
use Razorpay\Api\Api;
use Carbon\Carbon;
use DB;
use Hash;
use Session;
use Exception;

class CartController extends Controller
{
    use ShiprocketTrait;
    public function index(){ 
        // $cartData = Session::get('CART_SESSION');
        $userSession = Session::get('AR_USER');
        Session::forget('CART_COUPON'); 
        $resFavCoupons = ArPromos::where('promo_featured',1)->where('promo_status',1)->orderBy('promo_id','DESC')->get();
        $currDateTime = date("Y-m-d");
        $resCouponsData = ArPromos::where('promo_status',1)->where('promo_valid_to','>',$currDateTime)->get();
        $rowThemeData = ArThemeAdmin::first();
        if(isset($userSession) && $userSession->user_id >0){
            $cartData = ArCart::where('cart_is_wholesale',0)->where('cart_user_id', $userSession->user_id)->get();
        }else{            
            $cartData = Session::get('CART_SESSION');
        }
        $strTitle = 'Cart';
        return view('frontend.cart.index',compact('strTitle','cartData','userSession','resFavCoupons','resCouponsData','rowThemeData'));        
    }
    
    public function thankyou(){
        $orderNumber = Session::get('TRANSACTION_ID');
        if($orderNumber != ''){
            $userTrans = ArTransactions::where('trans_order_number',$orderNumber)->first();
            $user = ArUsers::where('user_id', $userTrans->trans_user_id	)->where('user_profile_status',1)->first();
            if($user){
                Session::put('AR_USER',$user);  
                Session::save();
            }            
            $strTitle = 'Thank You';
            return view('frontend.cart.thankyou',compact('strTitle','orderNumber','user','userTrans'));
        }else{
            return redirect()->route('front.home');
        }
    }

    public function cancel(){
        $orderNumber = Session::get('TRANSACTION_ID');
        if($orderNumber != ''){
            $tempTransObj = ArTempTransactions::where('temp_trans_order_id',$orderNumber)->first();
            $paymentId = $tempTransObj->temp_cf_payment_id;
            $message = $tempTransObj->temp_cashfree_message;
            $user = ArUsers::where('user_id', $tempTransObj->temp_trans_user_id	)->first();
            Session::put('AR_USER',$user);  
            Session::save();
            $strTitle = 'Payment Failed';
            return view('frontend.cart.payment_cancel',compact('strTitle','paymentId','message'));
        }else{
            return redirect()->route('front.home');
        }
    }
    public function failed(){
        $cartData = Session::get('CART_SESSION');
        $user = Session::get('AR_USER');
        $strTitle = 'Madhrri';
        return view('frontend.cart.failed',compact('strTitle','cartData','user'));
    }

    public function cartAddress(){
        $cartData = Session::get('CART_SESSION'); 
        $userSession = Session::get('AR_USER');
        $addressSession = Session::has('SELECTED_ADDRESS') ? Session::get('SELECTED_ADDRESS'):null;
        if($userSession){
            $promoCode = Session::get('CART_COUPON');
            $defaultAddressData = ArUserAddress::where('ua_default_address',1)->where('ua_user_id',$userSession->user_id)->first();
            $resAddressData = ArUserAddress::where('ua_default_address',0)->where('ua_user_id',$userSession->user_id)->get();
            $resCountryData = ArCountries::orderBy('country_name')->get();
            $resFavCoupons = ArPromos::where('promo_featured',1)->where('promo_status',1)->orderBy('promo_id','DESC')->get();
            $currDateTime = date("Y-m-d");
            $resCouponsData = ArPromos::where('promo_status',1)->where('promo_valid_to','>',$currDateTime)->get();
            $rowThemeData = ArThemeAdmin::first();
            $strTitle = 'Cart Address';
            return view('frontend.cart.cartaddress',compact('strTitle','cartData','rowThemeData','userSession','resAddressData','resCountryData','resFavCoupons','promoCode','resCouponsData','addressSession','defaultAddressData'));
        }else{
            return redirect()->route('front.cart.index');
        }        
    }

    public function shoppingcarthtml(){
        $cartData = Session::get('CART_SESSION');
        $userSession = Session::get('AR_USER');
        $resFavCoupons = ArPromos::where('promo_featured',1)->where('promo_status',1)->orderBy('promo_id','DESC')->get();
        $rowThemeData = ArThemeAdmin::first();
        $strTitle = 'Cart Address';
        return view('frontend.cart.shoppingcarthtml',compact('strTitle','cartData','userSession','resFavCoupons','rowThemeData'));
    }
    public function wholesalecheckout()
    {
        Session::forget('CART_COUPON'); 
        $userSession     = Session::get('AR_USER');
        $verifiedSession = Session::has('VF_USER') ? Session::get('VF_USER') : null;
        $states = ArState::all();
        $shippingCharge  = self::getTotalShipping('prepaid','wholesale');        
        $rowAdminData    = ArThemeAdmin::select('admin_min_order')->first(); 
        $strTitle        = 'Checkout';
        $user            = null; 
        $cartData        = [];

        if (isset($userSession) && $userSession->user_id > 0) {
            $this->cartClear($userSession->user_id);
            // Logged-in user
            $cartData = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->get();

            if ($cartData->count() > 0) {
                $user = ArUsers::where('user_id', $userSession->user_id)
                        ->with('address')
                        ->first();
            } else {
                return redirect()->route('front.wholesale.wholesalecart');
            }

        } else {
            return redirect()->route('front.home');
        }

        return view('frontend.wholesale.wholesale_checkout', compact(
            'strTitle',
            'rowAdminData',
            'cartData',
            'user',
            'states',
            'shippingCharge',
            'verifiedSession'
        ));
    }
    public function cartClear($user_id = null)
    {
        // Delete invalid RETAIL cart items
        ArCart::where('cart_user_id', $user_id)
            ->where('cart_is_wholesale', 0)
            ->where(function ($query) {
                $query->whereNotExists(function ($sub) {
                    $sub->select(\DB::raw(1))
                        ->from('ar_products')
                        ->whereColumn('ar_products.product_id', 'ar_cart.cart_product_id')
                        ->where('product_status', 1)
                        ->where('product_stock', '>', 0);
                });
            })
            ->delete();

        // Delete invalid WHOLESALE cart items
        ArCart::where('cart_user_id', $user_id)
            ->where('cart_is_wholesale', 1)
            ->where(function ($query) {
                $query->whereNotExists(function ($sub) {
                    $sub->select(\DB::raw(1))
                        ->from('ar_products')
                        ->whereColumn('ar_products.product_id', 'ar_cart.cart_product_id')
                        ->where('product_stock', '>', 0)
                        ->where('product_wholesale', 1);
                });
            })
            ->delete();
            return true;
    }
    public function checkout()
    {
        Session::forget('CART_COUPON'); 
        $userSession     = Session::get('AR_USER');
        $verifiedSession = Session::has('VF_USER') ? Session::get('VF_USER') : null;
        $promoCode       = Session::get('CART_COUPON'); 
        $currDateTime    = date("Y-m-d");
        $states = ArState::all();
        $shippingCharge  = self::getTotalShipping('prepaid');
        $resCouponsData  = ArPromos::where('promo_status', 1)->where('promo_featured', 1)
                            ->where('promo_valid_to', '>', $currDateTime)
                            ->get();
        $rowAdminData    = ArThemeAdmin::select('admin_min_order')->first(); 
        $strTitle        = 'Checkout';

        $user            = null; // ✅ Initialize to avoid undefined error
        $cartData        = [];

        if (isset($userSession) && $userSession->user_id > 0) {
            $this->cartClear($userSession->user_id);
            // Logged-in user
            $cartData = ArCart::where('cart_is_wholesale',0)->where('cart_user_id', $userSession->user_id)->get();

            if ($cartData->count() > 0) {
                $user = ArUsers::where('user_id', $userSession->user_id)
                        ->with('address')
                        ->first();
            } else {
                return redirect()->route('front.cart.index');
            }

        } else {
            // Guest user
            $cartData = Session::get('CART_SESSION', []);

            if (empty($cartData)) {
                return redirect()->route('front.cart.index');
            }
        }

        return view('frontend.cart.checkout', compact(
            'strTitle',
            'rowAdminData',
            'cartData',
            'user',
            'states',
            'resCouponsData',
            'promoCode',
            'shippingCharge',
            'verifiedSession'
        ));
    }
    public function fetchShipmentAmount(Request $request)
    {
        $order_type = $request->order_type ?? 'prepaid';
        $promoCode = Session::get('CART_COUPON'); 
        $promoDiscount = $promoCode ? $promoCode['discountAmount'] : 0;
        $adminShipping = ArThemeAdmin::where('id',1)->value('admin_min_order');
        $shippingCharge  = self::getTotalShipping($order_type);
        $shippingCharge  = number_format($shippingCharge,2);
        return response()->json(['status'=>'success','notification' => 'Shipment amount fetched successfully','shipment_amount'=>$shippingCharge,'admin_min_order'=>$adminShipping,'promoDiscount'=>$promoDiscount],200);
    }
    public function getTotalShipping($type='prepaid', $mode='retail')
    {
        $shipTotal = 0;
        $adminShipping = ArThemeAdmin::select('admin_prepaid_shipping_free','admin_shipping_cod_free')->first();
        
        if($mode == 'wholesale'){
            $totalItemWeight = $this->calculateWholesaleCartWeight();
        }else{
            if ($type == 'prepaid' && $adminShipping->admin_prepaid_shipping_free == 1) {
                return number_format(0, 2, '.', '');
            }else if ($type == 'cod' && $adminShipping->admin_shipping_cod_free == 1) {
                return number_format(0, 2, '.', '');
            }
            $totalItemWeight = $this->calculateCartWeight();
        }
        // Fetch all shipping charges
        $shippingCharges = ArShippingCharges::all();
        $shippingCharge = $shippingCharges
            ->filter(function ($charge) use ($totalItemWeight) {
                // Ensure weight_range format like "0-5"
                if (strpos($charge->weight_range, '-') === false) {
                    return false;
                }
                [$min, $max] = array_map('trim', explode('-', $charge->weight_range));
                $min = (float)$min;
                $max = (float)$max;
                return $totalItemWeight >= $min && $totalItemWeight <= $max;
            })
            ->pluck('charges')
            ->first();

        if ($shippingCharge !== null) {
            // Matching weight range found
            $shipTotal = (float)$shippingCharge;
        } else {
            // No match → fallback to maximum charge
            $shipTotal = (float) $shippingCharges->max('charges');
        }

        return number_format($shipTotal, 2, '.', '');
    }

    public function calculateCartWeight(){
        $rowUserInfo = Session::get('AR_USER');
        $cartItems = [];
        $weight = 0;
        if ($rowUserInfo) {
            // Logged-in user cart
            $cartItems = ArCart::where('cart_is_wholesale',0)->where('cart_user_id', $rowUserInfo->user_id)->get(['cart_product_id', 'cart_qty', 'cart_variation_id']);
            $this->cartClear($rowUserInfo->user_id);
            foreach ($cartItems as $cartitem) {
                $product = ArProduct::where('product_id', $cartitem->cart_product_id)
                    ->where('product_status', 1)->where('product_stock', '>', 0)
                    ->first();
                // ❌ Product not found → delete cart item
                if (!$product) {
                    $cartitem->delete();
                    continue;
                }
                // Simple Product
                if ($product->product_type == 0) {
                    $weight += (float) $product->product_weight * $cartitem->cart_qty;
                } else {
                    $variation = ArProductVariation::where('pv_id', $cartitem->cart_variation_id)->first();
                    // ❌ Variation not found → delete cart item
                    if (!$variation) {
                        $cartitem->delete();
                        continue;
                    }
                    $weight += (float) $variation->pv_weight * $cartitem->cart_qty;
                }
            }
        } else {
            // Guest user cart from session
            $cartSession = Session::get('CART_SESSION', []);
            $updatedSession = [];

            foreach ($cartSession as $key => $qty) {

                $parts = explode('##', $key);
                $productId = $parts[0];
                $variationId = $parts[1] ?? null;

                $product = ArProduct::where('product_id', $productId)
                    ->where('product_status', 1)->where('product_stock', '>', 0)
                    ->first();

                // ❌ Product not found → skip (do not re-add)
                if (!$product) {
                    continue;
                }

                // Simple Product
                if ($product->product_type == 0) {

                    $weight += (float) $product->product_weight * $qty;

                } else {
                    $variation = ArProductVariation::where('pv_id', $variationId)->first();
                    // ❌ Variation not found → skip
                    if (!$variation) {
                        continue;
                    }
                    $weight += (float) $variation->pv_weight * $qty;
                }
                // ✅ Only valid items added back
                $updatedSession[$key] = $qty;
            }
            // Replace session with cleaned cart
            Session::put('CART_SESSION', $updatedSession);
        }
        return $weight;
    }
    public function calculateWholesaleCartWeight(){
        $array=[];
        $rowUserInfo = Session::get('AR_USER');
        $cartItems = [];
        $weight = 0;
        if ($rowUserInfo) {
            // Logged-in user cart
            $cartItems = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $rowUserInfo->user_id)->get(['cart_product_id', 'cart_qty', 'cart_variation_id']);            
        }        
        foreach ($cartItems as $cartitem) {
            $pid = $cartitem->cart_product_id;
            $qty = $cartitem->cart_qty;
            $cartProduct = ArProduct::where('product_id',$pid)->where('product_status', 1)->where('product_wholesale', 1)->where('product_stock', '>', 0)->first(); 
            // ❌ Product not found → delete cart item
            if (!$cartProduct) {
                $cartitem->delete();
                continue;
            }
            if($cartProduct->product_type==0){
                $weight += (float)$cartProduct->product_weight*$qty;
            }else{
                $variationProduct = ArProductVariation::where('pv_id',$cartitem->cart_variation_id)->first();
                if (!$variationProduct) {
                    $cartitem->delete();
                    continue;
                } 
                if(isset($variationProduct)){
                    $weight += (float)$variationProduct->pv_weight*$qty;
                } 
            }  
        }
        return $weight;
    }
    public function getcartTotalShipping()
    {
        $user = Session::get('AR_USER');
        $resCartInfo = ArCart::where('cart_user_id', $user->user_id)->get();
        // $resCartInfo = Session::get('CART_SESSION');
        $intTotal = 0;
        if(isset($resCartInfo))
        {
            foreach($resCartInfo as $cartitem)
            {
                $pid = $cartitem->cart_product_id;
                $rowProductInfo = ArProduct::where('product_id',$pid)->first();
                if($rowProductInfo->product_type==0){
                    $intTotal +=  $rowProductInfo->product_selling_price*$cartitem->cart_qty;
                }else{
                    $variation = ArProductVariation::where('pv_id',$cartitem->cart_variation_id)->first();
                    if(isset($variation)){
                        $intTotal +=  $variation->pv_sellingprice*$cartitem->cart_qty;
                    }
                }
            }
        }
        return number_format($intTotal,2,'.','');
    }

    public function minicart(){
        $userSession = Session::get('AR_USER');
        if($userSession){
            $cartData = ArCart::where('cart_user_id', $userSession->user_id)->get();
        }else{
            $cartData = Session::get('CART_SESSION');
        }
        return view('frontend.elements.cart_sidebar',compact('cartData','userSession'));
    }

    public function sessionStoreAddress($addressid){
        $addressSession = Session::has('SELECTED_ADDRESS') ? Session::get('SELECTED_ADDRESS'):null;
        if(isset($addressSession) && $addressSession>0){
            Session::forget('SELECTED_ADDRESS'); 
        } 
        Session::put('SELECTED_ADDRESS',$addressid); 
        Session::save(); 
        return true;
        exit();
    }

    public function selectAddress(request $request)
    {
        $rowAdminData = ArThemeAdmin::first();
        if(isset($rowAdminData) && $rowAdminData->admin_agency_active>0){
            self::sessionStoreAddress($request->addressid);
            return response()->json(['message'=>'ok','notification' => 'Shipping Available','cod'=>true],200);
        }else{ 
            $shiprate = ArShippingRate::where('shipping_rate_checked',1)->first();
            if(isset($shiprate->shipping_rate_value) && $shiprate->shipping_rate_value == 1){
                self::sessionStoreAddress($request->addressid);
                return response()->json(['message'=>'ok','notification' => 'Shipping Available','cod'=>true],200); 
            }else if(isset($shiprate->shipping_rate_value) && $shiprate->shipping_rate_value == 2){
                $seladdr = ArUserAddress::where('ua_id',$request->addressid)->first();
                if($seladdr)
                {
                    $checkpincode = ArShippingPincode::where('shipping_pincodes',$seladdr->ua_ship_pincode)->first();
                    if($checkpincode)
                    {
                        if($checkpincode->shipping_pincodes_cod == 1)
                        {
                            self::sessionStoreAddress($request->addressid);
                            return response()->json(['message'=>'ok','notification' => 'Shipping Available','cod'=>true],200); 
                        }else{
                            self::sessionStoreAddress($request->addressid);
                            return response()->json(['message'=>'ok','notification' => 'Shipping Available','cod'=>false],200); 
                        }
                    }else{
                        return response()->json(['message'=>'failed','notification' => 'Sorry, shipping is not possible to this address. Try another one.'],200);  
                    }
                }
            }else if(isset($shiprate->shipping_rate_value) && $shiprate->shipping_rate_value == 3){
                return response()->json(['message'=>'failed','notification' => 'Sorry, shipping is not possible to this address. Try another one.'],200); 
            }else{
                return response()->json(['message'=>'failed','notification' => 'Sorry, shipping is not possible to this address. Try another one.'],200); 
            }
        }
    }

    public function fetchShipmentdata(Request $request){
        $userSession = Session::get('AR_USER');
        $addressSession = Session::has('SELECTED_ADDRESS') ? Session::get('SELECTED_ADDRESS'):null;
        $rowAdminData = ArThemeAdmin::first();
        $itemtotal = self::getcartTotalShipping();
        if(isset($rowAdminData) && $rowAdminData->admin_agency_active>0){
             
            $rowAgencyCredentials = ArShippingAgency::where('agency_type',$rowAdminData->admin_agency_active)->first();
            $authTokenStatus = $this->shiprocketAuthTokenGenarator($rowAdminData->admin_agency_active); 
            if(isset($rowAgencyCredentials) && $rowAgencyCredentials->agency_free_shipping==0){
                if($authTokenStatus->original['status']){
                    $selectedAddress = ArUserAddress::where('ua_id',$addressSession)->first();
                    $totalWeight = $this->calculateOrderWeight();
                    $serviceData = $this->checkCourierServiceability($rowAgencyCredentials->agency_pincode,$selectedAddress->ua_ship_pincode,$request->order_type,$totalWeight);
                    $array = array();
                    if(isset($serviceData['data'])){
                        foreach($serviceData['data']['available_courier_companies'] as $value){
                            $array[] = $value;
                        }
                        $numbers = array_column($array, 'rate');
                        $minValKey = array_keys($numbers, min($numbers));
                        Session::put('SHIPROCKET_SHIPP_DATA',$array[$minValKey[0]]); 
                        Session::save(); 
                        return response()->json(['message'=>'success','notification' => 'Shipment amount fetched successfully','shipment_amount'=>round(min($numbers))],200); 
                    }else{
                        return response()->json(['message'=>'success','notification' => 'Shipment amount fetched successfully','shipment_amount'=>0],200); 
                    }
                }else{
                    return response()->json(['message'=>'success','notification' => 'Shipment amount fetched successfully','shipment_amount'=>0],200); 
                }
            }else{
                return response()->json(['message'=>'success','notification' => 'Shipment amount fetched successfully','shipment_amount'=>0],200);   
            }
        }else{
            Session::forget('SHIPROCKET_SHIPP_DATA'); 
            $shiptype = ArThemeAdmin::first();
            if($itemtotal >= $shiptype->admin_shipping_free){
                return response()->json(['message'=>'success','notification' => 'Shipment amount fetched successfully','shipment_amount'=>0],200); 
            }else{
                $seladdr = ArUserAddress::where('ua_id',$addressSession)->first();
                $rowPincodeInfo = ArPincode::where('pin_id',$seladdr->ua_pin_id)->first();
                if($seladdr->ua_pin_id>0){
                    $rate = $shiptype->admin_notzone_amount;
                    if($shiptype->admin_shgipping_rule == 0){
                        $zone = ArZoneCity::where('zc_city_id',$rowPincodeInfo->pin_city_id)->where('zc_type',1)->first();
                        if(isset($zone) && $zone){
                            $shipAmount = ArShippingRateAmount::where('sra_zone_id',$zone->zc_zone_id)->where('sra_zone_type',1)->orderBy('sra_from')->get();  
                            foreach($shipAmount as $value){
                                if($value->sra_from<$itemtotal && $value->sra_to>=$itemtotal){
                                    $rate = $value->sra_rate;
                                } 
                            }
                        } 
                    }else if($shiptype->admin_shgipping_rule == 1){
                        $array=[];
                        // $cartData = Session::get('CART_SESSION');
                        $cartData = ArCart::where('cart_user_id', $userSession->user_id)->get();
                        foreach ($cartData as $value) {
                            $pid = $value->cart_product_id;
                            array_push($array,$pid);  
                        }
                        $product_weight = ArProduct::whereIn('product_id',$array)->sum('product_weight');
                        $zone = ArZoneCity::where('zc_city_id',$rowPincodeInfo->pin_city_id)->where('zc_type',1)->first();
                        if($product_weight>0){
                            if(isset($zone) && $zone){
                                $shipWeight = ArShippingRateWeight::where('srw_zone_id',$zone->zc_zone_id)->where('srw_zone_type',1)->orderBy('srw_from')->get();  
                                foreach($shipWeight as $value){
                                    if($value->srw_from<=$product_weight && $value->srw_to>=$product_weight){
                                        $rate = $value->srw_rate;
                                    }  
                                }
                            } 
                        } 
                    } 
                    return response()->json(['message'=>'success','notification' => 'Shipment amount fetched successfully','shipment_amount'=>intval($rate)],200); 
                }else{
                    $rate = $shiptype->admin_notzone_amount;
                    if($shiptype->admin_shipping_rule_other == 0){
                        $zone = ArZoneCity::where('zc_city_id',$seladdr->ua_country_id)->where('zc_type',0)->first();
                        if(isset($zone) && $zone){
                            $shipAmount = ArShippingRateAmount::where('sra_zone_id',$zone->zc_zone_id)->where('sra_zone_type',0)->orderBy('sra_from')->get();  
                            foreach($shipAmount as $value){
                                if($value->sra_from<$itemtotal && $value->sra_to>=$itemtotal){
                                    $rate = $value->sra_rate;
                                }
                            }
                        }
                    }else if($shiptype->admin_shipping_rule_other == 1){
                        $array = [];
                        $cartData = ArCart::where('cart_user_id', $userSession->user_id)->get();
                        foreach ($cartData as $value) {
                            $pid = $value->cart_product_id;
                            array_push($array,$pid);  
                        }
                        $product_weight = ArProduct::whereIn('product_id',$array)->sum('product_weight');
                        $zone = ArZoneCity::where('zc_city_id',$seladdr->ua_country_id)->where('zc_type',0)->first();
                        if($product_weight>0){
                            if(isset($zone) && $zone){
                                $shipWeight = ArShippingRateWeight::where('srw_zone_id',$zone->zc_zone_id)->where('srw_zone_type',0)->orderBy('srw_from')->get();  
                                foreach($shipWeight as $value){
                                    if($value->srw_from<=$product_weight && $value->srw_to>=$product_weight){
                                        $rate = $value->srw_rate;
                                    } 
                                }
                            } 
                        } 
                    } 
                    return response()->json(['message'=>'success','notification' => 'Shipment amount fetched successfully','shipment_amount'=>intval($rate)],200); 
                }
            }
        }
    }

    public function calculateShippingAmount($addressid=0,$itemtotal)
    {
        $rowAdminData = ArThemeAdmin::first();
        if(isset($rowAdminData) && $rowAdminData->admin_agency_active>0){
            $rowAgencyCredentials = ArShippingAgency::where('agency_type',$rowAdminData->admin_agency_active)->first();
            $authTokenStatus = $this->shiprocketAuthTokenGenarator($rowAdminData->admin_agency_active); 
            if(isset($rowAgencyCredentials) && $rowAgencyCredentials->agency_free_shipping==0){
                if($authTokenStatus->original['status']){
                    // return 2;
                    $selectedAddress = ArUserAddress::where('ua_id',$addressid)->first();
                    $totalWeight = $this->calculateOrderWeight();
                    $serviceData = $this->checkCourierServiceability($rowAgencyCredentials->agency_pincode,$selectedAddress->ua_ship_pincode,'1',$totalWeight);
                    $array = array();
                    if(isset($serviceData['status']) && $serviceData['status']==200){
                        foreach($serviceData['data']['available_courier_companies'] as $value){
                            $array[] = $value;
                        }
                        $numbers = array_column($array, 'rate');
                        $minValKey = array_keys($numbers, min($numbers));
                        Session::put('SHIPROCKET_SHIPP_DATA',$array[$minValKey[0]]); 
                        Session::save(); 
                        return round(min($numbers));
                    }else{
                        return 0;
                    }
                }else{
                    return 0;
                }
            }else{
                return 0;
            }
        }else{
            $shiptype = ArThemeAdmin::first();
            if($itemtotal >= $shiptype->admin_shipping_free){
                return 0; 
            }else{ 
                $seladdr = ArUserAddress::where('ua_id',$addressid)->first();
                $rowPincodeInfo = ArPincode::where('pin_id',$seladdr->ua_pin_id)->first();
                if($seladdr->ua_pin_id>0){
                    
                    $rate = $shiptype->admin_notzone_amount;
                    if($shiptype->admin_shgipping_rule == 0){
                        $zone = ArZoneCity::where('zc_city_id',$rowPincodeInfo->pin_city_id)->where('zc_type',1)->first();
                        if(isset($zone) && $zone){
                            $shipAmount = ArShippingRateAmount::where('sra_zone_id',$zone->zc_zone_id)->where('sra_zone_type',1)->orderBy('sra_from')->get();  
                            foreach($shipAmount as $value){
                                if($value->sra_from<$itemtotal && $value->sra_to>=$itemtotal){
                                    $rate = $value->sra_rate;
                                } 
                            }
                        } 
                    }else if($shiptype->admin_shgipping_rule == 1){
                        $array=[];
                        $cartData = Session::get('CART_SESSION');
                        foreach ($cartData as $key=>$value) {
                            $pid = explode("####",trim($key));
                            array_push($array,$pid[0]);  
                        }
                        $product_weight = ArProduct::whereIn('product_id',$array)->sum('product_weight');
                        $zone = ArZoneCity::where('zc_city_id',$rowPincodeInfo->pin_city_id)->where('zc_type',1)->first();
                        if($product_weight>0){
                            if(isset($zone) && $zone){
                                $shipWeight = ArShippingRateWeight::where('srw_zone_id',$zone->zc_zone_id)->where('srw_zone_type',1)->orderBy('srw_from')->get();  
                                foreach($shipWeight as $value){
                                    if($value->srw_from<=$product_weight && $value->srw_to>=$product_weight){
                                        $rate = $value->srw_rate;
                                    }  
                                }
                            } 
                        } 
                    } 
                    return intval($rate);
                }else{
                    $rate = $shiptype->admin_notzone_amount;
                    if($shiptype->admin_shipping_rule_other == 0){
                        $zone = ArZoneCity::where('zc_city_id',$seladdr->ua_country_id)->where('zc_type',0)->first();
                        if(isset($zone) && $zone){
                            $shipAmount = ArShippingRateAmount::where('sra_zone_id',$zone->zc_zone_id)->where('sra_zone_type',0)->orderBy('sra_from')->get();  
                            foreach($shipAmount as $value){
                                if($value->sra_from<$itemtotal && $value->sra_to>=$itemtotal){
                                    $rate = $value->sra_rate;
                                }
                            }
                        }
                    }else if($shiptype->admin_shipping_rule_other == 1){
                        $array = [];
                        $cartData = Session::get('CART_SESSION');
                        foreach ($cartData as $key=>$value) {
                            $pid = explode("####",trim($key));
                            array_push($array,$pid[0]);  
                        }
                        $product_weight = ArProduct::whereIn('product_id',$array)->sum('product_weight');
                        $zone = ArZoneCity::where('zc_city_id',$seladdr->ua_country_id)->where('zc_type',0)->first();
                        if($product_weight>0){
                            if(isset($zone) && $zone){
                                $shipWeight = ArShippingRateWeight::where('srw_zone_id',$zone->zc_zone_id)->where('srw_zone_type',0)->orderBy('srw_from')->get();  
                                foreach($shipWeight as $value){
                                    if($value->srw_from<=$product_weight && $value->srw_to>=$product_weight){
                                        $rate = $value->srw_rate;
                                    } 
                                }
                            } 
                        } 
                    } 
                    return intval($rate); 
                }
            }
        }
    }

    public function calculateOrderWeight(){
        $array=[];
        $user = Session::get('AR_USER');
        $cartData = ArCart::where('cart_user_id', $user->user_id)->get();
        // $cartData = Session::get('CART_SESSION');
        $weight = 0;
        foreach ($cartData as $cartitem) {
            $pid = $cartitem->cart_product_id;
            $qty = $cartitem->cart_qty;
            $cartProduct = ArProduct::where('product_id',$pid)->first(); 
            if($cartProduct->product_type==0){
                $weight += (float)$cartProduct->product_weight*$qty;
            }else{
                $variationProduct = ArProductVariation::where('pv_id',$cartitem->cart_variation_id)->first(); 
                if(isset($variationProduct)){
                    $weight += (float)$variationProduct->pv_weight*$qty;
                } 
            }  
        }
        return $weight;
    }

    public function getcartTotal()
    {
        $userSession = Session::has('AR_USER') ? Session::get('AR_USER'):[];
        $intTotal = 0;
        $itemTotal = 0;
        $totalDiscount = 0;
        if($userSession){
            $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)->get();
            if(isset($resCartInfo))
            {
                foreach($resCartInfo as $cartitem)
                {
                    $pid = $cartitem->cart_product_id;
                    $rowProductInfo = ArProduct::where('product_id',$pid)->first();
                    if(!$rowProductInfo){
                        continue;
                    }
                    if($rowProductInfo->product_type==0){
                        $intTotal +=  $rowProductInfo->product_selling_price*$cartitem->cart_qty;
                    }else{
                        $variation = ArProductVariation::where('pv_id',$cartitem->cart_variation_id)->first();                    
                        if(isset($variation)){
                            $intTotal +=  $variation->pv_sellingprice * $cartitem->cart_qty;
                        }
                    }
                }  

            }
        }else{
            $resCartInfo = Session::get('CART_SESSION');
            if(isset($resCartInfo))
            {
                foreach($resCartInfo as $product_id=>$cartitem)
                {
                    $pid = explode("####",trim($product_id));
                    $rowProductInfo = ArProduct::where('product_id',$pid[0])->first();
                    if(!$rowProductInfo){
                        continue;
                    }
                    if($rowProductInfo->product_type==0){
                        $intTotal +=  $rowProductInfo->product_selling_price*$cartitem;
                        $itemTotal +=  $rowProductInfo->product_price*$cartitem;
                        $totalDiscount +=  $rowProductInfo->product_discount*$cartitem;
                    }else{
                        $variation = ArProductVariation::where('pv_id',$pid[1])->first();                    
                        if(isset($variation)){
                            $intTotal +=  $variation->pv_sellingprice * $cartitem;
                            $itemTotal +=  $variation->pv_price*$cartitem;
                            $totalDiscount +=  $variation->pv_discount*$cartitem;
                        }
                    }
                }
            }
        }
        
        return [
            'intTotal' => number_format($intTotal, 2, '.', ''),
            'itemTotal' => number_format($itemTotal, 2, '.', ''),
            'totalDiscount' => number_format($totalDiscount, 2, '.', ''),
        ];
    }
    public function couponRemoveTotal()
    {
        $userSession = Session::has('AR_USER') ? Session::get('AR_USER'):[];
        $intTotal = 0;
        $itemTotal = 0;
        $totalDiscount = 0;
        if($userSession){
            
                $resCartInfo = ArCart::where('cart_is_wholesale',0)->where('cart_user_id', $userSession->user_id)->get();
            
            if(isset($resCartInfo))
            {
                foreach($resCartInfo as $cartitem)
                {
                    $pid = $cartitem->cart_product_id;
                    $rowProductInfo = ArProduct::where('product_id',$pid)->first();
                    if(!$rowProductInfo){
                        continue;
                    }
                    if($rowProductInfo->product_type==0){
                        
                            $intTotal +=  $rowProductInfo->product_selling_price*$cartitem->cart_qty;
                        
                    }else{
                        $variation = ArProductVariation::where('pv_id',$cartitem->cart_variation_id)->first();                    
                        if(isset($variation)){
                                $intTotal +=  $variation->pv_sellingprice * $cartitem->cart_qty;
                            
                        }
                    }
                }  

            }
        }else{
            $resCartInfo = Session::get('CART_SESSION');
            if(isset($resCartInfo))
            {
                foreach($resCartInfo as $product_id=>$cartitem)
                {
                    $pid = explode("####",trim($product_id));
                    $rowProductInfo = ArProduct::where('product_id',$pid[0])->first();
                    if(!$rowProductInfo){
                        continue;
                    }
                    if($rowProductInfo->product_type==0){
                        $intTotal +=  $rowProductInfo->product_selling_price*$cartitem;
                        $itemTotal +=  $rowProductInfo->product_price*$cartitem;
                        $totalDiscount +=  $rowProductInfo->product_discount*$cartitem;
                    }else{
                        $variation = ArProductVariation::where('pv_id',$pid[1])->first();                    
                        if(isset($variation)){
                            $intTotal +=  $variation->pv_sellingprice * $cartitem;
                            $itemTotal +=  $variation->pv_price*$cartitem;
                            $totalDiscount +=  $variation->pv_discount*$cartitem;
                        }
                    }
                }
            }
        }
        
        return [
            'intTotal' => number_format($intTotal, 2, '.', ''),
            'itemTotal' => number_format($itemTotal, 2, '.', ''),
            'totalDiscount' => number_format($totalDiscount, 2, '.', ''),
        ];
    }
    public function getcartNewTotal(Request $request)
    {
        $userSession = Session::has('AR_USER') ? Session::get('AR_USER'):[];
        $intTotal = 0;
        $itemTotal = 0;
        $totalDiscount = 0;
        if($userSession){
            if($request->type == 'wholesale'){
                $resCartInfo = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->get();
            }else{
                $resCartInfo = ArCart::where('cart_is_wholesale',0)->where('cart_user_id', $userSession->user_id)->get();
            }
            if(isset($resCartInfo))
            {
                foreach($resCartInfo as $cartitem)
                {
                    $pid = $cartitem->cart_product_id;
                    $rowProductInfo = ArProduct::where('product_id',$pid)->first();
                    if(!$rowProductInfo){
                        continue;
                    }
                    if($rowProductInfo->product_type==0){
                        if($request->type == 'wholesale'){
                            $intTotal +=  $rowProductInfo->product_wh_selling_price*$cartitem->cart_qty;
                        }else{
                            $intTotal +=  $rowProductInfo->product_selling_price*$cartitem->cart_qty;
                        }
                    }else{
                        $variation = ArProductVariation::where('pv_id',$cartitem->cart_variation_id)->first();                    
                        if(isset($variation)){
                            if($request->type == 'wholesale'){
                                $intTotal +=  $rowProductInfo->product_wh_selling_price*$cartitem->cart_qty;
                            }else{
                                $intTotal +=  $variation->pv_sellingprice * $cartitem->cart_qty;
                            }
                            
                        }
                    }
                }  

            }
        }else{
            $resCartInfo = Session::get('CART_SESSION');
            if(isset($resCartInfo))
            {
                foreach($resCartInfo as $product_id=>$cartitem)
                {
                    $pid = explode("####",trim($product_id));
                    $rowProductInfo = ArProduct::where('product_id',$pid[0])->first();
                    if(!$rowProductInfo){
                        continue;
                    }
                    if($rowProductInfo->product_type==0){
                        $intTotal +=  $rowProductInfo->product_selling_price*$cartitem;
                        $itemTotal +=  $rowProductInfo->product_price*$cartitem;
                        $totalDiscount +=  $rowProductInfo->product_discount*$cartitem;
                    }else{
                        $variation = ArProductVariation::where('pv_id',$pid[1])->first();                    
                        if(isset($variation)){
                            $intTotal +=  $variation->pv_sellingprice * $cartitem;
                            $itemTotal +=  $variation->pv_price*$cartitem;
                            $totalDiscount +=  $variation->pv_discount*$cartitem;
                        }
                    }
                }
            }
        }
        
        return [
            'intTotal' => number_format($intTotal, 2, '.', ''),
            'itemTotal' => number_format($itemTotal, 2, '.', ''),
            'totalDiscount' => number_format($totalDiscount, 2, '.', ''),
        ];
    }

    /* Remove Item From Cart Function */
    

    // public function removeitemfromcart(Request $request)
    // {
    //     $aryResponse = array();
    //     $cartSession = Session::get('CART_SESSION');
    //     // $cartSession = Session::get('CART_SESSION');
    //     if($request->isMethod('post')){
    //         if(isset($cartSession[$request->product_id])) {
    //             unset($cartSession[$request->product_id]);
    //             Session::put('CART_SESSION',$cartSession); 
    //             Session::save();
    //             $cartData = Session::get('CART_SESSION');
    //             $aryResponse['message'] = 'ok';
    //             $aryResponse['cartcount'] = count($cartData);
    //             $aryResponse['notification'] = 'Removed successfully';
    //         }else{
    //             $aryResponse['message'] = 'failed';
    //             $aryResponse['notification'] = 'Did not find any product';
    //         }
    //     }else{
    //         $aryResponse['message'] = 'failed';
    //         $aryResponse['notification'] = 'Invalid Method';
    //     }
    //     return response()->json(['data' =>$aryResponse]);
    // }


    function removefromfav(request $request ){
        $aryResponse = array();
        $customer = Session::get('AR_USER');
        $product_id = $request->product_id;
        $check = ArUserFavProduct::where('ufp_user_id',$customer->user_id)->where('ufp_product_id',$product_id)->first();
        if(isset($check->ufp_id)){
            ArUserFavProduct::where('ufp_id', $check->ufp_id)->delete();
        }else{
            return response()->json(['data' =>'not_found']);
        }
        $count = ArUserFavProduct::where('ufp_user_id',$customer->user_id)->where('ufp_status',1)->count();
        return response()->json(['data' =>'added_to_fav','count'=>$count]);
    }

    public function updatetocartcouponbyname(Request $request)
    {
        Session::forget('CART_COUPON'); 
        $aryResponse = [];
        $couponCode = $request->promocode;
        $amount     = $request->totalAmount;

        $now = Carbon::now();
        $dayName = $now->format('l');

        /* Fetch coupon */
        $resCouponInfo = ArPromos::where('promo_coupon_code', $couponCode)
            ->where('promo_status', 1)
            ->first();

        if (!$resCouponInfo) {
            return response()->json(['data' => [
                        'message' => 'fail',
                'notification' => 'Invalid coupon code'
                    ]]);
            
        }

        /* ===============================
        PROMO TYPE 0 → DATE BASED
        ================================ */
        if ($resCouponInfo->promo_type == 0) {

            if (
                $now->lt(Carbon::parse($resCouponInfo->promo_valid_from)) ||
                $now->gt(Carbon::parse($resCouponInfo->promo_valid_to))
            ) {
                return response()->json(['data' => [
                        'message' => 'fail',
                    'notification' => 'Coupon expired'
                    ]]);
            }
        }

        /* ===============================
        PROMO TYPE 1 → WEEKLY + TIME
        ================================ */
        if ($resCouponInfo->promo_type == 1) {

            // Check weekday
            if ($resCouponInfo->promo_week_day !== $dayName) {
            
                return response()->json(['data' => [
                        'message' => 'fail',
                    'notification' => 'Coupon not valid today'
                    ]]);
            }

            // Extract time window
            $promoStartTime = Carbon::parse($resCouponInfo->promo_valid_from)->format('H:i:s');
            $promoEndTime   = Carbon::parse($resCouponInfo->promo_valid_to)->format('H:i:s');

            // Apply today’s date
            $promoStartToday = Carbon::today()->setTimeFromTimeString($promoStartTime);
            $promoEndToday   = Carbon::today()->setTimeFromTimeString($promoEndTime);

            // Time validation
            if ($now->lt($promoStartToday) || $now->gt($promoEndToday)) {
                return response()->json(['data' => [
                        'message' => 'fail',
                    'notification' => 'Coupon not valid at this time'
                    ]]);
            }
        }

        $rowUserInfo = Session::get('AR_USER');

        if (!$resCouponInfo) {
            return response()->json(['data' => [
                'message'      => "fail",
                'notification' => "Invalid Coupon Code"
            ]]);
        }

        /** ================================
         *  First-time user condition
         *  ================================ */
        if ($resCouponInfo->promo_first_user == 1) {
            $userMobile = $rowUserInfo->user_mobile ?? $request->mobile ?? null;
            $userId     = $rowUserInfo->user_id ?? null;

            if ($userMobile) {
                $existingUser = ArUsers::where('user_mobile', $userMobile)->first();
                if ($existingUser) {
                    $checkOrders = ArTransactions::where('trans_user_id', $existingUser->user_id)->where('trans_payment_status',1)->count();
                    if ($checkOrders > 0) {
                        return response()->json(['data' => [
                            'message'      => "fail",
                            'notification' => "This coupon is only for first-time users."
                        ]]);
                    }
                }
            }
        }

        /** ================================
         *  Coupon usage & discount logic
         *  ================================ */
        $resTransactionsData = ArTransactions::where('trans_coupon_id', $resCouponInfo->promo_id)->where('trans_payment_status',1)->count();
        $resPerUserData = $rowUserInfo ? ArTransactions::where('trans_user_id', $rowUserInfo->user_id)
            ->where('trans_coupon_id', $resCouponInfo->promo_id)->where('trans_payment_status',1)->count() : 0;

        if ($resTransactionsData >= $resCouponInfo->promo_usage_limit) {
            return response()->json(['data' => [
                'message'      => "fail",
                'notification' => "Coupon usage limit is over."
            ]]);
        }

        if ($resPerUserData >= $resCouponInfo->promo_usage_user_limit) {
            return response()->json(['data' => [
                'message'      => "fail",
                'notification' => "You have already used this coupon."
            ]]);
        }

        /** ===================================================
         *  STEP 1: Get all category IDs allowed for this coupon
         *  =================================================== */
        $validCategoryIds = [];
        if (!empty($resCouponInfo->promo_cat_id) && $resCouponInfo->promo_cat_id != 0) {
            $validCategoryIds = ArCategory::where('cat_status', 1)
                ->where(function($q) use ($resCouponInfo) {
                    $q->where('cat_id', $resCouponInfo->promo_cat_id)
                    ->orWhere('cat_parent', $resCouponInfo->promo_cat_id);
                })
                ->pluck('cat_id')
                ->toArray();
        }
        /** ===================================================
         *  STEP 2: Collect cart items
         *  =================================================== */
        $cartItems = [];
        if ($rowUserInfo) {
            // Logged-in user cart
            $cartItems = ArCart::where('cart_is_wholesale',0)->where('cart_user_id', $rowUserInfo->user_id)->get(['cart_product_id', 'cart_qty', 'cart_variation_id']);
        } else {
            // Guest user cart from session
            $cartSession = Session::get('CART_SESSION', []);
            foreach ($cartSession as $key => $qty) {
                $parts = explode('##', $key);
                $cartItems[] = (object)[
                    'cart_product_id' => $parts[0],
                    'cart_qty' => $qty,
                    'cart_variation_id' => $parts[1] ?? null,
                ];
            }
        }

        /** ===================================================
         *  STEP 3: Calculate eligible subtotal
         *  =================================================== */
        $eligibleAmount = 0;
        foreach ($cartItems as $item) {
            $product = ArProduct::where('product_id', $item->cart_product_id)
                ->where('product_status', 1)
                ->first();

            if (!$product) continue;

            $productCategories = explode(',', $product->product_category_id);

            // Case 1: Coupon valid for ALL categories
            $isEligible = empty($validCategoryIds) 
                ? true 
                : (count(array_intersect($validCategoryIds, $productCategories)) > 0);

            if ($isEligible) {
                if ($product->product_type == 0) {
                    // Simple product
                    $eligibleAmount += $product->product_selling_price * $item->cart_qty;
                } else {
                    // Variation product
                    $variation = ArProductVariation::where('pv_id', $item->cart_variation_id)->first();
                    if ($variation) {
                        $eligibleAmount += $variation->pv_price * $item->cart_qty;
                    }
                }
            }
        }

        /** ===================================================
         *  STEP 4: Apply discount ONLY on eligibleAmount
         *  =================================================== */
        if ($eligibleAmount >= $resCouponInfo->promo_minimum_purchase) {
            if ($resCouponInfo->promo_discount_in == 0) {
                // Flat discount
                $discountAmount = min($resCouponInfo->promo_amount, $eligibleAmount);
            } else {
                // Percentage discount
                $discountAmount = ($eligibleAmount * $resCouponInfo->promo_amount / 100);
                if ($discountAmount > $resCouponInfo->promo_max_amount) {
                    $discountAmount = $resCouponInfo->promo_max_amount;
                }
            }

            $aryResponse['discountAmount'] = $discountAmount;
            $aryResponse['promo_id'] = $resCouponInfo->promo_id;
            $aryResponse['final_amount'] = $amount -$discountAmount;
            $aryResponse['promo_code'] = $resCouponInfo->promo_coupon_code;
            $aryResponse['message'] = "ok";
            $aryResponse['notification'] = $couponCode . " Coupon Code Successfully Applied.";

            Session::put('CART_COUPON', $aryResponse);
            Session::save();
        } else {
            $aryResponse['message'] = "fail";
            $aryResponse['notification'] = "Add ₹" . ($resCouponInfo->promo_minimum_purchase - $eligibleAmount) . " amount in eligible products to apply this coupon.";
        }

        return response()->json(['data' => $aryResponse]);
    }

    function removepromocode(Request $request){
        if($request->paymentMethod == 'online'){
            $shippingCharge  = self::getTotalShipping('prepaid','retail');
        }else{
            $shippingCharge  = self::getTotalShipping('cod');
        }
        $aryResponse = array();
        Session::forget('CART_COUPON'); 
        $total = self::couponRemoveTotal();
        $aryResponse['final_amount'] = $total['intTotal'] + $shippingCharge;
        $aryResponse['notification'] = "Coupon removed.";
        $aryResponse['message'] = "ok";
        return response()->json(['data' =>$aryResponse]);
    }


    function createRazorpayOrder(Request $request){
        $userSession = Session::get('AR_USER');
        $tempTransObj = new ArTempTransactions;
        $tempTransObj->temp_trans_order_id = self::getUniqueId(3);
        $tempTransObj->temp_trans_user_id = $userSession->user_id;
        $tempTransObj->temp_trans_amt = $request->payemntAmount;
        $tempTransObj->temp_trans_status = 0;
        $tempTransObj->temp_trans_method = $request->paymentMethod;
        $tempTransObj->temp_trans_payment_status = 0;
        if($tempTransObj->save())
        {
            $rowTempTransData = ArTempTransactions::where('temp_trans_id',$tempTransObj->temp_trans_id)->first(); 
            $resRazorpay = self::postOrderCurl($rowTempTransData->temp_trans_amt*100,$rowTempTransData->temp_trans_order_id);
            if(isset($resRazorpay)){
                ArTempTransactions::where('temp_trans_order_id',$resRazorpay['receipt'])->update(['temp_razorpay_order_id' => $resRazorpay['id']]);
                $rowTempTransUpdated = ArTempTransactions::where('temp_trans_id',$tempTransObj->temp_trans_id)->first(); 
                return response()->json(['notification' => 'Temp order created successfully','message' => 'ok','row_temp_trans' => $rowTempTransUpdated],200);
            }else{
                ArTempTransactions::where('temp_trans_order_id',$tempTransObj->temp_trans_id)->delete();
                return response()->json(['notification' => 'Order Did not create. Please try again','message' => 'failed'],200);
            }            
        }else{
            return response()->json(['notification' => 'Order Did not create. Please try again','message' => 'failed'],200);   
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
    
    /* **********************RAZORPAY INTEGRATION********************** */
    protected function postOrderCurl($amount,$orderID)
    {
        $rowAdminData = ArThemeAdmin::first(); 

        $razorpay = new Api($rowAdminData->admin_razorpay_key, $rowAdminData->admin_razorpay_secret);

        // Create a Razorpay Order
        $api = new Api($rowAdminData->admin_razorpay_key, $rowAdminData->admin_razorpay_secret);
        
        // Create an order
        $order = $api->order->create(array(
            // 'amount' => $amount, // Amount in paise (100 INR)
            'amount' => 100, // Amount in paise (100 INR)
            'currency' => 'INR',
            'receipt' => $orderID
        ));
        if ($order != "") {
            return $order->toArray();
        }
        return null;
        
    }

    public function getpaymentstatus($razorpay_payment_id){
        $rowAdminData = ArThemeAdmin::first(); 
        $api = new Api($rowAdminData->admin_razorpay_key, $rowAdminData->admin_razorpay_secret);
        $payment = $api->payment->fetch($razorpay_payment_id);
        if ($payment != "") {
            return $payment->toArray();
        }
        return null;
    } 

    public function paymentprocessing(Request $request)
    {
        $rowUserInfo = Session::get('AR_USER');
        $resUserData = ArUsers::where('user_id', $rowUserInfo->user_id)->first();
        $resCartInfo = ArCart::where('cart_user_id', $rowUserInfo->user_id)->get();
        $fee = ArThemeAdmin::where('id', 1)->value('admin_fixed_fee');
        $resCouponInfo = Session::get('CART_COUPON');
        $resShippmentInfo = Session::get('SHIPROCKET_SHIPP_DATA');    
        $addressSession = Session::get('SELECTED_ADDRESS');
        $resRazorpay = self::getpaymentstatus($request->trans_payment_ref);
        if(isset($resRazorpay)){
            if($resRazorpay['status']=='authorized' || $resRazorpay['status']=='captured')
            {
                $rowTempTransData = ArTempTransactions::where('temp_razorpay_order_id',$resRazorpay['order_id'])->first(); 
                $aryMainTransaction = new ArTransactions;
                $aryMainTransaction->trans_datetime = date('Y-m-d h:i:s');
                $aryMainTransaction->trans_order_number = $rowTempTransData->temp_trans_order_id;
                $aryMainTransaction->trans_amt = number_format($request->trans_payment,2,'.','');
                $aryMainTransaction->trans_currency = "₹";
                $aryMainTransaction->trans_method = $resRazorpay['method'];
                $aryMainTransaction->trans_response = json_encode($resRazorpay);
                $aryMainTransaction->trans_shipping_amount = number_format($request->trans_shipping_amount,2,'.','');
                $aryMainTransaction->trans_status = 1;
                $aryMainTransaction->trans_payment_status = 1;
                $aryMainTransaction->trans_ref_id = $request->trans_payment_ref;
                $aryMainTransaction->trans_address_id = $addressSession;
                $rowSelectedAddress = ArUserAddress::where('ua_id',$addressSession)->first();
                $aryMainTransaction->trans_billing_address = $rowSelectedAddress->ua_ship_house.', '.$rowSelectedAddress->ua_ship_address.', '.$rowSelectedAddress->ua_app_ship_city.', '.$rowSelectedAddress->ua_app_state_name.', '.$rowSelectedAddress->ua_ship_pincode;
                $aryMainTransaction->trans_delivery_address = $rowSelectedAddress->ua_ship_house.', '.$rowSelectedAddress->ua_ship_address.', '.$rowSelectedAddress->ua_app_ship_city.', '.$rowSelectedAddress->ua_app_state_name.', '.$rowSelectedAddress->ua_ship_pincode;
                $aryMainTransaction->trans_city = $rowSelectedAddress->ua_app_ship_city;
                $aryMainTransaction->trans_pincode = $rowSelectedAddress->ua_ship_pincode;
                $aryMainTransaction->trans_state = $rowSelectedAddress->ua_app_state_name;
                $aryMainTransaction->trans_country = 'India';
                $aryMainTransaction->trans_user_email = $resUserData->user_email;
                $aryMainTransaction->trans_user_id = $resUserData->user_id;
                $aryMainTransaction->trans_user_name = $resUserData->user_fname;
                $aryMainTransaction->trans_user_mobile = $resUserData->user_mobile;
                $aryMainTransaction->trans_discount_amount = number_format($request->trans_discount_amount,2,'.','');
                $aryMainTransaction->trans_coupon_id = isset($resCouponInfo)?$resCouponInfo['promo_id']:'0';
                $aryMainTransaction->trans_coupon_code = isset($resCouponInfo)?$resCouponInfo['promo_code']:'';
                $aryMainTransaction->trans_coupon_dis_amt = isset($resCouponInfo)?number_format($resCouponInfo['discountAmount'],2,'.',''):'';
                $aryMainTransaction->trans_shippment_data = json_encode($resShippmentInfo,true);
                $aryMainTransaction->save();
                $intTransId = $aryMainTransaction->trans_id;
                foreach($resCartInfo as $cartitem)
                {
                    $pid = $cartitem->cart_product_id;
                    $rowProductInfo =  ArProduct::where('product_id',$pid)->with(['taxBelongsTo'])->first();
                    $existOrderDetails = ArTransactionDetails::where('td_trans_id',$intTransId)->where('td_seller_id',$rowProductInfo->product_seller_id)->first();
                    $aryPostData = new ArTransactionDetails;
                    $aryPostData->td_order_id = (isset($existOrderDetails) && $existOrderDetails->td_id > 0) ? $existOrderDetails->td_order_id : self::getUniqueId(4);
                    $aryPostData->td_invoice_no = (isset($existOrderDetails) && $existOrderDetails->td_id > 0) ? $existOrderDetails->td_invoice_no : self::getUniqueId(5);
                    $aryPostData->td_trans_id  = $intTransId;
                    $aryPostData->td_item_id  = $pid;
                    $aryPostData->td_seller_id  = $rowProductInfo->product_seller_id;
                    $aryPostData->td_item_title  = $rowProductInfo->product_name;
                    $aryPostData->td_city = $rowSelectedAddress->ua_app_ship_city;
                    $aryPostData->td_pincode = $rowSelectedAddress->ua_ship_pincode;
                    $aryPostData->td_state = $rowSelectedAddress->ua_app_state_name;
                    $aryPostData->td_item_hsn = $rowProductInfo->product_saccode;
                    $aryPostData->td_item_commission = $rowProductInfo->product_cat_commission;
                    $aryPostData->td_item_commission_catid = $rowProductInfo->product_commission_catid;
                    $aryPostData->td_item_fixed_fee = $fee;
                    if($rowProductInfo->product_tax_id>0){
                        $aryPostData->td_gst = $rowProductInfo->taxBelongsTo->tax_rate;
                        $aryPostData->td_gst_name = $rowProductInfo->taxBelongsTo->tax_name;
                        $aryPostData->td_tax_id = $rowProductInfo->taxBelongsTo->tax_rate;
                    }
                    $aryPostData->td_country = 'India';
                    $aryPostData->td_user_id  = $rowUserInfo->user_id;
                    
                    $aryPostData->td_item_image  = (isset($rowProductInfo) && $rowProductInfo->product_image!='')?$rowProductInfo->product_image:url('/').'/public'.env('NO_IMAGE');
                    if ($rowProductInfo->product_type == 0) {
                        $this->handleSimpleProduct($aryPostData, $rowProductInfo, $cartitem);
                    } else {
                        $this->handleVariationProduct($aryPostData, $cartitem);
                    }
                    $aryPostData->save();
                }
                $this->createOrder($intTransId,'Prepaid'); 
                Session::put('TRANSACTION_ID',$aryMainTransaction->trans_order_number);  
                Session::save();
                $cartInfo = ArCart::where('cart_user_id', $rowUserInfo->user_id)->delete();            
                Session::forget('CART_COUPON');       
                Session::forget('SELECTED_ADDRESS'); 
                return redirect()->route('frontend.cart.thankyou');                
            }elseif($resRazorpay['status']=='refunded'){
                return redirect()->route('cart.checkout')->with('error', 'Transaction is refunded');
            }elseif($resRazorpay['status']=='failed'){
                return redirect()->route('cart.checkout')->with('error', 'Transaction is failed');
            }else{
                return redirect()->route('cart.checkout')->with('error', 'Sorry order can not process. Please, try again.');
            }
        }else{
            return redirect()->route('cart.checkout')->with('error', 'Payment id not found');
        }
    }

    public function paymentprocessingcod(Request $request){
        // $resCartInfo = Session::get('CART_SESSION');
        $rowUserInfo = Session::get('AR_USER');
        if($rowUserInfo){
            $resUserData = ArUsers::where('user_id', $rowUserInfo->user_id)->first();
            $resCartInfo = ArCart::where('cart_user_id', $rowUserInfo->user_id)->get();
            $fee = ArThemeAdmin::where('id', 1)->value('admin_fixed_fee');
            $resCouponInfo = Session::get('CART_COUPON');
            $resShippmentInfo = Session::get('SHIPROCKET_SHIPP_DATA');
        
            $addressSession = Session::get('SELECTED_ADDRESS');
            if(isset($resCartInfo) && count($resCartInfo)>0 && isset($rowUserInfo) && isset($addressSession))
            {
                $aryMainTransaction = new ArTransactions;
                $aryMainTransaction->trans_datetime = date('Y-m-d h:i:s');
                $aryMainTransaction->trans_order_number = self::getUniqueId(3);
                $aryMainTransaction->trans_amt = number_format($request->trans_payment,2,'.','');
                $aryMainTransaction->trans_currency = "₹";
                $aryMainTransaction->trans_method = $request->trans_payment_method;
                $aryMainTransaction->trans_shipping_amount = number_format($request->trans_shipping_amount,2,'.','');
                $aryMainTransaction->trans_status = 1;
                $aryMainTransaction->trans_payment_status = 0;
                $aryMainTransaction->trans_ref_id = '';
                $aryMainTransaction->trans_address_id = $addressSession;
                $rowSelectedAddress = ArUserAddress::where('ua_id',$addressSession)->first();
                $aryMainTransaction->trans_billing_address = $rowSelectedAddress->ua_ship_house.', '.$rowSelectedAddress->ua_ship_address.', '.$rowSelectedAddress->ua_app_ship_city.', '.$rowSelectedAddress->ua_app_state_name.', '.$rowSelectedAddress->ua_ship_pincode;
                $aryMainTransaction->trans_delivery_address = $rowSelectedAddress->ua_ship_house.', '.$rowSelectedAddress->ua_ship_address.', '.$rowSelectedAddress->ua_app_ship_city.', '.$rowSelectedAddress->ua_app_state_name.', '.$rowSelectedAddress->ua_ship_pincode;
                $aryMainTransaction->trans_city = $rowSelectedAddress->ua_app_ship_city;
                $aryMainTransaction->trans_pincode = $rowSelectedAddress->ua_ship_pincode;
                $aryMainTransaction->trans_state = $rowSelectedAddress->ua_app_state_name;
                $aryMainTransaction->trans_country = 'India';
                $aryMainTransaction->trans_user_email = $resUserData->user_email;
                $aryMainTransaction->trans_user_id = $resUserData->user_id;
                $aryMainTransaction->trans_user_name = $resUserData->user_fname;
                $aryMainTransaction->trans_user_mobile = $resUserData->user_mobile;
                $aryMainTransaction->trans_discount_amount = number_format($request->trans_discount_amount,2,'.','');
                $aryMainTransaction->trans_coupon_id = isset($resCouponInfo)?$resCouponInfo['promo_id']:'0';
                $aryMainTransaction->trans_coupon_code = isset($resCouponInfo)?$resCouponInfo['promo_code']:'';
                $aryMainTransaction->trans_coupon_dis_amt = isset($resCouponInfo)?number_format($resCouponInfo['discountAmount'],2,'.',''):'';
                $aryMainTransaction->trans_shippment_data = json_encode($resShippmentInfo,true);
                $aryMainTransaction->save();
                $intTransId = $aryMainTransaction->trans_id;
                foreach($resCartInfo as $cartitem)
                {
                    $pid = $cartitem->cart_product_id;
                    $rowProductInfo =  ArProduct::where('product_id',$pid)->with(['taxBelongsTo'])->first();
                    $existOrderDetails = ArTransactionDetails::where('td_trans_id',$intTransId)->where('td_seller_id',$rowProductInfo->product_seller_id)->first();
                    $aryPostData = new ArTransactionDetails;
                    $aryPostData->td_order_id = (isset($existOrderDetails) && $existOrderDetails->td_id > 0) ? $existOrderDetails->td_order_id : self::getUniqueId(4);
                    $aryPostData->td_invoice_no = (isset($existOrderDetails) && $existOrderDetails->td_id > 0) ? $existOrderDetails->td_invoice_no : self::getUniqueId(5);
                    $aryPostData->td_trans_id  = $intTransId;
                    $aryPostData->td_item_id  = $pid;
                    $aryPostData->td_seller_id  = $rowProductInfo->product_seller_id;
                    $aryPostData->td_item_title  = $rowProductInfo->product_name;
                    $aryPostData->td_city = $rowSelectedAddress->ua_app_ship_city;
                    $aryPostData->td_pincode = $rowSelectedAddress->ua_ship_pincode;
                    $aryPostData->td_state = $rowSelectedAddress->ua_app_state_name;
                    $aryPostData->td_item_hsn = $rowProductInfo->product_saccode;
                    $aryPostData->td_item_commission = $rowProductInfo->product_cat_commission;
                    $aryPostData->td_item_commission_catid = $rowProductInfo->product_commission_catid;
                    $aryPostData->td_item_fixed_fee = $fee;
                    if($rowProductInfo->product_tax_id>0){
                        $aryPostData->td_gst = $rowProductInfo->taxBelongsTo->tax_rate;
                        $aryPostData->td_gst_name = $rowProductInfo->taxBelongsTo->tax_name;
                        $aryPostData->td_tax_id = $rowProductInfo->taxBelongsTo->tax_rate;
                    }
                    $aryPostData->td_country = 'India';
                    $aryPostData->td_user_id  = $rowUserInfo->user_id;
                    
                    $aryPostData->td_item_image  = (isset($rowProductInfo) && $rowProductInfo->product_image!='')?$rowProductInfo->product_image:url('/').'/public'.env('NO_IMAGE');
                    if ($rowProductInfo->product_type == 0) {
                        $this->handleSimpleProduct($aryPostData, $rowProductInfo, $cartitem);
                    } else {
                        $this->handleVariationProduct($aryPostData, $cartitem);
                    }
                    $aryPostData->save();
                }
                $this->createOrder($intTransId,'COD'); 
                Session::put('TRANSACTION_ID',$aryMainTransaction->trans_order_number);  
                Session::save();
                $cartInfo = ArCart::where('cart_user_id', $rowUserInfo->user_id)->delete();            
                Session::forget('CART_COUPON');       
                Session::forget('SELECTED_ADDRESS'); 
                return redirect()->route('frontend.cart.thankyou');
            }else{
                return redirect()->route('cart.checkout')->with('error', 'Sorry order can not process. Please, try again.');
            }
        }else{
            return redirect()->route('front.home');     
        }
    }

    /* SHIPROCKET ORDER PLACE */ 
    public function createOrder($intTransId,$payment_method)
    {
        $rowTransDetailsData = ArTransactionDetails::where('td_trans_id',$intTransId)->get();
        $transDetailGroupBy = [];
        foreach($rowTransDetailsData as $value){
            if (!isset($transDetailGroupBy[$value->td_seller_id])) {
                $transDetailGroupBy[$value->td_seller_id] = [];
            }
            $transDetailGroupBy[$value->td_seller_id][] = $value;
        }
        $rowAdminData = ArThemeAdmin::first();
        $jsonDataTest = [];
        foreach($transDetailGroupBy as $key=>$value)
        {
            $rowSellerData = ArSeller::where('seller_id',$key)->first();
            if(isset($value) && count($value))
            {
                //$payment_method = 'COD';
                $rowTransData = ArTransactions::where('trans_id',$value[0]->td_trans_id)
                    ->select(
                        'trans_id','trans_datetime','trans_user_name',
                        'trans_billing_address','trans_city','trans_pincode',
                        'trans_state','trans_country','trans_user_email',
                        'trans_user_mobile','trans_city','trans_city','trans_city')
                    ->first();
                $dimentions = $this->calculateOrderDimentions($value);
                $order_items = $this->orderItems($value);
                $subTotal = 0.00;
                foreach ($order_items as $item) {
                    $subTotal += (float) $item['selling_price'] * (float) $item['units'];
                }
                $postData['order_id'] = $value[0]->td_order_id;
                $postData['order_date'] = date('Y-m-d',strtotime($rowTransData->trans_datetime));
                $postData['pickup_location'] = $rowSellerData->seller_pickup_location;
                $postData['channel_id'] = '';
                $postData['comment'] = "";
                $postData['reseller_name'] = "";
                $postData['company_name'] = "";
                $postData['billing_customer_name'] = $rowTransData->trans_user_name;
                $postData['billing_last_name'] = "";
                $postData['billing_address'] = $rowTransData->trans_billing_address;
                $postData['billing_address_2'] = "";
                $postData['billing_isd_code'] = "";
                $postData['billing_city'] = $rowTransData->trans_city;
                $postData['billing_pincode'] = $rowTransData->trans_pincode;
                $postData['billing_state'] = $rowTransData->trans_state;
                $postData['billing_country'] = $rowTransData->trans_country;
                $postData['billing_email'] = $rowTransData->trans_user_email;
                $postData['billing_phone'] = $rowTransData->trans_user_mobile; 
                $postData['billing_alternate_phone'] = "";
                $postData['shipping_is_billing'] = "1";
                $postData['shipping_customer_name'] = "";
                $postData['shipping_last_name'] = "";
                $postData['shipping_address'] = "";
                $postData['shipping_address_2'] = "";
                $postData['shipping_city'] = "";
                $postData['shipping_pincode'] = "";
                $postData['shipping_country'] = "";
                $postData['shipping_state'] = "";
                $postData['shipping_email'] = "";
                $postData['shipping_phone'] = "";
                $postData['order_items'] = $order_items;
                $postData['payment_method'] = $payment_method;
                $postData['shipping_charges'] = "";
                $postData['giftwrap_charges'] = "";
                $postData['transaction_charges'] = "";
                $postData['total_discount'] = "";
                $postData['sub_total'] = (float) $subTotal;
                $postData['length'] = $dimentions['length'];
                $postData['breadth'] = $dimentions['width'];
                $postData['height'] = $dimentions['height'];
                $postData['weight'] = $dimentions['weight'];
                $postData['ewaybill_no'] = "";
                $postData['customer_gstin'] = "";
                $postData['invoice_number'] = "";
                $postData['order_type'] = "";
                //$jsonDataTest[] = $postData;
                $data = json_encode($postData);
                $customeOrderData = $this->createCustomOrder($rowAdminData->admin_agency_active,$data); 
                if($customeOrderData['status_code'] == 1){
                    ArTransactionDetails::where('td_order_id',$value[0]->td_order_id)
                        ->update(
                            [
                                'td_shiprocket_order_response'=>json_encode($customeOrderData,true),
                                'td_item_status'=>1
                            ]);
                    //return true;
                }else{
                    ArTransactionDetails::where('td_order_id',$value[0]->td_order_id)
                        ->update(
                            [
                                'td_shiprocket_order_response'=>json_encode($customeOrderData,true),
                                'td_item_status'=>1
                            ]);
                    //return false;
                }
            }
        }
       // return $jsonDataTest;
    }

    public function orderItems($rowTransDetailsData){
        //$rowTransDetailsData = ArTransactionDetails::where('td_id',$td_id)->get();
        $array = [];
        foreach ($rowTransDetailsData as $key=>$value) {
            $response['name'] = $value->td_item_title;
            $response['sku'] = $value->td_item_sku;
            $response['units'] = $value->td_item_qty;
            $response['selling_price'] = number_format($value->td_item_sellling_price,2);
            $response['discount'] = 0;
            $response['tax'] = 0;
            $response['hsn'] = (int)$value->td_item_hsn;
            array_push($array,$response);
        }
        return $array;
    } 

    public function calculateOrderDimentions($rowTransDetailsData){
        //$rowTransDetailsData = ArTransactionDetails::where('td_id',$td_id)->get();
        $weight = 0; $height = 0; $width = 0; $length = 0;
        foreach ($rowTransDetailsData as $key=>$value) {
            $weight += $value->td_item_weight; 
            $height += $value->td_item_height; 
            $width = $value->td_item_width; 
            $length = $value->td_item_length;
        }
        $response['weight'] = number_format((float)$weight,3);
        $response['height'] = (float)$height;
        $response['width'] = (float)$width;
        $response['length'] = (float)$length;
        return $response;
    } 

    protected function handleSimpleProduct(&$aryPostData, $rowProductInfo, $cartitem)
{
    $aryPostData->td_item_net_price = $rowProductInfo->product_price;
    $aryPostData->td_item_sellling_price = $rowProductInfo->product_selling_price;
    $aryPostData->td_item_qty = $cartitem->cart_qty;
    $aryPostData->td_item_total = $cartitem->cart_qty * $rowProductInfo->product_selling_price;
    $aryPostData->td_item_weight = $rowProductInfo->product_weight ?? 0.200;
    $aryPostData->td_item_length = $rowProductInfo->product_length ?? 20;
    $aryPostData->td_item_width = $rowProductInfo->product_width ?? 10;
    $aryPostData->td_item_height = $rowProductInfo->product_height ?? 10;
    $aryPostData->td_item_sku = $rowProductInfo->product_sku;

    // Update product stock
    $qty = $rowProductInfo->product_stock - $cartitem->cart_qty;
    ArProduct::where('product_id', $rowProductInfo->product_id)->update(['product_stock' => abs($qty)]);
}

protected function handleVariationProduct(&$aryPostData, $cartitem)
{
    $variationProduct = ArProductVariation::where('pv_id', $cartitem->cart_variation_id)->first(); 
    $aryPostData->td_item_net_price = $variationProduct->pv_price;
    $aryPostData->td_item_sellling_price = $variationProduct->pv_sellingprice;
    $aryPostData->td_item_qty = $cartitem->cart_qty;
    $aryPostData->td_item_total = $cartitem->cart_qty * $variationProduct->pv_sellingprice;
    $aryPostData->td_item_weight = $variationProduct->pv_weight ?? 0.200;
    $aryPostData->td_item_length = $variationProduct->pv_length ?? 20;
    $aryPostData->td_item_width = $variationProduct->pv_width ?? 10;
    $aryPostData->td_item_height = $variationProduct->pv_height ?? 10;
    $aryPostData->td_item_sku = $variationProduct->pv_sku;

    $variation = explode(',', $variationProduct->pv_variation_extra);
    if (count($variation) > 0) {
        $aryPostData->td_item_unit = $variation[0] ?? '';
        $aryPostData->td_item_color = $variation[1] ?? '';
        $aryPostData->td_item_img = $variation[2] ?? '';
    }

    // Update variation stock
    $qty = $variationProduct->pv_quantity - $cartitem->cart_qty;
    ArProductVariation::where('pv_id', $cartitem->cart_variation_id)->update(['pv_quantity' => abs($qty)]);
}



    // Add product to cart
    public function addToCart(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:ar_products,product_id',
            'quantity'   => 'required|integer|min:1'
        ]);

        $product = ArProduct::where('product_id', $request->product_id)->first();
        $cart = session()->get('cart', []);

        // if product exists in cart, increase quantity
        if (isset($cart[$product->product_id])) {
            $cart[$product->product_id]['quantity'] += $request->quantity;
        } else {
            // otherwise add new item
            $cart[$product->product_id] = [
                'id'       => $product->product_id,
                'name'     => $product->name,
                'price'    => $product->price,
                'image'    => $product->image, // adjust field name
                'quantity' => $request->quantity,
            ];
        }

        // save back to session
        session()->put('cart', $cart);

        // prepare updated cart modal html
        $html = view('frontend.partials.cart_modal', ['cartItems' => $cart])->render();

        return response()->json([
            'success' => true,
            'message' => "{$product->name} added to cart.",
            'html'    => $html
        ]);
    }
}
