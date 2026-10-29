<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\badmin\LoginController;
use App\Http\Controllers\badmin\DashboardController;
use App\Http\Controllers\badmin\SettingsController;
use App\Http\Controllers\badmin\CategoryController;
use App\Http\Controllers\badmin\CustomerController;
use App\Http\Controllers\badmin\TestimonialController;
use App\Http\Controllers\badmin\AppearenceController;
use App\Http\Controllers\badmin\NewsBlogsController;
use App\Http\Controllers\badmin\OfferPromoController;
use App\Http\Controllers\badmin\TransactionController;
use App\Http\Controllers\badmin\ReviewsController;
use App\Http\Controllers\badmin\OrderController;
use App\Http\Controllers\badmin\ProductController;
use App\Http\Controllers\badmin\PageController;
use App\Http\Controllers\badmin\ShippingController;
use App\Http\Controllers\badmin\PaymentsController;
use App\Http\Controllers\badmin\LocationController;
use App\Http\Controllers\badmin\NewsletterController;
use App\Http\Controllers\badmin\MediaController;
use App\Http\Controllers\badmin\ContactController;
use App\Http\Controllers\badmin\PartnerController;
use App\Http\Controllers\badmin\TaxController;
use App\Http\Controllers\badmin\SalesController;
use App\Http\Controllers\badmin\TicketController;
use App\Http\Controllers\badmin\SellerController;
use App\Http\Controllers\badmin\QcRequestController;
use App\Http\Controllers\badmin\MerchantController;
use App\Http\Controllers\badmin\EventController;
use App\Http\Controllers\frontend\EventsController;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Route::group(['namespace' => 'frontend'],function(){

// 	// Route::get('/email-verify/{hash?}', [App\Http\Controllers\frontend\LoginController::class, 'emailVerify'])->name('front.login.emailVerify');
// 	// Route::get('/email-view/{type?}', [App\Http\Controllers\frontend\LoginController::class, 'viewEmail'])->name('front.login.viewEmail');
// 	Route::any('/sitemap.xml', [App\Http\Controllers\frontend\SitemapController::class, 'index']);
// 	Route::post('/sendotp', [App\Http\Controllers\frontend\LoginController::class, 'sendotp'])->name('front.login.sendotp');
// 	Route::post('/sendcartotp', [App\Http\Controllers\frontend\LoginController::class, 'sendcartotp'])->name('front.login.sendcartotp');
// 	Route::post('/verifyotp', [App\Http\Controllers\frontend\LoginController::class, 'verifyotp'])->name('front.login.verifyotp');
// 	Route::post('/verifycartotp', [App\Http\Controllers\frontend\LoginController::class, 'verifycartotp'])->name('front.login.verifycartotp');
// 	Route::post('/register', [App\Http\Controllers\frontend\LoginController::class, 'register'])->name('front.login.register');
// 	Route::any('/updatePincode', [App\Http\Controllers\frontend\LoginController::class, 'updatePincode'])->name('front.updatePincode');
	
// 	// Route::get('/login', [App\Http\Controllers\frontend\LoginController::class, 'login'])->name('front.login');

// 	Route::any('/', [App\Http\Controllers\frontend\HomeController::class, 'index'])->name('front.home');
// 	Route::any('home/searchproduct', [App\Http\Controllers\frontend\HomeController::class, 'searchproduct'])->name('front.home.searchproduct');
// 	Route::post('home/mobilesearchproduct', [App\Http\Controllers\frontend\HomeController::class, 'mobilesearchproduct'])->name('front.home.mobilesearchproduct');
	
// 	Route::get('/cart', [App\Http\Controllers\frontend\CartController::class, 'index'])->name('front.cart.index');
// 	Route::post('product/remove-from-fav', [App\Http\Controllers\frontend\MyWishListController::class, 'removefromfav'])->name('frontend.removefromfav');
// 	Route::post('cart/removeitemfromcart', [App\Http\Controllers\frontend\ProductController::class, 'removeitemfromcart'])->name('frontend.removeitemfromcart');
// 	Route::get('cart/minicart', [App\Http\Controllers\frontend\CartController::class, 'minicart'])->name('frontend.minicart');
// 	Route::get('cart/getcarttotal', [App\Http\Controllers\frontend\CartController::class, 'getcartNewTotal'])->name('frontend.cart.getcartNewTotal');
// 	Route::get('cart/checkout-address', [App\Http\Controllers\frontend\CartController::class, 'cartAddress'])->name('frontend.cart.cartAddress');
// 	Route::get('cart/checkout', [App\Http\Controllers\frontend\CartController::class, 'checkout'])->name('frontend.payment');
// 	Route::get('cart/shoppingcarthtml', [App\Http\Controllers\frontend\CartController::class, 'shoppingcarthtml'])->name('frontend.cart.shoppingcarthtml');
// 	Route::post('cart/selectAddress', [App\Http\Controllers\frontend\CartController::class, 'selectAddress'])->name('frontend.cart.selectAddress');
// 	Route::post('cart/updatetocartcouponbyname', [App\Http\Controllers\frontend\CartController::class, 'updatetocartcouponbyname'])->name('frontend.cart.updatetocartcouponbyname');
// 	Route::post('cart/fetchShipmentdata', [App\Http\Controllers\frontend\CartController::class, 'fetchShipmentdata'])->name('frontend.cart.fetchShipmentdata');
// 	Route::any('cart/fetch-shipment-amount', [App\Http\Controllers\frontend\CartController::class, 'fetchShipmentAmount'])->name('frontend.cart.fetchShipmentAmount');
// 	Route::get('cart/removepromocode', [App\Http\Controllers\frontend\CartController::class, 'removepromocode'])->name('frontend.cart.removepromocode');
// 	Route::get('thank-you', [App\Http\Controllers\frontend\CartController::class, 'thankyou'])->name('frontend.cart.thankyou');
// 	Route::get('cart/failed', [App\Http\Controllers\frontend\CartController::class, 'failed'])->name('frontend.cart.failed');
// 	Route::post('cart/create-razorpay-order', [App\Http\Controllers\frontend\CartController::class, 'createRazorpayOrder'])->name('frontend.cart.createRazorpayOrder');
// 	Route::get('cart/getpaymentstatus/{id?}', [App\Http\Controllers\frontend\CartController::class, 'getpaymentstatus'])->name('frontend.cart.getpaymentstatus');
// 	Route::post('cart/paymentprocessing', [App\Http\Controllers\frontend\CartController::class, 'paymentprocessing'])->name('frontend.cart.paymentprocessing');
// 	Route::post('cart/paymentprocessingcod', [App\Http\Controllers\frontend\CartController::class, 'paymentprocessingcod'])->name('frontend.cart.paymentprocessingcod');
// 	// Route::post('cart/addtocart', [App\Http\Controllers\frontend\CartController::class, 'addToCart'])->name('frontend.cart.addToCart');

// 	//Cash Free routs
// 	Route::post('cart/createdCashFreeOrderId', [App\Http\Controllers\frontend\CashFreeController::class, 'createdCashFreeOrderId'])->name('frontend.cart.createdCashFreeOrderId');
// 	Route::any('cashfree/payments/success', [App\Http\Controllers\frontend\CashFreeController::class, 'success'])->name('frontend.cart.paymentsuccess');
// 	Route::any('payments/cancel', [App\Http\Controllers\frontend\CartController::class, 'cancel'])->name('frontend.cart.paymentcancel');

	
// 	Route::get('/checkout', [App\Http\Controllers\frontend\CartController::class, 'checkout'])->name('front.cart.checkout');
// 	Route::get('/account', [App\Http\Controllers\frontend\AccountController::class, 'index'])->name('front.account.index');
// 	Route::get('/profile', [App\Http\Controllers\frontend\AccountController::class, 'profile'])->name('front.account.profile');
// 	Route::get('/help-support', [App\Http\Controllers\frontend\AccountController::class, 'helpsupport'])->name('front.account.helpsupport');
// 	Route::post('/accountprocess', [App\Http\Controllers\frontend\AccountController::class, 'accountProcess'])->name('front.accountprocess');
// 	Route::any('order-view/{orderid}', [App\Http\Controllers\frontend\AccountController::class, 'orderview'])->name('frontend.order.view');
// 	Route::post('cancel-order', [App\Http\Controllers\frontend\AccountController::class, 'cancelorder'])->name('frontend.cancelorder');
	

// 	Route::any('logout', [App\Http\Controllers\frontend\AccountController::class, 'frontlogout'])->name('front.logout');

// 	Route::get('/blogs', [App\Http\Controllers\frontend\BlogController::class, 'blog_list'])->name('front.blog.blog_list');
// 	// Route::get('/blogs-category/{id}', [App\Http\Controllers\frontend\BlogController::class, 'blog_by_category'])->name('front.blog.blogbycategory');
// 	Route::get('/blog/{id?}', [App\Http\Controllers\frontend\BlogController::class, 'blog_detail'])->name('front.blog.blog_detail');
// 	// Route::get('/blogs/{id}', [App\Http\Controllers\frontend\BlogController::class, 'blog_by_tags'])->name('front.blog.blog_by_tags');
// 	// Route::get('blogs/{type}/{id}', [App\Http\Controllers\frontend\BlogController::class, 'blogUrl'])->name('front.blog.blogUrl');

// 	/*Events Route*/
//     Route::get('events', [EventsController::class, 'events'])->name('frontend.events');
//     Route::get('event-details/{event_slug?}', [EventsController::class, 'eventDetails'])->name('frontend.events.eventdetails');

// 	Route::get('/testimonials', [App\Http\Controllers\frontend\TestimonialController::class, 'index'])->name('front.testimonial.index');
// 	Route::get('/about', [App\Http\Controllers\frontend\PagesController::class, 'aboutus'])->name('front.pages.aboutus');
// 	Route::get('/contact', [App\Http\Controllers\frontend\PagesController::class, 'contactus'])->name('front.pages.contactus');
// 	Route::get('faq', [App\Http\Controllers\frontend\PagesController::class, 'faqs'])->name('front.pages.faqs');
// 	Route::post('/process-contact', [App\Http\Controllers\frontend\PagesController::class, 'processcontact'])->name('front.contactus.processcontact');

// 	Route::get('addresses', [App\Http\Controllers\frontend\MyAddressController::class, 'myaddress'])->name('frontend.myaddress');
// 	Route::any('address/getStateCity', [App\Http\Controllers\frontend\MyAddressController::class, 'getStateCity'])->name('frontend.getStateCity');
// 	Route::any('addaddressprocess', [App\Http\Controllers\frontend\MyAddressController::class, 'addaddressprocess'])->name('frontend.addaddressprocess');
// 	Route::any('deleteaddress/{id}', [App\Http\Controllers\frontend\MyAddressController::class, 'deleteaddress'])->name('frontend.deleteaddress');

// 	Route::get('order', [App\Http\Controllers\frontend\AccountController::class, 'myorder'])->name('frontend.myorders');
// 	Route::get('wishlist', [App\Http\Controllers\frontend\AccountController::class, 'wishlist'])->name('frontend.mywishlist');
// 	Route::post('changepassword', [App\Http\Controllers\frontend\AccountController::class, 'changepassword'])->name('front.changepassword');


// 	Route::get('/the-process', [App\Http\Controllers\frontend\StoriesController::class, 'index'])->name('front.stories.theprocess');
// 	Route::get('/company', [App\Http\Controllers\frontend\StoriesController::class, 'index'])->name('front.stories.company');
// 	Route::get('/the-founder', [App\Http\Controllers\frontend\StoriesController::class, 'index'])->name('front.stories.founder');


// 	Route::get('/shop/{id}', [App\Http\Controllers\frontend\ProductController::class, 'productList'])->name('front.product.product_list');
// 	Route::get('/featured-product', [App\Http\Controllers\frontend\ProductController::class, 'featuredproduct'])->name('frontend.featuredproduct');
// 	Route::get('/tag/{slug?}', [App\Http\Controllers\frontend\ProductController::class, 'tagproduct'])->name('frontend.tagproduct');
// 	Route::any('/product/{id?}', [App\Http\Controllers\frontend\ProductController::class, 'productDetail'])->name('front.product.product_detail');

// 	// Wholesale Routes
// 	Route::get('/wholesale/{id}', [App\Http\Controllers\frontend\WholesaleController::class, 'productWholesaleList'])->name('front.product.productWholesaleList');
// 	Route::get('/wholesale-cart', [App\Http\Controllers\frontend\WholesaleController::class, 'wholesalecart'])->name('front.wholesale.wholesalecart');
// 	Route::get('/wholesale-fabric', [App\Http\Controllers\frontend\WholesaleController::class, 'catWholesaleList'])->name('front.product.catWholesaleList');
// 	Route::any('/wholesale/product/{id?}', [App\Http\Controllers\frontend\ProductController::class, 'productWhDetail'])->name('front.product.wholesale_product_detail');
// 	Route::post('/addtocartwholesale', [App\Http\Controllers\frontend\WholesaleController::class, 'addtocartwholesale'])->name('front.product.addtocartwholesale');
// 	Route::post('/plustocartAll', [App\Http\Controllers\frontend\WholesaleController::class, 'plustocartAll'])->name('front.wholesale.plustocartAll');
// 	Route::post('/plustocartwholesale', [App\Http\Controllers\frontend\WholesaleController::class, 'plustocartwholesale'])->name('front.wholesale.plustocartwholesale');
// 	Route::post('removeitemfromallcart', [App\Http\Controllers\frontend\WholesaleController::class, 'removeitemfromallcart'])->name('frontend.removeitemfromallcart');
// 	Route::post('removeitemfromcartwholesale', [App\Http\Controllers\frontend\WholesaleController::class, 'removeitemfromcartwholesale'])->name('frontend.removeitemfromcartwholesale');
// 	Route::post('/minustocartAll', [App\Http\Controllers\frontend\WholesaleController::class, 'minustocartAll'])->name('front.product.minustocartAll');
// 	Route::post('/minustocartwholesale', [App\Http\Controllers\frontend\WholesaleController::class, 'minustocartwholesale'])->name('front.product.minustocartwholesale');
// 	Route::get('/wholesale-checkout', [App\Http\Controllers\frontend\CartController::class, 'wholesalecheckout'])->name('front.cart.wholesalecheckout');

	
// 	Route::post('/sort-filter', [App\Http\Controllers\frontend\ProductController::class, 'productSortFilter'])->name('frontend.products.filter');
// 	Route::post('/price-filter', [App\Http\Controllers\frontend\ProductController::class, 'productPriceFilter'])->name('frontend.products.productPriceFilter');
// 	Route::post('/sort-attributes-filter', [App\Http\Controllers\frontend\ProductController::class, 'productAttributesFilter'])->name('frontend.products.productAttributesFilter');
// 	Route::post('/review-proccess', [App\Http\Controllers\frontend\ProductController::class, 'reviewProccess'])->name('frontend.products.reviewProccess');

// 	/* Route::post('/product/category-filter/{id?}', [App\Http\Controllers\frontend\ProductController::class, 'filterByCat'])->name('front.product.filterByCat'); */
// 	Route::post('/getvariationproductdata', [App\Http\Controllers\frontend\ProductController::class, 'getvariationproductdata'])->name('front.product.getvariationproductdata');
// 	Route::post('/addtocart', [App\Http\Controllers\frontend\ProductController::class, 'addtocart'])->name('front.product.addtocart');
// 	Route::post('/sync-cart', [App\Http\Controllers\frontend\ProductController::class, 'syncCart'])->name('front.product.syncCart');
// 	Route::post('/update-cart-qty', [App\Http\Controllers\frontend\ProductController::class, 'updateCartQty'])->name('front.product.updateCartQty');
// 	Route::post('/buy-now', [App\Http\Controllers\frontend\ProductController::class, 'buynow'])->name('front.product.buynow');
// 	Route::post('/plustocart', [App\Http\Controllers\frontend\ProductController::class, 'plustocart'])->name('front.product.plustocart');
// 	Route::post('/minustocart', [App\Http\Controllers\frontend\ProductController::class, 'minustocart'])->name('front.product.minustocart');
// 	Route::get('/product-quick-view/{slug?}', [App\Http\Controllers\frontend\ProductController::class, 'productDetailModalHtml'])->name('front.product.productDetailModalHtml');
// 	Route::get('/get-video-products', [App\Http\Controllers\frontend\HomeController::class, 'getVidProducts'])->name('front.home.getVidProducts');
// 	Route::post('/addtofav', [App\Http\Controllers\frontend\ProductController::class, 'addtofav'])->name('front.product.addtofav');
// 	Route::post('/movetowishlist', [App\Http\Controllers\frontend\ProductController::class, 'movetowishlist'])->name('front.product.movetowishlist');
// 	/* Route::post('/addReviewProccess', [App\Http\Controllers\frontend\ProductController::class, 'addReviewProccess'])->name('front.product.addReviewProccess'); */
// 	Route::post('/searchproduct', [App\Http\Controllers\frontend\ProductController::class, 'searchproduct'])->name('front.product.searchproduct');
// 	/* Route::post('/selectAddons', [App\Http\Controllers\frontend\ProductController::class, 'selectAddons'])->name('front.product.selectAddons');
// 	Route::post('/addAddons', [App\Http\Controllers\frontend\ProductController::class, 'addAddons'])->name('front.product.addAddons');
// 	Route::post('/addonsHtml', [App\Http\Controllers\frontend\ProductController::class, 'addonsHtml'])->name('front.product.addonsHtml'); */
// 	Route::post('/newsletterProccess', [App\Http\Controllers\frontend\ProductController::class, 'newsletterProccess'])->name('front.product.newsletterProccess');
// 	Route::post('/product/reviewFilter', [App\Http\Controllers\frontend\ProductController::class, 'reviewfilterhtml'])->name('front.product.reviewFilter');
// 	Route::post('/product/reviewCommentLikeDislike', [App\Http\Controllers\frontend\ProductController::class, 'reviewCommentLikeDislike'])->name('front.product.reviewCommentLikeDislike');
	
// 	//Category Route 
// 	Route::get('/tags/special-offers', [App\Http\Controllers\frontend\PagesController::class, 'specialOffers'])->name('front.specialOffers');
// 	Route::get('/categories', [App\Http\Controllers\frontend\ProductController::class, 'categories'])->name('front.category.categories');
// 	//Route::get('/view-all/{type}/{slug?}', [App\Http\Controllers\frontend\HomeController::class, 'viewall'])->name('front.viewallproducts');

// 	Route::get('/tracking', [App\Http\Controllers\frontend\TrackingController::class, 'tracking'])->name('frontend.tracking');
// 	// Route::get('/tag/special-offers', [App\Http\Controllers\frontend\PagesController::class, 'specialOffers'])->name('front.specialOffers');
// 	Route::get('/{url}', [App\Http\Controllers\frontend\PagesController::class, 'index'])->name('front.pages.index');

// });

Route::group(['namespace' => 'badmin'],function(){
	Route::get('/', [LoginController::class, 'adminLogin'])->name('adminLogin');
	Route::post('/login/loginAdminProcess', [LoginController::class, 'adminlogincheck'])->name('adminlogincheck');
	
    Route::group(['middleware'=>'AdminSession'], function(){
		Route::group(['prefix'=>'merchant'],function(){
			Route::get('/index', [MerchantController::class, 'index'])->name('badmin.merchant.index');
			Route::get('/sync/{id}', [MerchantController::class, 'syncProduct'])->name('badmin.merchant.syncProduct');
			Route::get('/bulk-sync', [MerchantController::class, 'bulkSync'])->name('badmin.merchant.bulkSync');
			Route::get('/delete/{id}', [MerchantController::class, 'deleteProduct'])->name('badmin.merchant.deleteProduct');
			Route::get('/list', [MerchantController::class, 'listProducts'])->name('badmin.merchant.list');
		});

    	Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    	Route::get('/logout', [LoginController::class, 'logout'])->name('badmin.adminLogout');
		Route::any('cart-abandonment', [App\Http\Controllers\badmin\CartAbandonmentController::class, 'index'])->name('badmin.cartabandonment.index');
		Route::get('cart-export', [App\Http\Controllers\badmin\CartAbandonmentController::class, 'cartExport'])->name('badmin.cartabandonment.cartExport');
    	Route::any('cart-abandonment-view/{user_id?}', [DashboardController::class, 'cartAbandonmentView'])->name('badmin.cartAbandonmentView');
		/* Settings Section */
		Route::get('setting/contact-setting', [SettingsController::class, 'contactsetting'])->name('badmin.setting.contactsetting');
    	Route::post('setting/contact-process', [SettingsController::class, 'contactprocess'])->name('badmin.setting.contactprocess');
    	Route::get('/setting/site-setting', [SettingsController::class, 'siteSetting'])->name('badmin.setting.sitesetting');
    	Route::post('/site-settings-process', [SettingsController::class, 'sitesettingsprocess'])->name('badmin.sitesettingsprocess');
		Route::any('change-password', [SettingsController::class, 'changepassword'])->name('backend.changepassword');
	    Route::any('changepasswordprocess', [SettingsController::class, 'changepasswordprocess'])->name('backend.changepasswordprocess');
	    Route::get('socialsettings', [SettingsController::class, 'socialsettings'])->name('badmin.socialsettings');
		Route::post('socialsettingprocess', [SettingsController::class, 'socialsettingprocess'])->name('badmin.socialsettingprocess');

		/* Customer Section */
    	Route::any('/customer/{id?}', [CustomerController::class, 'customer'])->name('badmin.customer');
		Route::get('/customer-view/{id?}', [CustomerController::class, 'customerview'])->name('badmin.customer.view');
		Route::get('/customer-status/{id?}', [CustomerController::class, 'customerstatus'])->name('badmin.customer.status');
		Route::get('/customer-delete/{id?}', [CustomerController::class, 'customerdelete'])->name('badmin.customer.delete');
		Route::any('/customer-filter', [CustomerController::class, 'customerfilter'])->name('badmin.customerfilter');
		Route::post('/customer-bulk-action', [CustomerController::class, 'customerbulkaction'])->name('badmin.customerbulkaction');
		
		//Product section
		Route::any('/allproduct/{id?}', [ProductController::class, 'allproduct'])->name('allproduct');
		Route::get('/addproduct/{type?}/{id?}', [ProductController::class, 'addproduct'])->name('addproduct');
		Route::any('/productcat/{id?}', [ProductController::class, 'productcat'])->name('productcat');
		Route::any('/products/productchange', [ProductController::class, 'productchange'])->name('badmin.productchange');
		Route::post('/products/productProcess', [ProductController::class, 'productProcess'])->name('productProcess');
		Route::post('/product/uploadgalleryimage', [ProductController::class, 'uploadgalleryimage'])->name('badmin.product.uploadgalleryimage');
		Route::post('/product/uploadresultimage', [ProductController::class, 'uploadresultimage'])->name('badmin.product.uploadresultimage');
		Route::get('/products/checkfeatured/{id?}', [ProductController::class, 'checkfeatured'])->name('product.checkfeatured');
		Route::get('/products/checkrecommended/{id?}', [ProductController::class, 'checkrecommended'])->name('product.checkrecommended');
		Route::get('/products/statusupdate/{id}', [ProductController::class, 'statusupdate'])->name('product.statusupdate');
		Route::get('/products/whstatusupdate/{id}', [ProductController::class, 'whstatusupdate'])->name('product.whstatusupdate');
		Route::get('/products/destroy/{id}', [ProductController::class, 'destroy'])->name('product.destroy');
		//Route::any('/searching-product', [ProductController::class, 'allproduct'])->name('badmin.searching');
 		Route::any('/products/getterms', [ProductController::class, 'getterms'])->name('badmin.products.getterms');
 		Route::any('/products/reset-filter', [ProductController::class, 'resetfilter'])->name('badmin.products.resetfilter');
 		Route::any('/products/productbulkaction', [ProductController::class, 'productbulkaction'])->name('badmin.productbulkaction');
		Route::any('/products/delete-product-video/{id?}', [ProductController::class, 'deleteproductvideo'])->name('badmin.deleteproductvideo');
		Route::get('/export/fb-products', [ProductController::class, 'fbProductExport'])->name('fb.products.export');


 		Route::get('/products/productCopy/{productid}', [ProductController::class, 'productCopy'])->name('badmin.products.productCopy');
		Route::any('/get-product-term', [ProductController::class, 'getProductTerms'])->name('badmin.getProductTerms');

		//Product->Category section
		Route::get('/category', [CategoryController::class, 'index'])->name('badmin.category');
		Route::get('/add-category/{id?}', [CategoryController::class, 'addCategory'])->name('badmin.addCategory');
		Route::get('/category-featured-change/{id?}', [CategoryController::class, 'categoryFeaturedChange'])->name('badmin.category.changefeatured');
    	Route::get('/category-status-change/{id?}', [CategoryController::class, 'categoryStatusChange'])->name('badmin.category.changestatus');
    	Route::get('/category-wh-status-change/{id?}', [CategoryController::class, 'categoryWhStatusChange'])->name('badmin.category.categoryWhStatusChange');
    	Route::get('/category-delete/{id?}', [CategoryController::class, 'categoryDelete'])->name('badmin.category.delete');
 		Route::post('/category-proccess',[CategoryController::class, 'categoryProccess'])->name('badmin.categoryProccess');
 		Route::post('update-category-order',[CategoryController::class, 'updateCategoryOrder'])->name('badmin.category.updatecategoryorder');

 		//Product->Tags section
		Route::get('products/tags/{id?}', [ProductController::class, 'tags'])->name('badmin.tags');
    	Route::post('products/tag-process/{id?}',[ProductController::class, 'tagprocess'])->name('badmin.tagprocess');
    	Route::get('products/tag-status/{id?}',[ProductController::class, 'tagstatus'])->name('badmin.tagstatus');
    	Route::get('products/delete-tag/{id?}',[ProductController::class, 'deletetag'])->name('badmin.deletetag');
		Route::get('products/featured-tag/{id?}', [ProductController::class, 'tagfeatured'])->name('badmin.tagfeatured');

		/* Category Commission Section */
    	Route::get('/category-commission-list/{id?}', [CategoryController::class, 'commissionList'])->name('badmin.commissionList');
    	Route::post('/category-commission/commission-proccess',[CategoryController::class, 'commissionProccess'])->name('badmin.commissionProccess');
		Route::get('/category-commission/commission-delete/{id?}', [CategoryController::class, 'commissionDelete'])->name('badmin.commissionDelete');

		/* Category Attribute Section */
    	Route::get('/category-attribute/{categoryid}/{id?}', [CategoryController::class, 'attribute'])->name('badmin.attribute');
    	Route::post('/category-attribute/attribute-proccess',[CategoryController::class, 'attributeProccess'])->name('badmin.attributeProccess');
    	Route::get('/category-attribute/attribute-status/{categoryid}/{id?}', [CategoryController::class, 'attributeStatus'])->name('badmin.attributeStatus');
    	Route::get('/category-attribute/attribute-delete/{categoryid}/{id?}', [CategoryController::class, 'attributeDelete'])->name('badmin.attributeDelete');

		//Product->Brand section
		Route::get('products/brand/{id?}', [ProductController::class, 'brand'])->name('badmin.brand');
		Route::post('products/brand-process/{id?}',[ProductController::class, 'brandprocess'])->name('badmin.brandprocess');
    	Route::get('products/brand-status/{id?}',[ProductController::class, 'brandstatus'])->name('badmin.brandstatus');
    	Route::get('products/delete-brand/{id?}',[ProductController::class, 'deletebrand'])->name('badmin.deletebrand');

		//Tax Rates->Tax section
		Route::get('tax-rates/{id?}', [TaxController::class, 'tax'])->name('badmin.tax'); 
		Route::post('tax-rates/{id?}',[TaxController::class, 'taxprocess'])->name('badmin.taxprocess');
    	Route::get('tax-rates-status/{id?}',[TaxController::class, 'taxstatus'])->name('badmin.taxstatus');
    	Route::get('delete-tax-rates/{id?}',[TaxController::class, 'deletetax'])->name('badmin.deletetax');
		
		//Sales Report->Sales Report section
		Route::any('sales-report', [SalesController::class, 'salesReport'])->name('badmin.sales.salesReport'); 
		Route::get('sales-report-reset', [SalesController::class, 'salesReportReset'])->name('badmin.sales.salesReportReset'); 
		Route::get('sales-report-export', [SalesController::class, 'salesReportExport'])->name('badmin.sales.salesReportExport'); 

		//Product->Label section
    	Route::get('label/{id?}', [ProductController::class, 'label'])->name('badmin.label');
    	Route::post('label-process/{id?}', [ProductController::class, 'labelprocess'])->name('badmin.labelprocess');
    	Route::get('label-status/{id?}', [ProductController::class, 'labelstatus'])->name('badmin.labelstatus');
    	Route::get('delete-label/{id?}', [ProductController::class, 'deletelabel'])->name('badmin.deletelabel');

    	//Product->Attributes section
    	Route::get('products/product-attributes/{id?}', [ProductController::class, 'productAttributes'])->name('badmin.product.attributes');
    	Route::post('products/attribute-process/{id?}', [ProductController::class, 'attributeProcess'])->name('badmin.product.attribute_process');
    	Route::get('products/delete-attribute/{id}', [ProductController::class, 'deleteattribute'])->name('badmin.product.deleteattribute');
    	Route::get('products/attribute-status/{id}', [ProductController::class, 'attributeStatus'])->name('badmin.product.attribute_status');
    	Route::get('products/attribute-terms/{slug}/{id?}', [ProductController::class, 'attributeTerms'])->name('badmin.product.attribute_terms');
    	Route::post('products/terms-process/{id?}', [ProductController::class, 'termsProcess'])->name('badmin.product.terms_process');
    	Route::get('products/attribute-slug', [ProductController::class, 'attributeSlug'])->name('badmin.product.attribute_slug');
    	Route::get('products/terms-status/{id}', [ProductController::class, 'termsStatus'])->name('badmin.product.terms_status');
    	Route::get('products/delete-terms/{id}', [ProductController::class, 'deleteTerms'])->name('badmin.product.delete_terms');
    	Route::get('products/product-reviews/{id}', [ProductController::class, 'productReview'])->name('badmin.product.productReview');
    	// Route::get('products/product-reviews-status/{id}', [ProductController::class, 'productStatus'])->name('badmin.product.reviewstatusupdate');
    	Route::get('products/product-reviews-delete/{id}', [ProductController::class, 'productDelete'])->name('badmin.product.reviewdestroy');
		

		/** Ticket Section **/
		Route::get('/ticket', [TicketController::class, 'ticket'])->name('badmin.ticket');
		    
		Route::any('/ticket/ticketbulkaction', [TicketController::class, 'ticketbulkaction'])->name('badmin.ticketbulkaction');

		/**SellerController**/
    	Route::any('seller/{type?}', [SellerController::class, 'seller'])->name('badmin.seller');
    	Route::get('seller-status/{id?}', [SellerController::class, 'sellerstatus'])->name('badmin.sellerstatus');
    	Route::get('seller-account-verification/{id?}', [SellerController::class, 'accountVerification'])->name('badmin.accountVerification');
    	Route::get('seller-gstin-verification/{id?}', [SellerController::class, 'gstinVerification'])->name('badmin.gstinVerification');
    	Route::get('delete-seller/{id?}', [SellerController::class, 'deleteseller'])->name('badmin.deleteseller');
    	Route::get('add-seller/{id?}', [SellerController::class, 'addseller'])->name('badmin.addseller');
    	Route::get('seller-details/{id?}', [SellerController::class, 'sellerDetails'])->name('badmin.sellerDetails');
    	Route::any('/seller-filter', [SellerController::class, 'sellerfilter'])->name('badmin.sellerfilter');
    	Route::get('seller-view/{id?}', [SellerController::class, 'sellerview'])->name('badmin.sellerview');
    	Route::post('seller-process', [SellerController::class, 'sellerprocess'])->name('badmin.sellerprocess');
    	Route::any('save-pickup-location', [SellerController::class, 'savePickupLocation'])->name('badmin.savePickupLocation');
		Route::post('/seller-bulk-action', [SellerController:: class, 'sellerbulkaction']) -> name('badmin.sellerbulkaction');
		Route::get('/seller-export', [SellerController:: class, 'sellerexport']) -> name('badmin.sellerexport');

		/* QC Request */
		Route::get('/qc-request/{type?}', [QcRequestController::class, 'qcRequest'])->name('badmin.qcRequest');
		Route::get('/qc-request/status/{id}/{status}', [QcRequestController::class, 'qcRequestStatus'])->name('badmin.reviews.qcRequestStatus');
		Route::any('/qc-request/qcrequestbulkaction', [QcRequestController::class,'qcRequestbulkaction'])->name('badmin.qcRequestbulkaction');

    	/** MediaController **/
    	Route::any('/media', [MediaController::class, 'media'])->name('badmin.media');
    	Route::any('media/addmedia/{id?}', [MediaController::class, 'addmedia'])->name('badmin.addmedia');
    	Route::any('media/mediaProcess/{id?}', [MediaController::class, 'mediaProcess'])->name('badmin.mediaProcess');
    	Route::any('media/deletemedia/{id}', [MediaController::class, 'deletemedia'])->name('badmin.deletemedia');
		
		/** PartnerController **/
    	Route::get('partner/{id?}', [PartnerController::class, 'partner'])->name('badmin.partner');
    	Route::post('partner-process/{id?}', [PartnerController::class, 'partnerprocess'])->name('badmin.partnerprocess');
    	Route::get('partner-status/{id?}', [PartnerController::class, 'partnerstatus'])->name('badmin.partnerstatus');
    	Route::get('delete-partner/{id?}', [PartnerController::class, 'deletepartner'])->name('badmin.deletepartner');  
		Route::get('partner-featured/{id?}', [PartnerController::class, 'partnerfeatured'])->name('badmin.partnerfeatured');

		/* Faq Controller */
    	Route::any('/faq/faq-view/{id?}', [App\Http\Controllers\badmin\FaqController::class, 'faqView'])->name('badmin.faqView');
		Route::get('/faq/faq-add/{id?}', [App\Http\Controllers\badmin\FaqController::class, 'faqAdd'])->name('badmin.faqAdd');
		Route::post('/faq/faq-proccess', [App\Http\Controllers\badmin\FaqController::class, 'faqProccess'])->name('badmin.faqProccess');
		Route::get('/faq/faq-delete/{id?}', [App\Http\Controllers\badmin\FaqController::class, 'faqDelete'])->name('badmin.faqDelete');
		Route::get('/faq/faq-status/{id?}', [App\Http\Controllers\badmin\FaqController::class, 'faqStatus'])->name('badmin.faqStatus');

		//OfferPromoController
    	Route::any('all-offers/{id?}', [OfferPromoController::class, 'alloffers'])->name('badmin.alloffers');
    	Route::any('offers/addoffers/{id?}', [OfferPromoController::class, 'addoffers'])->name('badmin.addoffers');
		Route::any('offers/offersprocess', [OfferPromoController::class, 'offersprocess'])->name('badmin.offersprocess');
		Route::any('offers/deleteoffers/{id?}', [OfferPromoController::class, 'deleteoffers'])->name('badmin.deleteoffers');
		Route::any('offers/offersstatus/{id?}',[OfferPromoController::class, 'offersstatus'])->name('badmin.offersstatus');
		Route::get('offers/offersfeatured/{id?}', [OfferPromoController::class, 'offersfeatured'])->name('badmin.offersfeatured');
		Route::any('/offers/reset-filter', [OfferPromoController::class, 'resetfilter'])->name('badmin.offers.resetfilter');
		Route::any('/offers/offersbulkaction', [OfferPromoController::class, 'offersbulkaction'])->name('badmin.offersbulkaction');
		
		/**TestimonialController**/
    	Route::get('testimonial', [TestimonialController::class, 'testimonial'])->name('badmin.testimonial');
    	Route::get('testimonial-status/{id?}', [TestimonialController::class, 'testimonialstatus'])->name('badmin.testimonialstatus');
    	Route::get('delete-testimonial/{id?}', [TestimonialController::class, 'deletetestimonial'])->name('badmin.deletetestimonial');
    	Route::get('add-testimonial/{id?}', [TestimonialController::class, 'addtestimonial'])->name('badmin.addtestimonial');
    	Route::post('testimonial-process', [TestimonialController::class, 'testimonialprocess'])->name('badmin.testimonialprocess');
		Route::get('testimonial-featured/{id?}', [TestimonialController::class, 'testimonialfeatured'])->name('badmin.testimonialfeatured');

		/**NewsletterController**/
    	Route::get('newsletter', [NewsletterController::class, 'newsletter'])->name('badmin.newsletter');
    	Route::get('delete-newsletter/{id?}', [NewsletterController::class, 'deletenewsletter'])->name('badmin.deletenewsletter');
		Route::post('/newsletter-bulk-action', [NewsletterController::class, 'newsletterbulkaction'])->name('badmin.newsletterbulkaction');

		/**Payment Controller**/
		Route::get('payment', [PaymentsController::class, 'index'])->name('badmin.payments');

    			
		//Appearence section
		Route::get('/appearance/slider/{id?}', [AppearenceController::class, 'slider'])->name('badmin.slider');
    	Route::any('/appearance/add-slider/{id?}', [AppearenceController::class, 'addslider'])->name('badmin.addslider');
		Route::any('/appearance/slider-process/{id?}', [AppearenceController::class, 'sliderprocess'])->name('badmin.sliderprocess');
		Route::any('/appearance/delete-slider-video/{id?}', [AppearenceController::class, 'deleteslidervideo'])->name('badmin.deleteslidervideo');
		Route::any('/appearance/sliderstatus/{id}', [AppearenceController::class, 'sliderstatus'])->name('badmin.sliderstatus');
		Route::any('/appearance/deleteslider/{id}', [AppearenceController::class, 'deleteslider'])->name('badmin.deleteslider');
		Route::get('/appearance/editor', [AppearenceController::class, 'editor'])->name('badmin.editor');
		Route::post('/appearance/editor-process', [AppearenceController::class, 'editorProcess'])->name('badmin.editorProcess');

		Route::get('appearance/menu/{id?}', [AppearenceController::class, 'menu'])->name('badmin.menu');
		Route::post('appearance/menu-process/{id?}', [AppearenceController::class, 'menuprocess'])->name('badmin.menuprocess');
	    Route::get('appearance/deletemenu/{id}', [AppearenceController::class, 'deletemenu'])->name('badmin.deletemenu');
	    Route::post('/updatemenuOrderAjax', [AppearenceController::class, 'updatemenuOrderAjax'])->name('badmin.updatemenuOrderAjax');

		Route::get('appearance/header/{id?}', [AppearenceController::class, 'header'])->name('badmin.header');
	    Route::post('appearance/header-process/{id?}', [AppearenceController::class, 'headerprocess'])->name('badmin.headerprocess');
    	Route::get('appearance/header-status/{id?}', [AppearenceController::class, 'headerstatus'])->name('badmin.headerstatus');
    	Route::get('appearance/delete-header/{id?}', [AppearenceController::class, 'deleteheader'])->name('badmin.deleteheader');
		
		Route::get('/footer', [AppearenceController::class, 'footer'])->name('footer');
		Route::any('appearance/footerProcess', [AppearenceController::class, 'footerProcess'])->name('badmin.footerProcess');
		Route::get('/menu', [AppearenceController::class, 'menu'])->name('menu');
		
		Route::any('/appearance/home', [AppearenceController::class, 'home'])->name('badmin.appearence.home');
		Route::post('/appearance/home-process', [AppearenceController::class, 'homeprocess'])->name('badmin.appearence.homeprocess');
		Route::post('update-home-order',[AppearenceController::class, 'updateHomeOrder'])->name('badmin.appearence.updateHomeOrder');
		Route::get('/delete-home/{id}/{type}', [AppearenceController::class, 'deletehome'])->name('badmin.appearence.deletehome');
		Route::get('/delete-home-details/{id}', [AppearenceController::class, 'deletehomedetails'])->name('badmin.appearence.deletehomedetails');
		Route::post('/appearance/select-structure-type', [AppearenceController::class, 'selectstructuretype'])->name('badmin.appearence.selectstructuretype');

		/* Shipping Controller */
		Route::any('shipping-rate', [ShippingController::class, 'shippingrate'])->name('badmin.shippingrate');
		Route::post('shipping-rate-process', [ShippingController::class, 'shippingrateprocess'])->name('badmin.shippingrateprocess');
		Route::get('shipping-pincode', [ShippingController::class, 'shippingpincode'])->name('badmin.shippingpincode');
		Route::get('add-shipping-pincode/{id?}', [ShippingController::class, 'addshippingpincode'])->name('badmin.addshippingpincode');
		Route::post('add-shipping-pincode-process', [ShippingController::class, 'addshippingpincodeprocess'])->name('badmin.addshippingpincodeprocess');
		Route::post('shipping-pincode-search', [ShippingController::class, 'shippingpincodesearch'])->name('badmin.shippingpincodesearch');
		Route::post('shipping-cod-update', [ShippingController::class, 'shippingcodupdate'])->name('badmin.shippingcodupdate');
		Route::post('shipping-update', [ShippingController::class, 'shippingupdate'])->name('badmin.shippingupdate');
		Route::post('pincode-delete', [ShippingController::class, 'deletepincode'])->name('badmin.deletepincode');
		Route::post('shipping/createzone', [ShippingController::class, 'createzone'])->name('badmin.createzone');
		Route::get('getzoneCities', [ShippingController::class, 'getzoneCities'])->name('getzoneCities');
		Route::get('restofindiastore', [ShippingController::class, 'restofindiastore'])->name('restofindiastore');
		Route::post('shippingrateamount', [ShippingController::class, 'shippingrateamount'])->name('shippingrateamount');
		Route::post('shippingweightamount', [ShippingController::class, 'shippingweightamount'])->name('shippingweightamount');
		Route::get('deletezone/{id}', [ShippingController::class, 'deletezone'])->name('deletezone');
		Route::post('getCities', [ShippingController::class, 'getCities'])->name('getCities');
		Route::post('shipping/select-checked-base-on', [ShippingController::class, 'selectCheckedBaseOn'])->name('shipping.selectCheckedBaseOn');
		Route::post('shipping/select-order-type', [ShippingController::class, 'selectOrderType'])->name('shipping.selectOrderType');
 
		Route::post('shipping/createzonecountry', [ShippingController::class, 'createzonecountry'])->name('badmin.createzonecountry');
		Route::get('getzoneCitiesCountry', [ShippingController::class, 'getzoneCitiesCountry'])->name('badmin.getzoneCitiesCountry');
		Route::get('restofcountrystore', [ShippingController::class, 'restofcountrystore'])->name('badmin.restofcountrystore');
		Route::post('shippingrateamountcountry', [ShippingController::class, 'shippingrateamountcountry'])->name('badmin.shippingrateamountcountry');
		Route::post('shippingweightamountcountry', [ShippingController::class, 'shippingweightamountcountry'])->name('badmin.shippingweightamountcountry');
		Route::get('deletezonecountry/{id}', [ShippingController::class, 'deletezonecountry'])->name('badmin.deletezonecountry');
		Route::post('shipping/add-free-shipping', [ShippingController::class, 'addFreeShipping'])->name('badmin.shipping.addfreeshipping');

		Route::any('shipping-agency/{id?}', [ShippingController::class, 'allshippingagency'])->name('badmin.shippingagency.allshippingagency');
		Route::post('shipping-agency-process', [ShippingController::class, 'shippingAgencyProcess'])->name('badmin.shippingagency.shippingAgencyProcess');
		Route::post('shipping-agency-deactivate', [ShippingController::class, 'shippingAgencyDeactivate'])->name('badmin.shippingagency.shippingAgencyDeactivate');


    	/* Transaction Section */
    	Route::any('/transactions', [TransactionController::class, 'transaction'])->name('badmin.transaction');
		Route::get('transactions-reset', [TransactionController::class, 'transactionReset'])->name('badmin.transactionReset'); 
		Route::get('transactions-export', [TransactionController::class, 'transactionExport'])->name('badmin.transactionExport'); 
    	Route::get('/delete-transaction/{id?}', [TransactionController::class, 'deletetransaction'])->name('badmin.deletetransaction');

    	/* Contact Us Section */ 
    	Route::get('/contact-us', [ContactController::class, 'contactus'])->name('badmin.contactus');
    	Route::get('/contact-us/delete-contact/{id}', [ContactController::class, 'deletecontact'])->name('badmin.deletecontact');
		Route::post('/contact-bulk-action', [ContactController::class, 'contactbulkaction'])->name('badmin.contactbulkaction');

		/* Location Section */ 
    	Route::any('/location', [LocationController::class, 'index'])->name('badmin.location');
    	Route::post('/location/add-state', [LocationController::class, 'addState'])->name('badmin.location.addState');
    	Route::post('/location/add-city', [LocationController::class, 'addCity'])->name('badmin.location.addCity');
    	Route::post('/location/add-pincode', [LocationController::class, 'addPincode'])->name('badmin.location.addPincode');
    	Route::post('/location/get-city-data', [LocationController::class, 'getCityData'])->name('badmin.location.getCityData');
    	Route::get('/location/delete-location/{id}', [LocationController::class, 'deleteLocation'])->name('badmin.location.deletelocation');
		Route::any('/location-filter', [LocationController::class, 'locationfilter'])->name('badmin.locationfilter');
		
    	/* Order Section */
    	Route::any('/orders/{id?}', [OrderController::class, 'orders'])->name('badmin.orders');
    	Route::any('/wholesale-orders/{id?}', [OrderController::class, 'wholesaleOrders'])->name('badmin.wholesaleOrders');
    	Route::any('/dropped-orders/{id?}', [OrderController::class, 'droppedOrders'])->name('badmin.orders.droppedOrders');
    	Route::any('/orders-invoice/{id?}', [OrderController::class, 'orderInvoice'])->name('badmin.orderInvoice');
		Route::any('/orders-view/{id?}', [OrderController::class, 'ordersview'])->name('badmin.ordersview');
		Route::any('/change-status', [OrderController::class, 'changestatus'])->name('changestatus');
		Route::any('/orders-filter', [OrderController::class, 'orderfilter'])->name('badmin.orderfilter');
		Route::any('/dropped-orders-filter', [OrderController::class, 'droppedOrderfilter'])->name('badmin.droppedOrderfilter');
		Route::post('/addtracking', [OrderController::class, 'addtracking'])->name('badmin.location.addtracking');
		Route::any('/acceptOrder/{trans_id}', [OrderController::class, 'acceptOrder'])->name('badmin.location.acceptOrder');
		Route::post('/assignToDelhivery', [OrderController::class, 'assignToDelhivery'])->name('badmin.location.assignToDelhivery');
		
		/* Reviews Section */
		Route::get('/reviews', [ReviewsController::class, 'reviews'])->name('badmin.reviews');
		Route::get('reviews/product-reviews-status/{id}', [ReviewsController::class, 'reviewStatus'])->name('badmin.reviews.reviewStatus');
		Route::any('/reviews/add-reviews/{id?}', [App\Http\Controllers\badmin\ReviewsController::class, 'addReview'])->name('badmin.reviews.addReview');
		Route::post('reviews/review-process', [App\Http\Controllers\badmin\ReviewsController::class, 'reviewprocess'])->name('badmin.reviews.reviewprocess');

    	//Pages Section
		Route::any('all-pages/{id?}', [PageController::class, 'pages'])->name('badmin.pages');
		Route::any('pages/add-page/{id?}', [PageController::class, 'addpage'])->name('badmin.addpage');
		Route::any('pages/page-process', [PageController::class, 'pageprocess'])->name('badmin.pageprocess');
		Route::any('pages/check-slug', [PageController::class, 'checkslug'])->name('badmin.checkslug');
		Route::any('pages/page-status/{id?}', [PageController::class, 'pagestatus'])->name('badmin.pagestatus');
		Route::any('pages/page-delete/{id?}', [PageController::class, 'pagedelete'])->name('badmin.pagedelete');
		Route::any('/pages/reset-filter', [PageController::class, 'resetfilter'])->name('badmin.pages.resetfilter');
		Route::any('/pages/pagesbulkaction', [PageController::class, 'pagesbulkaction'])->name('badmin.pagesbulkaction');

		/** NewsBlogsController **/
		Route::get('news-blogs/add-news-blogs/{id?}', [NewsBlogsController::class, 'addnewsblogs'])->name('badmin.addnewsblogs');
		Route::post('news-blogs/store', [NewsBlogsController::class, 'store'])->name('badmin.store');
		Route::get('all-news-blogs', [NewsBlogsController::class, 'newsblogs'])->name('badmin.newsblogs');
		Route::get('news-blogs/categories/{id?}', [NewsBlogsController::class, 'categories'])->name('badmin.categories');
		Route::post('news-blogs/category-process/{id?}', [NewsBlogsController::class, 'categoryprocess'])->name('badmin.categoryprocess');
		Route::get('news-blogs/deletecategory/{id?}', [NewsBlogsController::class, 'deletecategory'])->name('badmin.deletecategory');
		Route::get('news-blogs/categorystatus/{id}', [NewsBlogsController::class, 'categorystatus'])->name('badmin.categorystatus');
		Route::get('news-blogs/tags-status/{id}', [NewsBlogsController::class, 'tagsstatus'])->name('badmin.tagsstatus');
		Route::get('news-blogs/delete-tags/{id}', [NewsBlogsController::class, 'deletetag'])->name('badmin.deleteblogtag');
		Route::post('news-blogs/tags-process/{id?}', [NewsBlogsController::class, 'tagsprocess'])->name('badmin.tagsprocess');
		Route::get('news-blogs/tag/{id?}', [NewsBlogsController::class, 'tag'])->name('badmin.tag');
		Route::post('/updateblogCategoryOrderAjex',[NewsBlogsController::class, 'updateblogCategoryOrderAjex'])->name('backend.updateblogCategoryOrderAjex');
		Route::post('news-blogs/check_slug', [NewsBlogsController::class, 'check_slug'])->name('blogs.check_slug');
		Route::get('news-blogs/news-blogs-status/{id}', [NewsBlogsController::class, 'newsblogsstatus'])->name('badmin.newsblogsstatus');
		Route::get('news-blogs/news-blogs-featured/{id}', [NewsBlogsController::class, 'newsblogsfeatured'])->name('badmin.newsblogsfeatured');
		Route::get('news-blogs/delete-news-blogs/{id}', [NewsBlogsController::class, 'deletenewsblogs'])->name('badmin.deletenewsblogs');

		/** EventController **/
		Route::get('events/event-list/{id?}', [EventController::class, 'eventList'])->name('badmin.eventList');
		Route::get('events/event-add/{id?}', [EventController::class, 'eventAdd'])->name('badmin.eventAdd');
		Route::post('events/event-process', [EventController::class, 'eventProcess'])->name('badmin.eventProcess');
		Route::any('events/event-slug', [EventController::class, 'eventSlug'])->name('badmin.eventSlug');
		Route::get('events/event-status/{id}', [EventController::class, 'eventStatus'])->name('badmin.eventStatus');
		Route::get('events/event-featured/{id}', [EventController::class, 'eventFeatured'])->name('badmin.eventFeatured');
		Route::get('events/event-delete/{id}', [EventController::class, 'eventDelete'])->name('badmin.eventDelete');
		Route::post('event-list-order',[EventController::class, 'eventListOrder'])->name('badmin.eventListOrder');
		
		/** staff & Team **/
		Route::any('staff',[App\Http\Controllers\badmin\StaffController::class, 'staff'])->name('badmin.staff');
		Route::any('addstaff/{id?}',[App\Http\Controllers\badmin\StaffController::class, 'addstaff'])->name('badmin.addstaff');
		Route::any('staffprocess',[App\Http\Controllers\badmin\StaffController::class, 'staffprocess'])->name('staffprocess');
		Route::any('staffstatus/{id}',[App\Http\Controllers\badmin\StaffController::class, 'staffstatus'])->name('staffstatus');
		Route::any('deletestaff/{id}',[App\Http\Controllers\badmin\StaffController::class, 'deletestaff'])->name('deletestaff');

		/* Role Controller */
		Route::any('role',[App\Http\Controllers\badmin\RoleController::class, 'rolepermission'])->name('badmin.rolepermission');
		Route::any('add-role/{id?}',[App\Http\Controllers\badmin\RoleController::class, 'addrole'])->name('badmin.addrole');
		Route::any('roleprocess',[App\Http\Controllers\badmin\RoleController::class, 'roleprocess'])->name('roleprocess');
		Route::any('rolestatus/{id}',[App\Http\Controllers\badmin\RoleController::class, 'rolestatus'])->name('badmin.rolestatus');
		Route::any('deleterole/{id}',[App\Http\Controllers\badmin\RoleController::class, 'deleterole'])->name('badmin.deleterole');
		Route::any('permissions',[App\Http\Controllers\badmin\RoleController::class, 'permissions'])->name('badmin.permissions');
		Route::any('givepermission',[App\Http\Controllers\badmin\RoleController::class, 'givepermission'])->name('givepermission');
		Route::any('removepermission',[App\Http\Controllers\badmin\RoleController::class, 'removepermission'])->name('removepermission');
		Route::any('find_role_data',[App\Http\Controllers\badmin\RoleController::class, 'find_role_data'])->name('find_role_data');
		
	});
});