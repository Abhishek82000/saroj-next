<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArCategory;
use App\Models\ArProduct;
use App\Models\ArProductImages;
use App\Models\ArProductAttribute;
use App\Models\ArProductAttributeDetail;
use App\Models\ArProductAttributeterms;
use App\Models\ArProductVariation;
use App\Models\ArProductBrand;
use App\Models\ArUserFavProduct;
use App\Models\ArProductReview;
use App\Models\ArReviewLikeUnlike;
use App\Models\ArProductAddons;
use App\Models\ArAddonsCategory;
use App\Models\ArPromos;
use App\Models\ArNewsletter;
use App\Models\ArFaqs;
use App\Models\ArProductTabs;
use App\Models\ArUsers;
use App\Models\ArCart;
use App\Models\ArProductTags;
use App\Models\ArProductGallery;
use App\Models\ArPages;
use App\Models\ArThemeAdmin;
use App\Models\ArProductResults;
use App\Models\ArProductByCategory;
use Carbon\Carbon;
use DB;
use Hash;
use Session;
use URL;

class ProductController extends Controller
{
    function newsletterProccess(Request $request)
    {
        $rowNewsLetterData = ArNewsletter::where('newsletter_email',$request->newsletter_email)->first();
        if(isset($rowNewsLetterData) && $rowNewsLetterData->newsletter_id>0){
            return response()->json(['status' =>'failed','message' =>'Email Id already Subscribed']);
        }else{
            $aryObj = new ArNewsletter;
            $aryObj->newsletter_email = $request->newsletter_email;
            $aryObj->save();
            return response()->json(['status' =>'ok','message' =>'Email Id Subscribed successfully']);
        }
    } 

    public function productList($slug=null)
    {
        if (empty($slug) || !is_string($slug)) {
        return view('frontend.pages.not_found');
        }
        
        $slug = filter_var($slug, FILTER_SANITIZE_STRING);
        
        // Single query to get category with validation
        $category = ArCategory::where('cat_slug', $slug)
            ->where('cat_status', 1) // Add status check for security
            ->first();
        $product = ArProduct::where('product_slug',$slug)->where('product_status',1)->where('product_stock','>',0)->first();
        if($product){
            return redirect()->route('front.product.product_detail',$slug);
        }
        if (!$category) {
            return view('frontend.pages.not_found');
        }
        $tags = '';
        $category = ArCategory::where('cat_slug',$slug)->first();
        if(!$category){
            return view('frontend.pages.not_found');
        }
        $productIds = ArProductByCategory::where('cpc_category_id',$category->cat_id)->pluck('cpc_product_id')->toArray();
        $products = ArProduct::where('product_status',1)->whereIn('product_id', $productIds)->where('product_stock','>',0)->with(['images'])->inRandomOrder()->select('product_name','product_price','product_selling_price','product_image','product_slug','product_label_name','product_type','product_id','product_img_alt','product_image_cdn','product_rating','product_review','product_style_type')->get();
        $categoryList = ArCategory::with(['children' => function($query) { $query->where('cat_status',1)->orderBy('cat_order','ASC');}])->where('cat_status',1)->where('cat_parent',0)->where('cat_id','!=', 65)->orderBy('cat_order','ASC')->get();
        $tagsList = ArProductTags::where('tag_status',1)->orderBy('tag_id','DESC')->get();
        $saleProducts = ArProduct::where('product_recommended',1)->where('product_status',1)->where('product_stock','>',0)->with(['images'])->inRandomOrder()->select('product_name','product_price','product_selling_price','product_image','product_slug','product_image_cdn')->limit(4)->get();
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
        return view('frontend.product.product_list',compact('title','strImages','category','products','categoryList','firstBreadCrum','secondBreadCrum','slug','attributes','brands','meta_keyword','meta_description','meta_title','tagsList','tags','saleProducts'));
    }

    public function tagproduct($slug=null)
    {
        $tags = ArProductTags::where('tag_slug',$slug)->first();
        $category = array("cat_name"=>$tags->tag_name);
        $products = ArProduct::where('product_status',1)->where('product_stock', '>', 0)->whereRaw('FIND_IN_SET(?, product_tag_id)', [$tags->tag_id])->with(['images'])->inRandomOrder();
        $categoryList = ArCategory::with(['children' => function($query) { $query->where('cat_status',1)->orderBy('cat_order','ASC');}])->where('cat_status',1)->where('cat_parent',0)->orderBy('cat_order','ASC')->get();
        $tagsList = ArProductTags::where('tag_status',1)->orderBy('tag_id','DESC')->get();
        $products = $products->paginate(24);
        $attributes = ArProductAttribute::where('attribute_status',1)->with('attributeterms')->get();
        $brands = ArProductBrand::where('brand_status',1)->get();
        $firstBreadCrum = "Tags";
        $secondBreadCrum = $tags->tag_name;
        $title = 'Tags Product';
        $meta_keyword = "";
        $meta_description = "";
        $meta_title = "";
        if(isset($tags) && $tags->tag_id>0){
            $title = $tags->tag_name;
            $meta_keyword = $tags->tag_meta_keyword;
            $meta_description = $tags->tag_meta_desc;
            $meta_title = $tags->tag_meta_title;
        }
        $strImages = env('SETTING_IMAGE').$this->settingData->logo;
        return view('frontend.product.product_list',compact('title','strImages','meta_keyword','meta_description','meta_title','products','category','categoryList','firstBreadCrum','secondBreadCrum','slug','attributes','brands','tagsList','tags'));
    }

    public function featuredproduct($slug=null)
    {
        $products = ArProduct::where('product_status',1)->where('product_stock', '>', 0)->where('product_featured', 1)->with(['images'])->inRandomOrder();
        $category = array("cat_name"=>"Featured Products");
        $categoryList = ArCategory::with(['children' => function($query) { $query->where('cat_status',1)->orderBy('cat_order','ASC');}])->where('cat_status',1)->where('cat_parent',0)->orderBy('cat_order','ASC')->get();
        $products = $products->paginate(24);
        $attributes = ArProductAttribute::where('attribute_status',1)->with('attributeterms')->get();
        $brands = ArProductBrand::where('brand_status',1)->get();
        $firstBreadCrum = "Featured";
        $secondBreadCrum = "";
		$settingData = ArThemeAdmin::first();
        $currentURL = URL::current();
        $slugUrl = str_replace(env('SITE_URL'),'',$currentURL);
        $getpagedetails = ArPages::where('page_url',$slugUrl)->first();
        $title = 'Featured Products';
        $meta_keyword = "Featured Products";
        $meta_description = "Featured Products";
		$meta_title = "Featured Products";
        if(isset($getpagedetails->page_header_image) && $getpagedetails->page_header_image !=''){
            $strImages = env('PAGE_IMAGE').$getpagedetails->page_header_image;
        }else{
            $strImages = env('SETTING_IMAGE').$this->settingData->logo;
        }
        return view('frontend.product.product_list',compact('title','strImages','category','products','categoryList','firstBreadCrum','secondBreadCrum','slug','attributes','brands','meta_keyword','meta_description','meta_title','getpagedetails'));
    }

    public function productSortFilter(Request $request){
        if($request->type=='Category'){
            $categories = ArCategory::where('cat_slug',$request->url)->first();
            if(isset($categories) && $categories !=''){
                $productIds = ArProductByCategory::where('cpc_category_id',$categories->cat_id)->pluck('cpc_product_id')->toArray();
                $products = ArProduct::where('product_status',1)->whereIn('product_id', $productIds)->where('product_stock','>',0)->orderBy('product_recommended','DESC')->select('product_name','product_price','product_selling_price','product_image','product_slug','product_label_name','product_type','product_rating','product_review');
            }
        }elseif($request->type=='Tags'){
            $tags = ArProductTags::where('tag_slug',$request->url)->first();
            if(isset($tags) && $tags !=''){
                $products = ArProduct::whereRaw('FIND_IN_SET(?, product_tag_id)', [$tags->tag_id])->where('product_status',1)->where('product_stock', '>', 0);
            }
        }else{
            $products = ArProduct::where('product_status',1)->where('product_stock', '>', 0);
        }
        
        if($request->filter=='high_low'){
            $products = $products->orderBy('product_selling_price','DESC');
        }elseif($request->filter=='low_high'){
            $products = $products->orderBy('product_selling_price','ASC');
        }elseif($request->filter=='best_selling'){         
            $products = $products->where('product_featured',1);
        }else{
            $products = $products->orderBy('product_id','DESC');
        }
        $products = $products->with(['images'])->paginate(24);
        return view('frontend.product.product_filter',compact('products'));
    }

    public function productPriceFilter(Request $request){ 

        $products = ArProduct::where('product_status',1)->whereBetween('product_selling_price', [$request->minValue, $request->maxValue])->where('product_stock', '>', 0)->orderBy('product_selling_price','ASC');
        if($request->catslug != ''){
            $category = ArCategory::where('cat_slug',$request->catslug)->first();
            $products = $products->whereRaw('FIND_IN_SET(?, product_category_id)', [$category->cat_id]);
        }elseif($request->tagslug != ''){
            $tags = ArProductTags::where('tag_slug',$request->tagslug)->first();
            $products = $products->whereRaw('FIND_IN_SET(?, product_tag_id)', [$tags->tag_id]);
        }else{
            $products = $products;
        }
        $products = $products->with(['images'])->paginate(24);
        return view('frontend.elements.product_listview',compact('products'));
    }
    public function productAttributesFilter(Request $request){
        $colorProducts = array(); 
        if($request->type=='Categories'){
            $categories = ArCategory::where('cat_slug',$request->url)->first();
            if(isset($categories) && $categories !=''){
                $products = ArProduct::whereRaw('FIND_IN_SET(?, product_category_id)', [$categories->cat_id])->where('product_status',1)->where('product_stock', '>', 0)->orderBy('product_recommended','DESC');
            } 
            
        }elseif($request->type=='Tags'){
            $tags = ArProductTags::where('tag_slug',$request->url)->first();
            if(isset($tags) && $tags !=''){
                $products = ArProduct::whereRaw('FIND_IN_SET(?, product_tag_id)', [$tags->tag_id])->where('product_status',1)->orderBy('product_recommended','DESC');
            }
        }else{
            $products = ArProduct::where('product_status',1)->where('product_featured', 1)->orderBy('product_recommended','DESC');
        }

        if(isset($request['attributes']) && count($request['attributes'])>0){
            $allAttrs = ArProductAttributeDetail::get();
            $colors = $request['attributes'];
            foreach($colors as $key=>$color){
                foreach($allAttrs as $attr){
                    $unit = explode(',',$attr->attribute_details_attrterms);
                    if(in_array($color,$unit)){
                        if(!in_array($attr->attribute_details_proid,$colorProducts)){
                            $colorProducts[] = $attr->attribute_details_proid;
                        }
                    }
                }
            }
            $products = $products->whereIn('product_id',$colorProducts);
        }else{

        }
         
        if(isset($request->brands) && count($request->brands)>0){
            $products = $products->whereIn('product_brand_id',$request->brands);
        } 
        $products = $products->get();
        return view('frontend.elements.sortbyfilter_product_list',compact('products'));
        
    }

    function filterByCat(Request $request)
    {
        $aryFilter = array();
        if(isset($request['attributes']) && $request['attributes']!=""){
            $aryFilter['attributes'] = $request['attributes'];
        }
        if(isset($request['sortby']) && $request['sortby']!=""){
            $aryFilter['sortby'] = $request['sortby'];
        }
        Session::put('ATTRIBUTES_FILTER',$aryFilter); 
        Session::save();
        return response()->json(['data' =>$aryFilter,'message' =>'success']);
    }

    public function productDetailModalHtml($slug=null)
    {
        // dd(1);
        $strTitle = 'Product';
        $quickProduct = ArProduct::where('product_slug',$slug)->first();
        
        $productgallery = ArProductImages::where('image_productid',$quickProduct->product_id)->get();
        $variationproduct = ArProductAttributeDetail::where('attribute_details_proid',$quickProduct->product_id)->with(['attributes'])->get();
        $variation = ArProductVariation::where('pv_product_id',$quickProduct->product_id)->where('pv_default',1)->first();
        if($variation)
        {
            $selvararray = explode(',',$variation->pv_variation);
        }else{
            $selvararray = [];
        }
        $resProductAddonsData = ArProductAddons::where('addons_product_id',$quickProduct->product_id)->get();
        $resAddonsCategoryData = ArAddonsCategory::where('addons_category_status',1)->orderBy('addons_category_name')->get();
        // dd($quickProduct);
        return view('frontend.product.product_quick_view', compact('strTitle', 'resAddonsCategoryData', 'resProductAddonsData', 'selvararray', 'variation', 'variationproduct', 'quickProduct', 'productgallery'));
    }

    public function productDetail($slug = null)
    {
        // 1. Early return for invalid slug
        if (blank($slug)) {
            return view('frontend.pages.not_found');
        }

        // 2. Eager-load relationships to avoid N+1 queries
        $product = ArProduct::with([
                'gallery',       // replaces: ArProductGallery::where(...)
                'productAttributeDetails.attributes', // replaces: ArProductAttributeDetail::where(...)->with(...)
                'productTabs',          // replaces: ArProductTabs::where(...)
            ])
            ->where('product_slug', $slug)
            ->where('product_status', 1)
            ->where('product_stock', '>', 0)
            ->first();

        if (!$product) {
            return view('frontend.pages.not_found');
        }

        // 3. Update recently viewed in session (clean, no redundant ops)
        $recentlyViewedIds = collect(session('recently_viewed', []))
            ->reject(fn($id) => $id === $product->product_id)
            ->prepend($product->product_id)
            ->take(5)
            ->values()
            ->all();

        session()->put('recently_viewed', $recentlyViewedIds);

        // 4. Use authenticated user check for favorites (avoid unnecessary query)
        $userSession  = Session::get('AR_USER');
        $rowfavsData  = $userSession
            ? ArUserFavProduct::where('ufp_product_id', $product->product_id)->first()
            : null;

        // 5. Extract from eager-loaded relations (no extra queries)
        $productgallery    = $product->gallery;
        $variationproduct  = $product->attributeDetails;
        $proTab            = $product->productTabs->sortBy('tab_id');

        // 6. Default variation
        $variation   = ArProductVariation::where('pv_product_id', $product->product_id)
            ->where('pv_default', 1)
            ->first();
        $selvararray = $variation ? explode(',', $variation->pv_variation) : [];

        // 7. Category promo logic — isolated and readable
        $resCatPromo      = null;
        $remainingSeconds = 0;
        $dayName          = Carbon::now()->format('l');

        $catPromo = ArPromos::where('promo_status', 1)
            ->where('promo_type', 1)
            ->where('promo_week_day', $dayName)
            ->first();

        if ($catPromo) {
            $productInCat = ArProductByCategory::where('cpc_category_id', $catPromo->promo_cat_id)
                ->where('cpc_product_id', $product->product_id)
                ->exists(); // 8. exists() is faster than first() when you only need a boolean

            if ($productInCat) {
                $resCatPromo = $catPromo;

                // 9. Calculate remaining seconds until promo ends today
                $promoEnd         = Carbon::today()->setTimeFromTimeString(
                    Carbon::parse($catPromo->promo_valid_to)->format('H:i:s')
                );
                $remainingSeconds = max(0, Carbon::now()->diffInSeconds($promoEnd, false));
            }
        }

        // 10. Active coupons — single query, today's date auto-handled by Carbon
        $resCouponsData = ArPromos::where('promo_status', 1)
            ->where('promo_type', 0)
            ->where('promo_valid_to', '>', now()->toDateString())
            ->get();

        // 11. Related products — Eloquent raw-free, safe against SQL injection
        $categoryIds     = explode(',', $product->product_category_id);
        $related_products = ArProduct::where('product_id', '!=', $product->product_id)
            ->where('product_status', 1)->where('product_stock', '>', 0)
            ->where(function ($query) use ($categoryIds) {
                foreach ($categoryIds as $catId) {
                    $query->orWhereRaw('FIND_IN_SET(?, product_category_id)', [trim($catId)]);
                }
            })
            ->latest('product_id')
            ->limit(10)
            ->get();

        // 12. Rating — single aggregated DB query
        $ratingData = ArProductReview::selectRaw('COALESCE(SUM(pr_rating), 0) as total, COUNT(*) as counter')
            ->where('pr_product_id', $product->product_id)
            ->where('pr_status', 1)
            ->first();

        $intRating = $ratingData->counter > 0
            ? round($ratingData->total / $ratingData->counter, 2)
            : 0;

        // 13. Update product stats (consider moving to a queued job for performance)
        ArProduct::where('product_id',$product->product_id)->update([
            'product_rating' => $intRating,
            'product_review' => $ratingData->counter,
        ]);

        // 14. Paginated reviews
        $rowProductReview = ArProductReview::where('pr_product_id', $product->product_id)
            ->where('pr_status', 1)
            ->latest('pr_id')
            ->paginate(3);

        // 15. Recently viewed products (excluding current), preserving session order
        $recentlyViewedProducts = $recentlyViewedIds
            ? ArProduct::whereIn('product_id', $recentlyViewedIds)
                ->where('product_id', '!=', $product->product_id)->where('product_stock', '>', 0)->where('product_status', 1)
                ->orderByRaw('FIELD(product_id, ' . implode(',', $recentlyViewedIds) . ')')
                ->get()
            : collect();
        $catShowHomePage = ArCategory::where('cat_show_on_app_home', 1)->where('cat_status', 1)->orderBy('cat_order','ASC')
        ->with(['catProducts' => function($query) {
            $query->where('product_stock', '>', 0)
                    ->where('product_status', 1)
                    ->where('product_featured', 1)
                    ->orderBy('product_recommended', 'DESC')
                    ->with('gallery')
                    ->select('product_id', 'product_name', 'product_price', 
                            'product_selling_price', 'product_image', 'product_slug', 
                            'product_moq', 'product_stock', 'product_inventory', 
                            'product_type', 'product_label_name', 'product_rating', 
                            'product_review','product_img_alt','product_image_cdn','product_lgap','product_style_type')
                    ->limit(48);
        }])
        ->get();
        // 16. Meta & SEO
        $settingData     = ArThemeAdmin::first();
        $strTitle        = $product->product_name;
        $meta_keyword    = $product->product_meta_keyword;
        $meta_description = $product->product_meta_desc;
        $meta_title      = $product->product_meta_title;
        $strImages       = $product->product_image
            ?: (config('app.setting_image') . optional($settingData)->logo);

        $faqs = ArFaqs::where('faq_status', 1)->latest('faq_id')->get();

        return view('frontend.product.product_detail', compact(
            'strTitle', 'strImages', 'rowProductReview', 'userSession',
            'selvararray', 'variation', 'variationproduct', 'product',
            'productgallery', 'related_products', 'rowfavsData',
            'meta_keyword', 'meta_description', 'meta_title',
            'proTab', 'settingData', 'faqs', 'resCouponsData',
            'recentlyViewedProducts', 'resCatPromo','catShowHomePage', 'remainingSeconds'
        ));
    }
    public function productWhDetail($slug = null)
    {
        // 1. Early return for invalid slug
        if (blank($slug)) {
            return view('frontend.pages.not_found');
        }

        // 2. Eager-load relationships to avoid N+1 queries
        $product = ArProduct::with([
                'gallery',       // replaces: ArProductGallery::where(...)
                'productAttributeDetails.attributes', // replaces: ArProductAttributeDetail::where(...)->with(...)
                'productTabs',          // replaces: ArProductTabs::where(...)
            ])
            ->where('product_slug', $slug)
            ->where('product_wholesale',1)
            ->where('product_stock', '>', 0)
            ->first();

        if (!$product) {
            return view('frontend.pages.not_found');
        }

        // 3. Update recently viewed in session (clean, no redundant ops)
        $recentlyViewedIds = collect(session('recently_viewed', []))
            ->reject(fn($id) => $id === $product->product_id)
            ->prepend($product->product_id)
            ->take(5)
            ->values()
            ->all();

        session()->put('recently_viewed', $recentlyViewedIds);

        // 4. Use authenticated user check for favorites (avoid unnecessary query)
        $userSession  = Session::get('AR_USER');
        $rowfavsData  = $userSession
            ? ArUserFavProduct::where('ufp_product_id', $product->product_id)->first()
            : null;

        // 5. Extract from eager-loaded relations (no extra queries)
        $productgallery    = $product->gallery;
        $variationproduct = $product->productAttributeDetails ?? collect();
        $proTab            = $product->productTabs->sortBy('tab_id');

        // 6. Default variation
        $variation   = ArProductVariation::where('pv_product_id', $product->product_id)
            ->where('pv_default', 1)
            ->first();
        $selvararray = $variation ? explode(',', $variation->pv_variation) : [];

        // 7. Category promo logic — isolated and readable
        $resCatPromo      = null;
        $remainingSeconds = 0;
        $dayName          = Carbon::now()->format('l');

        $catPromo = ArPromos::where('promo_status', 1)
            ->where('promo_type', 1)
            ->where('promo_week_day', $dayName)
            ->first();

        if ($catPromo) {
            $productInCat = ArProductByCategory::where('cpc_category_id', $catPromo->promo_cat_id)
                ->where('cpc_product_id', $product->product_id)
                ->exists(); // 8. exists() is faster than first() when you only need a boolean

            if ($productInCat) {
                $resCatPromo = $catPromo;

                // 9. Calculate remaining seconds until promo ends today
                $promoEnd         = Carbon::today()->setTimeFromTimeString(
                    Carbon::parse($catPromo->promo_valid_to)->format('H:i:s')
                );
                $remainingSeconds = max(0, Carbon::now()->diffInSeconds($promoEnd, false));
            }
        }

        // 10. Active coupons — single query, today's date auto-handled by Carbon
        $resCouponsData = ArPromos::where('promo_status', 1)
            ->where('promo_type', 0)
            ->where('promo_valid_to', '>', now()->toDateString())
            ->get();

        // 11. Related products — Eloquent raw-free, safe against SQL injection
        $categoryIds     = explode(',', $product->product_category_id);
        $related_products = ArProduct::where('product_id', '!=', $product->product_id)->where('product_wholesale',1)
            ->where('product_stock', '>', 0)
            ->where(function ($query) use ($categoryIds) {
                foreach ($categoryIds as $catId) {
                    $query->orWhereRaw('FIND_IN_SET(?, product_category_id)', [trim($catId)]);
                }
            })
            ->latest('product_id')
            ->limit(12)
            ->get();

        // 12. Rating — single aggregated DB query
        $ratingData = ArProductReview::selectRaw('COALESCE(SUM(pr_rating), 0) as total, COUNT(*) as counter')
            ->where('pr_product_id', $product->product_id)
            ->where('pr_status', 1)
            ->first();

        $intRating = $ratingData->counter > 0
            ? round($ratingData->total / $ratingData->counter, 2)
            : 0;

        // 13. Update product stats (consider moving to a queued job for performance)
        ArProduct::where('product_id',$product->product_id)->update([
            'product_rating' => $intRating,
            'product_review' => $ratingData->counter,
        ]);

        // 14. Paginated reviews
        $rowProductReview = ArProductReview::where('pr_product_id', $product->product_id)
            ->where('pr_status', 1)
            ->latest('pr_id')
            ->paginate(3);

        // 15. Recently viewed products (excluding current), preserving session order
        $recentlyViewedProducts = $recentlyViewedIds
            ? ArProduct::whereIn('product_id', $recentlyViewedIds)
                ->where('product_id', '!=', $product->product_id)
                ->where('product_wholesale',1)
                ->where('product_stock', '>', 0)
                ->orderByRaw('FIELD(product_id, ' . implode(',', $recentlyViewedIds) . ')')
                ->get()
            : collect();
        $catShowHomePage = ArCategory::where('cat_show_on_app_home', 1)->where('cat_status', 1)->orderBy('cat_order','ASC')
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
                            'product_review','product_img_alt','product_image_cdn','product_lgap','product_style_type')
                    ->limit(48);
        }])
        ->get();
        // 16. Meta & SEO
        $settingData     = ArThemeAdmin::first();
        $strTitle        = $product->product_name;
        $meta_keyword    = $product->product_meta_keyword;
        $meta_description = $product->product_meta_desc;
        $meta_title      = $product->product_meta_title;
        $strImages       = $product->product_image
            ?: (config('app.setting_image') . optional($settingData)->logo);

        $faqs = ArFaqs::where('faq_status', 1)->latest('faq_id')->get();

        return view('frontend.product.product_detail', compact(
            'strTitle', 'strImages', 'rowProductReview', 'userSession',
            'selvararray', 'variation', 'variationproduct', 'product',
            'productgallery', 'related_products', 'rowfavsData',
            'meta_keyword', 'meta_description', 'meta_title',
            'proTab', 'settingData', 'faqs', 'resCouponsData',
            'recentlyViewedProducts', 'resCatPromo','catShowHomePage', 'remainingSeconds'
        ));
    }

    public function getvariationproductdata(request $request){
        $variation = ArProductVariation::where('pv_variation',$request->variation)->where('pv_product_id',$request->product_id)->first();
        return response()->json(['status' => 'success','data' => $variation]);
    }

    /* ADD TO CART */
    public function addtocart(Request $request)
    {
        $aryResponse = [];
        Session::forget('CART_COUPON'); 
        $userSession = Session::get('AR_USER', []);
        $image = env('NO_IMAGE');
        $cartData = [];
        $isthisWholesale = false;
        $hasWholesale= 0;
        if (!$request->isMethod('post')) {
            return response()->json(['data' => [
                'message' => 'failed',
                'notification' => 'Invalid Method'
            ]]);
        }

        if ($userSession) {
            // Logged-in user cart
            $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_is_wholesale',0)
                ->where('cart_product_id', $request->product_id)
                ->when($request->variationid > 0, function ($q) use ($request) {
                    $q->where('cart_variation_id', $request->variationid);
                })->first();
            $hasWholesale = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->count();
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
                $cartobj->cart_qty = (float) $request->qty;
                $cartobj->save();                
            }

            $resCartData = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_is_wholesale',0)->orderByDesc('cart_id')->get();
            $total = self::getcartTotal();
            $cartData = $resCartData;
        } else {
            // Guest user cart (Session)
            $resCartInfo = Session::get('CART_SESSION', []);
            $checkMaxOrder = self::checkMaxSessionOrder($request->product_id, $request->qty, $request->variationid);

            if (!$checkMaxOrder['status']) {
                return response()->json(['data' => [
                    'message' => 'failed',
                    'notification' => $checkMaxOrder['message']
                ]]);
            }

            $image = ArProduct::where('product_id', $request->product_id)->value('product_image');
            $strId = $request->product_id;
            if ($request->variationid > 0) {
                $pvimage = ArProductVariation::where('pv_id', $request->variationid)->value('pv_image');
                $image = $pvimage ?: $image;
                $strId .= '####' . $request->variationid;
            }

            // Add to session cart
            $resCartInfo[$strId] = ($resCartInfo[$strId] ?? 0) + (float) $request->qty;
            Session::put('CART_SESSION', $resCartInfo);
            $cartData = $resCartInfo;

            $total = self::getCartSessionTotal();
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
    public function syncCart(Request $request)
    {
        $userSession = Session::get('AR_USER', []);
        $localCartData = $request->cart_data ?? [];
        
        if (empty($localCartData)) {
            return response()->json(['data' => [
                'message' => 'failed',
                'notification' => 'No cart data to sync'
            ]]);
        }
        
        if ($userSession) {
            // User is logged in - sync localStorage cart to database
            foreach ($localCartData as $key => $qty) {
                if (is_string($key) && strpos($key, '####') !== false) {
                    // Session cart format: "product_id####variation_id"
                    $parts = explode('####', $key);
                    $productId = $parts[0];
                    $variationId = isset($parts[1]) ? $parts[1] : 0;
                } else {
                    // Direct product ID
                    $productId = $key;
                    $variationId = 0;
                }
                
                // Check if item already exists in user's cart
                $existingCart = ArCart::where('cart_user_id', $userSession->user_id)
                    ->where('cart_product_id', $productId)
                    ->when($variationId > 0, function ($q) use ($variationId) {
                        $q->where('cart_variation_id', $variationId);
                    })
                    ->first();
                
                if ($existingCart) {
                    // Update quantity (take the higher value)
                    $existingCart->cart_qty = max($existingCart->cart_qty, (int)$qty);
                    $existingCart->save();
                } else {
                    // Add new item to cart
                    $cartobj = new ArCart();
                    $cartobj->cart_user_id = $userSession->user_id;
                    $cartobj->cart_product_id = $productId;
                    $cartobj->cart_variation_id = $variationId;
                    $cartobj->cart_qty = (int)$qty;
                    $cartobj->save();
                }
            }
            
            $resCartData = ArCart::where('cart_user_id', $userSession->user_id)->orderByDesc('cart_id')->get();
            $total = self::getcartTotal();
            $cartData = $resCartData;
        } else {
            // User not logged in - update session cart
            $sessionCart = Session::get('CART_SESSION', []);
            
            foreach ($localCartData as $key => $qty) {
                $sessionCart[$key] = max($sessionCart[$key] ?? 0, (int)$qty);
            }
            
            Session::put('CART_SESSION', $sessionCart);
            $cartData = $sessionCart;
            $total = self::getCartSessionTotal();
        }
        
        $sidebarHtml = view('frontend.elements.cart_sidebar', compact('cartData', 'userSession'))->render();
        
        return response()->json(['data' => [
            'message' => 'ok',
            'cartcount' => count($cartData),
            'cartamount' => $total['intTotal'],
            'sidebarHtml' => $sidebarHtml
        ]]);
    }

    function buynow(Request $request)
    {
        $aryPostData = $request->all();
        $aryResponse = array();
        $userSession = Session::has('AR_USER') ? Session::get('AR_USER'):[];
        if(isset($request->variationid) && $request->variationid>0)
        {
            $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_product_id', $request->product_id)->where('cart_variation_id', $request->variationid)->first();
        }else{
            $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_product_id', $request->product_id)->first();
        }
        Session::forget('CART_COUPON'); 
        if($request->isMethod('post')){
            $checkMaxOrder = self::checkMaxOrder($request->product_id,$request->qty,$request->variationid);
            if($checkMaxOrder['status']){
                
                if(isset($request->variationid) && $request->variationid>0)
                {
                    $strId = $request->variationid;
                    $variation = ArProductVariation::where('pv_id',$strId)->first();
                    $image = $variation->pv_image;
                }else{
                    $strId = $request->product_id;
                    $rowProductInfo = ArProduct::where('product_id',$strId)->first();
                    $image = $rowProductInfo->product_image;
                } 
                if ($resCartInfo !== null) {
                    if (isset($resCartInfo->cart_qty)) {
                        $resCartInfo->cart_qty += (float)$request->qty;
                    } else {
                        $resCartInfo->cart_qty = (float)$request->qty;
                    }
                    $resCartInfo->save();
                } else {
                    $newCartInfo = new ArCart();
                    $newCartInfo->cart_user_id = $userSession->user_id;
                    $newCartInfo->cart_product_id = $request->product_id;
                    $newCartInfo->cart_variation_id = $request->variationid;
                    $newCartInfo->cart_qty = (float)$request->qty;
                
                    $newCartInfo->save();
                }
                $resCartData = ArCart::where('cart_user_id',$userSession->user_id)->orderBy('cart_id','DESC')->get();
                // $cartSession = Session::get('CART_SESSION');
                $total = self::getcartTotal();
                $aryResponse['message'] = 'ok';
                $aryResponse['data'] = $resCartData;
                $aryResponse['cartcount'] = count($resCartData);
                // $aryResponse['cartamount'] = $total;
                // $aryResponse['image'] = $image;
            }else{
                $aryResponse['message'] = 'failed';
                $aryResponse['notification'] = $checkMaxOrder['message'];
            }
        }else{
            $aryResponse['message'] = 'failed';
            $aryResponse['notification'] = 'Invalid Method';
        }
        return response()->json(['data' =>$aryResponse]);
    }

    // public function plustocart(Request $request)
    // {
    //     $aryPostData = $request->all();
    //     $aryResponse = [];
    //     if ($request->isMethod('post')) {
    //         $userSession = Session::has('AR_USER') ? Session::get('AR_USER') : [];
    //         $resCartInfo = Session::has('CART_SESSION') ? Session::get('CART_SESSION') : [];
    //         Session::forget('CART_COUPON');

    //         if ($userSession) {
    //             // Logged in user
    //             $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)
    //                 ->where('cart_id', $request->cart_id)
    //                 ->first();

    //             $checkMaxOrder = self::checkMaxOrder($resCartInfo->cart_product_id, $request->qty, $resCartInfo->cart_variation_id);
    //             if ($checkMaxOrder['status']) {
    //                 $resCartInfo->cart_qty += (int) $request->qty;
    //                 $resCartInfo->save();

    //                 $total = self::plustoCartTotal();

    //                 $aryResponse['message'] = 'ok';
    //                 $aryResponse['cartqty'] = $resCartInfo->cart_qty;
    //                 $aryResponse['cartitemtotal'] = $total['itemTotal'];
    //                 $aryResponse['cartdiscount'] = $total['totalDiscount'];
    //                 $aryResponse['carttotal'] = $total['intTotal'];

    //                 // ✅ Added for frontend sync
    //                 $aryResponse['cart'] = ArCart::where('cart_user_id', $userSession->user_id)->get();
    //                 $aryResponse['cartcount'] = ArCart::where('cart_user_id', $userSession->user_id)->count();
    //                 $aryResponse['cartamount'] = $total['intTotal'];
    //             } else {
    //                 $aryResponse['message'] = 'failed';
    //                 $aryResponse['notification'] = $checkMaxOrder['message'];
    //             }
    //         } else {
    //             // Guest user
    //             $checkMaxOrder = self::checkMaxOrder($request->cart_id, $request->qty, $request->variationid);
    //             if ($checkMaxOrder['status']) {
    //                 if (isset($request->variationid) && $request->variationid > 0) {
    //                     $strId = $request->cart_id . '####' . $request->variationid;
    //                 } else {
    //                     $strId = $request->cart_id;
    //                 }

    //                 if (isset($resCartInfo[$strId])) {
    //                     $resCartInfo[$strId] += (int) $request->qty;
    //                 } else {
    //                     $resCartInfo[$strId] = (int) $request->qty;
    //                 }
    //                 Session::put('CART_SESSION', $resCartInfo);
    //                 Session::save();

    //                 $cartSession = Session::get('CART_SESSION');
    //                 $total = self::getcartTotal();

    //                 $aryResponse['message'] = 'ok';
    //                 $aryResponse['cartqty'] = $cartSession[$strId];
    //                 $aryResponse['cartitemtotal'] = $total['itemTotal'];
    //                 $aryResponse['cartdiscount'] = $total['totalDiscount'];
    //                 $aryResponse['carttotal'] = $total['intTotal'];

    //                 // ✅ Added for frontend sync
    //                 $aryResponse['cart'] = $cartSession;
    //                 $aryResponse['cartcount'] = count($cartSession) ?? array_sum($cartSession);
    //                 $aryResponse['cartamount'] = $total['intTotal'];
    //             } else {
    //                 $aryResponse['message'] = 'failed';
    //                 $aryResponse['notification'] = $checkMaxOrder['message'];
    //             }
    //         }
    //     } else {
    //         $aryResponse['message'] = 'failed';
    //         $aryResponse['notification'] = 'Invalid Method';
    //     }
    //     return response()->json(['data' => $aryResponse]);
    // }

public function plustocart(Request $request)
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
            return $this->handleGuestUser($request, $qty, $type);
        }
    } catch (Exception $e) {
        return $this->jsonError('Something went wrong. Please try again.');
    }
}

private function handleLoggedInUser(Request $request, $userSession, float $qty, string $type)
{
    $cartItem = ArCart::where('cart_user_id', $userSession->user_id)
        ->where('cart_product_id', $request->product_id)->where('cart_is_wholesale',0)
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
    $userCartItems = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_is_wholesale',0)->get();

    return $this->jsonSuccess([
        'cartqty' => $cartItem->cart_qty,
        'cart' => $userCartItems,
        'cartcount' => $userCartItems->count(),
    ], $total);
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

    public function minustocart(Request $request)
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

                    $total = self::plustoCartTotal();

                    $aryResponse['message'] = 'ok';
                    $aryResponse['cartitemtotal'] = $total['itemTotal'];
                    $aryResponse['cartdiscount'] = $total['totalDiscount'];
                    $aryResponse['carttotal'] = $total['intTotal'];

                    // ✅ Added for frontend sync
                    $aryResponse['cart'] = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_is_wholesale',0)->get();
                    $aryResponse['cartcount'] = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_is_wholesale',0)->count();
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
    public function removeitemfromcart(Request $request)
    {
        $aryResponse = [];
        if ($request->isMethod('post')) {
            $userSession = Session::has('AR_USER') ? Session::get('AR_USER') : [];
            Session::forget('CART_COUPON');
            $whcount = 0;
            if ($userSession) {
                // Logged in user
                $cartRow = ArCart::where('cart_id', $request->cart_id)->where('cart_is_wholesale',0)
                    ->where('cart_user_id', $userSession->user_id)
                    ->first();
                    if ($cartRow) {
                        $cartRow->delete();
                        
                        $cartData = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_is_wholesale',0)->get();
                        $total = self::plustoCartTotal();
                        $whcount = ArCart::where('cart_is_wholesale',1)->where('cart_user_id', $userSession->user_id)->count();

                    $aryResponse['message'] = 'ok';
                    $aryResponse['notification'] = 'Removed successfully';
                    $aryResponse['cart'] = $cartData;
                    $aryResponse['cartcount'] = count($cartData);
                    $aryResponse['cartamount'] = $total['intTotal'];
                    $aryResponse['cartitemtotal'] = $total['itemTotal'];
                    $aryResponse['whcount'] = $whcount??0;
                    $aryResponse['cartdiscount'] = $total['totalDiscount'];
                    $aryResponse['carttotal'] = $total['intTotal'];
                } else {
                    $aryResponse['message'] = 'failed';
                    $aryResponse['notification'] = 'Did not find any product';
                }
            } else {
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
                    $aryResponse['whcount'] = 0;
                    $aryResponse['cartamount'] = $total['intTotal'];
                    $aryResponse['cartitemtotal'] = $total['itemTotal'];
                    $aryResponse['cartdiscount'] = $total['totalDiscount'];
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

    /* Cart total Function */
    public function getcartTotal()
    {
        $userSession = Session::has('AR_USER') ? Session::get('AR_USER'):[];
        $intTotal = 0;
        $itemTotal = 0;
        $totalDiscount = 0;
        if($userSession){
            $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_is_wholesale',0)->get();
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
    
    public function getCartSessionTotal()
    {
        $resCartInfo = Session::get('CART_SESSION');
        $intTotal = 0;
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
                }else{
                    if(isset($pid[1])){
                        $variation = ArProductVariation::where('pv_id',$pid[1])->first();
                        if(isset($variation)){
                            $intTotal +=  $variation->pv_sellingprice*$cartitem;
                        }
                    }else{
                        $variation = ArProductVariation::where('pv_product_id',$pid[0])->where('pv_default',1)->first();
                        if(isset($variation)){
                            $intTotal +=  $variation->pv_sellingprice*$cartitem;
                        }
                    }
                    
                }
            }
        }
        return ['intTotal' => number_format($intTotal, 2, '.', '')];
    }
    public function plustoCartTotal()
    {
        // $resCartInfo = Session::get('CART_SESSION');
        $userSession = Session::has('AR_USER') ? Session::get('AR_USER'):[];
        $resCartInfo = ArCart::where('cart_user_id', $userSession->user_id)->where('cart_is_wholesale',0)->get();
        $intTotal = 0;
        $itemTotal = 0;
        $totalDiscount = 0;
        if(isset($resCartInfo))
        {
            foreach($resCartInfo as $cartitem)
            {
                $pid = $cartitem->cart_product_id;
                $rowProductInfo = ArProduct::where('product_id',$pid)->first();
                if($rowProductInfo->product_type==0){
                    $intTotal +=  $rowProductInfo->product_selling_price*$cartitem->cart_qty;
                    $itemTotal +=  $rowProductInfo->product_price*$cartitem->cart_qty;
                    $totalDiscount +=  $rowProductInfo->product_discount*$cartitem->cart_qty;
                }else{
                    $variation = ArProductVariation::where('pv_id',$cartitem->cart_variation_id)->first();                    
                    if(isset($variation)){
                        $intTotal +=  $variation->pv_sellingprice * $cartitem->cart_qty;
                        $itemTotal +=  $variation->pv_price*$cartitem->cart_qty;
                        $totalDiscount +=  $variation->pv_discount*$cartitem->cart_qty;
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

    /* Check minimum order quantity Function */
    /* public function checkMaxOrder($productid=0,$quantity=0,$variationid=0){
        $rowProductData = ArProduct::where('product_id',$productid)->first();
        $cartSession = Session::get('CART_SESSION');
        if($variationid>0){
            $strId = $productid.'####'.$variationid;
            $variation = ArProductVariation::where('pv_id',$variationid)->first();
            if(isset($rowProductData) && isset($cartSession[$strId]) && $variation->pv_moq>0){
                if($cartSession[$strId]+$quantity <= $variation->pv_moq){
                    return true;
                }else{
                    return false;
                }
            }else{
                return true;
            }
        }else{
            if(isset($rowProductData) && isset($cartSession[$productid]) && $rowProductData->product_quantity>0){
                if($cartSession[$productid]+$quantity <= $rowProductData->product_quantity){
                    return true;
                }else{
                    return false;
                }
            }else{
                return true;
            }
        }
    } */

    /* Check minimum order quantity Function */
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
            $resCartInfo = ArCart::where('cart_user_id',$userSession->user_id)->where('cart_product_id',$productid)->first();
            if($variationid>0){
                $variation = ArProductVariation::where('pv_id',$variationid)->first();
                if(isset($rowProductData) && isset($resCartInfo)){
                    if($variation->pv_quantity == 0){
                        $aryResponse['status'] = false;
                        $aryResponse['message'] = 'Product is out of stock';
                    }else{
                        if($resCartInfo->cart_qty + $quantity <= $variation->pv_quantity){
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
                if(isset($rowProductData) && isset($resCartInfo)){
                    if($resCartInfo->cart_qty+1 <= $rowProductData->product_stock){
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
    public function checkMaxSessionOrder($productid=0,$quantity=0,$variationid=0){
        $aryResponse = array();
        $rowProductData = ArProduct::where('product_id',$productid)->first();
        if (!$rowProductData) {
            $aryResponse['status'] = false;
            $aryResponse['message'] = 'Product not found.';
            return $aryResponse;
        }
        $cartSession = Session::get('CART_SESSION');
        if($variationid>0){
            $strId = $productid.'####'.$variationid;
            $variation = ArProductVariation::where('pv_id',$variationid)->first();
            if(isset($rowProductData) && isset($cartSession[$strId])){
                if($variation->pv_quantity == 0){
                    $aryResponse['status'] = false;
                    $aryResponse['message'] = 'Product is out of stock';
                }else{
                    if($cartSession[$strId]+$quantity <= $variation->pv_moq){
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
            if(isset($rowProductData) && isset($cartSession[$productid])){
                if($cartSession[$productid]+1 <= $rowProductData->product_moq){
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
        return $aryResponse;
    }

    // public function addtofav(Request $request)
    // {
    //     $aryResponse = [];
    //     $customer = Session::get('AR_USER');
    //     $product_id = $request->product_id;

    //     if (!$customer || !$product_id) {
    //         return response()->json(['data' => ['message' => 'failed']], 400);
    //     }

    //     $check = ArUserFavProduct::where('ufp_user_id', $customer->user_id)
    //                             ->where('ufp_product_id', $product_id)
    //                             ->first();

    //     if ($check) {
    //         // Remove if exists
    //         $check->delete();
    //         $aryResponse['message'] = 'ok';
    //         $aryResponse['notification'] = ''; // removed
    //     } else {
    //         // Add new
    //         $fav = new ArUserFavProduct();
    //         $fav->ufp_user_id = $customer->user_id;
    //         $fav->ufp_product_id = $product_id;
    //         $fav->ufp_status = 1;
    //         $fav->save();

    //         $aryResponse['message'] = 'ok';
    //         $aryResponse['notification'] = 'favourite';
    //     }

    //     $aryResponse['count'] = ArUserFavProduct::where('ufp_user_id', $customer->user_id)->count();

    //     return response()->json(['data' => $aryResponse], 200);
    // }
    public function addtofav(Request $request)
{
    $aryResponse = [];
    $customer = Session::get('AR_USER');
    $product_id = $request->product_id;

    // Check for a logged-in user and product ID
    if (!$customer || !$product_id) {
        return response()->json(['data' => ['message' => 'failed']], 400);
    }

    // Find the product in the user's favorites
    $fav = ArUserFavProduct::where('ufp_user_id', $customer->user_id)
                           ->where('ufp_product_id', $product_id)
                           ->first();

    if ($fav) {
        // Product exists, so remove it (toggle off)
        $fav->delete();
        $aryResponse['message'] = 'ok';
        $aryResponse['notification'] = ''; // Indicates removal
    } else {
        // Product doesn't exist, so add it (toggle on)
        $newFav = new ArUserFavProduct();
        $newFav->ufp_user_id = $customer->user_id;
        $newFav->ufp_product_id = $product_id;
        $newFav->ufp_status = 1;
        $newFav->save();

        $aryResponse['message'] = 'ok';
        $aryResponse['notification'] = 'favourite'; // Indicates adding
    }

    // Get the new count after the operation
    $aryResponse['count'] = ArUserFavProduct::where('ufp_user_id', $customer->user_id)->count();

    return response()->json(['data' => $aryResponse], 200);
}
    public function removefromfav(Request $request)
    {
        $aryResponse = [];
        $customer = Session::get('AR_USER');
        $product_id = $request->product_id;

        if (!$customer || !$product_id) {
            return response()->json(['data' => ['message' => 'failed']], 400);
        }

        $check = ArUserFavProduct::where('ufp_user_id', $customer->user_id)
                                ->where('ufp_product_id', $product_id)
                                ->first();

        if ($check) {
            $check->delete();
        }

        $aryResponse['message'] = 'ok';
        $aryResponse['notification'] = '';
        $aryResponse['count'] = ArUserFavProduct::where('ufp_user_id', $customer->user_id)->count();

        return response()->json(['data' => $aryResponse], 200);
    }


    /* function addReviewProccess(Request $request){
        $customer = Session::get('AR_USER');
        if(isset($customer) && $customer->user_id>0){
            if($request->isMethod('post'))
            {
                if($request->review_content!='')
                {
                    $aryResponse['message']='ok';
                    $checkExist = ArProductReview::where('pr_user_id',$customer->user_id)->first();
                    if(isset($checkExist)){
                        $productReviewObj = ArProductReview::where('pr_user_id',$customer->user_id)->first();
                    }else{
                        $productReviewObj = new ArProductReview;
                    }
                    $productReviewObj->pr_user_id = $customer->user_id;
                    $productReviewObj->pr_product_id = $request->pr_product_id;
                    $productReviewObj->pr_review = $request->review_content;
                    $productReviewObj->pr_title = $customer->user_fname.' '.$customer->user_lname;
                    $productReviewObj->pr_rating = $request->pr_rating;
                    $productReviewObj->pr_status = 0;
                    $productReviewObj->save();
                    return response()->json(['message' =>'ok'],200);
                }else{
                    return response()->json(['message' =>'failed'],200);
                }
            }
        }else{
            return response()->json(['message' =>'session'],200);
        }
        
    } */

    function searchproduct(Request $request)
    {
        if(isset($request->searchstring))
        {
            $resProductData = ArProduct::where('product_name','LIKE','%'.$request->searchstring.'%')
                ->orWhere('product_category_name','LIKE','%'.$request->searchstring.'%')
                ->orWhere('product_tag_name','LIKE','%'.$request->searchstring.'%')->get();
            foreach($resProductData as $rowProductData)
            {
                echo '<li><a href="'.env('APP_URL').'product/'.$rowProductData->product_slug.'">'.$rowProductData->product_name.'</a></li>';
            }
        }
        exit();
    }


    /******************************************************Category Functions****************************************/

    function categories(){
        $title="Categories";
        $category = ArCategory::where('cat_status',1)->get();
        return view('frontend.category.categories',compact('title','category'));
    }

    public function reviewProccess(Request $request){
        $customer = Session::get('AR_USER');
        if($request->isMethod('post'))
        {
            if($request->pr_review!='')
            {
                $aryResponse['message']='ok';
                $checkExist = ArProductReview::where('pr_user_id',$customer->user_id)->where('pr_product_id',$request->pr_product_id)->first();
                if(isset($checkExist)){
                    //$productReviewObj = ArProductReview::where('pr_user_id',$customer->user_id)->where('pr_product_id',$request->pr_product_id)->first();
                    return redirect()->back()->with('success', 'You have already given your review on this product.');
                }else{
                    $productReviewObj = new ArProductReview;
                    $productReviewObj->pr_user_id = $customer->user_id;
                    $productReviewObj->pr_product_id = $request->pr_product_id;
                    $productReviewObj->pr_review = $request->pr_review;
                    $productReviewObj->pr_title = $customer->user_fname.' '.$customer->user_lname;
                    $productReviewObj->pr_rating = $request->rating;
                    $productReviewObj->pr_status = 0;
                    if($request->hasFile('review_image1')){
                        $image = $request->file('review_image1');
                        $name = rand(1000,9999).time().'.'.$image->getClientOriginalExtension();
                        $destinationPath = public_path(env('REVIEW_IMAGE'));
                        $image->move($destinationPath, $name);
                        $url = url('/').'/public'.env('REVIEW_IMAGE').'/'.$name;
                        $productReviewObj->pr_image1 = $url;
                    } 
                    if($request->hasFile('review_image2')){
                        $image = $request->file('review_image2');
                        $name = rand(1000,9999).time().'.'.$image->getClientOriginalExtension();
                        $destinationPath = public_path(env('REVIEW_IMAGE'));
                        $image->move($destinationPath, $name);
                        $url = url('/').'/public'.env('REVIEW_IMAGE').'/'.$name;
                        $productReviewObj->pr_image2 = $url;
                    }
                    $productReviewObj->save();
                    return redirect()->back()->with('success', 'Thank you for your review');
                }
                
            }else{
                return redirect()->back()->with('error', 'Review did not submited. please try after sometime.');
            }
        }else{
            return redirect()->back()->with('error', 'Invalid Method.');
        }
    }

    public function reviewfilterhtml(Request $request){
        $rowProductReview = array();
        if($request->type=='all'){
            $rowProductReview = ArProductReview::where('pr_product_id',$request->product_id)->where('pr_status',1)->orderBy('pr_id','DESC')->get();
        }elseif($request->type=='image'){
            $rowProductReview = ArProductReview::where('pr_product_id',$request->product_id)->where('pr_status',1)->where('pr_image1','!=',null)->orderBy('pr_id','DESC')->get();
        }elseif($request->type=='video'){
            $rowProductReview = ArProductReview::where('pr_product_id',$request->product_id)->where('pr_status',1)->where('pr_video','!=',null)->orderBy('pr_id','DESC')->get();
        }elseif($request->type=='default'){
            $rowProductReview = ArProductReview::where('pr_product_id',$request->product_id)->where('pr_status',1)->orderBy('pr_id','DESC')->get();
        }elseif($request->type=='newest'){
            $rowProductReview = ArProductReview::where('pr_product_id',$request->product_id)->where('pr_status',1)->orderBy('pr_id','DESC')->get();
        }elseif($request->type=='oldest'){
            $rowProductReview = ArProductReview::where('pr_product_id',$request->product_id)->where('pr_status',1)->orderBy('pr_id','ASC')->get();
        }
        $userSession = Session::get('AR_USER');
        $html ='';
        if(isset($rowProductReview) && count($rowProductReview)>0){
            
            foreach($rowProductReview as $value){
                $firstImage = '';
                $secImage = '';
                $video = '';
                
                $ratingPercentage = ($value->pr_rating*20);
                if($value->pr_image1!=''){
                    $firstImage = '<img class="btn-play btn-img pwsp" src="'.$value->pr_image1.'" width="280" height="315" alt="product" />';
                }
                if($value->pr_image2!=''){
                    $secImage = '.<img class="btn-play btn-img pwsp" src="'.$value->pr_image1.'" width="280" height="315" alt="product" />.';
                }
                if($value->pr_video!=''){
                    $video =  '.<a class="btn-play btn-iframe" style="background-image: url('.$image.'); background-size: cover;" href="'.$value->pr_video.'">
                    <i class="d-icon-play-solid"></i>
                </a>.';
                }
                if(isset($userSession) && $userSession->user_id>0){
                    $loginSession = "<button class='btn btn-link btn-icon-left btn-slide-up btn-infinite like mr-2' onclick='giveLikeunlike(1,$value->pr_id)'>
                        <i class='fa fa-thumbs-up'></i>
                        Like (<span class='count' id='likecount$value->pr_id'>$value->pr_likes</span>)
                    </button>
                    <button class='btn btn-link btn-icon-left btn-slide-down btn-infinite unlike' onclick='giveLikeunlike(0,$value->pr_id)'>
                        <i class='fa fa-thumbs-down'></i>
                        Unlike (<span class='count' id='unlikecount$value->pr_id'>$value->pr_unlikes</span>)
                    </button>";
                }else{
                    $loginSession = '<button class="btn btn-link btn-icon-left btn-slide-up btn-infinite mr-2 login-pop">
                        <i class="fa fa-thumbs-up"></i>
                        Like (<span class="count" id=likecount'.$value->pr_id.'">'.$value->pr_likes.'</span>)
                    </button>
                    <button class="btn btn-link btn-icon-left btn-slide-down btn-infinite login-pop">
                        <i class="fa fa-thumbs-down"></i>
                        Unlike (<span class="count" id="unlikecount'.$value->pr_id.'">'.$value->pr_unlikes.'</span>)
                    </button>';
                }
                $html .='<li>
                <div class="comment">
                    <figure class="comment-media">
                        <a href="javascript:void(0);">
                            <img src="https://www.studykee.com/projects/katori/public/img/avtar.png" alt="avatar" />
                        </a>
                    </figure>
                    <div class="comment-body">
                        <div class="comment-rating ratings-container">
                            <div class="ratings-full">
                                <span class="ratings" style="width: '.$ratingPercentage.'%;"></span>
                                <span class="tooltiptext tooltip-top"></span>
                            </div>
                        </div>
                        <div class="comment-user">
                            <span class="comment-date">by <span class="font-weight-semi-bold text-uppercase text-dark">'.$value->pr_title.'</span> on <span class="font-weight-semi-bold text-dark">'.date('M d, Y',strtotime($value->created_at)).'</span></span>
                        </div>

                        <div class="comment-content mb-5">
                            <p>'.$value->pr_review.'</p>
                        </div>
                        <div class="file-input-wrappers">
                            '.$firstImage.'
                            '.$secImage.'
                            '.$video.'
                        </div>
                        <div class="feeling mt-5">
                             '.$loginSession.'
                        </div>
                    </div>
                </div>
            </li>';
            }
        }else{
            $html = '<li><h3>No Review Found</h3></li>';
        }
        echo $html;
        exit();
    }

    public function reviewCommentLikeDislike(Request $request)
    {
        $aryResponse = array();
        $userSession = Session::get('AR_USER');
        $reviewLikeUnlikeData = ArReviewLikeUnlike::where('rlu_review_id',$request->review_id)->where('rlu_product_id',$request->product_id)->where('rlu_user_id',$userSession->user_id)->first();
        if(isset($reviewLikeUnlikeData) && $reviewLikeUnlikeData->rlu_id>0){
            $aryLikeUnlikeObj = $reviewLikeUnlikeData;
        }else{
            $aryLikeUnlikeObj = new ArReviewLikeUnlike;
        }
        $aryLikeUnlikeObj->rlu_review_id = $request->review_id;
        $aryLikeUnlikeObj->rlu_product_id = $request->product_id;
        $aryLikeUnlikeObj->rlu_user_id = $userSession->user_id;
        $aryLikeUnlikeObj->rlu_likeunlike_status = $request->type;
        $aryLikeUnlikeObj->rlu_user_id = $userSession->user_id;
        if($aryLikeUnlikeObj->save()){
            $resLikesCount = ArReviewLikeUnlike::where('rlu_review_id',$request->review_id)->where('rlu_product_id',$request->product_id)->where('rlu_likeunlike_status',1)->count();
            $resUnLikesCount = ArReviewLikeUnlike::where('rlu_review_id',$request->review_id)->where('rlu_product_id',$request->product_id)->where('rlu_likeunlike_status',0)->count();
            ArProductReview::where('pr_id',$request->review_id)->update(['pr_unlikes'=>$resUnLikesCount,'pr_likes'=>$resLikesCount]);
            $aryResponse['status'] = 'ok';
        }else{
            $aryResponse['status'] = 'failed';
        }
        return response()->json(['data'=>$aryResponse],200);
    }

    function getPriceRange($productIds){
        if (empty($productIds)) {
            return ['min' => 0, 'max' => 0];
        }

        $priceRange = ArProduct::where('product_status', 1)
            ->whereIn('product_id', $productIds)
            ->where('product_stock', '>', 0)
            ->selectRaw('MIN(product_selling_price) as min_price, MAX(product_selling_price) as max_price')
            ->first();

        return [
            'min' => $priceRange->min_price ?? 0,
            'max' => $priceRange->max_price ?? 0,
        ];
    }
    function movetowishlist(Request $request){
        $aryPostData = $request->all();
        $aryResponse = array();
        $resCartInfo = Session::has('CART_SESSION') ? Session::get('CART_SESSION'):[];
        Session::forget('CART_COUPON'); 
        if($request->isMethod('post')){
            if(isset($request->variationid) && $request->variationid>0)
            {
                $strId = $request->product_id.'####'.$request->variationid;
            }else{
                $strId = $request->product_id;
            } 
            $resCartInfo[$strId] -=1;
            if(isset($resCartInfo[$strId]) && $resCartInfo[$strId]==0)
            {
                unset($resCartInfo[$strId]);
            } 
            Session::put('CART_SESSION',$resCartInfo); 
            Session::save(); 
            $customer = Session::get('AR_USER');
            $check = ArUserFavProduct::where('ufp_user_id',$customer->user_id)->where('ufp_product_id',$request->product_id)->first();
            if(isset($check->ufp_id) && $check->ufp_id>0){
                //ArUserFavProduct::where('ufp_id', $check->ufp_id)->delete(); 
            }else{
                $check = new ArUserFavProduct;
                $check->ufp_user_id = $customer->user_id;
                $check->ufp_product_id = $request->product_id;
                $check->ufp_status = 1;
                $check->save(); 
            }
            $aryResponse['message'] = 'ok';
        }else{
            $aryResponse['message'] = 'failed';
            $aryResponse['notification'] = 'Invalid Method';
        }
        return response()->json(['data' =>$aryResponse]); 
    }

}
