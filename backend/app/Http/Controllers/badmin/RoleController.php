<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArRole;
use App\Models\ArStaff;
use App\Models\ArPermission;
use DB;
use Hash;
use Session;

class RoleController extends Controller
{
    public function rolepermission(Request $request){
        $title='Role';
        $roleData = ArRole::orderBy('role_id','DESC')->paginate(50);
             
     return view('badmin.rolepermission.rolepermission',compact('title','roleData'));
    }
    
    public function find_role_data(Request $request){
      
        if($request->id>0)
        {
            $roleIddata = ArRole::where('role_id',$request->id)->first();    
        return $roleIddata;
        }
        else
        {
            return 'pass id';
        }
    }
    
    public function addrole(Request $request,$id=null)
    {
        $title= 'Add Role';
        $roleIddata=[];
        if (isset($id) && $id > 0)
        {
            $roleIddata = ArRole::where('role_id',$id)->first();    
        }
        
        return view('badmin.rolepermission.addrole',compact('title','roleIddata'));
    }
   

    public function roleprocess(Request $request){
        if ($request->isMethod('post'))
        {
            $requestData = $request->all();
            if (isset($requestData['role_id']) && $requestData['role_id'] > 0)
            {
                $roledata = ArRole::where('role_id',$requestData['role_id'])->first();
                
            }else{
                $roledatas = ArRole::where('role_name',$requestData['role_name'])->get();
                if(count($roledatas)>0){
                    return redirect()->back()->with('error', 'Role is already added');
                }else{
                    $request->validate([
                        'role_name' => 'required',
                    ]);
                }
                
                $roledata = new ArRole;
            }
            $roledata->role_name = $requestData['role_name'];
            $roledata->role_desc = $requestData['role_desc'];
            if($roledata->save())
            {
                if(isset($requestData['role_id']) && $requestData['role_id'] > 0) {
                    return redirect()->route('badmin.rolepermission')->with('success','Role Updated Successfully');
                 }else{
                     return redirect()->route('badmin.rolepermission')->with('success','Role Added Successfully');
                 }
            }
        }else{
                return redirect()->route('badmin.rolepermission')->with('error', 'Invalid Method');
        }
    }
    
    public function deleterole($id){
        if($id>0){
            $staff=ArStaff::where('staff_role',$id)->get();
            if(count($staff)>0){
                return redirect()->back()->with('error', "You can't delete this role. This Role is already assigned to Staff!!");    
            }else{
                ArRole::where('role_id',$id)->delete();
                return redirect()->back()->with('success', 'Role Deleted Successfully');    
            }
        }else{
            return redirect()->back()->with('error', 'Something went wrong. Please try again!!');  
        }
       
    }

    public function rolestatus($id){
        $roleData=ArRole::where('role_id',$id)->first();
        if (isset($roleData->role_status) & $roleData->role_status==1) {
            $status=0;
        }else{
            $status=1;
        }
        ArRole::where('role_id',$id)->update(['role_status' => $status]);
        return redirect()->back()->with('success', 'Status Updated Successfully');
    }

    /***************************************Permission Section*******************************/
     public function permissions()
    {
        $title='Permission';
        $roleData = ArRole::orderBy('role_id','DESC')->paginate(50);
        return view('badmin.rolepermission.permissions',compact('title','roleData'));
    }

   public function givepermission(Request $request)
    {
        $title='Give Permission';
        $roleData = ArPermission::where('permission_role_id',$request->role_id)->where('permission_type',$request->type)->first();
        if($roleData)
        {
           $roleData->permission_status = 1;
        }
        else
        {
           $roleData = new ArPermission;
           $roleData->permission_role_id = $request->role_id;
           $roleData->permission_type = $request->type;
           $roleData->permission_status = 1;
        }
        if($roleData->save())
        {
            return redirect()->route('badmin.permissions')->with('success','Premission Given Successfully');   
        } 
        else{
            return redirect()->back()->with('error','Something Went Wrong');
 
        }
    }
    
    public function removepermission(Request $request)
    {
        $title='Remove Permission';
        $roleData = ArPermission::where('permission_role_id',$request->role_id)->where('permission_type',$request->type)->first();
        if($roleData)
        {
           $roleData->permission_status = 0;
        }
        else
        {
           $roleData = new ArPermission;
           $roleData->permission_role_id = $request->role_id;
           $roleData->permission_type = $request->type;
           $roleData->permission_status = 0;
        }
        if($roleData->save())
        {
            return redirect()->route('badmin.permissions')->with('success','Premission Removed Successfully');   
        } 
        else{
            return redirect()->back()->with('error','Something Went Wrong');
 
        }

    }
}