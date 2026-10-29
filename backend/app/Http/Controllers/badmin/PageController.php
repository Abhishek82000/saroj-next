<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use DB;
use Hash;
use Session;
use App\Models\ArPages;
use Illuminate\Support\Str;

class PageController extends Controller
{
    public function pages(Request $request, $id=1){
		$getdata = [];
        $title='Pages';
		$countall = ArPages::count(); 
        $countactive = ArPages::where('page_status',1)->count();
        $countinactive = ArPages::where('page_status',0)->count();  
        $getdata = ArPages::orderBy('page_id','DESC');
        if($id == 1)
        {
        $type = 'all';    
        $getdata = $getdata;   
        }
        else if($id == 2)
        {
        $type = 'active';
        $getdata = $getdata->where('page_status',1);  
  
        }
        else if($id == 3)
        {
        $type = 'inactive';    
        $getdata = $getdata->where('page_status',0);  
        }
        else
        {
        $type = 'active';
        $getdata = $getdata->where('page_status',1);
        }
		
	
		if($request->isMethod('post')) {
            if(empty($request['search_filter']))
            {
                return redirect()->back()->with('error', 'Please enter something to search');
            }
            else{
                Session::put('PAGE_FILTER', $request->all());
				Session::save();
            }
        } 
		$aryFilterSession = array();
        if(Session::has('PAGE_FILTER')){
            $aryFilterSession = Session::get('PAGE_FILTER');
              if(isset($aryFilterSession) && isset($aryFilterSession['search_filter']) && $aryFilterSession['search_filter']!='')
            {
            $getdata = $getdata->where('page_name', 'LIKE', '%' . $aryFilterSession['search_filter'] . '%' );
            }
        }
        $getdata = $getdata->paginate(50);
        return view('badmin.pages.all_pages',compact('title','getdata','type','countinactive','countactive','countall','aryFilterSession'));
    }

       public function resetfilter(Request $request){
        Session::forget('PAGE_FILTER');
        return redirect()->back();
    }

	public function pagesbulkaction(Request $request){
        if($request->getstatus == 1){
            foreach(array_filter(array_unique($request->pageid)) as $key => $value) {
               $update =ArPages::where('page_id',$value)->update(['page_status'=>1]);
            }
            
        }

        if($request->getstatus == 2){
             foreach (array_filter(array_unique($request->pageid)) as $key => $value) {
                $update =ArPages::where('page_id',$value)->update(['page_status'=>0]);
            }
           
        }

        if($request->getstatus == 3){
            foreach (array_filter(array_unique($request->pageid)) as $key => $value) {
                $update =ArPages::where('page_id',$value)->delete();
            }
            
        }

        if($update){
            return response()->json(['status' => true, 'message' => 'Data Updated successfully!!'],200);
        }else{
            return response()->json(['status' => false, 'message' => 'something went wrong!!'],201);
        }
    }
    
    public function addpage($id=null)
    {
        $pageIdData=array();
        if(isset($id) && $id > 0) {
           $pageIdData = ArPages::where('page_id',$id)->first();
        }
        $title='Add Pages';
        return view('badmin.pages.addpage',compact('title','pageIdData'));
    }

    public function pageprocess(Request $request){
         $requestData=$request->all();
         if (isset($requestData['page_id']) && $requestData['page_id'] > 0) {
            $pageObj=ArPages::where('page_id',$requestData['page_id'])->first();
         }else{
            $request->validate([
                'page_name' => 'required',
                'page_url' => 'required',
                'page_content' => 'sometimes',
                'meta_title' => 'required',
                'meta_desc' => 'sometimes',
                'meta_keyword' => 'sometimes'
           ]);
            $pageObj = new ArPages;
        }
        
        $pageObj->page_name = $request->page_name;
        $pageObj->page_url =  $request->page_url;
        $pageObj->page_content = $request->page_content;
        $pageObj->page_meta_title = $request->meta_title;
        $pageObj->page_meta_desc = $request->meta_desc;
        $pageObj->page_meta_keyword = $request->meta_keyword;
         if($request->hasFile('page_header_image'))
        {
            $image = $request->file('page_header_image');
            $header_name = time().'.'.$image->getClientOriginalExtension();
            $destinationPath = public_path("/img/uploads/"."pages");
            $image->move($destinationPath, $header_name);
            $pageObj->page_header_image = $header_name;
        }
        $pageObj->save();

        if (isset($requestData['page_id']) && $requestData['page_id'] > 0) {
            return redirect()->back()->with('success', 'Page Updated Successfully');
        }else{
            return redirect()->route('badmin.pages')->with('success', 'Page Added Successfully');
        }
    }

    public function checkslug(Request $request)
    {
        $slug = Str::slug($request->title);
        $title = $request->title;
        return response()->json(['slug' => $slug, 'title' => $title]);
    }
	
	public function pagestatus($id=null)
    {
        $pageObj = ArPages::where('page_id',$id)->first();
        if($pageObj->page_status == 0)
        {
        $pageObj->page_status = 1;
        }
        else{
            $pageObj->page_status = 0;
        }
        if ($pageObj->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }

    public function pagedelete($id)
    {
        $deletedata =  ArPages::where('page_id',$id)->delete();
        if($deletedata){
            return redirect()->back()->with('success', 'Page Deleted Successfully');
        }else{
            return redirect()->back()->with('error', 'Something went wrong. Please try again!!');
        }
    } 
}