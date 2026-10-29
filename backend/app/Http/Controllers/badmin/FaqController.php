<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArFaqs;
use Session;

class FaqController extends Controller
{
    
    public function faqView(Request $request, $id=null){
        $title='Faq';
		$getdata = ArFaqs::orderBy('faq_id','DESC')->paginate(50);
       
        return view('badmin.faq.faq_list',compact('title','getdata'));
    }

    public function faqAdd($id=null){
        $faqIdData=array();
        if(isset($id) && $id > 0) {
           $faqIdData = ArFaqs::where('faq_id',$id)->first();
        }
        $title='Add Faq';
        return view('badmin.faq.add_faq',compact('title','faqIdData'));
    }

    public function faqProccess(Request $request){
         $requestData=$request->all();
         if (isset($requestData['faq_id']) && $requestData['faq_id'] > 0) {
            $faqObj= ArFaqs::where('faq_id',$request->faq_id)->first();
         }else{            
            $faqObj = new ArFaqs;
        }
		$request->validate([
			'faq_title' => 'required',
			'faq_description' => 'required'
         ]);
        $faqObj->faq_title = $requestData['faq_title'];
        $faqObj->faq_description = $requestData['faq_description'];
        
        $faqObj->save();
        if (isset($requestData['faq_id']) && $requestData['faq_id'] > 0) {
            return redirect()->route('badmin.faqView')->with('success', 'Faq Updated Successfully');
        }else{
            return redirect()->route('badmin.faqView')->with('success', 'Faq Added Successfully');
        }
    }

    public function faqStatus($id=null)
    {
        $faqObj = ArFaqs::where('faq_id',$id)->first();
        if($faqObj->faq_status == 0)
        {
            $faq_status = 1;
        }
        else{
            $faq_status = 0;
        }
       ArFaqs::where('faq_id',$id)->update(['faq_status' => $faq_status]);
       return redirect()->back()->with('success', 'Status Updated Successfully');
    }

    public function faqDelete($id){
        $deletedata =  ArFaqs::where('faq_id',$id)->delete();
        if($deletedata){
            return redirect()->back()->with('success', 'Faq deleted Successfully');
        }else{
            return redirect()->back()->with('error', 'Something went wrong. Please try again!!');
        }
    }

    public function faqbulkaction(Request $request){
        if($request->bulkstatus == 1){
            foreach($request->faqdata as $key => $value) {
               $update =ArFaqs::where('faq_id',$value)->update(['faq_status'=>1]);
            }
        }
        if($request->bulkstatus == 2){
             foreach ($request->faqdata as $key => $value) {
                $update =ArFaqs::where('faq_id',$value)->update(['faq_status'=>0]);
            }
        }

        if($request->bulkstatus == 3){
            foreach ($request->faqdata as $key => $value) {
                $update =ArFaqs::where('faq_id',$value)->delete();
            }
        }

        if($update){
            return redirect()->back()->with('success', 'Data Updated successfully!!');
        }else{
            return redirect()->back()->with('error', 'Something went wrong. Please try again!!');
        }
    }
}

    

    
