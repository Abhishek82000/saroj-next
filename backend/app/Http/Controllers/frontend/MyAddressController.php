<?php

namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArUsers;
use App\Models\ArPincode;
use App\Models\ArUserAddress;
use App\Models\ArCountries;

use Session;
use Hash;


class MyAddressController extends Controller
{
    public function myaddress()
    { 
        $title='My Addresses';
        $customer=Session::get('AR_USER');
        
        if(isset($customer->user_id) && $customer->user_id !='')
        {
            $customerdetails = ArUsers::where('user_id',$customer->user_id)->first();
        }else{
            return redirect()->route('front.home'); 
        }
        $address = ArUserAddress::where('ua_user_id',$customer->user_id)->get();
        $resCountryData = ArCountries::orderBy('country_name')->get();
        return view('frontend.account.myaddress',compact('title','customerdetails','address','resCountryData'));
    }

    public function deleteaddress($id)
    {
        ArUserAddress::where('ua_id',$id)->delete();
        return redirect()->back()->with('success','Address Deleted Successfully');     
    }

    public function getStateCity(request $request){
        $address = ArPincode::where('Pincode',$request->value)->first();
        return response()->json(['data' =>$address],200);
    }

    public function addaddressprocess(request $request)
    {
        /* echo "<pre>";
        print_r($request->all());die; */
        $customer = Session::get('AR_USER');
        if($request->id>0)
        {
            $add_addr = ArUserAddress::where('ua_id',$request->id)->first();
            $msg = 'Address Updated Successfully';
        }
        else
        {
            $msg = 'Address Added Successfully';
            $add_addr = new ArUserAddress;
        }
        if(isset($request->defaultaddr))
        {
            $rowCountData = ArUserAddress::where('ua_user_id',$customer->user_id)->get();   
            if(count($rowCountData)>0)
            {
                ArUserAddress::where('ua_user_id',$customer->user_id)->update(['ua_default_address'=>0]);
            }
            $add_addr->ua_default_address = 1;
        }else{
            $rowCountData = ArUserAddress::where('ua_user_id',$customer->user_id)->count();   
            if($rowCountData>0)
            {
                $add_addr->ua_default_address = 0;
            }else{
                $add_addr->ua_default_address = 1;
            }
        }

        $rowCountryInfo = ArCountries::where('country_id',$request->ship_country)->first()->country_name;
        $add_addr->ua_app_state_name = $request->ship_state;
        $add_addr->ua_app_ship_city = $request->ship_city;
        $add_addr->ua_ship_address = $request->ship_address;
        $add_addr->ua_ship_pincode = $request->ship_pincode;
        $add_addr->ua_address_type = $request->addr_type;
        $add_addr->ua_ship_house = $request->ship_house;
        $add_addr->ua_address_type_other = $request->addr_type_other;
        $add_addr->ua_user_id = $customer->user_id;
        $add_addr->ua_country_id = $request->ship_country;
        $add_addr->ua_ship_phone = $request->ship_phone;
        $add_addr->ua_country_name = $rowCountryInfo;
        $add_addr->ua_pin_id = $request->pin_id;
        if($add_addr->save())
        { 
            return redirect()->back()->with('success',$msg);     
        }else{
            return redirect()->back()->with('error','Something Went Wrong');     
        }
    }

}