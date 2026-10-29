<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use DB;
use Hash;
use Session;
use App\Models\ArThemeAdmin;
use App\Models\ArTransactions;
use App\Models\ArCart;
use App\Models\ArProduct;
use App\Models\ArUsers;
use App\Models\ArTransactionDetails;
use Carbon\Carbon;


class DashboardController extends Controller
{
    public function index(){
        $title='Dashboard';      
        $this->cashfreeUpdateStatus();  
        $orderData=ArTransactions::orderby('trans_id','DESC')->limit(5)->get();
        $productcountData = ArProduct::count();
        $ordercountData = ArTransactions::where('trans_payment_status',1)->count();
        $usercountData = ArUsers::where('user_status',1)->count();
        $startDate = Carbon::now()->subWeek()->startOfWeek();
        $endDate = Carbon::now()->subWeek()->endOfWeek();
        $monthStartDate = Carbon::now()->subMonth()->startOfMonth();
        $monthEndDate = Carbon::now()->subMonth()->endOfMonth();
        $previousYearStartDate = Carbon::now()->subYear()->startOfYear();
        $previousYearEndDate = Carbon::now()->subYear()->endOfYear();
        
        $weeklyEarning = ArTransactions::whereBetween('trans_datetime', [$startDate, $endDate])->where('trans_payment_status',1)->sum('trans_amt');
        $monthlyEarning = ArTransactions::whereBetween('trans_datetime', [$monthStartDate, $monthEndDate])->where('trans_payment_status',1)->sum('trans_amt');
        $previousYearEarning = ArTransactions::whereBetween('trans_datetime', [$previousYearStartDate, $previousYearEndDate])->where('trans_payment_status',1)->sum('trans_amt');
        $curretMonth = date('m');
        $curretYear = date('Y');
        $lastYear = $curretYear - 1;
        $thisMonth = ArTransactions::whereMonth('created_at', $curretMonth)->where('trans_payment_status',1)->sum('trans_amt');
        $thisYear = ArTransactions::whereYear('created_at', $curretYear)->where('trans_payment_status',1)->sum('trans_amt');

        $monthlyEarnings = ArTransactions::whereYear('created_at', $curretYear)
        ->where('trans_payment_status', 1)
        ->selectRaw('SUM(trans_amt) as total_earning, MONTH(created_at) as month')
        ->groupBy(DB::raw('MONTH(created_at)'))
        ->get();

        // Initialize an array with zero values for each month
        $monthlyEarningsArray = array_fill(1, 12, 0);

        // Fill the array with actual monthly earnings
        foreach ($monthlyEarnings as $earning) {
            $month = $earning->month;
            $monthlyEarningsArray[$month] = $earning->total_earning;
        }

        $monthlyEarningsValues = array_values($monthlyEarningsArray);

        $premonthlyEarnings = ArTransactions::where('trans_payment_status', 1)
        ->whereBetween('created_at', [$previousYearStartDate, $previousYearEndDate])
        ->selectRaw('SUM(trans_amt) as total_earning, MONTH(created_at) as month')
        ->groupBy(DB::raw('MONTH(created_at)'))
        ->get();

        // Initialize an array with zero values for each month
        $premonthlyEarningsArray = array_fill(1, 12, 0);

        // Fill the array with actual monthly earnings
        foreach ($premonthlyEarnings as $earning) {
            $month = $earning->month;
            $premonthlyEarningsArray[$month] = $earning->total_earning;
        }

        $premonthlyEarningsValues = array_values($premonthlyEarningsArray);
        $totalOrderedQty = ArTransactions::where('trans_payment_status', 1)
        ->withSum('items', 'td_item_qty')
        ->get()
        ->sum('items_sum_td_item_qty');
        
        $top3SellingProducts = ArTransactionDetails::join('ar_transactions', 'ar_transaction_details.td_trans_id', '=', 'ar_transactions.trans_id')
                ->select('td_item_id', \DB::raw('SUM(td_item_qty) as total_quantity'))
                ->groupBy('td_item_id')
                ->orderBy('total_quantity', 'DESC')
                ->limit(3)->get();
        $top3SellingProductsQty = [];
        $top3SellingProductsId = [];
        $top3SellingProductsNames = [];
        foreach ($top3SellingProducts as $product) {
            $top3SellingProductsQty[] = number_format($product->total_quantity/$totalOrderedQty*100, 2);
            $top3SellingProductsId[] = $product->td_item_id;
        }
        $top3SellingProductsNames = ArProduct::whereIn('product_id', $top3SellingProductsId)->pluck('product_name')->toArray();
        // return $top3SellingProductsNames;
        $otherItemQty = 100 - array_sum($top3SellingProductsQty);
        $top3SellingProductsNames[] = "Others";
        $top3SellingProductsQty[] = number_format($otherItemQty, 2);
            
        return view('badmin.dashboard.index',compact('title','usercountData','productcountData','ordercountData','orderData','monthlyEarning','weeklyEarning','thisYear','thisMonth','previousYearEarning','monthlyEarningsValues','premonthlyEarningsValues','curretYear','lastYear','top3SellingProductsId','top3SellingProductsQty','top3SellingProductsNames'));
    }
    public function cartAbandonmentView($user_id = null)
    {
        $title = 'Cart Abandonment';

        // Delete invalid RETAIL cart items
        ArCart::where('cart_user_id', $user_id)
            ->where('cart_is_wholesale', 0)
            ->where(function ($query) {
                $query->whereNotExists(function ($sub) {
                    $sub->select(\DB::raw(1))
                        ->from('ar_products')
                        ->whereColumn('ar_products.product_id', 'ar_cart.cart_product_id')
                        ->where('product_status', 1)
                        ->where('product_stock', '>', 0);
                });
            })
            ->delete();

        // Delete invalid WHOLESALE cart items
        ArCart::where('cart_user_id', $user_id)
            ->where('cart_is_wholesale', 1)
            ->where(function ($query) {
                $query->whereNotExists(function ($sub) {
                    $sub->select(\DB::raw(1))
                        ->from('ar_products')
                        ->whereColumn('ar_products.product_id', 'ar_cart.cart_product_id')
                        ->where('product_stock', '>', 0)
                        ->where('product_wholesale', 1);
                });
            })
            ->delete();

        // Fetch Updated Cart
        $cartAbandonmentData = ArCart::where('cart_user_id', $user_id)
            ->orderBy('cart_id', 'DESC')
            ->with(['user', 'product'])
            ->get();

        return view('badmin.dashboard.cart_abandonment_view', compact('title', 'cartAbandonmentData'));
    }

    public function cashfreeUpdateStatus(): void
    {
        $todayTransactions = ArTransactions::where('trans_payment_status', 0)
            ->where('trans_status', 0)
            ->whereBetween('trans_datetime', [Carbon::yesterday()->startOfDay(),Carbon::today()->endOfDay(),])
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

        DB::transaction(function () use (  // ✅ was DB::ar_transactions
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
}