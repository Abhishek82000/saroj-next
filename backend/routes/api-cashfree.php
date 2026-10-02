<?php

/*
 * Add to routes/api.php — above any `cart/{id}` wildcard routes so these match first.
 */

use App\Http\Controllers\Api\CashfreeApiController;

Route::post('cart/paynow', [CashfreeApiController::class, 'payNow'])->middleware('throttle:10,1');
Route::get('cart/payment-status/{orderNumber}', [CashfreeApiController::class, 'status'])->middleware('throttle:30,1');
Route::post('cashfree/webhook', [CashfreeApiController::class, 'webhook'])->name('cashfree.webhook');
