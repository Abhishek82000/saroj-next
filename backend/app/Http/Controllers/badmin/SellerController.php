<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArSeller;
use App\Models\ArProduct;
use App\Models\ArUniqueIds;
use App\Models\ArCity;
use App\Models\ArState;
use Hash;
use Session;


class SellerController extends Controller
{
    public function seller($type=0){
        //dd($type);
        $countall = ArSeller::count(); 
        $countactive = ArSeller::where('seller_status',1)->count();
        $countpending = ArSeller::where('seller_status',0)->count();  
        $countblock = ArSeller::where('seller_status',2)->count();
        $seller = ArSeller::orderBy('seller_id','DESC');
        if($type == 'all')
        {
        $seller = $seller;   
        }
        else if($type == 'verified')
        {
        $seller = $seller->where('seller_status',1);  
        }
        else if($type == 'pending-for-approve')
        {
        $seller = $seller->where('seller_status',0);  
        }
        else if( $type == 'blocked')
        {
        $seller = $seller->where('seller_status',2); 
        }
        else
        {
        $type = 'all';    
        $seller = $seller;  
        }
        
        
        $title='Seller';
        $seller = $seller->paginate(50);

        return view('badmin.sellers.seller',compact('title','seller','type','countall','countactive','countpending','countblock'));
    }
    
    public function addseller($id=0){
        $title='Add Seller';
        $getsellerdetails= array();
        if (isset($id) && $id > 0) {
            $getsellerdetails = ArSeller::where('seller_id',$id)->first();
        }
        return view('badmin.sellers.addseller',compact('title','getsellerdetails'));
    }  
    
    public function sellerDetails($id = 0) {  
        $sellercity = "";
		$sellerstate = "";
        $getsellerdetails = ArSeller::where('seller_id', $id)->first();
		if(isset($getsellerdetails->seller_city_id) && $getsellerdetails->seller_city_id != ''){
			$sellercity = ArCity::where('cities_id', $getsellerdetails->seller_city_id)->first();
		}
		if(isset($getsellerdetails->seller_state_id) && $getsellerdetails->seller_state_id != ''){
			$sellerstate = ArState::where('state_id', $getsellerdetails->seller_state_id)->first();
		}
        if ($getsellerdetails) {
            $title='Seller Details';
            return view('badmin.sellers.seller_details',compact('title','getsellerdetails','sellercity','sellerstate'));
        } else {
            return redirect()->route('badmin.seller')->with('error', 'Something Went Wrong');
        }
    }

    public function sellerview($id = 0) {        
        $getsellerdetails = ArSeller::where('seller_id', $id)->first();
        if ($getsellerdetails) {
        $sellerid = $getsellerdetails->seller_id;
        $subdomainUrl = env('SELLER_URL').'/admin-seller-login';
        $subdomainUrl .= '?sellerid=' . urlencode($sellerid);

        return redirect()->to($subdomainUrl);
        } else {
            return redirect()->route('badmin.seller')->with('error', 'Something Went Wrong');
        }
    }
        
    public function sellerprocess(Request $request){
         if ($request->isMethod('post')) 
         {
            $requestData = $request->all();			 
                    
                if (isset($requestData['seller_id']) && $requestData['seller_id'] > 0) {
                    $sellerdata = ArSeller::where('seller_id',$requestData['seller_id'])->first();
                    $request->validate([
                        'seller_name' => 'required',
                        'seller_email' => 'required',
                        'seller_mobile' => 'required',
                    ]);
                }else{                   
                    $sellerdata = new ArSeller;
                    $sellerdata->seller_reg_id = self::getUniqueId(7);
                    $request->validate([
                        'seller_name' => 'required|unique:ar_seller',
                        'seller_business_name' => 'required|unique:ar_seller',
                        'seller_email' => 'required|unique:ar_seller',
                        'seller_mobile' => 'required|unique:ar_seller',
                    ]);
                }
                
                $sellerdata->seller_name = $requestData['seller_name'];
                $sellerdata->seller_business_name = $requestData['seller_business_name'];
                $sellerdata->seller_email = $requestData['seller_email'];
                $sellerdata->seller_mobile = $requestData['seller_mobile'];
                $sellerdata->seller_address = $requestData['seller_address'];
                if(isset($requestData['password']) && $requestData['password']!=''){
                    $sellerdata->seller_password = Hash::make($requestData['password']);
                }
                if($request->hasFile('seller_profile_')){
                    $image = $request->file('seller_profile_');
                    $name = rand(1000,9999).time().'.'.$image->getClientOriginalExtension();
                    $destinationPath = public_path(env('SELLER_IMAGE'));
                    $image->move($destinationPath, $name);
                    $url = url('/').'/public'.env('SELLER_IMAGE').'/'.$name;
                    $sellerdata->seller_profile = $url;
                } 
                if($sellerdata->save()){  
                    if (isset($requestData['seller_id']) && $requestData['seller_id'] > 0) {
                        return redirect()->route('badmin.seller')->with('success', 'Seller Updated Successfully');
                    }else{
                        return redirect()->route('badmin.seller')->with('success', 'Seller Added Successfully');
                    }
                }
            }else{
                return redirect()->back()->with('error', 'Invalid Method');
            }
    }
   
    
    public function sellerstatus($id){
        $seller = ArSeller::where('seller_id',$id)->first();
        if($seller->seller_status == 0)
        {
        $seller->seller_status = 1;
        }
        else{
            $seller->seller_status = 0;
        }
        if ($seller->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');

        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }
    public function accountVerification($id){
        $seller = ArSeller::where('seller_id',$id)->first();
        if($seller->seller_acc_verification == 0)
        {
        $seller->seller_acc_verification = 1;
        }
        else{
            $seller->seller_acc_verification = 0;
        }
        if ($seller->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');

        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }
    public function gstinVerification($id){
        $seller = ArSeller::where('seller_id',$id)->first();
        if($seller->seller_gstin_status == 0)
        {
        $seller->seller_gstin_status = 1;
        }
        else{
            $seller->seller_gstin_status = 0;
        }
        if ($seller->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }
    public function savePickupLocation(Request $request){
        $seller = ArSeller::where('seller_id',$request->seller_id)->first();
        if($seller)
        {
            ArSeller::where('seller_id',$seller->seller_id)->update(['seller_pickup_location'=> $request->seller_pickup_location]);
            return response()->json(['status' => 'success', 'message' => 'Pickup Location added successfully!!'], 200);
		} else {
			return response()->json(['status' => 'error', 'message' => 'Something Went Wrong'], 201);
		}
    }    
    public function deleteseller($id){
        if($id>0){
            $productExistis = ArProduct::where('product_seller_id',$id)->count();
            if($productExistis>0){
                return redirect()->back()->with('error', 'This Seller is selected in a product. It can not be deleted');
            }else{
            ArSeller::where('seller_id',$id)->delete();
            return redirect()->route('badmin.seller')->with('success', 'Seller Deleted Successfully');
            }
        }
	}
	

	//Bulk Action
	public function sellerbulkaction(Request $request) {
		// dd(array_filter(array_unique($request->sellerid)));
		if ($request->getstatus == 1) {
			foreach(array_filter(array_unique($request->sellerid)) as $key => $value) {
				$update = ArSeller::where('seller_id', $value)->update(['seller_status'=> 1]);
			}
		}
		if ($request->getstatus == 2) {
			foreach(array_filter(array_unique($request->sellerid)) as $key => $value) {
				$update = ArSeller::where('seller_id', $value)->update(['seller_status'=> 2]);
			}
		}
		if ($request->getstatus == 0) {
			foreach(array_filter(array_unique($request->sellerid)) as $key => $value) {
				$update = ArSeller::where('seller_id', $value)->update(['seller_status'=> 0]);
			}
		}
		//return $request->sellerid;
		if ($update) {
			return response()->json(['status' => true, 'message' => 'Data Updated successfully!!'], 200);
		} else {
			return response()->json(['status' => false, 'message' => 'something went wrong!!'], 201);
		}
	}
	
    public function sellerexport(){
        
        $sellerData = array();
        $sellerData = ArSeller::get();
            
            foreach($sellerData as $value)
                {                    
                    $row['Id'] = isset($value->seller_reg_id) ? $value->seller_reg_id : null;
                    $row['Name'] = isset($value->seller_name) ? $value->seller_name : null;
                    $row['Store Name'] = isset($value->seller_business_name) ? $value->seller_business_name : null;
                    $row['Email'] = isset($value->seller_email) ? $value->seller_email : null;
                    $row['Mobile'] = isset($value->seller_mobile) ? $value->seller_mobile : null;
                    $row['Address'] = isset($value->seller_address) ? $value->seller_address : null;
                    $row['Pincode'] = isset($value->seller_pincode) ? $value->seller_pincode : null;
                    $row['State'] = isset($value->seller_state_name) ? $value->seller_state_name : null;
                    $row['City'] = isset($value->seller_city_name) ? $value->seller_city_name : null;
                    $row['Contact Name'] = isset($value->seller_contact_name) ? $value->seller_contact_name : null;
                    $row['Contact Mobile'] = isset($value->seller_contact_mobile) ? $value->seller_contact_mobile : null;
                    $row['Contact Email'] = isset($value->seller_contact_email) ? $value->seller_contact_email : null;
                    $row['GSTIN'] = isset($value->seller_gstin) ? $value->seller_gstin : null;
                    $row['Acc No'] = isset($value->seller_acc_no) ? $value->seller_acc_no : null;
                    $row['IFSC'] = isset($value->seller_ifsc) ? $value->seller_ifsc : null;
                    $row['Signature'] = isset($value->seller_signature) ? $value->seller_signature : null;
                    $row['Acc Holder Name'] = isset($value->seller_acc_holder_name) ? $value->seller_acc_holder_name : null;
                    $row['Buisness Description'] = isset($value->seller_buisness_description) ? $value->seller_buisness_description : null;
                    $row['Status'] = isset($value->seller_status) ? 
                    ($value->seller_status == 1 ? 'Verified' : 
                    ($value->seller_status == 2 ? 'Blocked' : 'Pending')) 
                    : 'Pending';
                    $row['Date'] = date('d-m-Y',strtotime($value->created_at));
                    
                    $records[] = $row;
                }        
                $filename = 'seller-report.xls'; 
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
	public function getUniqueId($id)
    { 
        $rowUniqueId = ArUniqueIds::where('ui_id',$id)->first();
        $intCurrentCounter = $rowUniqueId->ui_current+1;
        $strCategoryId = $rowUniqueId->ui_prefix.$intCurrentCounter;
        ArUniqueIds::where('ui_id',$id)->update(['ui_current'=>$intCurrentCounter]);
        return $strCategoryId;
    }		
        
        

}