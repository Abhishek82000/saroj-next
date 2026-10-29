<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArCategory;
use App\Models\ArProduct;
use App\Models\ArProductAttribute;
use App\Models\ArTestimonials;
use App\Models\ArProductAttributeDetail;
use App\Models\ArProductAttributeterms;
use App\Models\ArProductVariation;
use App\Models\ArProductBrand;
use App\Models\ArUserFavProduct;
use App\Models\ArProductReview;
use App\Models\ArPromos;
use App\Models\ArUsers;
use App\Models\ArCart;
use App\Models\ArProductTags;
use App\Models\ArPages;
use App\Models\ArThemeAdmin;
use App\Models\ArProductByCategory;
use App\Models\ArAppearanceSlider;
use DB;
use Hash;
use Session;
use URL;

class WholesaleController extends Controller
{
    
    function searchproduct(Request $request)
    {
        if(isset($request->searchstring))
        {
            $resProductData = ArProduct::where('product_name','LIKE','%'.$request->searchstring.'%')
                ->orWhere('product_category_name','LIKE','%'.$request->searchstring.'%')
                ->orWhere('product_tag_name','LIKE','%'.$request->searchstring.'%')->get();
            foreach($resProductData as $rowProductData)
            {
                echo '<li><a href="'.env('APP_URL').'product/product-detail/'.$rowProductData->product_slug.'">'.$rowProductData->product_name.'</a></li>';
            }
        }
        exit();
    }

    // Wholesale Function 
    public function productWholesaleList($slug=null)
    {
        $tags = '';
        $category = ArCategory::where('cat_slug',$slug)->where('cat_is_wholesale',1)->first();
        $productIds = ArProductByCategory::where('cpc_category_id',$category->cat_id)->pluck('cpc_product_id')->toArray();
        $products = ArProduct::where('product_wholesale',1)->whereIn('product_id', $productIds)->where('product_wh_selling_price','>',0)->where('product_wh_mrp_price','>',0)->where('product_stock','>',5)->with(['images'])->inRandomOrder()->select('product_name','product_wh_mrp_price','product_wh_selling_price','product_image','product_slug','product_label_name','product_type','product_id','product_img_alt')->get();
        $categoryList = ArCategory::where('cat_is_wholesale',1)->where('cat_status',1)->where('cat_parent',0)->orderBy('cat_order','ASC')->get();
        $tagsList = ArProductTags::where('tag_status',1)->orderBy('tag_id','DESC')->get();
        $firstBreadCrum = "Category";
        $secondBreadCrum = $category->cat_name;
        $title = 'Category Product';
        $attributes = ArProductAttribute::where('attribute_status',1)->with('attributeterms')->get();
        $brands = ArProductBrand::where('brand_status',1)->get();
		$meta_keyword = "";
        $meta_description = "";
        $meta_title = "";
        if(isset($category) && $category->cat_id>0){
            $title = $category->cat_name;
            $meta_keyword = $category->cat_meta_keyword;
            $meta_description = $category->cat_meta_desc;
            $meta_title = $category->cat_meta_title;
        }
        if(isset($category->cat_image) && $category->cat_image !=''){
            $strImages = env('CATEGORY_IMAGE').$category->cat_image;
        }else{
            $strImages = env('SETTING_IMAGE').$this->settingData->logo;
        }
        return view('frontend.wholesale.product_wholesale_list',compact('title','strImages','category','products','categoryList','firstBreadCrum','secondBreadCrum','slug','attributes','brands','meta_keyword','meta_description','meta_title','tagsList','tags'));
    }
    public function catWholesaleList($slug=null)
    {
        $topSlider = ArAppearanceSlider::where('slider_status', 1)
        ->where('slider_position', 1)->where('slider_is_wholesale', 1)
        ->with(['category:cat_id,cat_name,cat_slug', 'tag:tag_id,tag_name,tag_slug'])
        ->limit(5)
        ->orderBy('slider_id', 'DESC')
        ->select('slider_id', 'slider_name', 'slider_desc', 'slider_image', 'slider_url', 'slider_category', 'slider_tags', 'slider_image_mobile', 'slider_image_mac','slider_type')
        ->get();
        $categoryHigh = ArCategory::whereIn('cat_id',[24,19,54,55,65])->where('cat_status',1)->where('cat_is_wholesale',1)->orderBy('cat_order','ASC')->get();   
        $categoryRayon = ArCategory::whereIn('cat_id',[45,46])->where('cat_status',1)->where('cat_is_wholesale',1)->orderBy('cat_order','ASC')->get(); 
        $catShowHomePage = ArCategory::where('cat_show_on_app_home', 1)->where('cat_is_wholesale',1)->where('cat_status', 1)->orderBy('cat_order','ASC')
        ->with(['catProducts' => function($query) {
            $query->where('product_stock', '>', 0)
                    ->where('product_wholesale', 1)
                    ->where('product_featured', 1)
                    ->orderBy('product_recommended', 'DESC')
                    ->with('gallery')
                    ->select('product_id', 'product_name', 'product_wh_mrp_price', 
                            'product_wh_selling_price', 'product_image', 'product_slug', 
                            'product_moq', 'product_stock', 'product_inventory', 
                            'product_type', 'product_label_name', 'product_rating', 
                            'product_review','product_img_alt','product_image_cdn')
                    ->limit(48);
        }])
        ->get();
        $testimonials = ArTestimonials::where('testimonial_status', 1)
        ->where('testimonial_featured', 1)
        ->orderBy('testimonial_id', 'DESC')
        ->limit(8)
        ->get();
        $categoryList = ArCategory::where('cat_status',1)->where('cat_featured', 0)->where('cat_is_wholesale',1)->orderBy('cat_order','ASC')->get();   
          
        $title = 'Category Wholesale';
        return view('frontend.wholesale.wholesale_cat',compact('title','categoryList','topSlider','testimonials','categoryHigh','categoryRayon','catShowHomePage'));
    }

    public function wholesalecart(){ 
        $userSession = Session::get('AR_USER');
        if(isset($userSession) && $userSession->user_id >0){        
            $promoCode = Session::get('CART_COUPON'); 
            $resFavCoupons = ArPromos::where('promo_featured',1)->where('promo_status',1)->orderBy('promo_id','DESC')->get();
            $currDateTime = date("Y-m-d");
            $resCouponsData = ArPromos::where('promo_status',1)->where('promo_valid_to','>',$currDateTime)->get();
            $rowThemeData = ArThemeAdmin::first();
            $cartData = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->get();            
            $strTitle = 'Cart';
            return view('frontend.wholesale.wholesale_cart',compact('strTitle','cartData','userSession','promoCode','resFavCoupons','resCouponsData','rowThemeData'));        
        }else{
            return redirect()->route('front.home');
        }
    }
    public function plustocartAll(Request $request)
    {
        // Early validation
        if (!$request->isMethod('post')) {
            return $this->jsonError('Invalid Method');
        }

        $userSession = Session::get('AR_USER');
        $qty = (float) $request->qty;
        $type = ($request->type == 0)? 'set':'increment'; 
        // Clear coupon session
        Session::forget('CART_COUPON');
        try {
            if ($userSession) {
                return $this->handleLoggedInUserAll($request, $userSession, $qty, $type);
            } else {
                return $this->handleGuestUser($request, $qty, $type);
            }
        } catch (Exception $e) {
            return $this->jsonError('Something went wrong. Please try again.');
        }
    }
    public function plustocartwholesale(Request $request)
    {
        // Early validation
        if (!$request->isMethod('post')) {
            return $this->jsonError('Invalid Method');
        }

        $userSession = Session::get('AR_USER');
        $qty = (float) $request->qty;
        $type = ($request->type == 0)? 'set':'increment'; 
        // Clear coupon session
        Session::forget('CART_COUPON');
        try {
            if ($userSession) {
                return $this->handleLoggedInUser($request, $userSession, $qty, $type);
            } else {
                return $this->jsonError('Please log in to update cart');
            }
        } catch (Exception $e) {
            return $this->jsonError('Something went wrong. Please try again.');
        }
    }
    private function handleGuestUser(Request $request, float $qty, string $type)
    {
        $cartSession = Session::get('CART_SESSION', []);
        
        // Generate cart key
        $cartKey = $request->product_id;
        if (!empty($request->variationid)) {
            $cartKey .= '####' . $request->variationid;
        }

        // Determine final quantity based on type
        $currentQty = $cartSession[$cartKey] ?? 0;
        if ($type === 'set') {
            $finalQty = $qty;
        } else { // increment
            $finalQty = $currentQty + 1; // Always increment by 1 regardless of $qty
        }
        
        // Check max order limit
        $maxOrderCheck = $this->checkMaxOrder(
            $request->product_id, 
            $finalQty, 
            $request->variationid ?? null
        );

        if (!$maxOrderCheck['status']) {
            return $this->jsonError($maxOrderCheck['message']);
        }

        // Update session cart based on type
        if ($type === 'set') {
            $cartSession[$cartKey] = $qty;
        } else {
            $cartSession[$cartKey] = $currentQty + 1; // Increment by 1
        }
        
        Session::put('CART_SESSION', $cartSession);

        // Get updated totals
        $total = $this->getcartTotal();

        return $this->jsonSuccess([
            'cartqty' => $cartSession[$cartKey],
            'cart' => $cartSession,
            'cartcount' => array_sum($cartSession),
        ], $total);
    }

    private function handleLoggedInUser(Request $request, $userSession, float $qty, string $type)
    {
        $cartItem = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)
            ->where('cart_product_id', $request->product_id)
            ->first();

        if (!$cartItem) {
            return $this->jsonError('Cart item not found');
        }

        // Check max order limit
        $maxOrderCheck = $this->checkMaxOrder(
            $cartItem->cart_product_id, 
            $qty, 
            $cartItem->cart_variation_id
        );

        if (!$maxOrderCheck['status']) {
            return $this->jsonError($maxOrderCheck['message']);
        }

        if ($type === 'set') {
            $finalQty = $qty;
        } else { // increment
            $finalQty = $cartItem->cart_qty + 1; // Always increment by 1 regardless of $qty
        }
        // Update quantity
        $cartItem->cart_qty = $finalQty;
        $cartItem->save();

        // Get updated totals
        $total = $this->plustoCartTotal();
        $userCartItems = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->get();

        return $this->jsonSuccess([
            'cartqty' => $cartItem->cart_qty,
            'cart' => $userCartItems,
            'cartcount' => $userCartItems->count(),
        ], $total);
    }
    private function handleLoggedInUserAll(Request $request, $userSession, float $qty, string $type)
    {
        $cartItem = ArCart::where('cart_user_id', $userSession->user_id)
            ->where('cart_product_id', $request->product_id)
            ->first();

        if (!$cartItem) {
            return $this->jsonError('Cart item not found');
        }

        // Check max order limit
        $maxOrderCheck = $this->checkMaxOrder(
            $cartItem->cart_product_id, 
            $qty, 
            $cartItem->cart_variation_id
        );

        if (!$maxOrderCheck['status']) {
            return $this->jsonError($maxOrderCheck['message']);
        }

        if ($type === 'set') {
            $finalQty = $qty;
        } else { // increment
            $finalQty = $cartItem->cart_qty + 1; // Always increment by 1 regardless of $qty
        }
        // Update quantity
        $cartItem->cart_qty = $finalQty;
        $cartItem->save();

        // Get updated totals
        $total = $this->plustoCartTotalAll();
        $userCartItems = ArCart::where('cart_user_id', $userSession->user_id)->get();

        return $this->jsonSuccess([
            'cartqty' => $cartItem->cart_qty,
            'cart' => $userCartItems,
            'cartcount' => $userCartItems->count(),
        ], $total);
    }
    private function jsonSuccess(array $cartData, array $total)
    {
        return response()->json([
            'data' => array_merge([
                'message' => 'ok',
                'cartitemtotal' => $total['itemTotal'],
                'cartdiscount' => $total['totalDiscount'],
                'carttotal' => $total['intTotal'],
                'cartamount' => $total['intTotal'],
            ], $cartData)
        ]);
    }

    private function jsonError(string $message)
    {
        return response()->json([
            'data' => [
                'message' => 'failed',
                'notification' => $message
            ]
        ]);
    }
    public function checkMaxOrder($productid=0,$quantity=0,$variationid=0){
        $aryResponse = array();
        $userSession = Session::has('AR_USER') ? Session::get('AR_USER'):[];
        $rowProductData = ArProduct::where('product_id',$productid)->first();
        if (!$rowProductData) {
            $aryResponse['status'] = false;
            $aryResponse['message'] = 'Product not found.';
            return $aryResponse;
        }
        if($userSession){
            $resCartInfo = ArCart::where('cart_is_wholesale',1)->where('cart_user_id',$userSession->user_id)->where('cart_product_id',$productid)->first();
            if($variationid>0){
                $variation = ArProductVariation::where('pv_id',$variationid)->first();
                if(isset($rowProductData) && isset($resCartInfo)){
                    if($variation->pv_quantity == 0){
                        $aryResponse['status'] = false;
                        $aryResponse['message'] = 'Product is out of stock';
                    }else{
                        if($resCartInfo->cart_qty + $quantity <= $variation->pv_moq){
                            $aryResponse['status'] = true;
                            $aryResponse['message'] = 'Product added successfully!';
                        }else{
                            $aryResponse['status'] = false;
                            $aryResponse['message'] = 'Quantity exceeds stock.!';
                        }
                    } 
                }else{
                    if($variation->pv_quantity == 0){
                        $aryResponse['status'] = false;
                        $aryResponse['message'] = 'Product is out of stock';
                    }else{
                        if($quantity <= $variation->pv_moq){
                            $aryResponse['status'] = true;
                            $aryResponse['message'] = 'Product added successfully!';
                        }else{
                            $aryResponse['status'] = false;
                            $aryResponse['message'] = 'Quantity exceeds stock.!';
                        }
                    }
                }
            }else{
                if(isset($rowProductData) && isset($resCartInfo)){
                    if($resCartInfo->cart_qty+1 <= $rowProductData->product_moq){
                        if($rowProductData->product_inventory==1){
                            if($rowProductData->product_backorder==0){
                                if($resCartInfo->cart_qty+1 <= $rowProductData->product_stock){
                                    $aryResponse['status'] = true;
                                    $aryResponse['message'] = 'Product added successfully!';
                                }else{
                                    $aryResponse['status'] = false;
                                    $aryResponse['message'] = 'Product is out of stock';
                                }
                            }else{
                                if($rowProductData->product_stock>0){
                                    if($resCartInfo->cart_qty+1 <= $rowProductData->product_stock){
                                        $aryResponse['status'] = true;
                                        $aryResponse['message'] = 'Product added successfully!';
                                    }else{
                                        $aryResponse['status'] = false;
                                        $aryResponse['message'] = 'Product is out of stock';
                                    }
                                }else{
                                    $aryResponse['status'] = true;
                                    $aryResponse['message'] = 'Product added successfully!';
                                }
                            }
                        }else{
                            $aryResponse['status'] = true;
                            $aryResponse['message'] = 'Product added successfully!';
                        }
                    }else{
                        $aryResponse['status'] = false;
                        $aryResponse['message'] = 'Quantity exceeds stock.!';
                    }
                }else{
                    $aryResponse['status'] = true;
                    $aryResponse['message'] = 'Product added successfully!';
                }
            }
        }else{
            $cartSession = Session::get('CART_SESSION');
            if($variationid>0){
                $strId = $productid.'####'.$variationid;
                $variation = ArProductVariation::where('pv_id',$variationid)->first();
                if(isset($rowProductData) && isset($cartSession[$strId])){
                    if($variation->pv_quantity == 0){
                        $aryResponse['status'] = false;
                        $aryResponse['message'] = 'Product is out of stock';
                    }else{
                        if($cartSession[$strId]+$quantity <= $variation->pv_quantity){
                            $aryResponse['status'] = true;
                            $aryResponse['message'] = 'Product added successfully!';
                        }else{
                            $aryResponse['status'] = false;
                            $aryResponse['message'] = 'Quantity exceeds stock.!';
                        }
                    } 
                }else{
                    if($variation->pv_quantity == 0){
                        $aryResponse['status'] = false;
                        $aryResponse['message'] = 'Product is out of stock';
                    }else{
                        if($quantity <= $variation->pv_quantity){
                            $aryResponse['status'] = true;
                            $aryResponse['message'] = 'Product added successfully!';
                        }else{
                            $aryResponse['status'] = false;
                            $aryResponse['message'] = 'Quantity exceeds stock.!';
                        }
                    }
                }
            }else{
                if(isset($rowProductData) && isset($cartSession[$productid])){
                    if($cartSession[$productid]+1 <= $rowProductData->product_stock){
                        if($rowProductData->product_inventory==1){
                            if($rowProductData->product_backorder==0){
                                if($cartSession[$productid]+1 <= $rowProductData->product_stock){
                                    $aryResponse['status'] = true;
                                    $aryResponse['message'] = 'Product added successfully!';
                                }else{
                                    $aryResponse['status'] = false;
                                    $aryResponse['message'] = 'Product is out of stock';
                                }
                            }else{
                                if($rowProductData->product_stock>0){
                                    if($cartSession[$productid]+1 <= $rowProductData->product_stock){
                                        $aryResponse['status'] = true;
                                        $aryResponse['message'] = 'Product added successfully!';
                                    }else{
                                        $aryResponse['status'] = false;
                                        $aryResponse['message'] = 'Product is out of stock';
                                    }
                                }else{
                                    $aryResponse['status'] = true;
                                    $aryResponse['message'] = 'Product added successfully!';
                                }
                            }
                        }else{
                            $aryResponse['status'] = true;
                            $aryResponse['message'] = 'Product added successfully!';
                        }
                    }else{
                        $aryResponse['status'] = false;
                        $aryResponse['message'] = 'Quantity exceeds stock.!';
                    }
                }else{
                    $aryResponse['status'] = true;
                    $aryResponse['message'] = 'Product added successfully!';
                }
            }
        }
        
        return $aryResponse;
    }
    public function plustoCartTotal($type='wholesale')
    {
        // $resCartInfo = Session::get('CART_SESSION');
        $userSession = Session::has('AR_USER') ? Session::get('AR_USER'):[];
        if($type=='all'){
            $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)->get();
        }else{
            $resCartInfo = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->get();
        }
        $intTotal = 0;
        $itemTotal = 0;
        $totalDiscount = 0;
        if(isset($resCartInfo))
        {
            foreach($resCartInfo as $cartitem)
            {
                $pid = $cartitem->cart_product_id;
                $rowProductInfo = ArProduct::where('product_id',$pid)->first();
                if($rowProductInfo){
                    $intTotal +=  $rowProductInfo->product_wh_selling_price*$cartitem->cart_qty;
                    $itemTotal +=  $rowProductInfo->product_wh_mrp_price*$cartitem->cart_qty;
                    $totalDiscount +=  $rowProductInfo->product_wh_discount*$cartitem->cart_qty;                
                }
            }            
        }
        return [
            'intTotal' => number_format($intTotal, 2, '.', ''),
            'itemTotal' => number_format($itemTotal, 2, '.', ''),
            'totalDiscount' => number_format($totalDiscount, 2, '.', ''),
        ];
    }
    public function plustoCartTotalAll()
    {
        // $resCartInfo = Session::get('CART_SESSION');
        $userSession = Session::has('AR_USER') ? Session::get('AR_USER'):[];
        $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)->get();
        
        $intTotal = 0;
        $itemTotal = 0;
        $totalDiscount = 0;
        if(isset($resCartInfo))
        {
            foreach($resCartInfo as $cartitem)
            {
                $pid = $cartitem->cart_product_id;
                $rowProductInfo = ArProduct::where('product_id',$pid)->first();
                if($cartitem->cart_is_wholesale==1){
                        $itemTotal +=  $rowProductInfo->product_wh_mrp_price*$cartitem->cart_qty;
                        $totalDiscount +=  $rowProductInfo->product_wh_discount*$cartitem->cart_qty;
                        $intTotal +=  $rowProductInfo->product_wh_selling_price*$cartitem->cart_qty;
                }else{
                    if($rowProductInfo->product_type==0){
                        $itemTotal +=  $rowProductInfo->product_price*$cartitem->cart_qty;
                        $totalDiscount +=  $rowProductInfo->product_discount*$cartitem->cart_qty;
                        $intTotal +=  $rowProductInfo->product_selling_price*$cartitem->cart_qty;
                    }else{
                        $variation = ArProductVariation::where('pv_id',$cartitem->cart_variation_id)->first();                    
                        if(isset($variation)){
                            $itemTotal +=  $variation->pv_price*$cartitem->cart_qty;
                            $totalDiscount +=  $variation->pv_discount*$cartitem->cart_qty;
                            $intTotal +=  $variation->pv_sellingprice * $cartitem->cart_qty;
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
    public function removeitemfromcartwholesale(Request $request)
    {
        $aryResponse = [];
        if ($request->isMethod('post')) {
            $userSession = Session::has('AR_USER') ? Session::get('AR_USER') : [];
            Session::forget('CART_COUPON');

            if ($userSession) {
                // Logged in user
                $cartRow = ArCart::where('cart_is_wholesale',1)->where('cart_id', $request->cart_id)
                    ->where('cart_user_id', $userSession->user_id)
                    ->first();
                    if ($cartRow) {
                        $cartRow->delete();
                        
                        $cartData = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->get();
                        $total = self::plustoCartTotal();
                        $whcount = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->count();

                    $aryResponse['message'] = 'ok';
                    $aryResponse['notification'] = 'Removed successfully';
                    $aryResponse['cart'] = $cartData;
                    $aryResponse['cartcount'] = count($cartData);
                    $aryResponse['whcount'] = $whcount??0;
                    $aryResponse['cartamount'] = $total['intTotal'];
                    $aryResponse['cartitemtotal'] = $total['itemTotal'];
                    $aryResponse['cartdiscount'] = $total['totalDiscount'];
                    $aryResponse['carttotal'] = $total['intTotal'];
                } else {
                    $aryResponse['message'] = 'failed';
                    $aryResponse['notification'] = 'Did not find any product';
                }
            }else{
                $aryResponse['message'] = 'failed';
                $aryResponse['notification'] = 'Please log in to update cart';
            }
        } else {
            $aryResponse['message'] = 'failed';
            $aryResponse['notification'] = 'Invalid Method';
        }

        return response()->json(['data' => $aryResponse]);
    }
    public function removeitemfromallcart(Request $request)
    {
        $aryResponse = [];
        if ($request->isMethod('post')) {
            $userSession = Session::has('AR_USER') ? Session::get('AR_USER') : [];
            Session::forget('CART_COUPON');

            if ($userSession) {
                // Logged in user
                $cartRow = ArCart::where('cart_id', $request->cart_id)
                    ->where('cart_user_id', $userSession->user_id)
                    ->first();
                    if ($cartRow) {
                        $cartRow->delete();
                        
                        $cartData = ArCart::where('cart_user_id', $userSession->user_id)->get();
                        $total = self::plustoCartTotalAll();
                        $whcount = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->count();

                    $aryResponse['message'] = 'ok';
                    $aryResponse['notification'] = 'Removed successfully';
                    $aryResponse['cart'] = $cartData;
                    $aryResponse['cartcount'] = count($cartData);
                    $aryResponse['whcount'] = $whcount??0;
                    $aryResponse['cartamount'] = $total['intTotal'];
                    $aryResponse['cartitemtotal'] = $total['itemTotal'];
                    $aryResponse['cartdiscount'] = $total['totalDiscount'];
                    $aryResponse['carttotal'] = $total['intTotal'];
                } else {
                    $aryResponse['message'] = 'failed';
                    $aryResponse['notification'] = 'Did not find any product';
                }
            }else {
                // Guest user
                $cartSession = Session::get('CART_SESSION', []);

                if (isset($cartSession[$request->cart_id])) {
                    unset($cartSession[$request->cart_id]);
                    Session::put('CART_SESSION', $cartSession);
                    Session::save();

                    $cartData = Session::get('CART_SESSION');
                    $total = self::getcartTotal();

                    $aryResponse['message'] = 'ok';
                    $aryResponse['notification'] = 'Removed successfully';
                    $aryResponse['cart'] = $cartData;
                    $aryResponse['cartcount'] = count($cartData);
                    $aryResponse['cartamount'] = $total['intTotal'];
                    $aryResponse['cartitemtotal'] = $total['itemTotal'];
                    $aryResponse['cartdiscount'] = $total['totalDiscount'];
                    $aryResponse['whcount'] = 0;
                    $aryResponse['carttotal'] = $total['intTotal'];
                } else {
                    $aryResponse['message'] = 'failed';
                    $aryResponse['notification'] = 'Did not find any product';
                }
            }
        } else {
            $aryResponse['message'] = 'failed';
            $aryResponse['notification'] = 'Invalid Method';
        }

        return response()->json(['data' => $aryResponse]);
    }
    public function minustocartwholesale(Request $request)
    {
        $aryResponse = [];
        if ($request->isMethod('post')) {
            $userSession = Session::has('AR_USER') ? Session::get('AR_USER') : [];
            Session::forget('CART_COUPON');

            if ($userSession) {
                // Logged-in user
                $resCartInfo = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)
                    ->where('cart_product_id', $request->product_id)
                    ->where('cart_variation_id', $request->variationid ?? 0)
                    ->first();

                if ($resCartInfo) {
                    if($resCartInfo->cart_qty = 10){
                        $aryResponse['message'] = 'failed';
                        $aryResponse['notification'] = 'Minimum order quantity for wholesale products is 10.';
                        return response()->json(['data' => $aryResponse]);
                    }
                    $resCartInfo->cart_qty -= 1;
                    if ($resCartInfo->cart_qty <= 0) {
                        $resCartInfo->delete();
                        $aryResponse['cartqty'] = 0;
                    } else {
                        $resCartInfo->save();
                        $aryResponse['cartqty'] = $resCartInfo->cart_qty;
                    }

                    $total = self::plustoCartTotal();

                    $aryResponse['message'] = 'ok';
                    $aryResponse['cartitemtotal'] = $total['itemTotal'];
                    $aryResponse['cartdiscount'] = $total['totalDiscount'];
                    $aryResponse['carttotal'] = $total['intTotal'];

                    // ✅ Added for frontend sync
                    $aryResponse['cart'] = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->get();
                    $aryResponse['cartcount'] = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->count();
                    $aryResponse['cartamount'] = $total['intTotal'];
                } else {
                    $aryResponse['message'] = 'failed';
                    $aryResponse['notification'] = 'Item not found in cart';
                }
            } else {
                $aryResponse['message'] = 'failed';
                $aryResponse['notification'] = 'Please log in to update cart';
            }
        } else {
            $aryResponse['message'] = 'failed';
            $aryResponse['notification'] = 'Invalid Method';
        }

        return response()->json(['data' => $aryResponse]);
    }
    public function minustocartAll(Request $request)
    {
        $aryResponse = [];
        if ($request->isMethod('post')) {
            $userSession = Session::has('AR_USER') ? Session::get('AR_USER') : [];
            Session::forget('CART_COUPON');

            if ($userSession) {
                // Logged-in user
                $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)
                    ->where('cart_product_id', $request->product_id)
                    ->where('cart_variation_id', $request->variationid ?? 0)
                    ->first();

                if ($resCartInfo) {
                    
                    $resCartInfo->cart_qty -= 1;
                    if ($resCartInfo->cart_qty <= 0) {
                        $resCartInfo->delete();
                        $aryResponse['cartqty'] = 0;
                    } else {
                        $resCartInfo->save();
                        $aryResponse['cartqty'] = $resCartInfo->cart_qty;
                    }

                    $total = self::plustoCartTotalAll();

                    $aryResponse['message'] = 'ok';
                    $aryResponse['cartitemtotal'] = $total['itemTotal'];
                    $aryResponse['cartdiscount'] = $total['totalDiscount'];
                    $aryResponse['carttotal'] = $total['intTotal'];

                    // ✅ Added for frontend sync
                    $aryResponse['cart'] = ArCart::where('cart_user_id', $userSession->user_id)->get();
                    $aryResponse['cartcount'] = ArCart::where('cart_user_id', $userSession->user_id)->count();
                    $aryResponse['cartamount'] = $total['intTotal'];
                } else {
                    $aryResponse['message'] = 'failed';
                    $aryResponse['notification'] = 'Item not found in cart';
                }
            } else {
                // Guest user
                $resCartInfo = Session::has('CART_SESSION') ? Session::get('CART_SESSION') : [];

                if (isset($request->variationid) && $request->variationid > 0) {
                    $strId = $request->product_id . '####' . $request->variationid;
                } else {
                    $strId = $request->product_id;
                }

                if (isset($resCartInfo[$strId])) {
                    $resCartInfo[$strId] -= 1;
                    if ($resCartInfo[$strId] <= 0) {
                        unset($resCartInfo[$strId]);
                        $aryResponse['cartqty'] = 0;
                    } else {
                        $aryResponse['cartqty'] = $resCartInfo[$strId];
                    }

                    Session::put('CART_SESSION', $resCartInfo);
                    Session::save();

                    $cartSession = Session::get('CART_SESSION');
                    $total = self::getcartTotal();

                    $aryResponse['message'] = 'ok';
                    $aryResponse['cartitemtotal'] = $total['itemTotal'];
                    $aryResponse['cartdiscount'] = $total['totalDiscount'];
                    $aryResponse['carttotal'] = $total['intTotal'];

                    // ✅ Added for frontend sync
                    $aryResponse['cart'] = $cartSession;
                    $aryResponse['cartcount'] = count($cartSession) ?? array_sum($cartSession);
                    $aryResponse['cartamount'] = $total['intTotal'];
                } else {
                    $aryResponse['message'] = 'failed';
                    $aryResponse['notification'] = 'Item not found in cart';
                }
            }
        } else {
            $aryResponse['message'] = 'failed';
            $aryResponse['notification'] = 'Invalid Method';
        }

        return response()->json(['data' => $aryResponse]);
    }
    /* ADD TO CART WHOLESALE*/
    public function addtocartwholesale(Request $request)
    {
        $aryResponse = [];
        Session::forget('CART_COUPON'); 
        $userSession = Session::get('AR_USER', []);
        $image = env('NO_IMAGE');
        $cartData = [];
        $isthisWholesale = true;
        $hasWholesale= 0;
        if (!$request->isMethod('post')) {
            return response()->json(['data' => [
                'message' => 'failed',
                'notification' => 'Invalid Method'
            ]]);
        }

        if ($userSession) {
            // Logged-in user cart
            
            $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_is_wholesale',1)
                ->where('cart_product_id', $request->product_id)
                ->when($request->variationid > 0, function ($q) use ($request) {
                    $q->where('cart_variation_id', $request->variationid);
                })->first();

            $checkMaxOrder = self::checkMaxOrder($request->product_id, $request->qty, $request->variationid);
            if (!$checkMaxOrder['status']) {
                return response()->json(['data' => [
                    'message' => 'failed',
                    'notification' => $checkMaxOrder['message']
                ]]);
            }

            // Get product/variation image
            $rowProductInfo = ArProduct::find($request->product_id);
            $image = $rowProductInfo->product_image;
            if ($request->variationid > 0) {
                $variation = ArProductVariation::find($request->variationid);
                $image = $variation->pv_image ?? $image;
            }

            // Update or insert cart
            if ($resCartInfo) {
                $resCartInfo->cart_qty += (float) $request->qty;
                $resCartInfo->save();
            } else {
                $cartobj = new ArCart();
                $cartobj->cart_user_id = $userSession->user_id;
                $cartobj->cart_product_id = $request->product_id;
                $cartobj->cart_variation_id = $request->variationid;
                $cartobj->cart_is_wholesale = 1;
                $cartobj->cart_qty = (float) $request->qty;
                $cartobj->save();                
            }

            $resCartData = ArCart::where('cart_user_id', $userSession->user_id)->orderByDesc('cart_id')->where('cart_is_wholesale',1)->get();
            $total = self::getwholesaleCartTotal();
            $cartData = $resCartData;
            $hasWholesale = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->count();
        } else{
            return response()->json(['data' => [
                'message' => 'failed',
                'notification' => 'Login to add wholesale products to cart'
            ]]);
        }
        $sidebarHtml = view('frontend.elements.cart_sidebar', compact('cartData','userSession','hasWholesale','isthisWholesale'))->render();

        return response()->json(['data' => [
            'message' => 'ok',
            'cartcount' => count($cartData),
            'cartamount' => $total['intTotal'],
            'image' => $image,
            'data' => $cartData,
            'sidebarHtml' => $sidebarHtml
        ]]);
    }
    public function getwholesaleCartTotal()
    {
        $userSession = Session::has('AR_USER') ? Session::get('AR_USER'):[];
        $intTotal = 0;
        $itemTotal = 0;
        $totalDiscount = 0;
        if($userSession){
            $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_is_wholesale',1)->get();
            if(isset($resCartInfo))
            {
                foreach($resCartInfo as $cartitem)
                {
                    $pid = $cartitem->cart_product_id;
                    $rowProductInfo = ArProduct::where('product_id',$pid)->first();
                    if(!$rowProductInfo){
                        continue;
                    }
                    if($cartitem->cart_is_wholesale==1){
                        $intTotal +=  $rowProductInfo->product_wh_selling_price*$cartitem->cart_qty;
                    }else{
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

            }
        }
        return [
            'intTotal' => number_format($intTotal, 2, '.', ''),
            'itemTotal' => number_format($itemTotal, 2, '.', ''),
            'totalDiscount' => number_format($totalDiscount, 2, '.', ''),
        ];
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
}
