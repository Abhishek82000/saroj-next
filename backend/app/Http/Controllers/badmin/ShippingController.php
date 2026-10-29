<?php

namespace App\Http\Controllers\badmin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ArShippingRate;
use App\Models\ArShippingPincode;
use App\Models\ArCity;
use App\Models\ArCities;
use App\Models\ArState;
use App\Models\ArZone;
use App\Models\ArZoneCity;
use App\Models\ArShippingRateAmount;
use App\Models\ArShippingRateWeight;
use App\Models\ArThemeAdmin;
use App\Models\ArCountries;
use App\Models\ArShippingAgency;
use Illuminate\Support\Str;
use DB;
use Hash;
use Session;


class ShippingController extends Controller
{

    public function allshippingagency()
    {
        $rowShiprocketData = ArShippingAgency::where('agency_type',1)->first();
        $activeAgency = ArThemeAdmin::first();
        $title = 'Shipping Agency';
        return view('badmin.shipping.shippingagency',compact('title','rowShiprocketData','activeAgency'));
    }

    public function shippingAgencyProcess(Request $request)
    {
        if($request->isMethod('post')){
            $objAgenct = ArShippingAgency::where('agency_type',$request->agency_type)->first();
            if(!isset($objAgenct)){
                $objAgenct = new ArShippingAgency;
            }
            $objAgenct->agency_type = $request->agency_type;
            $objAgenct->agency_emailid = $request->agency_emailid;
            $objAgenct->agency_api_password = $request->agency_api_password;
            $objAgenct->agency_company_name = $request->agency_company_name;
            $objAgenct->agency_phone = $request->agency_phone;
            $objAgenct->agency_address1 = $request->agency_address1;
            $objAgenct->agency_address2 = $request->agency_address2;
            $objAgenct->agency_city = $request->agency_city;
            $objAgenct->agency_state = $request->agency_state;
            $objAgenct->agency_country = $request->agency_country;
            $objAgenct->agency_pincode = $request->agency_pincode;
            $objAgenct->agency_free_shipping = $request->agency_free_shipping;
            if($objAgenct->save()){
                ArThemeAdmin::where('id',1)->update(['admin_agency_active'=>$objAgenct->agency_type]);
                return redirect()->back()->With('success', 'Shipping agency saved successfully.');
            }else{
                return redirect()->back()->With('error', 'Shipping agency did not save, Please try again.');
            }
        }else{
            return redirect()->back()->With('error', 'Invalid method.');
        }
    }

    public function shippingAgencyDeactivate(Request $request){
        ArThemeAdmin::where('id',1)->update(['admin_agency_active'=>0]);
        exit();
    }

    public function selectCheckedBaseOn(Request $request){

        $aryObj = ArThemeAdmin::first();
        if($request->base==0){
            $aryObj->admin_shipping_other = $request->value;
            if($request->value==1){
                $message = 'Shipping rates based on Countries activated successfully!!';
            }else{
                $message = 'Shipping rates based on Countries de-activated successfully!!';
            }
        }else{
            $aryObj->admin_shipping_india = $request->value;
            if($request->value==1){
                $message = 'Shipping rates based on India activated successfully!!';
            }else{
                $message = 'Shipping rates based on India de-activated successfully!!';
            }
        }
        
        if($aryObj->save()) {
            return response()->json(['status' => 'ok', 'notification' => $message],200);
        }else{
            return response()->json(['status' => 'failed', 'notification' => 'Internal error, please try again!!'],200);
        }
    }

    public function selectOrderType(Request $request)
    {
        $aryObj = ArThemeAdmin::first();
        if($request->base==0){
            $aryObj->admin_shipping_rule_other = $request->value;
        }else{
            $aryObj->admin_shgipping_rule = $request->value;
        }
        if($aryObj->save()) {
            return response()->json(['status' => 'ok', 'notification' => 'Updated successfully!!'],200);
        }else{
            return response()->json(['status' => 'failed', 'notification' => 'Internal error, please try again!!'],200);
        }
    }

    

    public function shippingrate()
    {
        $title = 'Shipping Rate';
        $getdata = ArShippingRate::where('shipping_rate_checked',1)->first();
        $zonecity = ArZoneCity::pluck('zc_city_id')->toArray();
        $cities = ArCity::whereNotIn('cities_id',$zonecity)->get();
        $zone = ArZone::get();
        $shipping = ArThemeAdmin::first();
        $shippingamtdata = ArShippingRateAmount::where('sra_zone_type',1)->get();
        $shippingweightdata = ArShippingRateWeight::where('srw_zone_type',1)->get();
        $shippingamtCountrydata = ArShippingRateAmount::where('sra_zone_type',0)->get();
        $shippingweightCountrydata = ArShippingRateWeight::where('srw_zone_type',0)->get();
        /* echo "<pre>";
        print_r($shippingweightCountrydata);die; */
        $states = ArState::get();

        $zoneCountriesData = ArCountries::where('country_id','!=',101)->get();
        return view('badmin.shipping.shippingrate',compact('title','shippingweightCountrydata','shippingamtCountrydata','shippingamtCountrydata','getdata','cities','zone','shipping','shippingamtdata','shippingweightdata','states','zoneCountriesData'));
    }

    public function getzoneCities(Request $request)
    {
        $citiesdata = ArCity::where('state_id',$request->state_id)->get();
        $selcities = ArZoneCity::where('zc_zone_id', $request->zone_id)->where('zc_state_id', $request->state_id)->pluck('zc_city_id')->toArray();
        $html='<option disabled>Select City</option>';
        foreach($citiesdata as $value)
        {
            if(in_array($value->cities_id,$selcities))
            {$val='selected';}
            else{
             $val='';   
            }
            $html .= '<option value='.$value->cities_id." ".$val.'>'.$value->cities_name.'</option>';

        }
        return $html;
    }

    public function shippingrateamount(Request $request)
    {
        ArShippingRateAmount::where('sra_zone_type',1)->delete();
        foreach($request->amtzone as $key=>$value)
        {
            if(!empty($value) && !empty($request->amtfrom[$key]) && !empty($request->amtto[$key]) && !empty($request->amtrate[$key]))
            {
                $amt = new ArShippingRateAmount;
                $amt->sra_zone_id = $value;
                $amt->sra_zone_type = 1;
                $amt->sra_from = $request->amtfrom[$key];
                $amt->sra_to = $request->amtto[$key];
                $amt->sra_rate = $request->amtrate[$key];
                $amt->save();
            }
        }
        return redirect()->back()->With('success', 'Shippings Rate Updated Successfully!'); 
 
    }  

    public function shippingweightamount(Request $request)
    { 
        ArShippingRateWeight::where('srw_zone_type',1)->delete();
        foreach($request->weightzone as $key=>$value)
        {
            if(!empty($value) && !empty($request->weightfrom[$key]) && !empty($request->weightto[$key]) && !empty($request->weightrate[$key]))
            {
            $amt = new ArShippingRateWeight;
            $amt->srw_zone_id = $value;
            $amt->srw_zone_type = 1;
            $amt->srw_from = $request->weightfrom[$key];
            $amt->srw_to = $request->weightto[$key];
            $amt->srw_rate = $request->weightrate[$key];
            $amt->save();
            }
        }
        return redirect()->back()->With('success', 'Shippings Rate Updated Successfully!'); 
 
    }  

    public function addFreeShipping(Request $request){
        ArThemeAdmin::where('id',1)->update(['admin_shipping_free'=>$request->shipping_free_amount,'admin_min_order'=>$request->shipping_mim_order,'admin_notzone_amount'=>$request->shipping_notzone_amount,'admin_shipping_cod'=>$request->cod]);
        return redirect()->back()->With('success', 'Free Shipping Updated Successfully!'); 
    }


    public function restofindiastore(Request $request)
    {
        $citiesdata = ArCity::where('state_id',$request->state_id)->get();
        $html='<option disabled>Select City</option>';
        foreach($citiesdata as $value)
        {
            $val='selected'; 
            $html .= '<option value='.$value->cities_id." ".$val.'>'.$value->cities_name.'</option>';
        }
        return $html;
    }

    public function restofcountrystore(Request $request)
    {
        $citiesdata = ArCountries::get();
        $html='<option disabled>Select Country</option>';
        foreach($citiesdata as $value)
        {
            $val='selected'; 
            $html .= '<option value='.$value->country_id." ".$val.'>'.$value->country_name.'</option>';
        }
        return $html;
    }


    public function deletezone($id)
    {
        ArZone::where('zone_id',$id)->delete();
        ArZoneCity::where('zc_zone_id',$id)->delete();
        ArShippingRateAmount::where('sra_zone_id',$id)->delete();
        ArShippingRateWeight::where('srw_zone_id',$id)->delete();
        return redirect()->back()->With('success', 'Deleted Successfully!');
    }

    public function deletezonecountry($id)
    {
        ArZone::where('zone_id',$id)->delete();
        ArZoneCity::where('zc_zone_id',$id)->delete();
        ArShippingRateAmount::where('sra_zone_id',$id)->delete();
        ArShippingRateWeight::where('srw_zone_id',$id)->delete();
        return redirect()->back()->With('success', 'Deleted Successfully!');
    }

    

    public function createzone(request $request)
    {
        if(empty($request->zone_name))
        {
            return redirect()->back()->With('error', 'Zone name cannot be empty!'); 
        }
        if(empty($request->zone_city))
        {
            return redirect()->back()->With('error', 'Zone Cities cannot be empty!'); 
        }
        $cities_name = ArCity::wherein('cities_id',$request->zone_city)->pluck('cities_name')->toArray();

        if(isset($request->id) && $request->id>0)
        {
            $zone = ArZone::where('zone_id',$request->id)->first();
        }
        else
        {
            $zoneexist = ArZone::where('zone_name',$request->zone_name)->where('zone_type',1)->first();
            if($zoneexist)
            {
                return redirect()->back()->With('error', 'Zone Already Exists!'); 
            }

            $zone = new ArZone;
        }
        $zone->zone_name = $request->zone_name;
        $zone->zone_cities_id = implode(',',$request->zone_city);
        $zone->zone_cities_name = implode(', ',$cities_name);
        $zone->zone_state_id = $request->state_id;
        $zone->zone_type = 1;
        if($zone->save())
        {
            ArZoneCity::where('zc_zone_id',$zone->zone_id)->delete();
            foreach($request->zone_city as $value)
            {
                if($value!=''){
                $city = ArCity::where('cities_id',$value)->first();
                $zonecity = new ArZoneCity;
                $zonecity->zc_zone_id = $zone->zone_id;
                $zonecity->zc_city_id = $value;
                $zonecity->zc_city_name = $city->cities_name;
                $zonecity->zc_state_id = $request->state_id;
                $zonecity->zc_type = 1;
                $zonecity->Save();
                }
            }
        }
        return redirect()->back()->With('success', 'Zone Created Successfully!');
    }

    public function createzonecountry(request $request)
    {
        //return $request->all();
        if(empty($request->zone_name))
        {
            return redirect()->back()->With('error', 'Zone name cannot be empty!'); 
        }
        if(empty($request->country_zone_city))
        {
            return redirect()->back()->With('error', 'Zone Cities cannot be empty!'); 
        }
        $countires_name = ArCountries::wherein('country_id',$request->country_zone_city)->pluck('country_name')->toArray();

        if(isset($request->id) && $request->id>0)
        {
            $zone = ArZone::where('zone_id',$request->id)->first();
        }
        else
        {
            $zoneexist = ArZone::where('zone_name',$request->zone_name)->where('zone_type',0)->first();
            if($zoneexist)
            {
                return redirect()->back()->With('error', 'Zone Already Exists!'); 
            }

            $zone = new ArZone;
        }
        $zone->zone_name = $request->zone_name;
        $zone->zone_cities_id = implode(',',$request->country_zone_city);
        $zone->zone_cities_name = implode(', ',$countires_name);
        $zone->zone_state_id = 0;
        $zone->zone_type = 0;
        if($zone->save())
        {
            ArZoneCity::where('zc_zone_id',$zone->zone_id)->delete();
            foreach($request->country_zone_city as $value)
            {
                if($value!=''){
                $city = ArCountries::where('country_id',$value)->first();
                $zonecity = new ArZoneCity;
                $zonecity->zc_zone_id = $zone->zone_id;
                $zonecity->zc_city_id = $value;
                $zonecity->zc_city_name = $city->country_name;
                $zonecity->zc_state_id = 0;
                $zonecity->zc_type = 0;
                $zonecity->Save();
                }
            }
        }
        return redirect()->back()->With('success', 'Country Zone Created Successfully!');
    }

    public function shippingrateamountcountry(Request $request)
    {
        ArShippingRateAmount::where('sra_zone_type',0)->delete();
        foreach($request->amtzone as $key=>$value)
        {
            if(!empty($value) && !empty($request->amtfrom[$key]) && !empty($request->amtto[$key]) && !empty($request->amtrate[$key]))
            {
                $amt = new ArShippingRateAmount;
                $amt->sra_zone_id = $value;
                $amt->sra_zone_type = 0;
                $amt->sra_from = $request->amtfrom[$key];
                $amt->sra_to = $request->amtto[$key];
                $amt->sra_rate = $request->amtrate[$key];
                $amt->save();
            }
        }
        return redirect()->back()->With('success', 'Shippings Rate Updated Successfully!'); 
 
    }  

    public function shippingweightamountcountry(Request $request)
    { 
        ArShippingRateWeight::where('srw_zone_type',0)->delete();
        foreach($request->weightzone as $key=>$value)
        {
            if(!empty($value) && !empty($request->weightfrom[$key]) && !empty($request->weightto[$key]) && !empty($request->weightrate[$key]))
            {
            $amt = new ArShippingRateWeight;
            $amt->srw_zone_id = $value;
            $amt->srw_zone_type = 0;
            $amt->srw_from = $request->weightfrom[$key];
            $amt->srw_to = $request->weightto[$key];
            $amt->srw_rate = $request->weightrate[$key];
            $amt->save();
            }
        }
        return redirect()->back()->With('success', 'Shippings Rate Updated Successfully!'); 
 
    }  

    public function getzoneCitiesCountry(Request $request)
    {
        $citiesdata = ArCountries::get();
        $selcities = ArZoneCity::where('zc_zone_id', $request->zone_id)->pluck('zc_city_id')->toArray();
        $html='<option disabled>Select City</option>';
        foreach($citiesdata as $value)
        {
            if(in_array($value->country_id,$selcities))
            {
                $val='selected';
            }
            else{
                $val='';   
            }
            $html .= '<option value='.$value->country_id." ".$val.'>'.$value->country_name.'</option>';
        }
        return $html;
    }

    public function shippingrateprocess(Request $request){
        $checkdata = ArShippingRate::where('shipping_rate_value',$request->shipping_rate_value)->first();
        if(isset($checkdata) && $checkdata!=''){
            ArShippingRate::where('shipping_rate_id',$checkdata->shipping_rate_id)->update(['shipping_rate_checked'=>1]);
            ArShippingRate::where('shipping_rate_id','!=',$checkdata->shipping_rate_id)->update(['shipping_rate_checked'=>0]);
        }else{
            $adddata = new ArShippingRate;
            $adddata->shipping_rate_value = $request->shipping_rate_value;
            $adddata->shipping_rate_checked = 1;
            $adddata->save();

            ArShippingRate::where('shipping_rate_id','!=',$adddata->shipping_rate_id)->update(['shipping_rate_checked'=>0]);
        }
        return redirect()->back()->With('success', 'Shipping policy updated successfully!');
    }


    public function shippingpincode(){
        $title = 'Shipping Rate';
        $getdatas = ArShippingPincode::paginate(50);
        return view('badmin.shipping.shipping_pincode',compact('title','getdatas'));
    }

    public function addshippingpincode($id=null){
        $title = 'Shipping Rate';
        $getpincode = [];
            if(isset($id) && $id !=''){
                $getpincode = ArShippingPincode::where('shipping_pincodes_id',$id)->first();
            }
        
        return view('badmin.shipping.add_shipping_pincode',compact('title','getpincode'));
    }

    public function addshippingpincodeprocess(Request $request){
        $pincodes = explode(",", $request->pincode);
        $requestData=$request->all();
            $request->validate([
                'pincode' => 'required|min:6'
            ]);
            foreach ($pincodes as $key => $value) {
                $shippingPincode = ArShippingPincode::updateOrCreate(['shipping_pincodes' => $value]);
            }
            return redirect()->route('badmin.shippingpincode')->with('success', 'Pincode Added Successfully');
    }

    public function shippingpincodesearch(Request $request)
    {
            $output="";
             $getpincodes = ArShippingPincode::where('shipping_pincodes','like', '%' . $request->searchpincode . '%')->get();
            if(count($getpincodes)>0)
            {
                 return response()->json(['statuscode' => 200, 'message' => $getpincodes]);
            }else{
                return response()->json(['statuscode' => 201, 'message' => 'No data found']);
            }
    }

    public function shippingcodupdate(Request $request)
    {
                 ArShippingPincode::where('shipping_pincodes_id',$request->pincode_id)
                                  ->update(['shipping_pincodes_cod'=>$request->cod]);
                 return response()->json(['statuscode' => 200, 'message' => "Data updated successfully"]);
    }


    public function shippingupdate(Request $request)
    {
                 ArShippingPincode::where('shipping_pincodes_id',$request->pincode_id)
                                  ->update(['shipping_pincodes_shipping'=>$request->shipping]);
                 return response()->json(['statuscode' => 200, 'message' => "Data updated successfully"]);
    }

    public function deletepincode(Request $request)
    {
    
        if($request->pincodeid && is_array($request->pincodeid) && count($request->pincodeid) > 0)
        {
            foreach($request->pincodeid as $key => $value)
            {
                $updatestatus = ArShippingPincode::where('shipping_pincodes_id',$value)->delete();
            }
        }else{
                $updatestatus = ArShippingPincode::where('shipping_pincodes_id',$request->pincodeid)->delete();
        }
          
        if($updatestatus)
        {
            return response()->json(['statuscode' => true, 'message' => 'Pincode deleted scuccessfully']);
        }else{
            return response()->json(['statuscode' => false, 'message' => 'Something went wrong']);
        }
    }

}