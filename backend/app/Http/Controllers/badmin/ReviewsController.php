<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use DB;
use Hash;
use Session;
use App\Models\ArProductReview;
use App\Models\ArProductByCategory;
use App\Models\ArUsers;
use App\Models\ArProduct;


class ReviewsController extends Controller
{
    public function reviews(){
        $title='Reviews';
		$productReview = ArProductReview::with(['products','users'])->orderBy('pr_id','DESC')->paginate(50);
        return view('badmin.reviews.reviews',compact('title','productReview'));
    }
    public function addReview($id=null)
    {        
        $title = 'Add Reviews';
        $reviewIdData = null; 
        if ($id && $id > 0) {
            $reviewIdData = ArProductReview::where('pr_id', $id)->first();
        }
        $precutProductArr = ArProductByCategory::where('cpc_category_id',37)->pluck('cpc_product_id')->toArray();
        $product = ArProduct::whereNotIn('product_id',$precutProductArr)->where('product_status', 1)->where('product_stock','>', 0)->orderBy('product_id', 'DESC')->get();
        $customerdata = ArUsers::where('user_status', 1)->orderBy('user_id', 'DESC')->get();
        return view('badmin.reviews.addreview', compact('title', 'product', 'reviewIdData'));
    }

    public function reviewprocess(Request $request)
    {
        if ($request->isMethod('post')) {
             $requestData = $request->all();
            if (isset ($requestData['pr_id']) && $requestData['pr_id'] > 0) {
                $reviewdata = ArProductReview::where('pr_id', $requestData['pr_id'])->first();
            } else {
                $reviewdata = new ArProductReview;
            }
            $request->validate([
                'pr_user_name' => 'required',
                'pr_rating' => 'required',
                'pr_product_id' => 'required',
                'pr_review' => 'required',
                'pr_created' => 'required',
            ]);
            
            $reviewdata->pr_product_id = $requestData['pr_product_id'];
            $reviewdata->pr_created = $requestData['pr_created'];
            $reviewdata->pr_rating = $requestData['pr_rating'];
            $reviewdata->pr_title = $requestData['pr_user_name'];
            $reviewdata->pr_review = $requestData['pr_review'];
            $reviewdata->pr_status = 1;
            if ($reviewdata->save()) {
                return redirect()->route('badmin.reviews')->with('success', 'Review Added Successfully');
            }
        }
    }
    public function reviewStatus($id)
    {
        $productObj=ArProductReview::where('pr_id',$id)->first();
        if (isset($productObj->pr_status) && $productObj->pr_status==1) {
            $status=0;
        }else{
            $status=1;
        }
        ArProductReview::where('pr_id',$id)->update(['pr_status'=>$status]);
        return redirect()->back()->with('success', 'Status Updated Successfully');
    }

    
}