<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArCategory;
use App\Models\ArFaqs;
use App\Models\ArProduct;
use App\Models\ArProductAttributeterms;
use App\Models\ArProductByCategory;
use App\Models\ArProductReview;
use App\Models\ArProductVariation;
use App\Models\ArPromos;
use App\Models\ArThemeAdmin;
use App\Models\ArUserFavProduct;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;

/**
 * Product detail for the Next.js storefront.
 *
 * This mirrors ProductController::productDetail() and productWhDetail() so the
 * two front ends stay in step. Anything the Blade template decides in PHP —
 * which price column to read, what the length dropdown steps by, whether the
 * cart button is a login gate — is decided here and shipped as plain data, so
 * the React side never has to re-derive business rules.
 */
class ProductApiDetailController extends Controller
{
    private const LENGTH_STYLE  = 1;   // sold by the metre
    private const VARIANT_STYLE = 3;   // has an attribute picker
    private const ENQUIRY_STYLE = 4;   // WhatsApp enquiry, no cart
    private const DEFAULT_LGAP  = 0.5;
    private const FREE_SHIPPING = 2000;

    /** GET /api/products/{slug} */
    public function show(Request $request, string $slug): JsonResponse
    {
        return $this->buildDetail($request, $slug, wholesale: false);
    }

    /** GET /api/wholesale/products/{slug} */
    public function showWholesale(Request $request, string $slug): JsonResponse
    {
        return $this->buildDetail($request, $slug, wholesale: true);
    }

    /**
     * POST /api/products/{id}/variation
     * Body: { variation: "Red,XL", wholesale: bool }
     *
     * The equivalent of front.product.getvariationproductdata — the picker
     * calls this when a swatch changes and swaps price, image and stock.
     */
    public function variation(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'variation' => 'required|string',
            'wholesale' => 'sometimes|boolean',
        ]);

        $product = ArProduct::where('product_id', $id)->first();
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        $variation = ArProductVariation::where('pv_product_id', $id)
            ->where('pv_variation', $data['variation'])
            ->first();

        if (!$variation) {
            return response()->json([
                'success' => false,
                'message' => 'That combination is not available',
            ], 422);
        }

        $wholesale = (bool) ($data['wholesale'] ?? false);

        return response()->json([
            'success' => true,
            'data' => [
                'variation_id' => $variation->pv_id,
                'image'        => $variation->pv_image ?: ($product->product_image_cdn ?: $product->product_image),
                'stock'        => (int) ($variation->pv_quantity ?? $product->product_stock),
                'price'        => $this->pricing($product, $variation, $wholesale),
            ],
        ]);
    }

    /**
     * GET /api/products/cards?ids=12,44,7&wholesale=1
     *
     * Rail cards for a list of ids, in the order asked for. The Next.js
     * "recently viewed" strip calls this from the browser, which is what keeps
     * the product page itself statically rendered.
     */
    public function cards(Request $request): JsonResponse
    {
        $ids = collect(explode(',', (string) $request->query('ids')))
            ->map(fn ($id) => (int) trim($id))
            ->filter()->unique()->take(12)->values();

        if ($ids->isEmpty()) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $wholesale = $request->boolean('wholesale');

        $products = ArProduct::whereIn('product_id', $ids)
            ->where('product_stock', '>', 0)
            ->where($wholesale ? 'product_wholesale' : 'product_status', 1)
            ->orderByRaw('FIELD(product_id, ' . $ids->implode(',') . ')')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products->map(fn ($p) => $this->card($p, $wholesale))->values(),
        ]);
    }

    /* ==================================================================== */

    private function buildDetail(Request $request, string $slug, bool $wholesale): JsonResponse
    {
        $product = ArProduct::with(['gallery', 'productAttributeDetails.attributes', 'productTabs'])
            ->withCount('hasManyCart')
            ->where('product_slug', $slug)
            ->where('product_stock', '>', 0)
            ->where($wholesale ? 'product_wholesale' : 'product_status', 1)
            ->first();

        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        // Recently viewed: the Next app owns this list, because it may not share
        // a session with Laravel. It sends what it has as ?recent=12,44,7 and we
        // send back the updated order for it to persist. Session is the fallback
        // for anything still hitting this API from the Blade side.
        $incoming = $request->filled('recent')
            ? collect(explode(',', (string) $request->query('recent')))->map(fn ($id) => (int) trim($id))
            : collect(session('recently_viewed', []));

        $recentIds = $incoming
            ->filter()
            ->reject(fn ($id) => $id === $product->product_id)
            ->prepend($product->product_id)
            ->unique()->take(5)->values()->all();

        session()->put('recently_viewed', $recentIds);

        $userSession = Session::get('AR_USER');
        $userId      = $userSession->user_id ?? null;

        $isFavorite = $userId
            ? ArUserFavProduct::where('ufp_product_id', $product->product_id)
                ->where('ufp_user_id', $userId)->exists()
            : false;

        $variation = ArProductVariation::where('pv_product_id', $product->product_id)
            ->where('pv_default', 1)->first();

        $pricing = $this->pricing($product, $variation, $wholesale);
        $cut     = $this->cutRules($product, $variation, $wholesale);

        [$promo, $promoSeconds] = $this->resolveCategoryPromo($product);

        // Wholesale has its own pricing conversation; the coupon strip and the
        // countdown are retail-only, exactly as the Blade template has it.
        $coupons = $wholesale ? collect() : ArPromos::where('promo_status', 1)
            ->where('promo_type', 0)
            ->where('promo_valid_to', '>', now()->toDateString())
            ->get()
            ->map(fn ($c) => [
                'code'        => $c->promo_coupon_code,
                'description' => $c->promo_description,
                'valid_to'    => $c->promo_valid_to,
            ])->values();

        $reviews = $this->reviewSummary($product);
        $settings = ArThemeAdmin::first();
        $settings?->makeHidden([
            'id',
            'admin_password',
            'admin_min_order',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'mode'    => $wholesale ? 'wholesale' : 'retail',
                'product' => $this->productPayload($product, $variation, $pricing, $cut, $wholesale),
                'variants'          => $this->variantGroups($product, $variation),
                'is_favorite'       => $isFavorite,
                'requires_login'    => $wholesale && !$userId,
                'promo'             => $promo ? [
                    'code'              => $promo->promo_coupon_code,
                    'description'       => $promo->promo_description,
                    'seconds_remaining' => $promoSeconds,
                ] : null,
                'coupons'           => $coupons,
                'reviews'           => $reviews,
                'faqs'              => ArFaqs::where('faq_status', 1)->latest('faq_id')->get()
                                        ->map(fn ($f) => ['title' => $f->faq_title, 'html' => $f->faq_description])->values(),
                'related'           => $this->relatedProducts($product, $wholesale)
                                        ->map(fn ($p) => $this->card($p, $wholesale))->values(),
                'recently_viewed'   => $this->recentProducts($recentIds, $product, $wholesale)
                                        ->map(fn ($p) => $this->card($p, $wholesale))->values(),
                'recently_viewed_ids' => $recentIds,
                'category_rails'    => $this->categoryRails($wholesale),
                'handicraft_categories' => $this->handicraftCategories(),
                'shipping'        => [
                    'estimate'            => '7-10 days',
                    'free_shipping_above' => $wholesale ? null : self::FREE_SHIPPING,
                    'minimum'             => $wholesale ? $cut['min'] . ($cut['mode'] === 'length' ? 'm' : ' pcs') : null,
                ],
                'settings' => $settings,
            ],
        ]);
    }

    /* ---------------- pricing & cut rules ---------------- */

    /**
     * Which price columns apply depends on the mode and on whether the product
     * is variable. Wholesale rows fall back to the variation price when the
     * wholesale columns are empty, matching the Blade's `??` chain.
     */
    private function pricing(ArProduct $product, ?ArProductVariation $variation, bool $wholesale): array
    {
        if ($wholesale) {
            $mrp     = $product->product_wh_mrp_price ?: ($variation->pv_price ?? 0);
            $selling = $product->product_wh_selling_price ?: ($variation->pv_sellingprice ?? 0);
        } elseif ($product->product_type == 1 && $variation) {
            $mrp     = $variation->pv_price ?: $product->product_price;
            $selling = $variation->pv_sellingprice ?: $product->product_selling_price;
        } else {
            $mrp     = $product->product_price;
            $selling = $product->product_selling_price;
        }

        $mrp     = (float) $mrp;
        $selling = (float) $selling;

        return [
            'mrp'      => $mrp,
            'selling'  => $selling,
            // Guard the division the Blade does unguarded — a zero MRP on a
            // draft row currently throws there.
            'discount' => $mrp > 0 ? (int) round(100 - ($selling * 100) / $mrp) : 0,
            'currency' => 'INR',
            'gst_extra' => $wholesale,
        ];
    }

    /**
     * How the buy box behaves: a length dropdown, a quantity stepper, or an
     * enquiry button. `min`, `max` and `step` are the same numbers the Blade
     * feeds its @for loop.
     */
    private function cutRules(ArProduct $product, ?ArProductVariation $variation, bool $wholesale): array
    {
        $style = (int) $product->product_style_type;
        $lgap  = (float) ($product->product_lgap ?: self::DEFAULT_LGAP);

        $max = $wholesale && $variation
            ? (float) ($variation->pv_quantity ?: $product->product_stock)
            : (float) $product->product_stock;

        $min = $wholesale ? (float) ($product->product_wh_min_qty ?: 1) : 1.0;

        if ($style === self::ENQUIRY_STYLE) {
            return ['mode' => 'enquiry', 'min' => 0, 'max' => 0, 'step' => 0, 'unit' => 'enquiry', 'lgap' => $lgap];
        }

        if ($style === self::LENGTH_STYLE) {
            // The Blade raises the floor to one full gap when the gap is
            // coarser than a metre, so the first option is never unbuyable.
            if ($lgap > 1) {
                $min = max($min, $lgap);
            }
            return ['mode' => 'length', 'min' => $min, 'max' => $max, 'step' => $lgap, 'unit' => 'metre', 'lgap' => $lgap];
        }

        return ['mode' => 'quantity', 'min' => $min, 'max' => $max, 'step' => 1, 'unit' => 'each', 'lgap' => $lgap];
    }

    /* ---------------- payload shaping ---------------- */

    private function productPayload(ArProduct $product, ?ArProductVariation $variation, array $pricing, array $cut, bool $wholesale): array
    {
        $image = $variation->pv_image
            ?? ($product->product_image_cdn ?: $product->product_image);

        return [
            'id'                => $product->product_id,
            'name'              => $product->product_name,
            'slug'              => $product->product_slug,
            'sku'               => $product->product_sku,
            'label'             => $product->product_label_name ?: null,
            'image'             => $image,
            'image_alt'         => $product->product_img_alt ?: $product->product_name,
            'gallery'           => $product->gallery->map(fn ($g) => [
                'id'  => $g->gallery_id,
                'src' => $g->gallery_image,
                'alt' => $product->product_img_alt ?: $product->product_name,
            ])->values(),
            'short_description' => $product->product_short_description,
            'description_html'  => $product->product_description,
            'type'              => (int) $product->product_type,      // 0 simple, 1 variable
            'style_type'        => (int) $product->product_style_type,
            'stock'             => (int) $product->product_stock,
            'in_carts'          => (int) ($product->has_many_cart_count ?? 0),
            'rating'            => (float) ($product->product_rating ?? 0),
            'review_count'      => (int) ($product->product_review ?? 0),
            'price'             => $pricing,
            'cut'               => $cut,
            'default_variation_id' => $variation->pv_id ?? null,
            'tabs'              => $product->productTabs->sortBy('tab_id')
                                    ->map(fn ($t) => ['name' => $t->tab_name, 'html' => $t->tab_description])->values(),
            'meta' => [
                'title'       => $product->product_meta_title ?: $product->product_name,
                'description' => $product->product_meta_desc
                                    ?: Str::limit(strip_tags((string) $product->product_description), 300),
                'keywords'    => $product->product_meta_keyword,
            ],
            'wholesale' => [
                // The cross-link between the two versions of the same page.
                'available'      => (bool) $product->product_wholesale,
                'min_qty'        => (float) ($product->product_wh_min_qty ?: 0),
                'selling_price'  => (float) $product->product_wh_selling_price,
                'is_current'     => $wholesale,
                // L-fold note is a wholesale, sold-by-length detail only.
                'l_fold_note'    => $wholesale && (int) $product->product_style_type === self::LENGTH_STYLE,
            ],
        ];
    }

    /**
     * The colour / size / swatch groups behind the picker, with every term
     * resolved so the client does not have to make a second call per attribute.
     */
    private function variantGroups(ArProduct $product, ?ArProductVariation $variation): array
    {
        if ((int) $product->product_type !== 1) {
            return [];
        }

        $selected = $variation ? explode(',', $variation->pv_variation) : [];
        $termsImageBase = rtrim((string) env('PRODUCT_TERMS_IMAGE'), '/');

        return $product->productAttributeDetails->values()->map(function ($detail, $index) use ($selected, $termsImageBase) {
            $termIds = array_filter(explode(',', (string) $detail->attribute_details_attrterms));

            $terms = ArProductAttributeterms::whereIn('terms_id', $termIds)
                ->orderBy('terms_order', 'ASC')->get();

            // Fall back to the first term so a picker is never rendered with
            // nothing chosen — same rule as the Blade's $defaultTerm.
            $default = collect($terms)->firstWhere(fn ($t) => in_array($t->terms_name, $selected, true))
                ?? $terms->first();

            return [
                'index'     => $index,
                'attribute' => $detail->attributes->attribute_name ?? 'Choose',
                // 1 colour swatch, 3 text size, anything else an image swatch
                'type'      => (int) ($detail->attributes->attribute_type ?? 0),
                'default'   => $default->terms_name ?? null,
                'terms'     => $terms->map(fn ($t) => [
                    'id'    => $t->terms_id,
                    'name'  => $t->terms_name,
                    'value' => $t->terms_value,
                    'image' => $t->terms_image ? $termsImageBase . '/' . $t->terms_image : null,
                ])->values(),
            ];
        })->values()->all();
    }

    private function reviewSummary(ArProduct $product): array
    {
        $rows = ArProductReview::where('pr_product_id', $product->product_id)
            ->where('pr_status', 1)->get(['pr_id', 'pr_rating', 'pr_title', 'pr_review', 'pr_created', 'pr_image1']);

        $total   = $rows->count();
        $average = $total ? round($rows->sum('pr_rating') / $total, 2) : 0.0;

        // The Blade writes these two columns back on every page view. Keeping it
        // for parity, but this belongs in a queued job — a GET should not write.
        ArProduct::where('product_id', $product->product_id)
            ->update(['product_rating' => $average, 'product_review' => $total]);

        return [
            'average' => $average,
            'total'   => $total,
            'buckets' => collect([5, 4, 3, 2, 1])
                ->mapWithKeys(fn ($star) => [$star => $rows->where('pr_rating', $star)->count()])->all(),
            'items' => $rows->sortByDesc('pr_id')->take(12)->map(fn ($r) => [
                'id'      => $r->pr_id,
                'rating'  => (int) $r->pr_rating,
                'title'   => $r->pr_title,
                'body'    => $r->pr_review,
                'image'   => $r->pr_image1 ?: null,
                'created' => $r->pr_created,
                'ago'     => $r->pr_created ? Carbon::parse($r->pr_created)->diffForHumans() : null,
            ])->values(),
        ];
    }

    /** One shape for every product that appears in a rail. */
    private function card(ArProduct $p, bool $wholesale): array
    {
        $mrp     = (float) ($wholesale ? $p->product_wh_mrp_price : $p->product_price);
        $selling = (float) ($wholesale ? $p->product_wh_selling_price : $p->product_selling_price);

        return [
            'id'         => $p->product_id,
            'name'       => $p->product_name,
            'slug'       => $p->product_slug,
            'image'      => $p->product_image_cdn ?: $p->product_image,
            'image_alt'  => $p->product_img_alt ?: $p->product_name,
            'mrp'        => $mrp,
            'selling'    => $selling,
            'discount'   => $mrp > 0 ? (int) round(100 - ($selling * 100) / $mrp) : 0,
            'label'      => $p->product_label_name ?: null,
            'rating'     => (float) ($p->product_rating ?? 0),
            'review_count' => (int) ($p->product_review ?? 0),
            'stock'      => (int) $p->product_stock,
            'style_type' => (int) $p->product_style_type,
            'lgap'       => (float) ($p->product_lgap ?: self::DEFAULT_LGAP),
            // The smallest wholesale order line, for wholesale cards (0 = the site default).
            'wh_min_qty' => $wholesale ? (float) ($p->product_wh_min_qty ?: 0) : 0,
        ];
    }

    private function relatedProducts(ArProduct $product, bool $wholesale)
    {
        $categoryIds = explode(',', (string) $product->product_category_id);

        return ArProduct::where('product_id', '!=', $product->product_id)
            ->where('product_stock', '>', 0)
            ->where($wholesale ? 'product_wholesale' : 'product_status', 1)
            ->where(function ($q) use ($categoryIds) {
                foreach ($categoryIds as $catId) {
                    $q->orWhereRaw('FIND_IN_SET(?, product_category_id)', [trim($catId)]);
                }
            })
            ->latest('product_id')
            ->limit($wholesale ? 12 : 10)
            ->get();
    }

    private function recentProducts(array $recentIds, ArProduct $product, bool $wholesale)
    {
        if (!$recentIds) {
            return collect();
        }

        return ArProduct::whereIn('product_id', $recentIds)
            ->where('product_id', '!=', $product->product_id)
            ->where('product_stock', '>', 0)
            ->where($wholesale ? 'product_wholesale' : 'product_status', 1)
            ->orderByRaw('FIELD(product_id, ' . implode(',', array_map('intval', $recentIds)) . ')')
            ->get();
    }

    private function categoryRails(bool $wholesale): array
    {
        $priceColumns = $wholesale
            ? ['product_wh_mrp_price', 'product_wh_selling_price']
            : ['product_price', 'product_selling_price'];

        return ArCategory::where('cat_show_on_app_home', 1)
            ->where('cat_status', 1)
            ->orderBy('cat_order', 'ASC')
            ->with(['catProducts' => function ($q) use ($wholesale, $priceColumns) {
                $q->where('product_stock', '>', 0)
                    ->where($wholesale ? 'product_wholesale' : 'product_status', 1)
                    ->where('product_featured', 1)
                    ->orderBy('product_recommended', 'DESC')
                    ->select(array_merge([
                        'product_id', 'product_name', 'product_image', 'product_slug', 'product_moq',
                        'product_stock', 'product_inventory', 'product_type', 'product_label_name',
                        'product_rating', 'product_review', 'product_img_alt', 'product_image_cdn',
                        'product_lgap', 'product_style_type', 'product_shipping_free'
                    ], $priceColumns))
                    ->limit(24);
            }])
            ->get()
            ->filter(fn ($cat) => $cat->catProducts->isNotEmpty())
            ->map(fn ($cat) => [
                'id'       => $cat->cat_id,
                'name'     => $cat->cat_name,
                'slug'     => $cat->cat_slug,
                'products' => $cat->catProducts->map(fn ($p) => $this->card($p, $wholesale))->values(),
            ])->values()->all();
    }

    /**
     * The handicraft categories (cat_type 1) for the strip at the foot of the
     * product page. Categories without an image are left out — the strip is
     * all photographs.
     */
    private function handicraftCategories(): array
    {
        return ArCategory::where('cat_type', 1)
            ->where('cat_status', 1)
            ->orderBy('cat_order', 'ASC')
            ->get()
            ->map(fn ($cat) => [
                'id'    => $cat->cat_id,
                'name'  => $cat->cat_name,
                'slug'  => $cat->cat_slug,
                'image' => $cat->cat_cdn_url ?: $cat->cat_image,
            ])
            ->filter(fn ($c) => !empty($c['image']))
            ->values()->all();
    }

    private function resolveCategoryPromo(ArProduct $product): array
    {
        $catPromo = ArPromos::where('promo_status', 1)
            ->where('promo_type', 1)
            ->where('promo_week_day', Carbon::now()->format('l'))
            ->first();

        if (!$catPromo) {
            return [null, 0];
        }

        $inCategory = ArProductByCategory::where('cpc_category_id', $catPromo->promo_cat_id)
            ->where('cpc_product_id', $product->product_id)
            ->exists();

        if (!$inCategory) {
            return [null, 0];
        }

        $promoEnd = Carbon::today()->setTimeFromTimeString(
            Carbon::parse($catPromo->promo_valid_to)->format('H:i:s')
        );

        return [$catPromo, max(0, Carbon::now()->diffInSeconds($promoEnd, false))];
    }
}
