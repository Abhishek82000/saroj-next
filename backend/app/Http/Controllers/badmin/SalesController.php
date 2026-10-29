<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArPages;
use App\Models\ArTransactionDetails;
use App\Models\ArTransactions;
use DB;
use Hash;
use Session;
use Illuminate\Support\Str;

class SalesController extends Controller
{
    
    public function salesReport(Request $request, $id=1){
        $getdata = array();
        if($request->isMethod('post')) {
            Session::put('SALES_REPORT_FILTER', $request->all());
            Session::save();
        }
        $resOrderItems = array();
        $aryFilterSession = array();
        if(Session::has('SALES_REPORT_FILTER')){
            $aryFilterSession = Session::get('SALES_REPORT_FILTER');
            
            if (isset($aryFilterSession['from']) && isset($aryFilterSession['to']) && $aryFilterSession['from'] != '' && $aryFilterSession['to'] != '') {
                $resOrderItems = ArTransactionDetails::whereBetween('created_at', [$aryFilterSession['from']." 00:00:00", $aryFilterSession['to']." 23:59:59"] )
                ->with(['product','transaction'])
                ->orderBy('td_id','ASC')->get();
            }
        }
        $title='Sales Report';
        return view('badmin.sales.sales_report',compact('title','aryFilterSession','resOrderItems'));
    }

    public function salesReportReset(Request $request){
        Session::forget('SALES_REPORT_FILTER');
        return redirect()->back();
    }
    public function salesReportExport()
    {
        // Extend execution time for large reports
        ini_set('max_execution_time', 0);
        ini_set('memory_limit', '-1');

        $records = [];
        $aryFilterSession = Session::get('SALES_REPORT_FILTER', []);
        
        // Fetch data based on filter (if applied)
        $query = ArTransactions::where('trans_payment_status', 1);

        if (!empty($aryFilterSession['from']) && !empty($aryFilterSession['to'])) {
            $query->whereBetween('created_at', [$aryFilterSession['from']." 00:00:00", $aryFilterSession['to']." 23:59:59"] );
        }

        $transData = $query->get();

        foreach ($transData as $value) {
            $taxPercentage = 5;
            $shippingTaxPercentage = 18; // Standard GST rate on shipping
            $taxableValue = $value->trans_amt - $value->trans_shipping_amount;
            $noTaxAmount = $taxableValue - ($taxableValue*$taxPercentage)/100;
            $invoiceAmount = $value->trans_amt;
            $shippingValue = $value->trans_shipping_amount;

            // Default tax rates
            $CGSTRate = $SGSTRate = $IGSTRate = 0;
            $CGSTAmount = $SGSTAmount = $IGSTAmount = 0;
            $shipCGSTRate = $shipSGSTRate = $shipIGSTRate = 0;
            $shipCGSTAmount = $shipSGSTAmount = $shipIGSTAmount = 0;

            // Tax calculation
            if (strtolower($value->trans_state) == 'rajasthan') {
                $CGSTRate = $SGSTRate = $taxPercentage / 2;
                $CGSTAmount = ($taxableValue * $CGSTRate) / 100;
                $SGSTAmount = ($taxableValue * $SGSTRate) / 100;

                $shipCGSTRate = $shipSGSTRate = $shippingTaxPercentage / 2;
                $shipCGSTAmount = ($shippingValue * $shipCGSTRate) / 100;
                $shipSGSTAmount = ($shippingValue * $shipSGSTRate) / 100;
            } else {
                $IGSTRate = $taxPercentage;
                $IGSTAmount = ($taxableValue * $IGSTRate) / 100;

                $shipIGSTRate = $shippingTaxPercentage;
                $shipIGSTAmount = ($shippingValue * $shipIGSTRate) / 100;
            }

            $records[] = [
                'Order Id' => $value->trans_order_number,
                'User Name' => $value->trans_user_name ?? '',
                'Order Date' => $value->created_at->format('d-m-Y'),
                'Item Quantity' => ArTransactionDetails::where('td_trans_id', $value->trans_id)->sum('td_item_qty'),
                'Taxable Amount' => number_format($taxableValue, 2),
                'IGST (%)' => number_format($IGSTAmount, 2) . " ({$IGSTRate}%)",
                'CGST (%)' => number_format($CGSTAmount, 2) . " ({$CGSTRate}%)",
                'SGST (%)' => number_format($SGSTAmount, 2) . " ({$SGSTRate}%)",
                'Shipping Amount' => number_format($shippingValue, 2),
                'Shipping IGST (%)' => number_format($shipIGSTAmount, 2) . " ({$shipIGSTRate}%)",
                'Shipping CGST (%)' => number_format($shipCGSTAmount, 2) . " ({$shipCGSTRate}%)",
                'Shipping SGST (%)' => number_format($shipSGSTAmount, 2) . " ({$shipSGSTRate}%)",
                'Pincode' => $value->trans_pincode ?? '',
                'State' => $value->trans_state ?? '',
                'Invoice Amount' => number_format($invoiceAmount, 2),
            ];
        }

        if (empty($records)) {
            return response('No records found for the selected period.', 404);
        }

        // Generate Excel output
        $filename = 'sales-report-' . date('Y-m-d') . '.xls';

        header("Content-Disposition: attachment; filename=\"$filename\"");
        header('Content-Type: application/vnd.ms-excel');

        $heading = false;
        foreach ($records as $row) {
            if (!$heading) {
                echo implode("\t", array_keys($row)) . "\n";
                $heading = true;
            }

            array_walk($row, function (&$str) {
                $str = preg_replace("/\t/", "\\t", $str);
                $str = preg_replace("/\r?\n/", "\\n", $str);
                if (strstr($str, '"')) $str = '"' . str_replace('"', '""', $str) . '"';
            });

            echo implode("\t", array_values($row)) . "\n";
        }

        exit;
    }

}