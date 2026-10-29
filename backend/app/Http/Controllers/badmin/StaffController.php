<?php

namespace App\Http\Controllers\badmin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Hash;
use Session;
use Illuminate\Support\Str;
use App\Models\ArStaff;
use App\Models\ArRole;
use App\Models\ArUniqueIds;
use DB;

class StaffController extends Controller
{
    public function staff(){
        $title='Staff';
        $staffData = ArStaff::orderBy('staff_id','DESC')->paginate(50);
        return view('badmin.staff.staff',compact('title','staffData'));
    }

    public function addstaff($id=null){
        $title='Add Staff';
        $staffIddata=[];
        if($id>0)
        {
            $staffIddata = ArStaff::where('staff_id',$id)->first();  
        }
		$roles = ArRole::where('role_id','!=',1)->select('role_id','role_name')->where('role_status',1)->get(); 
        return view('badmin.staff.addstaff',compact('title','staffIddata','roles'));
    }

    public function staffprocess(request $request){
        if ($request->isMethod('post')) 
        {
            if(isset($request['staff_id']) && $request['staff_id'] > 0){
                $staffdata= ArStaff::where('staff_id',$request->staff_id)->first();
            }else{
                $request->validate([
                    'staff_name' => 'required:ar_staffs',
                    'staff_email' => 'required|unique:ar_staffs',
                    'staff_mobile' => 'required|unique:ar_staffs',
                    'staff_role' => 'required:gs_staffs'
                ]);
                $staffdata = new ArStaff;
                $staffdata->staff_registration_id = self::getUniqueId(1);
            }
           
            if($request->hasFile('file')){
                $image = $request->file('file');
                $name = time().'.'.$image->getClientOriginalExtension();
                $destinationPath = public_path('img/uploads/profile');
                $image->move($destinationPath, $name);
                $staffdata->staff_profile=$name;
            } 

            $staffdata->staff_name = $request->staff_name;
            $staffdata->staff_email = $request->staff_email;
            $staffdata->staff_mobile = $request->staff_mobile;
            if(isset($request->password) && $request->password!=''){
                $staffdata->password = Hash::make($request->password);
            } 
            $staffdata->staff_role = $request->staff_role;
            $staff = ArRole::where('role_id',$request->staff_role)->pluck('role_name')->first();
            $staffdata->staff_role_name = $staff;
            $staffdata->save();        
            if(isset($request->staff_id) && $request->staff_id > 0){
                return redirect()->route('badmin.staff')->with('success', 'Staff details Updated Successfully');
            }else{
                return redirect()->route('badmin.staff')->with('success', 'Staff details Added Successfully');
            }
        }else{
            return redirect()->back()->with('error', 'Invalid Method');
        }

    }

    public function getUniqueId($id)
    { 
        $rowUniqueId = ArUniqueIds::where('ui_id',$id)->first();
        $intCurrentCounter = $rowUniqueId->ui_current+1;
        $strCategoryId = $rowUniqueId->ui_prefix.$intCurrentCounter;
        ArUniqueIds::where('ui_id',$id)->update(['ui_current'=>$intCurrentCounter]);
        return $strCategoryId;
    }
    
    public function deletestaff($id){
        ArStaff::where('staff_id',$id)->delete();
        return redirect()->route('badmin.staff')->with('success', 'Staff Details Deleted successfully');
    }

    public function staffstatus($id){
        $staffData=ArStaff::where('staff_id',$id)->first();
        if (isset($staffData->staff_status) & $staffData->staff_status==1) {
            $status=0;
        }else{
            $status=1;
        }
        ArStaff::where('staff_id',$id)->update(['staff_status' => $status]);
        return redirect()->route('badmin.staff')->with('success', 'Status Updated Successfully');
    }
}


		