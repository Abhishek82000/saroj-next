<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArAppearanceSlider;
use App\Models\ArCategory;
use App\Models\ArTestimonials;
use App\Models\ArNewsBlogs;
use App\Models\ArProduct;
use App\Models\ArProductTags;
use App\Models\ArPages;
use Illuminate\Support\Facades\Cache;
use App\Models\CommonSearch;
use DB;
use Hash;
use Session;

class HomeController extends Controller
{
    public function index(){          
    $title = 'Saroj Textiles - Home';
    $meta_keyword = "";
    $meta_description = "";
    $meta_title = "";   
    
    $category = ArCategory::where('cat_status', 1)
        ->where('cat_parent', 0)
        ->where('cat_type', 0)
        ->where('cat_id','!=', 65)
        ->orderBy('cat_order', 'ASC')
        ->select('cat_id', 'cat_name', 'cat_image', 'cat_slug','cat_cdn_url')
        ->get();
    
    $topSlider = ArAppearanceSlider::where('slider_status', 1)
        ->where('slider_position', 1)
        ->where('slider_is_wholesale', 0)
        ->with(['category:cat_id,cat_name,cat_slug', 'tag:tag_id,tag_name,tag_slug'])
        ->limit(5)
        ->orderBy('slider_id', 'DESC')
        ->select('slider_id', 'slider_name', 'slider_desc', 'slider_image', 'slider_url', 'slider_category', 'slider_tags', 'slider_image_mobile','slider_image_mac','slider_type','slider_web_cdn','slider_mob_cdn')
        ->get();
    $tagShowHomePage = ArProductTags::where('tag_show_on_app_home', 1)
    ->with(['products' => function($query) {
        $query->where('product_stock', '>', 0)->where('product_is_handicraft', 0)
                ->where('product_status', 1)->where('product_featured', 1)
                ->orderBy('product_id', 'DESC')
                ->with('gallery')
                ->select('product_id', 'product_name', 'product_price', 
                        'product_selling_price', 'product_image', 'product_slug', 
                        'product_moq', 'product_stock', 'product_inventory', 
                        'product_type', 'product_label_name', 'product_rating', 
                        'product_review','product_img_alt','product_image_cdn','product_lgap','product_style_type')
                ->limit(30);
    }])
    ->get();
    
    $middleSlider = ArAppearanceSlider::where('slider_status', 1)
        ->where('slider_position', 8)
        ->with(['category:cat_id,cat_name,cat_slug', 'tag:tag_id,tag_name,tag_slug'])
        ->orderBy('slider_id', 'DESC')
        ->select('slider_id', 'slider_name', 'slider_desc', 'slider_image', 'slider_url', 'slider_category', 'slider_tags', 'slider_type', 'slider_image_mobile', 'slider_image_mac','slider_web_cdn','slider_mob_cdn')
        ->get();
    $videoProducts = ArProduct::where('product_status',1)->where('product_video_cdn','!=','')->where('product_stock','>',0)->orderBy('product_recommended','DESC')->select('product_id','product_name','product_price','product_selling_price','product_slug','product_video_cdn')->limit(6)->get();
    $catShowHomePage = ArCategory::where('cat_show_on_app_home', 1)->where('cat_status', 1)->orderBy('cat_order','ASC')->where('cat_type', 0)
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
                ->limit(40);
    }])
    ->get();
    
    $testimonials = ArTestimonials::where('testimonial_status', 1)
        ->where('testimonial_featured', 1)
        ->orderBy('testimonial_id', 'DESC')
        ->limit(8)
        ->get();
    
    $blogs = ArNewsBlogs::where('blog_status', 1)
        ->where('blog_featured', 1)
        ->orderBy('blog_id', 'DESC')
        ->select('blog_slug', 'blog_name', 'blog_image')
        ->limit(6)
        ->get();
    $getpagedetails = Cache::remember('home_page_details', 3600, function() {
        return ArPages::where('page_url', null)
            ->select('page_name', 'page_meta_keyword', 'page_meta_desc', 'page_meta_title')
            ->first();
    });
    
    if($getpagedetails) {
        $title = $getpagedetails->page_name;            
        $meta_keyword = $getpagedetails->page_meta_keyword;
        $meta_description = $getpagedetails->page_meta_desc;
        $meta_title = $getpagedetails->page_meta_title;
    }
    $homePage = 'home';
    return view('frontend.home.index', compact(
        'title', 'meta_keyword', 'meta_description', 'meta_title',
        'category', 'topSlider', 'tagShowHomePage', 'middleSlider','videoProducts',
        'catShowHomePage', 'testimonials', 'blogs','homePage'
    ));
}
    function searchproduct(Request $request)
    {
        if(isset($request->searchstring))
        {
            $resProductData = CommonSearch::where( 'name', 'LIKE', '%'   . $request->searchstring . '%' )->get();
            if($request->wholesale==1){
                foreach($resProductData as $rowProductData)
                {
                    if($rowProductData->type==2){
                        
                        echo '<li class="tf-quicklink-item"><a href="'.url('/').'/wholesale/'.$rowProductData->slug.'">'.$rowProductData->name.'</a></li>';
                    }
                    else {                    
                        echo '<li class="tf-quicklink-item"><a href="'.url('/').'/wholesale/product/'.$rowProductData->slug.'">'.$rowProductData->name.'</a></li>';
                    }
                }
            }else{
                foreach($resProductData as $rowProductData)
                {
                    if($rowProductData->type==1){
                        echo '<li class="tf-quicklink-item"><a href="'.url('/').'/tag/'.$rowProductData->slug.'">'.$rowProductData->name.'</a></li>';
                    }
                    else if($rowProductData->type==2){
                        
                        echo '<li class="tf-quicklink-item"><a href="'.url('/').'/shop/'.$rowProductData->slug.'">'.$rowProductData->name.'</a></li>';
                    }
                    else {                    
                        echo '<li class="tf-quicklink-item"><a href="'.url('/').'/product/'.$rowProductData->slug.'">'.$rowProductData->name.'</a></li>';
                    }
                }
            }
        }
        exit();
    }
}