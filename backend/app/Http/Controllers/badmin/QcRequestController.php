<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use DB;
use Hash;
use Session;
use App\Models\ArProductReview;
use App\Models\ArProduct;


class QcRequestController extends Controller
{
    public function qcRequest(Request $request,$type=2)
    {
        $qcStatus = [1=>'All','QC in Process','QC Error','QC Pass','Draft'];
		$resProducts = ArProduct::orderBy('product_id', 'DESC');

        if ($type == 1) {
            $resProducts = $resProducts;
        } else if ($type == 2) {
            $resProducts = $resProducts->where('product_qc_status', 2);
        } else if ($type == 3) {
            $resProducts = $resProducts->where('product_qc_status', 3);
        } else if ($type == 4) {
            $resProducts = $resProducts->where('product_qc_status', 4);
        } else if ($type == 5) {
            $resProducts = $resProducts->where('product_qc_status', 5);
        } else {
            $resProducts = $resProducts->where('product_qc_status', '>=', 0);
        }

        $resProducts = $resProducts->with(['seller'])->paginate(50);

        $statusCounts = ArProduct::whereIn('product_qc_status', [2, 3, 4, 5])
            ->selectRaw('product_qc_status, COUNT(*) as count')
            ->groupBy('product_qc_status')
            ->pluck('count', 'product_qc_status');

        $countall = ArProduct::count();
        $countqcprocess = $statusCounts[2] ?? 0;
        $countqcerror = $statusCounts[3] ?? 0;
        $countqcpass = $statusCounts[4] ?? 0;
        $countqcdraft = $statusCounts[5] ?? 0;
        $title='QC Request';
        return view('badmin.qcrequest.index',compact('title','resProducts','qcStatus','countall','countqcprocess','countqcerror','countqcpass','countqcdraft','type'));
    }

    public function qcRequestStatus($id,$status)
    {
        ArProduct::where('product_id',$id)->update(['product_qc_status'=>$status]);
        return redirect()->back()->with('success', 'Status Updated Successfully');
    }

    public function qcRequestbulkaction(Request $request){
        // dd(array_filter(array_unique($request->productid)));
        if($request->getstatus == 4){
            foreach(array_filter(array_unique($request->productid)) as $key => $value) {
               $update =ArProduct::where('product_id',$value)->update(['product_qc_status'=>4]);
            }   
        }
        if($request->getstatus == 3){
             foreach (array_filter(array_unique($request->productid)) as $key => $value) {
                $update =ArProduct::where('product_id',$value)->update(['product_qc_status'=>3]);
            }  
        }
        if($update){
            return response()->json(['status' => true, 'message' => 'Qc Request Status Updated successfully!!'],200);
        }else{
            return response()->json(['status' => false, 'message' => 'something went wrong!!'],201);
        }
    }

}