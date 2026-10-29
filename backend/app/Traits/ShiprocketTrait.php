<?php

namespace App\Traits;
use App\Models\ArShippingAgency;

use App\Traits\ShiprocketTrait;
use Illuminate\Http\Request;
use Session;
trait ShiprocketTrait {

    /**
     * @param Request $request
     * @return $this|false|string
     */

    /* This function is to login into shiprocket and generate auth token */
    public function shiprocketAuthTokenGenarator($active_agency=0) {
        $rowAgencyCredentials = ArShippingAgency::where('agency_type',$active_agency)->first();
        if(isset($rowAgencyCredentials) && $rowAgencyCredentials->agency_id>0){
        $postData = '{
            "email": "'.$rowAgencyCredentials->agency_emailid.'",
            "password": "'.$rowAgencyCredentials->agency_api_password.'"
        }';
        
        $curl = curl_init();
        curl_setopt_array($curl, array(
        CURLOPT_URL => 'https://apiv2.shiprocket.in/v1/external/auth/login',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS =>$postData,
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json'
        ),
        ));
        $response = curl_exec($curl);
        curl_close($curl);
        $response = json_decode($response,true);
        if(isset($response['token']) && $response['token']!=''){
            Session::put('SHIPROCKET_AUTH_DATA',$response); 
            Session::save(); 
            return response()->json(['message'=>'success','notification' => 'Login Successfully','response'=>$response,'status'=>true],200);  
        }else{
            return response()->json(['message'=>'failed','notification' => 'login failed. Try again.','response'=>$response,'status'=>false],200);  
        }
    }
        
    }

    public function checkCourierServiceability($pickup_postcode,$delivery_postcode,$cod,$weight){
        $shipRocketToken = Session::get('SHIPROCKET_AUTH_DATA');
        $curl = curl_init();

        $getUrl = "https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=$pickup_postcode&delivery_postcode=$delivery_postcode&cod=$cod&weight=$weight";
        curl_setopt_array($curl, array(
        CURLOPT_URL => $getUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'GET',
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'Authorization: Bearer '.$shipRocketToken['token']
        ),
        ));
        $response = curl_exec($curl);
        curl_close($curl);
        return $response = json_decode($response,true);
    }

    public function createCustomOrder($active_agency=0,$postData){
        // return $postData;
        $authTokenStatus = $this->shiprocketAuthTokenGenarator($active_agency);
        if(isset($authTokenStatus->original) && $authTokenStatus->original['status']){
            $shipRocketToken = Session::get('SHIPROCKET_AUTH_DATA');
            $curl = curl_init();
            curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => "$postData",
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json',
                'Authorization: Bearer '.$shipRocketToken['token']
            ),
            ));
            $response = curl_exec($curl);
            curl_close($curl);
            return $response = json_decode($response,true);
        }else{
            return $response = 0;
        }
    } 

    public function cancelOrder($active_agency=0,$postData){
        //return $postData;
        $authTokenStatus = $this->shiprocketAuthTokenGenarator($active_agency);
        if(isset($authTokenStatus->original) && $authTokenStatus->original['status']){
            $shipRocketToken = Session::get('SHIPROCKET_AUTH_DATA');
            $curl = curl_init();
            curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://apiv2.shiprocket.in/v1/external/orders/cancel',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => "$postData",
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json',
                'Authorization: Bearer '.$shipRocketToken['token']
            ),
            ));
            $response = curl_exec($curl);
            curl_close($curl);
            return $response = json_decode($response,true);
        }else{
            return $response = 0;
        }
    } 

}