<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArContacts;


class ContactController extends Controller
{
    public function contactus(){
        $title='Contact Us';
        $contacts = ArContacts::orderBy('contact_id','DESC')->paginate(50);
        return view('badmin.contactus.index',compact('title','contacts'));
    }

    public function deletecontact($id)
    {
        if($id>0){
             ArContacts::where('contact_id',$id)->delete();
             return redirect()->back()->with('success','Contact Deleted Successfully');
        }else{
            return redirect()->back()->with('error','Something went wrong. Please try again!!');
        }   
       
    }
	//Bulk Action
    public function contactbulkaction(Request $request){
        
        if($request->getstatus == 1){
            foreach (array_filter(array_unique($request->contactid)) as $key => $value) {
                $update =ArContacts::where('contact_id',$value)->delete();
            }
            
        }

        if($update){
            return response()->json(['status' => true, 'message' => 'Data Updated successfully!!'],200);
        }else{
            return response()->json(['status' => false, 'message' => 'something went wrong!!'],201);
        }
    }
}