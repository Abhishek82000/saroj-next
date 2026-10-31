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
use App\Models\ArProduct;
use App\Models\ArProductTags;
use App\Models\ArPages;
use App\Models\CommonSearch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class HandicraftApiController extends Controller
{
    public function index(): JsonResponse
    {
        // Cache the whole assembled payload, not just the page meta row, for 30 s.
        // The key must be this endpoint's own: it used to share 'api_home_payload'
        // with HomeApiController, so whichever endpoint filled the cache first
        // served its payload from BOTH — the home page lost its handicraft
        // sections, or this page lost its wheel.
        $payload = Cache::remember('api_handicraft_payload', 30, function () {

            // Shuffle seeded by today's date, so the tag and category rails come out
            // in a new order each day but hold the same order all day long. Sorting
            // on a hash of date + product id avoids depending on shuffle()'s seed
            // argument, which not every Laravel version keeps.
            $day = date('Y-m-d');
            $dailyShuffle = fn ($products) => $products
                ->sortBy(fn ($p) => crc32($day . '-' . $p->product_id))
                ->values();

            $handicraftCategory = ArCategory::where('cat_status', 1)
                ->where('cat_type', 1)
                ->where('cat_parent', 0)
                ->where('cat_id', '!=', 65)
                ->orderBy('cat_order', 'ASC')
                ->select('cat_id', 'cat_name', 'cat_image', 'cat_slug', 'cat_cdn_url')
                ->get();
            $handicraftFeatCategory = ArCategory::where('cat_status', 1)
                ->where('cat_parent', 0)
                ->where('cat_featured', 1)
                ->where('cat_type', 1)
                ->where('cat_id', '!=', 65)
                ->orderBy('cat_order', 'ASC')
                ->select('cat_id', 'cat_name', 'cat_image', 'cat_slug', 'cat_cdn_url')
                ->get();
            $fabricCategory = ArCategory::where('cat_status', 1)
                ->where('cat_parent', 0)
                ->where('cat_type', 0)
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
                ->limit(5)
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
                        ->where('product_is_handicraft', 1)
                        ->where('product_featured', 1)
                        ->orderBy('product_id', 'DESC')
                        ->with('gallery')
                        ->select($productColumns)
                        ->limit(30);
                }])
                ->get()
                ->each(fn ($tag) => $tag->setRelation('products', $dailyShuffle($tag->products)));
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
            $catShowHomePage = ArCategory::where('cat_show_on_app_home', 1)
                ->where('cat_status', 1)
                ->where('cat_type', 1)
                ->orderBy('cat_order', 'ASC')
                ->with(['catProducts' => function ($query) use ($productColumns) {
                    $query->where('product_stock', '>', 0)
                        ->where('product_status', 1)
                        ->where('product_featured', 1)
                        ->where('product_is_handicraft', 1)
                        ->orderBy('product_recommended', 'DESC')
                        ->with('gallery')
                        ->select($productColumns)
                        ->limit(40);
                }])
                ->get()
                ->each(fn ($cat) => $cat->setRelation('catProducts', $dailyShuffle($cat->catProducts)));

            // The handicraft categories (cat_type 1) marked for the home page, each with
            // its products — the handicraft page's product rails. category_show_home_page
            // above isn't limited to handicraft, so it carries the fabric collections.
            $handiCatShowHomePage = ArCategory::where('cat_show_on_app_home', 1)
                ->where('cat_status', 1)
                ->where('cat_type', 1)
                ->orderBy('cat_order', 'ASC')
                ->with(['catProducts' => function ($query) use ($productColumns) {
                    $query->where('product_stock', '>', 0)
                        ->where('product_status', 1)
                        ->where('product_is_handicraft', 1)
                        ->orderBy('product_recommended', 'DESC')
                        ->with('gallery')
                        ->select($productColumns)
                        ->limit(40);
                }])
                ->get();

            $videoProducts = ArProduct::where('product_status', 1)
                ->where('product_is_handicraft', 1)
                ->where('product_video_cdn', '!=', '')
                ->where('product_stock', '>', 0)
                ->orderBy('product_recommended', 'DESC')
                ->select(
                    'product_id', 'product_name', 'product_price',
                    'product_selling_price', 'product_slug', 'product_video_cdn'
                )
                ->limit(6)
                ->get();
            $handiCatProdShowHome = ArCategory::where('cat_status', 1)
                ->where('cat_type', 1)
                ->orderBy('cat_order', 'ASC')
                ->get();
            $testimonials = ArTestimonials::where('testimonial_status', 1)
                ->where('testimonial_featured', 1)
                ->orderBy('testimonial_id', 'DESC')
                ->limit(8)
                ->get();

            return [
                
                'fabricCategory'          => CategoryResource::collection($fabricCategory),
                'handicraftFeatCategory'          => CategoryResource::collection($handicraftFeatCategory),
                'handicraftCategory'          => CategoryResource::collection($handicraftCategory),
                'top_slider'          => SliderResource::collection($topSlider),
                'tag_show_home_page'  => TagWithProductsResource::collection($tagShowHomePage),
                'category_show_home_page' => $catShowHomePage->map(function ($cat) {
                    return [
                        'cat_id'   => $cat->cat_id,
                        'cat_name' => $cat->cat_name,
                        'cat_slug' => $cat->cat_slug,
                        'products' => ProductResource::collection($cat->catProducts),
                    ];
                }),
                'handicraft_show_home_page' => $handiCatShowHomePage->map(function ($cat) {
                    return [
                        'cat_id'   => $cat->cat_id,
                        'cat_name' => $cat->cat_name,
                        'cat_slug' => $cat->cat_slug,
                        'products' => ProductResource::collection($cat->catProducts),
                    ];
                }),
                'handicraft_type_show_home_page' => $handiCatProdShowHome->map(function ($cat) {
                    return [
                        'cat_id'   => $cat->cat_id,
                        'cat_name' => $cat->cat_name,
                        'cat_slug' => $cat->cat_slug,
                        'image'    => $cat->cat_cdn_url ?: $cat->cat_image,
                        'cat_handi_type' => $cat->cat_handi_type,
                    ];
                }),
                'middle_slider'       => SliderResource::collection($middleSlider),
                'video_handicraft_products'      => $videoProducts,
                'testimonials'        => TestimonialResource::collection($testimonials),
            ];
        });

        return response()
            ->json([
                'success' => true,
                'data'    => $payload,
            ])
            ->header('Cache-Control', 'public, max-age=30, stale-while-revalidate=30');
    }
}