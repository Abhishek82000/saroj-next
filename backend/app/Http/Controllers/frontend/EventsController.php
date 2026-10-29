<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArPages;
use App\Models\ArEvent;

class EventsController extends Controller
{
	
    public function events($id=null){
        $title = "";
        $meta_keyword = "";
        $meta_description = "";
        $meta_title = "";
        $getpagedetails = ArPages::where('page_url','events')->first();
        $events = ArEvent::where('event_status',1)->orderBy('event_order', 'ASC')->paginate(20);
        if(isset($getpagedetails) && $getpagedetails!=''){
            $title = $getpagedetails->page_name;
            $meta_keyword = $getpagedetails->page_meta_keyword;
            $meta_description = $getpagedetails->page_meta_desc;
            $meta_title = $getpagedetails->page_meta_title;
        }
       
        return view('frontend.events.events',compact('title','getpagedetails','meta_keyword','meta_description','meta_title','events'));
    }

    public function eventDetails($eventslug){
        $title = "";
        $meta_keyword = "";
        $meta_description = "";
        $meta_title = "";
        if(empty($eventslug)){
            return redirect()->route('front.home');
        }
        $events = ArEvent::where('event_slug',$eventslug)->first();
        if($events){
            $title = $events->event_name;
            $meta_title = $events->event_meta_title;
            $meta_keyword = $events->event_meta_keyword;
            $meta_description = $events->event_meta_desc;
        }else{
            return redirect()->route('front.home');
        }
        return view('frontend.events.eventdetails',compact('title','events','meta_title','meta_keyword','meta_description'));
    }

}