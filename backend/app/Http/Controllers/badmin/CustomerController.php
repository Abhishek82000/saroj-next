<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArUsers;
use DB;
use Hash;
use Session;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function customer(Request $request,$id=1){

        $customerdata = ArUsers::orderBy('user_id','DESC');

        if($id == 1)
        {
        $type = 'all';    
        $customerdata = $customerdata;   
        }
        else if($id == 3)
        {
        $type = 'inactive';    
        $customerdata = $customerdata->where('user_status',0);  
        }
        else
        {
        $type = 'active';
        $customerdata = $customerdata->where('user_status',1);
        }

        
        if($request->isMethod('post')) {
    
            if(empty($request['search_filter']))
            {
                return redirect()->back()->with('error', 'Please enter something to search');
            }
            else{
            Session::put('CUSTOMER_FILTER', $request->all());
            Session::save();
            }
          
        }

        $aryFilterSession = array();
        if(Session::has('CUSTOMER_FILTER')){
            $aryFilterSession = Session::get('CUSTOMER_FILTER');
            
            if(isset($aryFilterSession) && isset($aryFilterSession['search_filter']) && $aryFilterSession['search_filter']!=''){
                $customerdata = $customerdata->Where( 'user_unique_id', 'LIKE', '%' . $aryFilterSession['search_filter'] . '%' )
                ->orWhere( 'user_email', 'LIKE', '%' . $aryFilterSession['search_filter'] . '%' )
                ->orWhere( 'user_mobile', 'LIKE', '%' . $aryFilterSession['search_filter'] . '%' );
            }           
           
        }
        
        $customerdata = $customerdata->paginate(50); 
        $title='Customer';
		$countall = ArUsers::count(); 
        $countactive = ArUsers::where('user_status',1)->count();
        $countinactive = ArUsers::where('user_status',0)->count();  
        
		//$customerdata = ArUsers::orderby('user_id','DESC')->paginate(50);
        return view('badmin.customers.customer',compact('title','aryFilterSession','customerdata','countinactive','countactive','countall','type'));
    }

    public function customerfilter(Request $request){
        Session::forget('CUSTOMER_FILTER');
        return redirect()->back();
    }
    
    public function customerstatus($id=null)
    {
        $userObj = ArUsers::where('user_id',$id)->first();
        if($userObj->user_status == 0)
        {
        $userObj->user_status = 1;
        }
        else{
            $userObj->user_status = 0;
        }
        if ($userObj->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }
    
    public function customerview($id)
    {
        $title='Customer View';
        $customerdetail = ArUsers::where('user_id',$id)->first();
        return view('badmin.customers.customerview',compact('title','customerdetail'));
    }
    
    public function customerdelete($id)
    {
        $deletedata =  ArUsers::where('user_id',$id)->delete();
        if($deletedata){
            return redirect()->back()->with('success', 'Customer Deleted Successfully');
        }else{
            return redirect()->back()->with('error', 'Something went wrong. Please try again!!');
        }
    }

    //Bulk Action
    public function customerbulkaction(Request $request){
        // dd(array_filter(array_unique($request->customerid)));
        if($request->getstatus == 1){
            foreach(array_filter(array_unique($request->customerid)) as $key => $value) {
               $update =ArUsers::where('user_id',$value)->update(['user_status'=>1]);
            }
            
        }

        if($request->getstatus == 2){
             foreach (array_filter(array_unique($request->customerid)) as $key => $value) {
                $update =ArUsers::where('user_id',$value)->update(['user_status'=>0]);
            }
           
        }

        if($request->getstatus == 3){
            foreach (array_filter(array_unique($request->customerid)) as $key => $value) {
                $update =ArUsers::where('user_id',$value)->delete();
            }
            
        }

        if($update){
            return response()->json(['status' => true, 'message' => 'Data Updated successfully!!'],200);
        }else{
            return response()->json(['status' => false, 'message' => 'something went wrong!!'],201);
        }
    }
	
}