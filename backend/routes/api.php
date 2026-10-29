<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\HomeApiController;
use App\Http\Controllers\api\CommonApiController;
use App\Http\Controllers\api\CartApiController;
use App\Http\Controllers\api\OfferApiController;
use App\Http\Controllers\api\FavoriteApiController;
use App\Http\Controllers\api\NewsletterApiController;
use App\Http\Controllers\api\ProductApiController;
use App\Http\Controllers\api\ProductApiDetailController;
use App\Http\Controllers\api\ReviewApiController;
use App\Http\Controllers\api\BlogApiController;
use App\Http\Controllers\api\WholesaleApiController;
use App\Http\Controllers\api\LoginApiController;
use App\Http\Controllers\api\AccountApiController;
use App\Http\Controllers\api\HandicraftApiController;
use App\Http\Controllers\api\CashfreeApiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/
Route::prefix('auth')->group(function () {
    // throttle:6,1 = 6 requests/minute per IP — a floor, not a full fix,
    // for a 4-digit OTP with no expiry. Consider also rate-limiting per
    // mobile number (not just per IP) and adding an otp_expires_at column.
    Route::post('/send-otp', [LoginApiController::class, 'sendOtp'])->middleware('throttle:6,1');
    Route::post('/verify-otp', [LoginApiController::class, 'verifyOtp'])->middleware('throttle:10,1');
    Route::post('/register', [LoginApiController::class, 'register']);
 
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/me', [LoginApiController::class, 'me']);
        Route::post('/update-profile', [LoginApiController::class, 'updateProfile']);
        Route::post('/logout', [LoginApiController::class, 'logout']);
        
        Route::get('/orders', [AccountApiController::class, 'orders']);
        Route::get('/order-view/{orderNumber}', [AccountApiController::class, 'orderView']);
        Route::get('/wishlist', [AccountApiController::class, 'wishlist']);
        Route::post('/add-to-wishlist', [AccountApiController::class, 'toggle']);
        Route::post('/remove-to-wishlist', [AccountApiController::class, 'remove']);
        Route::get('/count-data', [AccountApiController::class, 'countData']);
    });
});
Route::post('cart/paynow', [CashfreeApiController::class, 'payNow'])->middleware('throttle:10,1');
Route::get('cart/payment-status/{orderNumber}', [CashfreeApiController::class, 'status'])->middleware('throttle:30,1');
Route::post('cashfree/webhook', [CashfreeApiController::class, 'webhook'])->name('cashfree.webhook');
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/process/{productId}/reviews', [ReviewApiController::class, 'store']);
    Route::get('/cart', [CartApiController::class, 'index']);
    Route::post('/cart/sync', [CartApiController::class, 'sync']);
    Route::patch('/cart/{cartId}', [CartApiController::class, 'update'])->whereNumber('cartId');
    Route::delete('/cart/{cartId}', [CartApiController::class, 'remove'])->whereNumber('cartId');
});
Route::get('/home', [HomeApiController::class, 'index']);
Route::get('/search', [HomeApiController::class, 'search']);
Route::get('/faqs', [HomeApiController::class, 'faqs']);
Route::get('/meta-data/{slug}', [HomeApiController::class, 'commonmetaData']);
Route::get('/page-data/{slug}', [HomeApiController::class, 'pageDetails']);
Route::get('/common', [CommonApiController::class, 'layout']);

// Products
Route::get('/products', [ProductApiController::class, 'index']);
Route::get('/products/variation', [ProductApiController::class, 'variation']);
Route::get('/categories', [ProductApiController::class, 'categories']);

Route::post('/get-state-city', [CartApiController::class, 'getStateCity']);

Route::get('/products/cards',                [ProductApiDetailController::class, 'cards']);
Route::get('/products/{slug}',               [ProductApiDetailController::class, 'show']);
Route::post('/products/{id}/variation',      [ProductApiDetailController::class, 'variation'])
    ->whereNumber('id');
Route::get('/wholesale/products/{slug}',     [ProductApiDetailController::class, 'showWholesale']);

// Cart — retail is open to guests, whose cart lives in the browser: these two
// only price/check it (and store it when a Bearer token is sent).
Route::post('/cart/add', [CartApiController::class, 'add']);
Route::post('/cart/price', [CartApiController::class, 'price']);

// Offers — featured coupons, the milestone offer, free shipping; and applying a
// coupon to the browser's cart. Guests or Bearer. See OfferApiController.
Route::get('/offers', [OfferApiController::class, 'index']);
Route::post('/offers/apply', [OfferApiController::class, 'apply'])->middleware('throttle:20,1');
// Stored carts (retail + wholesale) of the Bearer token's user.
    
    Route::get('/products/{productId}/reviews', [ReviewApiController::class, 'index']);
// Favorites
Route::post('/favorites/toggle', [FavoriteApiController::class, 'toggle']);
Route::delete('/favorites/{product_id}', [FavoriteApiController::class, 'remove']);
Route::post('/favorites/move-from-cart', [FavoriteApiController::class, 'moveFromCart']);

// Newsletter
Route::post('/newsletter/subscribe', [NewsletterApiController::class, 'subscribe']);
Route::post('/contact-process', [NewsletterApiController::class, 'processContact']);

// Blogs
Route::get('/blogs', [\App\Http\Controllers\api\BlogApiController::class, 'index']);
Route::get('/blogs/{slug}', [\App\Http\Controllers\api\BlogApiController::class, 'show']);

// Wholesale Apis
Route::get('/wholesale-page-data', [\App\Http\Controllers\api\WholesaleApiController::class, 'index']);


// Handicraft Apis
Route::get('/handicraft-data', [\App\Http\Controllers\api\HandicraftApiController::class, 'index']);


// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });
