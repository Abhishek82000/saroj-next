<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArPages;
use App\Models\ArUniqueIds;
use App\Models\ArContacts;
use App\Models\ArFaqs;
use DB;
use Hash;
use Session;


class PagesController extends Controller
{
    public function index($url=null){
        
        if($url == 'badmin'){
            return view('badmin.auth.index');
        } else{ 
            $getpagedetails = ArPages::where('page_url',$url)->first();
            if(isset($getpagedetails) && $getpagedetails !=''){
               $strTitle = $getpagedetails->page_name;
               $meta_keyword = $getpagedetails->page_meta_keyword;
               $meta_description = $getpagedetails->page_meta_desc;
               $meta_title = $getpagedetails->page_meta_title;
               if(isset($getpagedetails->page_header_image) && $getpagedetails->page_header_image !=''){
                $strImages = env('PAGE_IMAGE').$getpagedetails->page_header_image;
               }else{
                $strImages = env('SETTING_IMAGE').$this->settingData->logo;
               }
               return view('frontend.pages.index',compact('strTitle','strImages','getpagedetails','url','meta_keyword','meta_description','meta_title'));
            }else{
                return view('frontend.pages.not_found');
            }
        } 
    }
    public function faqs(){
        $strTitle = "";
        $meta_keyword = "";
        $meta_description = "";
        $meta_title = "";
        $getpagedetails = ArPages::where('page_url','avada-faqs')->first();
        if(isset($getpagedetails) && $getpagedetails !=''){
            $strTitle = $getpagedetails->page_name;
            $meta_keyword = $getpagedetails->page_meta_keyword;
            $meta_description = $getpagedetails->page_meta_desc;
            $meta_title = $getpagedetails->page_meta_title;
        }
        $faqs = ArFaqs::where('faq_status',1)->orderBy('faq_id','DESC')->get();
        if(isset($getpagedetails->page_header_image) && $getpagedetails->page_header_image !=''){
            $strImages = env('PAGE_IMAGE').$getpagedetails->page_header_image;
        }else{
            $strImages = env('SETTING_IMAGE').$this->settingData->logo;
        }
        return view('frontend.pages.faq',compact('strTitle','strImages','getpagedetails','meta_keyword','meta_description','meta_title','faqs'));
    }
    public function aboutus(){
        $strTitle = "";
        $meta_keyword = "";
        $meta_description = "";
        $meta_title = "";
        $getpagedetails = ArPages::where('page_url','about')->first();
        if(isset($getpagedetails) && $getpagedetails !=''){
            $strTitle = $getpagedetails->page_name;
            $meta_keyword = $getpagedetails->page_meta_keyword;
            $meta_description = $getpagedetails->page_meta_desc;
            $meta_title = $getpagedetails->page_meta_title;
        }
        if(isset($getpagedetails->page_header_image) && $getpagedetails->page_header_image !=''){
            $strImages = env('PAGE_IMAGE').$getpagedetails->page_header_image;
        }else{
            $strImages = env('SETTING_IMAGE').$this->settingData->logo;
        }
        return view('frontend.pages.about',compact('strTitle','strImages','getpagedetails','meta_keyword','meta_description','meta_title'));
    }
    public function contactus(){
        $strTitle = "";
        $meta_keyword = "";
        $meta_description = "";
        $meta_title = "";
        $getpagedetails = ArPages::where('page_url','contact')->first();
        if(isset($getpagedetails) && $getpagedetails !=''){
            $strTitle = $getpagedetails->page_name;
            $meta_keyword = $getpagedetails->page_meta_keyword;
            $meta_description = $getpagedetails->page_meta_desc;
            $meta_title = $getpagedetails->page_meta_title;
        }
        if(isset($getpagedetails->page_header_image) && $getpagedetails->page_header_image !=''){
            $strImages = env('PAGE_IMAGE').$getpagedetails->page_header_image;
        }else{
            $strImages = env('SETTING_IMAGE').$this->settingData->logo;
        }
        return view('frontend.pages.contactus',compact('strTitle','strImages','getpagedetails','meta_keyword','meta_description','meta_title'));
    }
    public function processcontact(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'mobile' => 'required',
            'email' => 'required',
        ]);

        if($request->isMethod('post'))
        {
            $resuserData = new ArContacts;
            $resuserData->contact_name = $request->name;
            $resuserData->contact_mobile = $request->mobile;
            $resuserData->contact_email = $request->email;
            $resuserData->contact_message = $request->message;
            if($resuserData->save())
            {
                // $adminemail = 'no-reply@toybee.in';
                //     $details = [
                //         'subject' => 'Enquiry Recieved!!',
                //         'name' => $request->name,
                //         'email' => $request->email,
                //         'mobile' => $request->mobile,
                //         'message' => $request->message,
                        
                //         'template' =>'frontend.emails.contactus',
                //     ];
                //     \Mail::to($adminemail)->send(new sendingEmail($details));
                //     $userdetails = [
                //         'subject' => 'Thanks for your enquiry. We will get back to you soon!',
                //         'name' => $request['name'],                        
                //         'template' =>'frontend.emails.thanksmsg',
                //     ];
                //     \Mail::to($request['email'])->send(new sendingEmail($userdetails));
                return redirect()->route('front.pages.contactus')->with('success', 'Thanks! Your message has been sent. We will get back to you soon!');
            }
        }
    }
}