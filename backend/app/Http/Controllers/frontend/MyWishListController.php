<?php

namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArUsers;
use App\Models\ArUserFavProduct;
use App\Models\ArProduct;

use Session;
use Hash;


class MyWishListController extends Controller
{
    public function wishlist()
    {
        $title='My Wishlist';
        $customer=Session::get('AR_USER');
        if(isset($customer->user_id) && $customer->user_id !='')
        {
            $customerdetails = ArUsers::where('user_id',$customer->user_id)->first();
        }

        $prod_fav = ArUserFavProduct::where('ufp_user_id',$customer->user_id)->where('ufp_status',1)->pluck('ufp_product_id');
        $products = ArProduct::where('product_status',1)->wherein('product_id', $prod_fav)->with(['gallery'])->get();

        return view('frontend.account.wishlist',compact('title','customerdetails','products'));
    }

    public function removefromfav(Request $request)
    {
        $aryResponse = [];
        $customer = Session::get('AR_USER');
        $product_id = $request->product_id;

        if (!$customer || !$product_id) {
            return response()->json(['data' => ['message' => 'failed']], 400);
        }

        $check = ArUserFavProduct::where('ufp_user_id', $customer->user_id)
                                ->where('ufp_product_id', $product_id)
                                ->first();

        if ($check) {
            $check->delete();
        }

        $aryResponse['message'] = 'ok';
        $aryResponse['notification'] = 'Removed from wishlist';
        $aryResponse['count'] = ArUserFavProduct::where('ufp_user_id', $customer->user_id)->count();

        return response()->json(['data' => $aryResponse], 200);
    }

}