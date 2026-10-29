<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\ArCategory;
use App\Models\ArProduct;
use App\Models\ArProductAttribute;
use App\Models\ArProductAttributeDetail;
use App\Models\ArProductBrand;
use App\Models\ArProductByCategory;
use App\Models\ArProductTags;
use App\Models\ArProductVariation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The original had SIX separate endpoints for what is really one concept
 * — "a filtered, sorted, paginated product list": productList (by
 * category), tagproduct, featuredproduct, productSortFilter,
 * productPriceFilter, productAttributesFilter — each re-deriving the
 * category/tag context from scratch and each returning a fresh HTML
 * fragment for a different bit of the page. For a Next.js frontend that's
 * six fetches doing overlapping work instead of one.
 *
 * Here it's one endpoint driven entirely by query params, which also maps
 * cleanly onto Next.js's `useSearchParams` / server-component
 * `searchParams` pattern and keeps filters bookmarkable/shareable in the
 * URL — the original persisted sort/attribute filters into a server
 * Session (filterByCat()), which doesn't translate well to a stateless
 * API and is dropped here in favor of the URL carrying that state.
 *
 * GET /api/products
 *   ?category=slug        — products in this category
 *   &tag=slug              — products with this tag (mutually exclusive with category)
 *   &featured=1             — featured products only
 *   &sort=low_high|high_low|best_selling|latest
 *   &price_min=&price_max=
 *   &attributes[]=red&attributes[]=xl
 *   &brands[]=3&brands[]=7
 *   &page=1
 */
class ProductApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $category = null;
        $tag = null;

        $query = ArProduct::where('product_status', 1)->where('product_stock', '>', 0);

        if ($request->filled('category')) {
            $category = ArCategory::where('cat_slug', $request->category)->where('cat_status', 1)->first();
            if (!$category) {
                return response()->json(['success' => false, 'message' => 'Category not found'], 404);
            }
            $productIds = ArProductByCategory::where('cpc_category_id', $category->cat_id)->pluck('cpc_product_id');
            $query->whereIn('product_id', $productIds);
        } elseif ($request->filled('tag')) {
            $tag = ArProductTags::where('tag_slug', $request->tag)->where('tag_status', 1)->first();
            if (!$tag) {
                return response()->json(['success' => false, 'message' => 'Tag not found'], 404);
            }
            $query->whereRaw('FIND_IN_SET(?, product_tag_id)', [$tag->tag_id]);
        } elseif ($request->boolean('featured')) {
            $query->where('product_featured', 1);
        }
        $categoryList = ArCategory::where('cat_parent',0)->where('cat_id','!=', 65)->orderBy('cat_order','ASC')->select('cat_id','cat_name','cat_slug')->get();
        $tagsList = ArProductTags::where('tag_status',1)->orderBy('tag_id','DESC')->select('tag_id','tag_name','tag_slug')->get();
        $saleProducts = ArProduct::where('product_recommended',1)->where('product_status',1)->where('product_stock','>',0)->with(['images'])->inRandomOrder()->select('product_name','product_price','product_selling_price','product_image','product_slug','product_image_cdn')->limit(4)->get();
        // price_range meta reflects the category/tag scope BEFORE the
        // price filter itself, so a frontend price slider has real bounds.
        $priceRange = (clone $query)
            ->selectRaw('MIN(product_selling_price) as min_price, MAX(product_selling_price) as max_price')
            ->first();

        if ($request->filled('price_min') && $request->filled('price_max')) {
            $query->whereBetween('product_selling_price', [$request->price_min, $request->price_max]);
        }

        if ($request->filled('attributes')) {
            $matchingIds = ArProductAttributeDetail::get()
                ->filter(function ($attr) use ($request) {
                    $terms = explode(',', $attr->attribute_details_attrterms);
                    return count(array_intersect($request->attributes, $terms)) > 0;
                })
                ->pluck('attribute_details_proid')
                ->unique();

            $query->whereIn('product_id', $matchingIds);
        }

        if ($request->filled('brands')) {
            $query->whereIn('product_brand_id', $request->brands);
        }

        match ($request->sort) {
            'high_low'     => $query->orderBy('product_selling_price', 'DESC'),
            'low_high'     => $query->orderBy('product_selling_price', 'ASC'),
            'best_selling' => $query->where('product_featured', 1)->orderBy('product_recommended', 'DESC'),
            default        => $query->orderBy('product_id', 'DESC'),
        };

        $products = $query->with('images')->paginate(24)->withQueryString();
        
        return response()->json([
            'success' => true,
            'data'    => [
                'category'    => $category ? ['id' => $category->cat_id, 'name' => $category->cat_name, 'cat_short_desc' => $category->cat_short_desc, 'slug' => $category->cat_slug] : null,
                'tag'         => $tag ? ['id' => $tag->tag_id, 'name' => $tag->tag_name, 'cat_short_desc' => "", 'slug' => $tag->tag_slug] : null,
                'categoryList'    => $categoryList,
                'tagsList'         => $tagsList,
                'price_range' => ['min' => $priceRange->min_price ?? 0, 'max' => $priceRange->max_price ?? 0],
                'products'    => ProductResource::collection($products),
                'saleProducts'    => $saleProducts,
                'pagination'  => [
                    'current_page' => $products->currentPage(),
                    'last_page'    => $products->lastPage(),
                    'total'        => $products->total(),
                ],
            ],
        ]);
    }

    /** GET /api/categories — flat list (the original `categories()` action). */
    public function categories(): JsonResponse
    {
        $categories = ArCategory::where('cat_status', 1)->get();

        return response()->json(['success' => true, 'data' => $categories->map(fn ($c) => [
            'id' => $c->cat_id, 'name' => $c->cat_name, 'slug' => $c->cat_slug,
        ])]);
    }

    /** GET /api/products/variation?variation=...&product_id=... */
    public function variation(Request $request): JsonResponse
    {
        $variation = ArProductVariation::where('pv_variation', $request->variation)
            ->where('pv_product_id', $request->product_id)
            ->first();

        return response()->json(['success' => true, 'data' => $variation]);
    }
}
