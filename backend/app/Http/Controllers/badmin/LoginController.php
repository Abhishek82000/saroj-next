<?php 
namespace App\Http\Controllers\badmin; 
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use DB;
use Hash;
use Session;
use App\Models\ArThemeAdmin;
use App\Models\ArStaff;
use App\Models\CommonLogin;

class LoginController extends Controller
{
	public function adminLogin(){
		if(Session::has('B_ADMIN')){
	        return redirect()->route('dashboard');    
	    }
		$title='Login';
		return view('badmin.auth.index');
	}

	public function adminlogincheck(Request $request){
		$request->validate([
            'administration_email' => 'required',
            'admin_password' => 'required',
        ]);
		$adminData=CommonLogin::where('username',$request->administration_email)->first();
		if($adminData){
			
			if (Hash::check($request->admin_password, $adminData->password)) {
				Session::put('B_ADMIN', $adminData);
				Session::save();
				return redirect()->route('dashboard')->with(['success'=>'Login successfull']);
			}else{
				return redirect()->back()->with(['error'=>'Wrong Email or Password. Please try again']);
			}
		}else{
			return redirect()->back()->with(['error'=>'Wrong Email or Password. Please try again']);
		}
	}

	public function logout(Request $request){	
		Session::forget('B_ADMIN');
		return redirect()->route('adminLogin')->withErrors("logged out.");
	}

}