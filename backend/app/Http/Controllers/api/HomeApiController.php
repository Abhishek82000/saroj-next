<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\SliderResource;
use App\Http\Resources\TagWithProductsResource;
use App\Http\Resources\TestimonialResource;
use App\Http\Resources\BlogResource;
use App\Models\ArAppearanceSlider;
use App\Models\ArCategory;
use App\Models\ArTestimonials;
use App\Models\ArNewsBlogs;
use App\Models\ArProduct;
use App\Models\ArProductTags;
use App\Models\ArPages;
use App\Models\ArFaqs;
use App\Models\CommonSearch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class HomeApiController extends Controller
{
    public function index(): JsonResponse
    {
        // Cache the whole assembled payload, not just the page meta row.
        // 10 min is a reasonable revalidate window for a homepage; tune to taste.
        $payload = Cache::remember('api_home_payload', 10, function () {

            $category = ArCategory::where('cat_status', 1)
                ->where('cat_parent', 0)->where('cat_type', 0)
                ->where('cat_id', '!=', 65)
                ->orderBy('cat_order', 'ASC')
                ->select('cat_id', 'cat_name', 'cat_image', 'cat_slug', 'cat_cdn_url')
                ->get();

            $topSlider = ArAppearanceSlider::where('slider_status', 1)
                ->where('slider_position', 1)
                ->where('slider_is_wholesale', 0)
                ->with([
                    'category:cat_id,cat_name,cat_slug',
                    'tag:tag_id,tag_name,tag_slug',
                ])
                ->orderBy('slider_id', 'DESC')
                ->select(
                    'slider_id', 'slider_name', 'slider_desc', 'slider_image',
                    'slider_url', 'slider_category', 'slider_tags',
                    'slider_image_mobile', 'slider_image_mac', 'slider_type',
                    'slider_web_cdn', 'slider_mob_cdn'
                )
                ->limit(7)
                ->get();

            $middleSlider = ArAppearanceSlider::where('slider_status', 1)
                ->where('slider_position', 5)
                ->with([
                    'category:cat_id,cat_name,cat_slug',
                    'tag:tag_id,tag_name,tag_slug',
                ])
                ->orderBy('slider_id', 'DESC')
                ->select(
                    'slider_id', 'slider_name', 'slider_desc', 'slider_image',
                    'slider_url', 'slider_category', 'slider_tags', 'slider_type',
                    'slider_image_mobile', 'slider_image_mac', 'slider_web_cdn',
                    'slider_mob_cdn'
                )
                ->get();

            $productColumns = [
                'product_id', 'product_name', 'product_price',
                'product_selling_price', 'product_image', 'product_slug',
                'product_moq', 'product_stock', 'product_inventory',
                'product_type', 'product_label_name', 'product_rating',
                'product_review', 'product_img_alt', 'product_image_cdn',
                'product_lgap', 'product_style_type', 'product_shipping_free'
            ];

            $tagShowHomePage = ArProductTags::where('tag_show_on_app_home', 1)
                ->with(['products' => function ($query) use ($productColumns) {
                    $query->where('product_stock', '>', 0)
                        ->where('product_status', 1)
                        ->where('product_is_handicraft', 0)
                        ->where('product_featured', 1)
                        ->orderBy('product_id', 'DESC')
                        ->with('gallery')
                        ->select($productColumns)
                        ->limit(30);
                }])
                ->get();
            $handcategories = ArCategory::where('cat_status', 1)
                ->where('cat_type', 1)
                ->orderBy('cat_order', 'ASC')
                ->select('cat_id', 'cat_name', 'cat_image', 'cat_slug', 'cat_cdn_url')
                ->get();
            $catShowHomePage = ArCategory::where('cat_show_on_app_home', 1)
                ->where('cat_status', 1)->where('cat_type', 0)
                ->orderBy('cat_order', 'ASC')
                ->with(['catProducts' => function ($query) use ($productColumns) {
                    $query->where('product_stock', '>', 0)
                        ->where('product_status', 1)
                        ->where('product_is_handicraft', 0)
                        ->where('product_featured', 1)
                        ->orderBy('product_recommended', 'DESC')
                        ->with('gallery')
                        ->select($productColumns)
                        ->limit(40);
                }])
                ->get();
            $handiCatProdShowHome = ArCategory::where('cat_status', 1)
                ->where('cat_type', 1)
                ->orderBy('cat_order', 'ASC')
                ->get();

            $videoProducts = ArProduct::where('product_status', 1)
                ->where('product_video_cdn', '!=', '')
                ->where('product_stock', '>', 0)
                ->where('product_is_handicraft', 0)
                ->orderBy('product_recommended', 'DESC')
                ->select(
                    'product_id', 'product_name', 'product_price',
                    'product_selling_price', 'product_slug', 'product_video_cdn'
                )
                ->limit(6)
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

            $pageMeta = ArPages::whereNull('page_url')
                ->select('page_name', 'page_meta_keyword', 'page_meta_desc', 'page_meta_title')
                ->first();

            return [
                'meta' => [
                    'title'            => $pageMeta->page_name ?? 'Saroj Textiles - Home',
                    'meta_title'       => $pageMeta->page_meta_title ?? '',
                    'meta_keyword'     => $pageMeta->page_meta_keyword ?? '',
                    'meta_description' => $pageMeta->page_meta_desc ?? '',
                ],
                'categories'          => CategoryResource::collection($category),
                'handcategories'          => CategoryResource::collection($handcategories),
                'top_slider'          => SliderResource::collection($topSlider),
                'middle_slider'       => SliderResource::collection($middleSlider),
                'tag_show_home_page'  => TagWithProductsResource::collection($tagShowHomePage),
                'category_show_home_page' => $catShowHomePage->map(function ($cat) {
                    return [
                        'cat_id'   => $cat->cat_id,
                        'cat_name' => $cat->cat_name,
                        'cat_slug' => $cat->cat_slug,
                        'products' => ProductResource::collection($cat->catProducts),
                    ];
                }),
                'handicraft_show_home_page' => $handiCatProdShowHome->map(function ($cat) {
                    return [
                        'cat_id'   => $cat->cat_id,
                        'cat_name' => $cat->cat_name,
                        'cat_slug' => $cat->cat_slug,
                        'cat_handi_type' => $cat->cat_handi_type,
                    ];
                }),
                'video_products'      => $videoProducts,
                'testimonials'        => TestimonialResource::collection($testimonials),
                'blogs'               => BlogResource::collection($blogs),
            ];
        });

        return response()
            ->json([
                'success' => true,
                'data'    => $payload,
            ])
            ->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }

    public function search(Request $request)
    {
        $request->validate([
            'q'         => 'nullable|string|max:100',
            'wholesale' => 'nullable|boolean',
        ]);
        $term = trim((string) $request->query('q', $request->query('searchstring', '')));

        if ($term === '') {
            return response()->json(['success' => true, 'data' => []]);
        }

        $isWholesale = $request->query('wholesale');
        $statusFilter = $isWholesale ? 'wh_status' : 'status';
        $results = CommonSearch::where('name', 'LIKE', '%' . $term . '%')->where($statusFilter, 1)
            ->limit(20)
            ->get()
            ->map(function ($row) use ($isWholesale) {
                if ($isWholesale) {
                    $url = $row->type == 2
                        ? url('/wholesale/' . $row->slug)
                        : url('/wholesale/product/' . $row->slug);
                } else {
                    $url = match ((int) $row->type) {
                        1 => url('/tag/' . $row->slug),
                        2 => url('/shop/' . $row->slug),
                        default => url('/product/' . $row->slug),
                    };
                }

                return [
                    'name' => $row->name,
                    'slug' => $row->slug,
                    'image' => $row->image,
                    'type' => $row->type,
                    'url'  => $url,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $results,
        ]);
    }
    public function commonmetaData($slug='')
    {
        $metaData = ArPages::where('page_url', $slug)
            ->select('page_name', 'page_content','page_meta_title', 'page_meta_desc', 'page_meta_keyword', 'page_header_image','page_url')
            ->first();
    
        if ($metaData) {
            return response()->json([
                'status' => 'success',
                'message' => 'Data fetch    ed successfully',
                'metaData' => $metaData,
                'page_image_path' => env('PAGE_IMAGE', '')
            ], 200);
        }
    
        // Return default metadata when not found
        return response()->json([
            'status' => 'success', // Still success since this is a valid response
            'message' => 'Using default metadata',
            'metaData' => [
                'page_meta_title' => 'Saroj Textile - designer fabric online',
                'page_meta_desc' => 'Saroj Textile - designer fabric online',
                'page_meta_keyword' => 'Saroj Textile - designer fabric online',
                'page_header_image' => 'https://www.sarojtextile.com/img/uploads/settings/1755887479.jpeg'
            ],
            'page_image_path' => env('PAGE_IMAGE', '')
        ], 200);
    }
    public function pageDetails($slug='')
    {   
        $pageDetails = ArPages::where('page_url', $slug)->where('page_status',1)->first();
        $imgUrl = env('PAGE_IMAGE');
            
        if ($pageDetails) {
            return response()->json(['status' => 'success', 'message' => 'Data fetched successfully', 'data' => $pageDetails, 'imgUrl' => $imgUrl], 200);
        } else {
            return response()->json(['status' => 'error', 'message' => 'Page not found'], 200);
        }
    }
    public function faqs(): JsonResponse
    {
        
        $faqs = ArFaqs::where('faq_status', 1)
            ->orderBy('faq_id', 'DESC')
            ->get();

        return response()->json([
            'success' => true,

            'data' => [
                'faqs' => $faqs,
            ],
        ], 200);
    }
}