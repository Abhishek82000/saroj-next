<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            /* The Next.js storefront renders every page on its own server, so all
               its calls come from one IP: per-IP limiting throttled every visitor
               at once (pages stuck loading, then "not found"). Its calls carry
               this shared secret (config/storefront.php ← STOREFRONT_API_KEY,
               set in both apps' env) and aren't throttled. Route-level limits (OTP, pay now, offers/apply)
               still apply on top. */
            $key = (string) config('storefront.key', '');
            if ($key !== '' && hash_equals($key, (string) $request->header('X-Storefront-Key', ''))) {
                return Limit::none();
            }
            /* Browsers call the API directly too; in India many shoppers share
               one mobile-carrier IP (CGNAT), so 60 a minute was too tight. */
            return Limit::perMinute(300)->by($request->user()?->id ?: $request->ip());
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }
}
