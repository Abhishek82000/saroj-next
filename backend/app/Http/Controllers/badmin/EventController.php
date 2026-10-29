<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArEvent;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function eventList(){
        $title='Event List';
        $getdata = ArEvent::orderby('event_order','ASC')->paginate(50);
        return view('badmin.events.event_list',compact('title','getdata'));
    }

    public function eventAdd($id=0){
        $title='Event Add';
        $categoryIdData= array();
        if (isset($id) && $id > 0) {
            $categoryIdData = ArEvent::where('event_id',$id)->first();
        }
        
        return view('badmin.events.event_add',compact('title','categoryIdData'));
    }
    
     public function eventProcess(Request $request)
    {
        $requestData=$request->all();   
        $request->validate([
            'event_name' => 'required',
            'meta_title' => 'required',
            'event_start_date' => 'required',
        ]); 
        if (isset($requestData['event_id']) && $requestData['event_id'] > 0) {
            $gsObj=ArEvent::where('event_id',$requestData['event_id'])->first();
        }else{
            $gsObj = new ArEvent;
        }

        $gsObj->event_name = $requestData['event_name'];
        $gsObj->event_start_date = $requestData['event_start_date'];
        $gsObj->event_desc = $requestData['event_desc'];
        $gsObj->event_meta_title = $requestData['meta_title'];
        $gsObj->event_meta_keyword = $requestData['meta_keyword'];
        $gsObj->event_meta_desc = $requestData['meta_desc'];
        if($request->hasFile('event_image_')){
            $image = $request->file('event_image_');
            $name = time().'.'.$image->getClientOriginalExtension();
            $destinationPath = public_path(env('EVENT_IMAGE'));
            $image->move($destinationPath, $name);
            $gsObj->event_image=$name;
        }
        if($gsObj->save())
        {
            if (isset($requestData['event_id']) && $requestData['event_id'] > 0) {
                return redirect()->route('badmin.eventList')->with('success', 'Event Updated Successfully');
            }else{
                return redirect()->route('badmin.eventList')->with('success', 'Event Added Successfully');
            }
        }else{
            return redirect()->back()->with('error', 'Invalid Method');
        }
    }
    
    public function eventSlug(Request $request)
    {
        $slug = Str::slug($request->title);
        $title = $request->title;
        return response()->json(['slug' => $slug, 'title' => $title]);
    }

    public function eventStatus($id=null,$status=null)
    {
        $eventObj = ArEvent::where('event_id',$id)->first();
        if($eventObj->event_status == 0)
        {
            $eventObj->event_status = 1;
        }
        else{
            $eventObj->event_status = 0;
        }
        if ($eventObj->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }

    public function eventFeatured($id=null)
    {
        $eventObj = ArEvent::where('event_id',$id)->first();
        if($eventObj->event_featured == 0)
        {
            $eventObj->event_featured = 1;
        } else{
            $eventObj->event_featured = 0;
        }
        if ($eventObj->save())
        {
            return redirect()->back()->with('success', 'Featured Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }

    public function eventDelete($id)
    {
        ArEvent::where('event_id',$id)->delete();
        return redirect()->back()->with('success', 'Event Deleted Successfully');
    }

    function eventListOrder(Request $request)
    {
        foreach($request['sliderid'] as $key=>$label)
        {
            ArEvent::where('event_id',$label)->update(['event_order'=>$request['ordernum'][$key]]);
        } 
        echo 'ok';
        exit;
    }
    
}