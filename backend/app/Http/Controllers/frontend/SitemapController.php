<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArCategory;
use App\Models\ArNewsBlogs;
use App\Models\ArProduct;
use App\Models\ArProductTags;
use App\Models\ArPages;
use App\Models\ArThemeAdmin;

class SitemapController  extends Controller
{
    public function index()
    {
        $priorityarray = ['0.90','0.80','0.70','0.60','0.50','0.40','0.30','0.20','0.10'];
        $getpagesdata = ArPages::where('page_status',1)->orderBy('page_id','ASC')->get();
        $getCategoryData = ArCategory::where('cat_status',1)->orderBy('cat_order','ASC')->get();
        $wholesaleCatData = $getCategoryData->where('cat_is_wholesale', 1)->sortBy('cat_order');
        $getTagData = ArProductTags::where('tag_status',1)->where('tag_show_on_app_home',1)->orderBY('tag_id','DESC')->select('tag_name','tag_slug')->get();
        $getblogsdata = ArNewsBlogs::where('blog_status',1)->orderBy('blog_id','DESC')->get();
        $getProductData = ArProduct::where('product_status',1)->where('product_stock','>',0)->orderBy('product_recommended','DESC')->select('product_name','product_slug','updated_at')->get();
        $site_settings = ArThemeAdmin::first();
        return response()->view('frontend.sitemap.index', [
            'blogs' => $getblogsdata,
            'pages' => $getpagesdata,
            'categories' => $getCategoryData,
            'wholesale_cat' => $wholesaleCatData,
            'tags' => $getTagData,
            'products' => $getProductData,
            'site_settings' => $site_settings,
            'priorityarray' => $priorityarray
        ])->header('Content-Type', 'text/xml');
    }
}