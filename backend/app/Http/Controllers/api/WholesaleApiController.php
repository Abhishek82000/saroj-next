<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\ArAppearanceSlider;
use App\Models\ArProduct;
use App\Models\ArCategory;
use App\Models\ArTestimonials;
use App\Models\ArProductTags;
use App\Http\Resources\TagWithProductsResource;
use App\Http\Resources\SliderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class WholesaleApiController extends Controller
{
    /**
     * GET /api/wholesale/home
     *
     * Same treatment as the retail HomeController::index(): the original
     * fired 5 queries (slider, 2 hardcoded-ID category lookups, the
     * "show on app home" category+products eager load, testimonials,
     * category list) on every single page load. Cached as one payload
     * here, plus a Cache-Control header so a CDN or Next.js's own fetch
     * cache can skip hitting PHP entirely on repeat visits.
     */
    public function index(): JsonResponse
    {
        $payload = Cache::remember('api_wholesale_home_payload', 600, function () {
            $topSlider = ArAppearanceSlider::where('slider_status', 1)
                ->where('slider_position', 1)
                ->where('slider_is_wholesale', 1)
                ->with([
                    'category:cat_id,cat_name,cat_slug',
                    'tag:tag_id,tag_name,tag_slug',
                ])
                ->orderBy('slider_id', 'DESC')
                ->select(
                    'slider_id', 'slider_name', 'slider_desc', 'slider_image', 'slider_url',
                    'slider_category', 'slider_tags', 'slider_image_mobile', 'slider_image_mac', 'slider_type'
                )
                ->limit(5)
                ->get();

            $categoryHigh = ArCategory::whereIn('cat_id', [24, 19, 54, 55, 65])
                ->where('cat_status', 1)
                ->where('cat_is_wholesale', 1)
                ->orderBy('cat_order', 'ASC')
                ->get();

            $categoryRayon = ArCategory::whereIn('cat_id', [45, 46])
                ->where('cat_status', 1)
                ->where('cat_is_wholesale', 1)
                ->orderBy('cat_order', 'ASC')
                ->get();
            $videoProducts = ArProduct::where('product_status', 1)
                ->where('product_video_cdn', '!=', '')
                ->where('product_stock', '>', 0)
                ->orderBy('product_recommended', 'DESC')
                ->select(
                    'product_id', 'product_name', 'product_wh_mrp_price',
                    'product_wh_selling_price', 'product_slug', 'product_video_cdn'
                )
                ->limit(6)
                ->get();
            $catShowHomePage = ArCategory::where('cat_show_on_app_home', 1)
                ->where('cat_is_wholesale', 1)
                ->where('cat_status', 1)
                ->orderBy('cat_order', 'ASC')
                ->with(['catProducts' => function ($query) {
                    $query->where('product_stock', '>', 0)
                        ->where('product_wholesale', 1)
                        ->where('product_featured', 1)
                        ->orderBy('product_recommended', 'DESC')
                        ->with('gallery')
                        ->select(
                            'product_id', 'product_name', 'product_wh_mrp_price', 'product_wh_selling_price',
                            'product_image', 'product_slug', 'product_moq', 'product_stock', 'product_inventory',
                            'product_type', 'product_label_name', 'product_rating', 'product_review',
                            'product_img_alt', 'product_image_cdn'
                        )
                        ->limit(48);
                }])
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
            $tagShowHomePage = ArProductTags::where('tag_show_on_app_home', 1)
                ->with(['products' => function ($query) {
                    $query->where('product_stock', '>', 0)
                        ->where('product_wholesale', 1)
                        ->where('product_featured', 1)
                        ->orderBy('product_id', 'DESC')
                        ->with('gallery')
                        ->select(
                            'product_id', 'product_name', 'product_wh_mrp_price', 'product_wh_selling_price',
                            'product_image', 'product_slug', 'product_moq', 'product_stock', 'product_inventory',
                            'product_type', 'product_label_name', 'product_rating', 'product_review',
                            'product_img_alt', 'product_image_cdn'
                        )
                        ->limit(30);
                }])
                ->get();
            $testimonials = ArTestimonials::where('testimonial_status', 1)
                ->where('testimonial_featured', 1)
                ->orderBy('testimonial_id', 'DESC')
                ->limit(8)
                ->get();

            $categoryList = ArCategory::where('cat_status', 1)
                ->where('cat_featured', 0)
                ->where('cat_type', 0)
                ->where('cat_is_wholesale', 1)
                ->orderBy('cat_order', 'ASC')
                ->get();
            // ProductResource prices every product from the retail columns, which these
            // queries don't even select — so wholesale products went out with price null.
            // On the wholesale feed, the wholesale columns are the prices.
            $catShowHomePage->each(fn ($cat) => $this->useWholesalePrices($cat->catProducts));
            $tagShowHomePage->each(fn ($tag) => $this->useWholesalePrices($tag->products));

            $slider_image = env('APPEARANCE_IMAGE');
            return [
                'top_slider'     => $topSlider,
                'slider_image'   => $slider_image,
                'category_high'  => $categoryHigh,
                'category_rayon' => $categoryRayon,
                'category_list'  => $categoryList,
                'tag_show_home_page'  => TagWithProductsResource::collection($tagShowHomePage),
                'middle_slider'       => SliderResource::collection($middleSlider),
                'testimonials'   => $testimonials,
                'video_products'      => $videoProducts,
                'category_show_home_page' => $catShowHomePage->map(function ($cat) {
                    return [
                        'cat_id'   => $cat->cat_id,
                        'cat_name' => $cat->cat_name,
                        'cat_slug' => $cat->cat_slug,
                        'products' => ProductResource::collection($cat->catProducts),
                    ];
                }),
            ];
        });

        return response()
            ->json(['success' => true, 'data' => $payload])
            ->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }

    /**
     * Puts the wholesale MRP and selling price where ProductResource reads its
     * `price` / `selling_price`, so the feed carries trade rates, not nulls.
     */
    private function useWholesalePrices($products): void
    {
        foreach ($products as $p) {
            $p->setAttribute('product_price', $p->product_wh_mrp_price);
            $p->setAttribute('product_selling_price', $p->product_wh_selling_price);
        }
    }
}