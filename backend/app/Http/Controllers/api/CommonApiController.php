<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\MenuResource;
use App\Models\ArThemeAdmin;
use App\Models\ArCategory;
use App\Models\ArFooter;
use App\Models\ArAppearanceMenu;
use App\Models\ArAppearanceSlider;
use App\Models\ArPromos;
use App\Support\MenuTree;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

/**
 * JSON equivalent of the data your Blade `Controller::__construct()`
 * pushes into every view via View::share(). A Next.js app doesn't render
 * Blade views, so none of that constructor logic (or the admin
 * multi-login session block, which only matters for admin-panel Blade
 * pages) needs to run on every request — instead it's exposed here as one
 * cacheable "site layout" endpoint that your Next.js root layout fetches
 * once per revalidate window.
 */
class CommonApiController extends Controller
{
    /**
     * GET /api/common
     *
     * Header/footer/menu/promo data your Next.js layout needs on every
     * page. Fetch this once in your root layout (server component) with
     * a revalidate window, not per-page — it barely changes.
     */
    public function layout(Request $request): JsonResponse
    {
        $isWholesale = $request->boolean('wholesale');

        $cacheKey = 'api_common_payload';

        $payload = Cache::remember($cacheKey, 600, function () {
            $currDateTime = date('Y-m-d');

            $settings = ArThemeAdmin::first();
            if ($settings) {
                unset($settings->admin_password);
            }
            $featuredCategories = ArCategory::where('cat_featured', 1)
                ->where('cat_status', 1)
                ->orderBy('cat_order', 'ASC')
                ->get();


            $menuFlat = ArAppearanceMenu::where('menu_status', 1)
                ->with(['pages', 'categories'])
                ->orderBy('menu_order', 'ASC')
                ->get()
                ->toArray();

            $menuTree = MenuTree::build($menuFlat);

            $promos = ArPromos::where('promo_status', 1)
                ->where('promo_type', 0)
                ->where('promo_valid_to', '>', $currDateTime)
                ->orderBy('promo_id', 'DESC')
                ->get();

            return [
                // NOTE: ArThemeAdmin / ArFooter / ArPromos column names beyond
                // what's referenced in your original controller (footer_id,
                // promo_status, promo_type, promo_valid_to, promo_id) weren't
                // visible to me — this returns the full model as-is for now.
                // Swap in dedicated Resources once you confirm the real
                // column lists, so the API doesn't leak internal columns
                // (timestamps, admin password hash fields, etc.) to the
                // frontend.
                'settings' => $settings,
                'featured_categories' => CategoryResource::collection($featuredCategories),
                'menu'                => MenuResource::collection($menuTree),
                'promos'              => $promos,
            ];
        });

        return response()
            ->json([
                'success' => true,
                'data'    => array_merge($payload, [
                    'is_wholesale' => $isWholesale,
                ]),
            ])
            ->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
}
