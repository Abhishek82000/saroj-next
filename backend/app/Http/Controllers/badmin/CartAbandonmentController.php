<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use DB;
use Hash;
use Session; 
use App\Models\ArCart;


class CartAbandonmentController extends Controller
{
    public function index()
    {
        $title = 'Cart Abandonment';
        
        // 🧮 Subquery: compute total amount per user using SUM
        $subQuery = DB::table('ar_cart as c')
            ->leftJoin('ar_product_variations as v', 'c.cart_variation_id', '=', 'v.pv_id')
            ->leftJoin('ar_products as p', 'c.cart_product_id', '=', 'p.product_id')
            ->select(
                'c.cart_user_id',
                DB::raw('SUM(
                    CASE 
                        WHEN c.cart_variation_id > 0 THEN IFNULL(v.pv_sellingprice, 0) * c.cart_qty
                        ELSE IFNULL(p.product_selling_price, 0) * c.cart_qty
                    END
                ) as total_amount')
            )
            ->groupBy('c.cart_user_id');

        // 🧩 Main query: get the latest cart entry per user with total amount joined
        $cartAbandonmentData = ArCart::select('ar_cart.*', 'totals.total_amount')
            ->join(
                DB::raw('(SELECT cart_user_id, MAX(cart_id) AS max_cart_id FROM ar_cart GROUP BY cart_user_id) latest_carts'),
                function ($join) {
                    $join->on('ar_cart.cart_user_id', '=', 'latest_carts.cart_user_id');
                    $join->on('ar_cart.cart_id', '=', 'latest_carts.max_cart_id');
                }
            )
            ->joinSub($subQuery, 'totals', function ($join) {
                $join->on('ar_cart.cart_user_id', '=', 'totals.cart_user_id');
            })
            ->with(['user'])
            ->orderBy('ar_cart.cart_id', 'DESC')
            ->paginate(50);

        return view('badmin.cartabandonment.index', compact('title', 'cartAbandonmentData'));
    }

	public function cartExport()
    {
        $resReportData = ArCart::with(['user', 'product', 'variation'])
            ->orderBy('cart_id', 'DESC')
            ->get()
            ->groupBy('cart_user_id'); // group by user so each user appears once

        $records = [];

        foreach ($resReportData as $userId => $cartItems) {
            $totalCartAmount = 0;
            $user = $cartItems->first()->user;

            foreach ($cartItems as $cart) {
                // handle both product and variation cases safely
                if ($cart->cart_variation_id > 0 && isset($cart->variation)) {
                    $price = $cart->variation->pv_sellingprice ?? 0;
                } else {
                    $price = $cart->product->product_selling_price ?? 0;
                }
                $totalCartAmount += $price * $cart->cart_qty;
            }

            $records[] = [
                'First Name'    => $user->user_fname ?? '',
                'Email'         => $user->user_email ?? '',
                'Mobile Number' => $user->user_mobile ?? '',
                'Cart Amount'   => $totalCartAmount,
                'Created Date'  => $cartItems->first()->created_at->format('d-m-Y'),
            ];
        }

        // Export as Excel (.xls)
        $filename = 'cartabandonment-report-' . date('d-m-Y') . '.xls';
        header("Content-Disposition: attachment; filename=\"$filename\"");
        header('Content-Type: application/vnd.ms-excel;');

        if (!empty($records)) {
            // Print heading row
            echo implode("\t", array_keys($records[0])) . "\n";
            // Print each record
            foreach ($records as $row) {
                array_walk($row, function (&$str) {
                    $str = preg_replace("/\t/", "\\t", $str);
                    $str = preg_replace("/\r?\n/", "\\n", $str);
                    if (strstr($str, '"')) $str = '"' . str_replace('"', '""', $str) . '"';
                });
                echo implode("\t", array_values($row)) . "\n";
            }
        }
        exit;
    }

}