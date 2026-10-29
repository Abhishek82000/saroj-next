<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArCategory;
use App\Models\ArUniqueIds;
use App\Models\ArUsers;
use App\Models\ArTransactionDetails;
use App\Models\ArTransactions;
use App\Models\ArThemeAdmin;
use App\Models\ArUserFavProduct;
use App\Models\ArCart;
use App\Models\ArProduct;
use App\Mail\sendingEmail;
use App\Services\DelhiveryService;
use DB;
use Hash;
use Session;


class AccountController extends Controller
{
    public function index(){
        $title = 'Account';
        $customer=Session::get('AR_USER');
        if(isset($customer->user_id) && $customer->user_id !='')
        {
            $customerdetails = ArUsers::where('user_id',$customer->user_id)->first();
            if(!$customerdetails){
                Session::forget('AR_USER');
                return redirect()->route('front.home');
            }   
            return view('frontend.account.index',compact('title','customerdetails','customer'));
        }
        else{
            return redirect()->route('front.home');
        }
    }
    public function profile(){
        $title = 'Profile';
        $customer=Session::get('AR_USER');
        if(isset($customer->user_id) && $customer->user_id !='')
        {
            $customerdetails = ArUsers::where('user_id',$customer->user_id)->first();
            return view('frontend.account.profile',compact('title','customerdetails','customer'));
        }
        else{
            return redirect()->route('front.home');
        }
    }

    public function accountProcess(Request $request)
    {
        if ($request->isMethod('post'))
        {
            $requestData = $request->all();
            $addUser = new ArUsers;
            $updatedata = ArUsers::where('user_id',$requestData['user_id'])->update([
                'user_fname'=>$requestData['user_fname'], 
            ]);
            if($updatedata){
                return redirect()->route('front.account.profile')->with('success', 'Account Details Updated Successfully');
            }        
        }else{
            return redirect()->route('front.account.profile')->with('error', 'Invalid Method');
        }
    }

    public function frontlogout(Request $request)
    {   
        Session::forget('AR_USER');
        return redirect()->route('front.home')->withErrors("logged out.");
    }

    public function myorder()
    {
        $title='My Orders';
        $customer=Session::get('AR_USER');
        $customerdetails = array();
        $resOrderData = array();
        if(isset($customer->user_id) && $customer->user_id !='')
        {
            $this->cashfreeUpdateStatus(); 
            $customerdetails = ArUsers::where('user_id',$customer->user_id)->first();
            $resOrderData = ArTransactions::where('trans_payment_status',1)->where('trans_user_id',$customer->user_id)->orderBy('trans_id','DESC')->get();
            $orderStatus = [
                        1 => 'Ready to Ship',
                        4 => 'Delivered',
                        5 => 'Cancelled',
                        6 => 'Shipped',
                    ];
    
            return view('frontend.account.myorder',compact('title','customerdetails','resOrderData','customer','orderStatus'));
        }else{
            return redirect()->route('front.home');
        }
    }
    public function cashfreeUpdateStatus(): void
    {
        $customer=Session::get('AR_USER');
        $todayTransactions = ArTransactions::where('trans_payment_status', 0)
            ->where('trans_status', 0)->where('trans_user_id',$customer->user_id)
            ->with(['items.product'])
            ->get();

        if ($todayTransactions->isEmpty()) {
            return;
        }

        $client = new \GuzzleHttp\Client([
            'headers' => [
                'accept'          => 'application/json',
                'x-api-version'   => '2023-08-01',
                'x-client-id'     => '945057711083630e4d417d5d2d750549',
                'x-client-secret' => 'cfsk_ma_prod_9d9749fb45a1666cee6ff93034ae27c9_16689382',
            ],
        ]);

        $requests = function () use ($todayTransactions, $client) {
            foreach ($todayTransactions as $transaction) {
                $orderNumber = $transaction->trans_order_number;
                yield $orderNumber => function () use ($client, $orderNumber) {
                    return $client->getAsync(
                        'https://api.cashfree.com/pg/orders/' . $orderNumber . '/payments'
                    );
                };
            }
        };

        $results = [];

        $pool = new \GuzzleHttp\Pool($client, $requests(), [
            'concurrency' => 10,
            'fulfilled' => function (\Psr\Http\Message\ResponseInterface $response, $orderNumber) use (&$results) {
                $body   = (string) $response->getBody();
                $parsed = json_decode($body);
                if (isset($parsed[0]) && $parsed[0]->payment_status === 'SUCCESS') {
                    $results[$orderNumber] = [
                        'parsed' => $parsed[0],
                        'raw'    => $body,
                    ];
                }
            },
            'rejected' => function (\Throwable $e, $orderNumber) {
                \Log::error("Cashfree payment check failed for order {$orderNumber}: " . $e->getMessage());
            },
        ]);

        $pool->promise()->wait();

        if (empty($results)) {
            return; // ✅ void return, no value
        }

        // ✅ removed the stray `return $results;` that was here

        $productStockDeductions = [];
        $cartDeletesByUser      = [];

        DB::transaction(function () use (  
            $todayTransactions, $results,
            &$productStockDeductions, &$cartDeletesByUser
        ) {
            foreach ($todayTransactions as $transaction) {
                $orderNumber = $transaction->trans_order_number;

                if (!isset($results[$orderNumber])) {
                    continue;
                }

                $cf         = $results[$orderNumber]['parsed'];
                $methodName = null;

                if (isset($cf->payment_method)) {
                    $methodArray = (array) $cf->payment_method;
                    $methodName  = array_key_first($methodArray);
                }
                $transaction->trans_status            = 1;
                $transaction->trans_payment_status    = 1;
                $transaction->trans_ref_id            = $cf->cf_payment_id;
                $transaction->trans_method            = $methodName;
                $transaction->trans_cashfree_response = json_decode($results[$orderNumber]['raw']);
                $transaction->save();

                $userId      = $transaction->trans_user_id;
                $isWholesale = $transaction->trans_is_wholesale == 1;

                foreach ($transaction->items as $item) {
                    $productId = $item->td_item_id;
                    $qty       = $item->td_item_qty;

                    $productStockDeductions[$productId] = ($productStockDeductions[$productId] ?? 0) + $qty;

                    if ($isWholesale) {
                        $cartDeletesByUser[$userId]['wholesale'][] = $productId;
                    } else {
                        $cartDeletesByUser[$userId]['retail'][] = $productId;
                    }
                }
            }

            foreach ($productStockDeductions as $productId => $deduction) {
                ArProduct::where('product_id', $productId)
                    ->update(['product_stock' => DB::raw("GREATEST(product_stock - {$deduction}, 0)")]);
            }

            foreach ($cartDeletesByUser as $userId => $groups) {
                if (!empty($groups['wholesale'])) {
                    ArCart::where('cart_is_wholesale', 1)
                        ->where('cart_user_id', $userId)
                        ->whereIn('cart_product_id', array_unique($groups['wholesale']))
                        ->delete();
                }
                if (!empty($groups['retail'])) {
                    ArCart::where('cart_is_wholesale', 0)
                        ->where('cart_user_id', $userId)
                        ->whereIn('cart_product_id', array_unique($groups['retail']))
                        ->delete();
                }
            }
        });
    }
    public function orderview($id){
        $customer = Session::get('AR_USER');
        if($customer){
            $rowOrderData = ArTransactions::where('trans_order_number',$id)->where('trans_user_id',$customer->user_id)->with(['items'])->first();
            if($rowOrderData){
                $customerdetails = ArUsers::where('user_id',$customer->user_id)->first();
                $title='My Orders';
                $orderStatus = [
                    1 => 'Ready to Ship',
                    4 => 'Delivered',
                    5 => 'Cancelled',
                    6 => 'Shipped',
                ];
                $trackingData = null;
                if (!empty($rowOrderData->trans_waybill)) {
                    $delhivery = app(\App\Services\DelhiveryService::class);
                    $trackingResult = $delhivery->trackShipment($rowOrderData->trans_waybill);

                    if ($trackingResult['status']) {
                        $trackingData = $trackingResult['shipments'][0] ?? null;
                    }
                }
                return view('frontend.account.orderview',compact('title','rowOrderData','customer','customerdetails','orderStatus','trackingData'));
            }else{
                return redirect()->route('front.home');
            }        
        }else{
            return redirect()->route('front.home');
        }
        
    }

    public function cancelorder(Request $request){
        
        if ($request->isMethod('post')) {
            if(Session::has('AR_USER')){
                $customer = Session::get('AR_USER');
                $customerdetails = ArUsers::where('user_id',$customer->user_id)->first();
                ArTransactions::where('trans_payment_status',1)->where('trans_id',$request->trans_id)->update(['trans_status'=>5,'trans_cancel_reason'=>$request->cancel_reason,'trans_cancellation_date'=>date('Y-m-d')]);
                $rowTransData = ArTransactions::where('trans_payment_status',1)->where('trans_id',$request->trans_id)->with(['items'])->first();
                try {
                    $details = [
                        'subject' => 'Order cancelled',
                        'rowTransData' => $rowTransData,
                        'template' =>'frontend.emails.order_cancelled', 
                    ];
                    \Mail::to($details['rowTransData']['trans_user_email'])->send(new sendingEmail($details));
                    $details1 = [
                        'subject' => 'Order cancelled',
                        'rowTransData' => $rowTransData,
                        'template' =>'frontend.emails.order_cancelled', 
                    ];
                    $rowAdminData = ArThemeAdmin::first(); 
                    \Mail::to($rowAdminData->administration_email)->send(new sendingEmail($details1));
                  } catch (\Exception $e) {
                  
                      //return $e->getMessage();
                  }
                
                return redirect()->back()->with('success', 'Order Cancelled successfully!!');
            }else{
                return redirect()->route('front.home');
            }
        }else{
            return redirect()->back()->with('error', 'Invalid Method');
        }
        
    }

    public function wishlist()
    {
        $title='My Wishlist';
        $products = [];
        $customer=Session::get('AR_USER');
        if(isset($customer->user_id) && $customer->user_id !='')
        {
            $customerdetails = ArUsers::where('user_id',$customer->user_id)->first();
             $prod_fav = ArUserFavProduct::where('ufp_user_id',$customer->user_id)->where('ufp_status',1)->pluck('ufp_product_id');
            $products = ArProduct::where('product_status',1)->wherein('product_id', $prod_fav)->get();
            return view('frontend.account.wishlist',compact('title','customerdetails','products'));
        }else{
            return redirect()->route('front.home');
        }

    }
    
    public function helpsupport(){
        $title = 'Help & Support';
        $customer=Session::get('AR_USER');
        if(isset($customer->user_id) && $customer->user_id !='')
        {
            $customerdetails = ArUsers::where('user_id',$customer->user_id)->first();
            return view('frontend.account.helpsupport',compact('title','customerdetails','customer'));
        }
        else{
            return redirect()->route('front.home');
        }
    }
}