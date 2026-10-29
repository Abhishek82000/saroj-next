<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use DB;
use Hash;
use Session;
use App\Models\ArPromos;
use App\Models\ArPromoTier;
use App\Models\ArCategory;
use App\Models\ArUsers;


class OfferPromoController extends Controller
{
    public function alloffers(Request $request, $id=1){
        $title='All Offers';
		$countall = ArPromos::count(); 
        $countactive = ArPromos::where('promo_status',1)->count();
        $countinactive = ArPromos::where('promo_status',0)->count(); 

        $offerData = ArPromos::orderBy('promo_id','DESC');
        if($id == 1)
        {
        $type = 'all';    
        $offerData = $offerData;   
        }
        
        else if($id == 3)
        {
        $type = 'inactive';    
        $offerData = $offerData->where('promo_status',0);
        // $offerData = ArPromos::where('promo_status',0)->orderBy('promo_id','DESC')->paginate(50);  
        }
        else
        {
            $type = 'active';
            $offerData = $offerData->where('promo_status',1);
        }
		 if($request->isMethod('post')) {
            if(empty($request['search_filter']))
            {
                return redirect()->back()->with('error', 'Please enter something to search');
            }
            else{
                Session::put('PROMO_FILTER', $request->all());
				Session::save();
            }
        } 
        $aryFilterSession = array();
        if(Session::has('PROMO_FILTER')){
            $aryFilterSession = Session::get('PROMO_FILTER');
            if(isset($aryFilterSession['search_filter']))
            {
            $offerData = ArPromos::where( 'promo_name', 'LIKE', '%' . $aryFilterSession['search_filter'] . '%' )
            ->orWhere( 'promo_coupon_code', 'LIKE', '%' . $aryFilterSession['search_filter'] . '%' );
            }
        }
        $offerData=$offerData->paginate(50);

        return view('badmin.offers.index',compact('title','offerData','countall','countactive','countinactive','type','aryFilterSession'));
    }
	
	 public function resetfilter(Request $request){
        Session::forget('PROMO_FILTER');
        return redirect()->back();
    }
	
	 public function offersbulkaction(Request $request){
        if($request->getstatus == 1){
            foreach(array_filter(array_unique($request->promoid)) as $key => $value) {
               $update =ArPromos::where('promo_id',$value)->update(['promo_status'=>1]);
            }
            
        }

        if($request->getstatus == 2){
             foreach (array_filter(array_unique($request->promoid)) as $key => $value) {
                $update =ArPromos::where('promo_id',$value)->update(['promo_status'=>0]);
            }
           
        }

        if($request->getstatus == 3){
            foreach (array_filter(array_unique($request->promoid)) as $key => $value) {
                $update =ArPromos::where('promo_id',$value)->delete();
            }
            
        }

        if($update){
            return response()->json(['status' => true, 'message' => 'Status Updated successfully!!'],200);
        }else{
            return response()->json(['status' => false, 'message' => 'something went wrong!!'],201);
        }
    }

    public function addoffers($id=null){
        $title='Add Offers';
        $offerIdData = array();
        if (isset($id) && $id >0){
             $offerIdData=ArPromos::with('tiers')->where('promo_id',$id)->first();
        }
        $resUserData = ArUsers::where('user_status',1)->orderBy('user_fname','ASC')->get();
                 $resCategoryData = ArCategory::orderBy('cat_order','ASC')->get();
        $weekDays = array('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday');
        return view('badmin.offers.addoffer',compact('title','offerIdData','resUserData','resCategoryData','weekDays'));
    }

    public function offersprocess(Request $request)
    {
        if (!$request->isMethod('post')) {
            return redirect()->route('badmin.alloffers')->with('error', 'invalid Method');
        }

        $isUpdate = $request->promo_id > 0;
        $isTier   = $request->promo_type == 2;

        $rules = [
            'promo_name'        => 'required',
            'promo_coupon_code' => 'required|unique:ar_promos,promo_coupon_code' . ($isUpdate ? ",{$request->promo_id},promo_id" : ''),
            'valid_from'        => 'required',
            'valid_to'          => 'required|after:valid_from',
            'description'       => 'required',
            'promo_first_user'  => 'required',
        ];
        if ($isTier) {
            $rules += [
                'tiers'                      => 'required|array|min:1',
                'tiers.*.tier_min_amount'    => 'required|numeric|min:1',
                'tiers.*.tier_label'         => 'required|string|max:60',
                'tiers.*.tier_reward_type'   => 'required|in:0,1,2,3',
                'tiers.*.tier_reward_value'  => 'nullable|numeric|min:0',
            ];
        } else {
            $rules += [
                'discount_type' => 'required',
                'discount_in'   => 'required',
                'amount'        => 'required|numeric',
                'max_amount'    => 'required|numeric',
            ];
        }
        $request->validate($rules);

        DB::transaction(function () use ($request, $isUpdate, $isTier) {
            $offerObj = $isUpdate
                ? ArPromos::where('promo_id', $request->promo_id)->firstOrFail()
                : new ArPromos;

            $offerObj->promo_name            = $request->promo_name;
            $offerObj->promo_coupon_code     = $request->promo_coupon_code;
            $offerObj->promo_valid_from      = $request->valid_from;
            $offerObj->promo_valid_to        = $request->valid_to;
            $offerObj->promo_discount_type   = $isTier ? 1 : $request->discount_type;
            $offerObj->promo_discount_in     = $isTier ? 0 : $request->discount_in;
            $offerObj->promo_amount          = $isTier ? 0 : $request->amount;
            $offerObj->promo_max_amount      = $isTier ? 0 : $request->max_amount;
            $offerObj->promo_description     = $request->description;
            $offerObj->promo_usage_limit     = $request->usage_limit;
            $offerObj->promo_usage_user_limit= $request->user_limit;
            $offerObj->promo_minimum_purchase= $request->minimum_purchase;
            $offerObj->promo_cat_id          = $request->promo_cat_id;
            $offerObj->promo_first_user      = $request->promo_first_user;
            $offerObj->promo_type            = $request->promo_type;
            $offerObj->promo_week_day        = $request->promo_type == 1 ? $request->promo_week_day : '';
            $offerObj->save();

            // sync tiers
            ArPromoTier::where('promo_id', $offerObj->promo_id)->delete();
            if ($isTier) {
                foreach (array_values($request->tiers) as $order => $t) {
                    $type = (int) $t['tier_reward_type'];
                    ArPromoTier::create([
                        'promo_id'          => $offerObj->promo_id,
                        'tier_min_amount'   => $t['tier_min_amount'],
                        'tier_label'        => $t['tier_label'],
                        'tier_reward_type'  => $type,
                        'tier_reward_value' => $t['tier_reward_value'] ?? 0,
                        'tier_max_amount'   => $t['tier_max_amount'] ?: null,
                        'tier_coupon_code'  => $type === 2 ? ($t['tier_coupon_code'] ?? null) : null,
                        'tier_product_id'   => $type === 3 ? ($t['tier_coupon_code'] ?? null) : null,
                        'tier_order'        => $order,
                    ]);
                }
            }
        });

        return redirect()->route('badmin.alloffers')
            ->with('success', $isUpdate ? 'Offer Updated Successfully' : 'Offer Added Successfully');
    }

    public function deleteoffers($id=null){
        ArPromos::where('promo_id',$id)->delete();
        return redirect()->back()->with('success', 'Offer Deleted Successfully');
    }
    
    public function offersstatus($id=null){
        $offerData=ArPromos::where('promo_id',$id)->first();
        if (isset($offerData->promo_status) && $offerData->promo_status==1) {
            $status=0;
        }else{
            $status=1;
        }
        ArPromos::where('promo_id',$id)->update(array('promo_status' => $status));
        return redirect()->back()->with('success', 'Status Updated Successfully');
    }

    public function offersfeatured($id=null)
    {
        $offerData = ArPromos::where('promo_id',$id)->first();
        if($offerData->promo_featured == 0)
        {
            $offerData->promo_featured = 1;
        } else{
            $offerData->promo_featured = 0;
        }
        if($offerData->save())
        {
            return redirect()->back()->with('success', 'Featured Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }

}