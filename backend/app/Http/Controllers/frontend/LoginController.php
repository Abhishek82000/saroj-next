<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArUniqueIds;
use App\Models\ArUsers;
use App\Models\ArPincode;
use App\Models\ArState;
use App\Models\ArCities;
use App\Models\ArCart;
use App\Models\ArProductVariation;
use App\Models\TableName;
use App\Models\ArThemeAdmin;
use App\Mail\sendingEmail;
use App\Models\ArTransactions;

use DB;
use Hash;
use Session;


class LoginController extends Controller
{
    
    public function updatePincode(){
        die('Simon Go Back');
        // die('Do not try this url');
        $resPincodesData = TableName::orderBy('State','ASC')->get(); 
        if(isset($resPincodesData)){
            foreach($resPincodesData as $value){
                 $statesData = ArState::where('state_name','=',$value->State)->first(); 
                if(isset($statesData)){
                    $cityData = ArCities::where('state_id',$statesData->state_id)->where('cities_name',$value->City)->first();
                    
                    if(isset($cityData)){
                        TableName::where('pin_id', $value->pin_id)->update(['pin_state_id' => $cityData->state_id,'pin_city_id' => $cityData->cities_id]);
                    }
                }
            }
        }
        echo "Updated Successfully";
        exit();
    }
    
    public function sendotp(request $request){
        if(empty($request->mobile))
        {
            return response()->json(['status' => 'error','message' => 'Please Enter Mobile Number.']);
        }
        if(strlen($request->mobile) != 10)
        {
            return response()->json(['status' => 'error','message' => 'Please Enter Valid Mobile Number.']);
        }

        $user = ArUsers::where('user_mobile',$request->mobile)->first();
        $otp = rand(1000,9999);
        
        if(isset($user) && $user->user_id > 0 )
        {
            if($user->user_profile_status == 1){
                if($user->user_status == 1){
                    $user->user_mobile_otp = $otp;  
                    $user->save();
                    $msg = 'Already Register with Saroj Textile';
                }else{
                    return response()->json(['status' => 'error','message' => 'Account is not active. Please contact admin.'],200);
                }
            }else{
                $user->user_mobile_otp = $otp;  
                $user->save();
                $msg = 'Already Register with Saroj Textile';
            }
        }else{
            $user = new ArUsers;
            $user->user_mobile = $request->mobile;
            $user->user_mobile_otp = $otp;  
            $user->user_status = 0;
            $user->user_profile_status = 0;
            $user->save();
            $msg = 'New Registration Successfull';
        }
        $strMessage = "Dear Customer your OTP is $otp to verify your Saroj Textile account. Don't share this password to anyone. ML Ent.";
        $this->sendSms($request->mobile,$strMessage); 
        Session::put('TEMP_USER', $user);
        Session::save();
        return response()->json(['status' => 'success','message' => $msg],200);
    }

    public function verifyotp(request $request){
        $userSession = Session::get('TEMP_USER');
        $rowUserData = ArUsers::where('user_id',$userSession->user_id)->first();        
        if(isset($rowUserData) && $rowUserData->user_mobile_otp == $request->otp)
        {
            if($rowUserData->user_profile_status == 1)
            {
                if($rowUserData->user_status == 1)
                {   
                    Session::put('AR_USER', $rowUserData);
                    Session::save();
                    self::saveLoginCart();
                    return response()->json(['status' => 'success','message' => 'already_register'],200);
                }else{
                    return response()->json(['status' => 'error','message' => 'Account is not active. Please contact Bindian support team.']);
                }
            }else{
                return response()->json(['status' => 'success','message' => 'new_register'],200);
            }
        }else{
            return response()->json(['status' => 'error','message' => 'Invalid OTP']);
        }        
    }
    public function sendcartotp(request $request){
        if(empty($request->mobile))
        {
            return response()->json(['status' => 'error','message' => 'Please Enter Mobile Number.']);
        }
        if(strlen($request->mobile) != 10)
        {
            return response()->json(['status' => 'error','message' => 'Please Enter Valid Mobile Number.']);
        }

        $user = ArUsers::where('user_mobile',$request->mobile)->first();
        $otp = rand(1000,9999);
        if(isset($user) && $user->user_id > 0 )
        {
            if($user->user_profile_status == 1){
                if($user->user_status == 1){
                    Session::put('AR_USER', $user);
                    Session::save();
                    $msg = 'Already Register with Saroj Textile';
                    return response()->json(['status' => 'registered','message' => $msg],200);
                }else{
                    return response()->json(['status' => 'error','message' => 'Account is not active. Please contact admin.'],200);
                }
            }else{
                $user->user_mobile_otp = $otp;  
                $user->save();
                $msg = 'New User';
            }
        }else{
            $user = new ArUsers;
            $user->user_mobile = $request->mobile;
            $user->user_mobile_otp = $otp;  
            $user->user_status = 0;
            $user->user_profile_status = 0;
            $user->save();
            $msg = 'New User';
        }
        $strMessage = "Dear Customer your OTP is $otp to verify your Saroj Textile account. Don't share this password to anyone. ML Ent.";
        $this->sendSms($request->mobile,$strMessage); 
        Session::put('TEMP_USER', $user);
        Session::save();
        return response()->json(['status' => 'success','message' => $msg],200);
    }
    public function verifycartotp(request $request){
        $userSession = Session::get('TEMP_USER');
        $rowUserData = ArUsers::where('user_id',$userSession->user_id)->first();        
        if(isset($rowUserData) && $rowUserData->user_mobile_otp == $request->otp)
        {
            if($rowUserData->user_profile_status == 1)
            {
                if($rowUserData->user_status == 1)
                {   
                    Session::put('AR_USER', $rowUserData);
                    Session::save();
                    ArCart::where('cart_user_id',$rowUserData->user_id)->delete();
                    Session::forget('TEMP_USER');
                    self::saveLoginCart();
                    return response()->json(['status' => 'success','message' => 'already_register'],200);
                }else{
                    return response()->json(['status' => 'error','message' => 'Account is not active. Please contact Bindian support team.']);
                }
            }else{
                return response()->json(['status' => 'success','message' => 'new_register'],200);
            }
        }else{
            return response()->json(['status' => 'error','message' => 'Invalid OTP']);
        }
    }
    public function register(request $request){
        $userSession = Session::get('TEMP_USER');
        $rowUserData = ArUsers::where('user_id',$userSession->user_id)->first();
        if(isset($rowUserData))
        {
            $rowUserData->user_fname = $request->name;
            // $user->user_lname = $request->last_name;
            $rowUserData->user_email = $request->email;
            $rowUserData->user_unique_id = self::getUniqueId(7);
            $rowUserData->user_status = 1;
            $rowUserData->user_profile_status = 1;
            $rowUserData->user_email_status = 0;
            //$verify_email_url = md5($request->email.$request->password);
            //$user->user_email_hash = $verify_email_url;
            if($rowUserData->save()){
                Session::put('AR_USER', $rowUserData);
                Session::save();
                self::saveLoginCart();
                Session::forget('TEMP_USER');
                // try {
                //     $details = [
                //         'subject' => 'Thankyou for Registered with Saroj Textile',
                //         'name' => $request->name,
                //         'template' =>'frontend.emails.new_register', 
                //     ];
                //     \Mail::to($request->email)->send(new sendingEmail($details)); 
                //     $details1 = [
                //         'subject' => 'New Registered with Saroj Textile',
                //         'name' => $request->name,
                //         'template' =>'frontend.emails.new_register', 
                //     ];
                //     $rowAdminData = ArThemeAdmin::first(); 
                //     \Mail::to($rowAdminData->admin_email)->send(new sendingEmail($details1));
                //   } catch (\Exception $e) {
                  
                //        return $e->getMessage();
                //   }
                
                return response()->json(['status' => 'success','message' => 'Registration Successfull'],200);
            }else{
                return response()->json(['status' => 'success','message' => 'We are not able to process this request, Please try after sometime.'],200);
            }
                
                /* $details = [
                    'subject' => 'Confirm your Email ID',
                    'name' => $request['name'],
                    'verify_email_url' => $verify_email_url,
                    'template' =>'frontend.emails.email_verification', 
                ];
                \Mail::to($request->email)->send(new sendingEmail($details));  

                $details = [
                    'subject' => 'Thankyou for Registered with Saroj Textile',
                    'name' => $request->name,
                    'template' =>'frontend.emails.new_register', 
                ];
                \Mail::to($request->email)->send(new sendingEmail($details)); 
                $details1 = [
                    'subject' => 'New Registered with Saroj Textile',
                    'name' => $request->name,
                    'template' =>'frontend.emails.new_register', 
                ];
                $rowAdminData = ArThemeAdmin::first(); 
                \Mail::to($rowAdminData->admin_email)->send(new sendingEmail($details1)); 
                return response()->json(['status' => 'success','message' => 'Registration Successfull'],200);
            }else{
                
            }*/
			
        }
    }

    public function emailVerify($hash=null){
        $rowUserData = ArUsers::where('user_email_hash',$hash)->first();
        ArUsers::where('user_id',$rowUserData->user_id)->update(['user_email_status'=>1]);
        /* if($rowUserData->user_email_status==0){
            $details = [
                'subject' => 'Account Creation Successful',
                'name' => $rowUserData->user_fname,
                'template' =>'frontend.emails.new_register', 
            ];
            \Mail::to($rowUserData->user_email)->send(new sendingEmail($details)); 
        } */
        $title = 'Email Verify';
        return view('frontend.account.verify_email',compact('title'));
    }

    public function getUniqueId($id)
    { 
        $rowUniqueId = ArUniqueIds::where('ui_id',$id)->first();
        $intCurrentCounter = $rowUniqueId->ui_current+1;
        $strUserId = $rowUniqueId->ui_prefix.$intCurrentCounter;
        ArUniqueIds::where('ui_id',$id)->update(['ui_current'=>$intCurrentCounter]);
        return $strUserId;
    }

    public static function sendSms($mobile,$message)
    {
        $curl = curl_init();
        $message = urlencode($message);
        curl_setopt_array($curl, array(
        CURLOPT_URL => "http://sms.therytech.com/api/smsapi?key=39a1ee2c2f9e58d2c6f561cbcb1c7bb9&route=1&sender=MHENTP&number=$mobile&sms=$message&templateid=1407177816542983951",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => "GET",
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_SSL_VERIFYPEER => 0,
        ));
        $response = curl_exec($curl);
        $err = curl_error($curl);
        curl_close($curl);
        return  true;  
    }  
    public function frontlogout(Request $request)
    {   
        Session::forget('AR_USER');
        Session::forget('CART_SESSION');
        return redirect()->route('front.home')->withErrors("logged out.");
    }
    // temp cart store function 
    public function saveLoginCart()
    {   
         $userSession = Session::get('AR_USER');
        if($userSession){
            $user = ArUsers::where('user_id',$userSession->user_id)->first();
            $cartSession = Session::get('CART_SESSION');
            if($cartSession){
                foreach($cartSession as $product_id=>$qty)
                {
                     $pid = explode("####",trim($product_id));

                     $cartItem = ArCart::where('cart_user_id',$user->user_id)->where('cart_product_id',$pid[0])->first();
                    if(empty($cartItem)){
                        
                        $cartItem = new ArCart;
                        $cartItem->cart_qty += $qty;
                    }elseif(isset($pid[1]) && $cartItem->cart_variation_id == $pid[1]){
                        $cartItem->cart_qty += $qty;
                    }else{
                        $cartItem->cart_qty += $qty;
                    }
                    $cartItem->cart_user_id = $user->user_id;
                    $cartItem->cart_product_id = $pid[0];

                    if (isset($pid[1]) && $pid[1] > 0) {
                        $variation = ArProductVariation::find($pid[1]);
                        if ($variation) {
                            $cartItem->cart_variation_id = $variation->pv_id;
                        } 
                    } else {
                        $cartItem->cart_variation_id = 0;
                    }
                    $cartItem->save();                    
                }
                Session::forget('CART_SESSION');
            }

        }
    }
    
}