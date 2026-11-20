<?php

/*
 * The Next.js storefront (www.sarojtextile.com).
 *
 * A file of its own, so nothing has to be merged into config/services.php:
 * upload it to config/ and Laravel loads it as config('storefront.*').
 */

return [

    // Shared secret the storefront's server sends as the X-Storefront-Key
    // header. Calls carrying it skip the per-IP API rate limit
    // (App\Providers\RouteServiceProvider). Same value as STOREFRONT_API_KEY
    // in the Next.js app's environment. Empty = no exemption.
    'key' => env('STOREFRONT_API_KEY', ''),

];
