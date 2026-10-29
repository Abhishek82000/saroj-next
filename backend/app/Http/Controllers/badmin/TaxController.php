<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArUniqueIds;
use App\Models\ArProduct;
use App\Models\ArTaxRates;

use DB;
use Hash;
use Session;
use Illuminate\Support\Str;
use App\Models\ArThemeAdmin;
use Illuminate\Support\Facades\File;

class TaxController extends Controller
{   
    public function getUniqueId($id)
    { 
        $rowUniqueId = ArUniqueIds::where('ui_id',$id)->first();
        $intCurrentCounter = $rowUniqueId->ui_current+1;
        $strCategoryId = $rowUniqueId->ui_prefix.$intCurrentCounter;
        ArUniqueIds::where('ui_id',$id)->update(['ui_current'=>$intCurrentCounter]);
        return $strCategoryId;
    } 
	 
	
    /*---------------------------------------BrandSection---------------------------------*/
	
	public function tax($id=0){
        $title='Tax Rates';
		$taxData= array();
        if (isset($id) && $id > 0) {
            $taxData = ArTaxRates::where('tax_id',$id)->first();
        }
        $taxdetails = ArTaxRates::orderBy('tax_id','DESC')->paginate(50);
        return view('badmin.tax.tax_rates',compact('title','taxdetails','taxData'));
    }
	
	 public function taxprocess(Request $request)
     {
        if ($request->isMethod('post')) 
        {
            $requestData = $request->all();
            if (isset($requestData['tax_id']) && $requestData['tax_id'] > 0) {
                $taxObj = ArTaxRates::where('tax_id',$requestData['tax_id'])->first();
            }else{
                $request->validate([
                    'tax_name' => 'required',
					'tax_rate' => 'required'
                ]);
                $taxObj = new ArTaxRates;
            }

            $taxObj->tax_name = $requestData['tax_name'];
			$taxObj->tax_rate = $requestData['tax_rate'];
            if($taxObj->save()){
                
            if (isset($requestData['tax_id']) && $requestData['tax_id'] > 0) {
                return redirect()->route('badmin.tax')->with('success', 'Tax Updated Successfully');
            }else{
                return redirect()->route('badmin.tax')->with('success', 'Tax Added Successfully');
            }
            }
            }else{
                return redirect()->route('badmin.tax')->with('error', 'Invalid Method');
            }
    }
	
	public function deletetax($id){
        if($id>0){
            $deletebrand = ArProduct::where('product_tax_id',$id)->first();
            if($deletebrand){
                return redirect()->route('badmin.tax')->with('error', 'Tax is selected in all product. It can not be deleted');
            }else{
                ArTaxRates::where('tax_id',$id)->delete();
                return redirect()->route('badmin.tax')->with('success', 'Tax Deleted Successfully');
            } 
        }
    }
	
	public function taxstatus($id=null)
    {
        $taxObj = ArTaxRates::where('tax_id',$id)->first();
        if($taxObj->tax_status == 0)
        {
        $taxObj->tax_status = 1;
        }
        else{
            $taxObj->tax_status = 0;
        }
        if ($taxObj->save()) {
            return redirect()->route('badmin.tax')->with('success', 'Status Updated Successfully');
        }
        return redirect()->route('badmin.tax')->with('error', 'Something Went Wrong');
    }
}   