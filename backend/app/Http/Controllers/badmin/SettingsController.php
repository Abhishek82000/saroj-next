<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use DB;
use Hash;
use Session;
use App\Models\ArThemeAdmin;
use App\Models\ArState;
use App\Models\ArCities;


class SettingsController extends Controller
{
    public function contactsetting()
    {
        $title = 'Contact Setting';
        $account_data = Session::get('B_ADMIN');
        $account_data = ArThemeAdmin::where('id',$account_data->id)->first();
        return view('badmin.settings.contactsetting',compact('title','account_data'));
    }
    
    public function contactprocess(Request $request)
    {
        $resuserData = ArThemeAdmin::where('id', $request->id)->first();
        if(!empty($resuserData))
        {
            $resuserData->admin_name = $request->name;
            $resuserData->admin_lastname = $request->last_name;
            $resuserData->admin_mobile = $request->mobile;
            $resuserData->admin_hours = $request->admin_hours;
            $resuserData->admin_email = $request->email;
            $resuserData->address = $request->address;
            $resuserData->theme_about = $request->theme_about;
        }
        if($resuserData->save())
        {
            return redirect()->back()->with('success','Details Saved Successfully');     
        }
        else{
            return redirect()->back()->with('error','Something went wrong'); 
        }
    }
    
    public function siteSetting()
    {
        $title='Site Setting';
        $settingData = ArThemeAdmin::where('id', 1)->first();
        return view('badmin.settings.site_setting',compact('title','settingData'));
    }

    public function accounts()
    {
        $title = 'Accounts';
        $account_data = Session::get('B_ADMIN');
        $account_data = ArThemeAdmin::where('id',$account_data->id)->first();
        $states = ArState::get();
        $cities = ArCities::where('state_id',$account_data->state)->get();
        return view('badmin.settings.account',compact('title','account_data','states','cities'));
    }
	
	public function accountprocess(Request $request)
    {
		$request->validate([
            'name' => 'required',
			'email' => 'required'
        ]);
        $resuserData = ArThemeAdmin::where('id', $request->id)->first();
        if(!empty($resuserData))
        {
            $resuserData->admin_name = $request->name;
            $resuserData->admin_lastname = $request->last_name;
            $resuserData->admin_mobile = $request->mobile;
            $resuserData->admin_email = $request->email;
            $resuserData->address = $request->address;
            $resuserData->state = $request->state;
            $resuserData->city = $request->city;
            $resuserData->postcode = $request->postcode;
        }
        $resuserData->save();
        if($resuserData->save())
        {
            return redirect()->back()->with('message','Details Saved Successfully');     
        }
        else{
            return redirect()->back()->with('error','Something went wrong'); 
        }
    }
    
    public function getCities(Request $request)
    {
        $cities = ArCities::where('state_id', $request->state_id)->get();
        if (count($cities) > 0)
        {
            return response()->json($cities);
        }
    }
     
    public function changepassword(){
        $title='Change Password';
        return view('badmin.settings.change_password',compact('title'));
    }
    
    public function changepasswordprocess(Request $request)
    {
		$request->validate([
			'password' => 'required|confirmed'
		]);
        $user = Session::get('B_ADMIN');
        $id = $user->id;
            $resuserData = ArThemeAdmin::where('id', $id)->first();
            if(!empty($resuserData))
            {
                $resuserData->admin_password = Hash::make($request->password);
            }
            $resuserData->save();
            if($resuserData->save())
            {
                return redirect()->back()->with('success','Password Changed Successfully');     
            }
            else{
                return redirect()->back()->with('error','Something went wrong'); 
            }
        return redirect()->back()->with('success','Password Changed Successfully');
    }
    
   
    
    public function sitesettingsprocess(Request $request)
    {
	    $request->validate([
                    'site_title' => 'required',
                    'admin_razorpay_secret' => 'sometimes',
                    'admin_razorpay_key' => 'sometimes',
                    'administration_email' => 'required',
                    'logo'=>'image|mimes:jpg,png,gif|max:2048',
                    'favicon'=>'image|mimes:jpg,png,gif|max:2048'
                ]);
        $aryObj = ArThemeAdmin::where('id',1)->first();
	    if($request->hasFile('favicon'))
        {
            $image = $request->file('favicon');
            $favicon_name = time().'.'.$image->getClientOriginalExtension();
            $destinationPath = public_path(env('SITE_UPLOAD_PATH')."settings");
            $image->move($destinationPath, $favicon_name);
            $aryObj->favicon = $favicon_name;
        } 
    
        if($request->hasFile('logo'))
        {
            $image = $request->file('logo');
            $logo_name = time().'.'.$image->getClientOriginalExtension();
            $destinationPath = public_path(env('SITE_UPLOAD_PATH')."settings");
            $image->move($destinationPath, $logo_name);
            $aryObj->logo = $logo_name;
        }
		if($request->hasFile('footer_logo'))
        {
            $image1 = $request->file('footer_logo');
            $footer_logo_name = time().'.'.$image1->getClientOriginalExtension();
            $destinationPath = public_path(env('SITE_UPLOAD_PATH')."settings");
            $image1->move($destinationPath, $footer_logo_name);
            $aryObj->footer_logo = $footer_logo_name;
        }
        $aryObj->site_title = $request->site_title;
        $aryObj->site_address = $request->site_address;
        $aryObj->site_website_marque = $request->site_website_marque;
        
        $aryObj->admin_email = $request->administration_email;
        $aryObj->admin_support_email = $request->admin_support_email;
        $aryObj->admin_support_mobile = $request->admin_support_mobile;
        $aryObj->admin_razorpay_key = $request->admin_razorpay_key;
        $aryObj->admin_razorpay_secret = $request->admin_razorpay_secret;
        $aryObj->admin_share_message = $request->admin_share_message;
        $aryObj->admin_fixed_fee = $request->admin_fixed_fee;
        $aryObj->admin_prepaid_shipping_free = $request->admin_prepaid_shipping_free;
        $aryObj->admin_shipping_cod_free = $request->admin_shipping_cod_free;
        $aryObj->admin_min_order = $request->admin_min_order;
        if($aryObj->save()){
            return redirect()->back()->with('success','Site Settings Changed Successfully');
        }else{
            return redirect()->back()->with('error','Site Settings could not update, Please try again.');
        } 
    }
    
    public function socialsettings(){
        $title='Social Settings';
        $settingData = ArThemeAdmin::where('id', 1)->first();
        return view('badmin.settings.social_settings',compact('title','settingData'));
    }
    
    public function socialsettingprocess(Request $request){
        $resuserData=$request->all();
        if (isset($resuserData['id']) && $resuserData['id'] == 1) {
           ArThemeAdmin::where('id',$resuserData['id'])->update(array('facebook_url'=>$resuserData['facebook_url'],'instagram_url'=>$resuserData['instagram_url'],'twitter_url'=>$resuserData['twitter_url'],'youtube_url'=>$resuserData['youtube_url'],'linkedin_url'=>$resuserData['linkedin_url']));
           return redirect()->back()->with('success','Social Setting Changed Successfully');
        }
        $title='Social Settings';
        return view('badmin.settings.social_settings',compact('title'));
    }
}