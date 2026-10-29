<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArTransactions;
use App\Models\ArTransactionDetails;
use Session;

class TransactionController extends Controller
{
    public function transaction(Request $request)
    {
        if($request->isMethod('post')) {
            if(empty($request['from']) || empty($request['to']))
            {
                return redirect()->back()->with('error', 'Please select from and to dates');
            } else{
                Session::put('TRANSACTION_FILTER', $request->all());
                Session::save();   
            }
        }
        $transactionData = ArTransactions::orderBy('trans_id','DESC')->where('trans_payment_status',1);
        $aryFilterSession = array();
        if(Session::has('TRANSACTION_FILTER')){
            $aryFilterSession = Session::get('TRANSACTION_FILTER');
            $transactionData = $transactionData->whereBetween('created_at', [$aryFilterSession['from']." 00:00:00", $aryFilterSession['to']." 23:59:59"] );
        }
        
        $title='Transaction';
        $transactionData = $transactionData->paginate(20);
        return view('badmin.transactions.transaction',compact('title','transactionData','aryFilterSession'));
    }
    public function transactionReset(Request $request){
        Session::forget('TRANSACTION_FILTER');
        return redirect()->back();
    }
    public function transactionExport(){
        
        $transactionData = array();
        $aryFilterSession = array();
        if(Session::has('TRANSACTION_FILTER')){
            $aryFilterSession = Session::get('TRANSACTION_FILTER');
            $transactionData = ArTransactions::whereBetween('created_at', [$aryFilterSession['from']." 00:00:00", $aryFilterSession['to']." 23:59:59"] )->where('trans_payment_status',1)->orderBy('trans_id','DESC')->get();
        }else{
            $transactionData = ArTransactions::orderBy('trans_id','DESC')->where('trans_payment_status',1)->get();
        }
            foreach($transactionData as $value)
                {
                    
                    $row['Order Id'] = $value->trans_order_number;
                    $row['Amount'] = $value->trans_amt;
                    $row['Payment Method'] = $value->trans_method;
                    $row['Payment Status'] = 'Complete';
                    
                    $row['Date'] = date('d-m-Y',strtotime($value->created_at));
                    
                    $records[] = $row;
                }        
                $filename = 'transaction-report.xls'; 
                header("Content-Disposition: attachment; filename=\"$filename\"");
                header('Content-Type: application/vnd.ms-excel;');
                $heading = false;
                if(!empty($records)){
                    foreach($records as $row) 
                    {
                        if(!$heading) {
                            echo implode("\t", array_keys($row)) . "\n";
                            $heading = true;
                        } 
                        array_walk($row, function(&$str){
                            $str = preg_replace("/\t/", "\\t", $str);
                            $str = preg_replace("/\r?\n/", "\\n", $str);
                            if(strstr($str, '"')) $str = '"' . str_replace('"', '""', $str) . '"';
                        });
                        echo implode("\t", array_values($row)) . "\n"; 
                    }
                }
                exit;
        
    }


     public function deletetransaction($id)
     {
        if($id>0)
        {
            ArTransactions::where('trans_id',$id)->delete();      
            ArTransactionDetails::where('td_trans_id',$id)->delete();      
            return redirect()->route('badmin.transaction')->with('success', 'Transaction Deleted Successfully');
        }
    }
}