<?php

/*
 * Add this entry to the array in config/services.php.
 */

return [

    'cashfree' => [
        'app_id'       => env('CASHFREE_APP_ID'),
        'secret'       => env('CASHFREE_SECRET_KEY'),
        // "sandbox" or "production"
        'env'          => env('CASHFREE_ENV', 'sandbox'),
        // Where the Next.js storefront lives — Cashfree sends the buyer back to
        // <frontend_url>/checkout/status (or /wholesale-fabric/checkout/status).
        'frontend_url' => env('CASHFREE_FRONTEND_URL', 'https://www.sarojtextile.com'),
    ],

];
