<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use DB;
use Hash;
use Session;
use App\Models\ArThemeAdmin;
use App\Models\ArAppearanceSlider;
use App\Models\ArAppearanceHeader;
use App\Models\ArAppearanceMenu;
use App\Models\ArPages;
use App\Models\ArCategory;
use App\Models\ArProductTags;
use App\Models\ArFooter;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\File; 

class AppearenceController extends Controller
{
    public function slider($id=null)
    {
        $title = 'Slider';
        $sliderData = ArAppearanceSlider::orderBy('slider_id','DESC')->paginate(50);
		$sliderPosition = array('1'=>'Top (Web)','2'=>'Bottom of Category Products(Web)','3'=>'Bottom (Web)','4'=>'Top Slider (App)','5'=>'Middle Banner (App)','6'=>'Bottom Banner (App)','7'=>'Login Popup(Web)','8'=>'Bottom of Featured Products (Web)','9'=>'Bottom of Tags (Web)','10'=>'Top of Featured Blogs (Web)');
		$sliderGrid = array('12'=>'Grid 1','6'=>'Grid 2','4'=>'Grid 3','3'=>'Grid 4');
        return view('badmin.appearence.slider',compact('title','sliderData','sliderPosition','sliderGrid'));
    }
    
    public function addslider($id=null)
    {
        $title = 'Add Slider';
        $sliderIdData =[];
        if (isset($id) && $id > 0) {
            $sliderIdData = ArAppearanceSlider::where('slider_id',$id)->first();
        }
        $resCategoryData = ArCategory::where('cat_status',1)->orderBy('cat_order','ASC')->get();
        $resTagsData = ArProductTags::where('tag_status',1)->orderBy('tag_name','ASC')->get();
        return view('badmin.appearence.addslider',compact('title','sliderIdData','resCategoryData','resTagsData'));
    }
    
    public function sliderprocess(Request $request)
    {
        if ($request->isMethod('post')) 
        {
        $requestData = $request->all();
        if(isset($request->slider_id) && $request->slider_id > 0){
            $addslider = ArAppearanceSlider::where('slider_id',$request->slider_id)->first();
        }else{
            
            $addslider = new ArAppearanceSlider;
            $addslider->slider_status = 1;
        } 
        $addslider->slider_name = $requestData['slider_name'];
		$addslider->slider_desc = $requestData['slider_desc'];
        $addslider->slider_position = $requestData['slider_position'];
        $addslider->slider_url = $requestData['slider_url'];
        $addslider->slider_type = $requestData['slider_type'];
        $addslider->slider_category = $requestData['slider_category'];
        $addslider->slider_tags = $requestData['slider_tags'];
        $addslider->slider_is_wholesale = $requestData['slider_is_wholesale'];
		$addslider->slider_view = $requestData['slider_view'];
        $addslider->slider_grid_type = $requestData['slider_grid_type'];
        
        if($request->hasFile('slider_image_'))
        {
            $image = $request->file('slider_image_');
            $name = rand(0000,9999).time().'.'.$image->getClientOriginalExtension();
            $destinationPath = public_path("/img/uploads/"."appearance");
            $image->move($destinationPath, $name);
            $addslider->slider_image=$name;
            // Upload to CDN
            $localPath = $destinationPath . '/' . $name;

            $bunny = new \App\Services\Bunny();
            $cdnUrl = $bunny->upload('appearance/' . $name, file_get_contents($localPath));

            if(!$cdnUrl){
                return response()->json(['error' => 'Upload failed'], 500);
            }
            $addslider->slider_web_cdn = $cdnUrl;
        }
        if($request->hasFile('slider_image_mac_'))
        {
            $image = $request->file('slider_image_mac_');
            $name = rand(0000,9999).time().'.'.$image->getClientOriginalExtension();
            $destinationPath = public_path("/img/uploads/"."appearance");
            $image->move($destinationPath, $name);
            $addslider->slider_image_mac=$name;
        }
        if($request->hasFile('slider_image_mobile_'))
        {
            $image = $request->file('slider_image_mobile_');
            $name = rand(0000,9999).time().'.'.$image->getClientOriginalExtension();
            $destinationPath = public_path("/img/uploads/"."appearance");
            $image->move($destinationPath, $name);
            $addslider->slider_image_mobile=$name;
            // Upload to CDN
            $localPath = $destinationPath . '/' . $name;

            $bunny = new \App\Services\Bunny();
            $cdnUrl = $bunny->upload('appearance/' . $name, file_get_contents($localPath));

            if(!$cdnUrl){
                return response()->json(['error' => 'Upload failed'], 500);
            }
            $addslider->slider_mob_cdn = $cdnUrl;
        }

        if($request->hasFile('slider_video_'))
        {
            $image = $request->file('slider_video_');
            $name = rand(0000,9999).time().'.'.$image->getClientOriginalExtension();
            $destinationPath = public_path("/img/uploads/"."appearance");
            $image->move($destinationPath, $name);
            $addslider->slider_video = $name;
        }
            
            
        if($addslider->save()){
        if(isset($request->slider_id) && $request->slider_id > 0){
            return redirect()->route('badmin.slider')->with('success', 'Slider Updated Successfully');
        }else{
            return redirect()->route('badmin.slider')->with('success', 'Slider Added Successfully');
        }
        }
        }else{
            return redirect()->route('badmin.slider')->with('error', 'Invalid Method');
        }
    }
   
    public function sliderstatus($id)
    {
        $sliderData=ArAppearanceSlider::where('slider_id',$id)->first();
        if (isset($sliderData->slider_status) & $sliderData->slider_status==1) {
            $status=0;
        }else{
            $status=1;
        }
        ArAppearanceSlider::where('slider_id',$id)->update(array('slider_status' => $status));
        return redirect()->back()->with('success', 'Status Updated Successfully');
    }

    public function deleteslider($id=null)
    {
        ArAppearanceSlider::where('slider_id',$id)->delete();
        return redirect()->back()->with('success', 'Slider Deleted Successfully');
    }

    public function deleteslidervideo($id=0){
        $sliderData = ArAppearanceSlider::where('slider_id',$id)->first();
        if(isset($sliderData)){
            $destinationPath = public_path("/img/uploads/"."appearance/".$sliderData->slider_video);
            if(File::delete($destinationPath)){
                ArAppearanceSlider::where('slider_id',$id)->update(['slider_video' => '']);
                return redirect()->back()->with('success', 'Video Removed Successfully');
            }else{
                return redirect()->back()->with('success', 'Video did not remove. Please try after sometime.');
            }
        }
    }

  /***********************************************Header Section**************************************************/
    public function header($id=0){
        $title='Header';
        $headerIdData= array();
        if (isset($id) && $id > 0) {
            $headerIdData = ArAppearanceHeader::where('header_id',$id)->first();
        }
        $headerData = ArAppearanceHeader::paginate(50);
        return view('badmin.appearence.header',compact('title','headerIdData','headerData'));
    }
    
    public function headerprocess(Request $request){
        
        if ($request->isMethod('post')) 
        {
            $requestData = $request->all();
            
            if (isset($requestData['header_id']) && $requestData['header_id'] > 0) {
                $headerObj = ArAppearanceHeader::where('header_id',$requestData['header_id'])->first();
                $getslug = $headerObj->header_slug;
            }else{
                $request->validate([
                    'header_name' => 'required'
                ]);
                $headerObj = new ArAppearanceHeader;
                $gettitleslug = ArAppearanceHeader::where('header_slug',[Str::slug($requestData['header_name'], '-')])->get();
                
            }
            $headerObj->header_name = $requestData['header_name'];
            $headerObj->header_link = $requestData['header_link'];
            
            if($headerObj->save()){
                
            if (isset($requestData['header_id']) && $requestData['header_id'] > 0) {
            return redirect()->route('badmin.header')->with('success', 'Header Updated Successfully');
            }else{
            return redirect()->back()->with('success', 'Header Added Successfully');
            }
            }
            }else{
            return redirect()->back()->with('error', 'Invalid Method');
             }
    }

    public function headerstatus($id=null)
    {
        $headerObj = ArAppearanceHeader::where('header_id',$id)->first();
        if($headerObj->header_status == 0)
        {
        $headerObj->header_status = 1;
        }
        else{
            $headerObj->header_status = 0;
        }
        if ($headerObj->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');

        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }

    public function deleteheader($id=null){
        if($id>0){
            $deleteheader = ArAppearanceHeader::where('header_id',$id)->count();
            if($deleteheader){
                ArAppearanceHeader::where('header_id',$id)->delete();
                return redirect()->back()->with('success', 'Header Deleted Successfully');
            }else{
                return redirect()->back()->with('error', 'Something went wrong. Please try again!');
            }
        }
    }
    
    
    
    /***********************************************Footer Section************************************************/
    public function footer(){
        $title = 'Footer';
        $footerIdData = ArFooter::where('footer_id',1)->first();
        return view('badmin.appearence.footer',compact('title','footerIdData'));
    }
     
    public function footerProcess(Request $request){
        $requestData=$request->all();
        $getfooter=ArFooter::count();
        if($getfooter > 0){
            $footerObj=ArFooter::where('footer_id',$request->footer_id)->update(['footer_desc1'=>$request->footer1,'footer_desc2'=>$request->footer2,'footer_desc3'=>$request->footer3,'footer_desc4'=>$request->footer4]);
            return redirect()->back()->with('success', 'Footer Updated Successfully');
        }else{
                $footerObj = new ArFooter;
                $footerObj->footer_desc1 = $requestData['footer1'];
                $footerObj->footer_desc2 = $requestData['footer2'];
                $footerObj->footer_desc3 =$requestData['footer3'];
                $footerObj->footer_desc4 = $requestData['footer4'];
                $footerObj->save();
                return redirect()->back()->with('success', 'Footer Added Successfully');
        }
     
     }
    
    public function offer(){
        $title='Offer';
        return view('badmin.appearence.offer',compact('title'));
    }

    /***********************************************Menu Section**************************************************/

    public function menu($id=0)
    {
        
        $menuIdData= array();
        $menu_categoryid = 0;
        $menu_id = 0;
        if (isset($id) && $id > 0) {
            $menuIdData = ArAppearanceMenu::where('menu_id',$id)->with('pages')->first();
            $menu_categoryid = $menuIdData->menu_categoryid;
            $menu_id = $menuIdData->menu_parent;
        } 
        
        $menuData = ArAppearanceMenu::with(['children' => function($query)  {
            $query->with(['subchildren' => function($subquery)  {
                $subquery->orderBy('menu_order','ASC');
               }
            ])->orderBy('menu_order','ASC');
           }
        ])
        ->where('menu_parent',0)->orderBy('menu_order','ASC')->paginate(50);
        
        $resCategoryListData = ArCategory::where('cat_status',1)->orderBy('cat_order','ASC')->get();
        $catTree = $this->buildCatTree($resCategoryListData);
        $strCatEntryHtml = $this->getCatgoryEntryChildHtml($catTree,'',0,$menu_categoryid);

        $resMenuListData = ArAppearanceMenu::orderBy('menu_order','ASC')->get();
        $menuTree = $this->buildMenuTree($resMenuListData);
        $strMenuEntryHtml = $this->getMenuEntryChildHtml($menuTree,'',0,$menu_id);

        $getpages = ArPages::where('page_status',1)->get();
        $title = 'Menu';
        return view('badmin.appearence.menu',compact('title','menuData','strCatEntryHtml','menuIdData','strMenuEntryHtml','getpages'));
    }
 
    function buildCatTree($elements, $parentId = 0) 
    {
        $branch = array();
        foreach ($elements as $element) {
            if ($element['cat_parent'] == $parentId) {
                $children = $this->buildCatTree($elements, $element['cat_id']);
                if ($children) {
                    $element['children'] = $children;
                }
                $branch[] = $element;
            } 
        }
        return $branch;
    }

    function getCatgoryEntryChildHtml($tree,$strExtraHtml='',$intLevel=0,$intSelectParent='')
    {
        $strHtml = $strExtraHtml;
        $intExtraLevel = $intLevel;

        foreach($tree as $key=>$label)
        {
            $strStyle='';
            if($label['cat_parent']!=0)
            {
                $strStyle=' style="background:#eaeaea"';
            }
            if($label['cat_parent']==0)
            {
                $intLevel=0;
            }
            $strExtraData = '';
            for($i=0;$i<$intLevel;$i++)
            {
                $strExtraData .='-';
            }
            $strselect ='';
            if($label['cat_id']==$intSelectParent)
            {
                $strselect ='selected="selected"';
            }
            $strHtml .='<option '.$strselect.' value="'.$label['cat_id'].'">'.$strExtraData.$label['cat_name'].'</option>';
            if(isset($label->children) && $intLevel!=2)
            {
                $intLevel++;
                $strHtml =$this->getCatgoryEntryChildHtml($label->children,$strHtml,$intLevel,$intSelectParent);
                $intLevel = $intExtraLevel;
            }
        }
        return $strHtml;
        exit();
    }

    function buildMenuTree($elements, $parentId = 0) 
    {
        $branch = array();
        foreach ($elements as $element) {
            if ($element['menu_parent'] == $parentId) {
                $children = $this->buildCatTree($elements, $element['menu_id']);
                if ($children) {
                    $element['children'] = $children;
                }
                $branch[] = $element;
            } 
        }
        return $branch;
    }

    function getMenuEntryChildHtml($tree,$strExtraHtml='',$intLevel=0,$intSelectParent='')
    {
        $strHtml = $strExtraHtml;
        $intExtraLevel = $intLevel;

        foreach($tree as $key=>$label)
        {
            $strStyle='';
            if($label['menu_parent']!=0)
            {
                $strStyle=' style="background:#eaeaea"';
            }
            if($label['menu_parent']==0)
            {
                $intLevel=0;
            }
            $strExtraData = '';
            for($i=0;$i<$intLevel;$i++)
            {
                $strExtraData .='-';
            }
            $strselect ='';
            if($label['menu_id']==$intSelectParent)
            {
                $strselect ='selected="selected"';
            }
            $strHtml .='<option '.$strselect.' value="'.$label['menu_id'].'">'.$strExtraData.$label['menu_name'].'</option>';
            if(isset($label->children) && $intLevel!=2)
            {
                $intLevel++;
                $strHtml =$this->getMenuEntryChildHtml($label->children,$strHtml,$intLevel,$intSelectParent);
                $intLevel = $intExtraLevel;
            }
        }
        return $strHtml;
        exit();
    }
    
    public function menuprocess(Request $request)
    {
        if ($request->isMethod('post')) 
        {
            $requestData = $request->all();
            
            if (isset($requestData['menu_id']) && $requestData['menu_id'] > 0) {
                $menuObj = ArAppearanceMenu::where('menu_id',$requestData['menu_id'])->first();
                $getslug = $menuObj->menu_slug;
            }else{
                $menuObj = new ArAppearanceMenu;
            }
            $request->validate([
                'menu_name' => 'required',
            ]);

            // if(isset($requestData['menu_categoryid']) && $requestData['menu_categoryid']>0 && isset($requestData['menu_pageid']) && $requestData['menu_pageid']>0){
            //     $categoryName = ArCategory::where('cat_id',$requestData['menu_categoryid'])->pluck('cat_name')->first();
            //     $requestData['menu_name'] = $categoryName;
            // }else if(isset($requestData['menu_categoryid']) && $requestData['menu_categoryid']>0){
            //     $categoryName = ArCategory::where('cat_id',$requestData['menu_categoryid'])->pluck('cat_name')->first();
            //     $requestData['menu_name'] = $categoryName;
            // }else if(isset($requestData['menu_pageid']) && $requestData['menu_pageid']>0){
            //     $pageName = ArPages::where('page_id',$requestData['menu_pageid'])->pluck('page_name')->first();
            //     $requestData['menu_name'] = $pageName;
            // }else{
            //     $request->validate([
            //         'menu_name' => 'required',
            //     ]);
            // }
            
            $categoryId = $requestData['menu_categoryid'];
            $pageId = $requestData['menu_pageid'];
            if(isset($requestData['show_home']) && $requestData['show_home'] =='on'){
                if(isset($requestData['menu_parent']) && $requestData['menu_parent'] ==0){
                    $menuObj->menu_mega = 1;
                }else{
                    return redirect()->back()->with('error', 'You cannot add the mega menu for child menu');
                }
            } else{
                $menuObj->menu_mega = 0;
            }  

            // if(!empty($request->file('menu_image_')) && empty($requestData['menu_pageid'])){
            //     return redirect()->back()->with('error', 'Select the Page to Proceed');
            // }
             
            $menuObj->menu_name = $requestData['menu_name'];
            $menuObj->menu_customlink = $requestData['menu_customlink'];
            $menuObj->menu_categoryid = $requestData['menu_categoryid'];
            $menuObj->menu_parent = $requestData['menu_parent'];
            $menuObj->menu_pageid = $requestData['menu_pageid'];
            if($request->hasFile('menu_image_'))
            {
                $image1 = $request->file('menu_image_');
                $name1 = time().rand(999,9999).'.'.$image1->getClientOriginalExtension();
                $destinationPath =  public_path("/img/uploads/"."appearance");
                $image1->move($destinationPath, $name1);
                $url = env('APPEARANCE_IMAGE').$name1;
                $menuObj->menu_image = $url;
            } 
            if($menuObj->save()){
                if (isset($requestData['menu_id']) && $requestData['menu_id'] > 0) {
                    return redirect()->route('badmin.menu')->with('success', 'Menu Updated Successfully');
                }else{
                    return redirect()->back()->with('success', 'Menu Added Successfully');
                }
            }
        }else{
            return redirect()->back()->with('error', 'Invalid Method');
        }
    }
    
    public function deletemenu($id){
        if($id>0){
            $childExistCount = ArAppearanceMenu::where('menu_parent',$id)->count();
            if($childExistCount>0){
                return redirect()->route('badmin.menu')->with('error', 'Menu can not be deleted. Please delete child menu');
            }else{
                ArAppearanceMenu::where('menu_id',$id)->delete();
                return redirect()->route('badmin.menu')->with('success', 'Menu Deleted Successfully');
            }
        }
    }
    
    public function menustatus($id){
         $menuData=ArAppearanceMenu::where('menu_id',$id)->first();

        if (isset($menuData->menu_status) & $menuData->menu_status==1) {
            $status=0;
        }else{
            $status=1;
        }
        ArAppearanceMenu::where('menu_id',$id)->update(array('menu_status' => $status));
        return redirect()->back()->with('success', 'Status Updated Successfully');
    }
    
    function updatemenuOrderAjax(Request $request)
    {
        foreach($request['sliderid'] as $key=>$label)
        {
            ArAppearanceMenu::where('menu_id',$label)->update(['menu_order'=>$request['ordernum'][$key]]);
        } 
        echo 'ok';
        exit;
    }
	
	   /***********************************************Editor Section******************************************************/
	
 	  public function editor(){
		$title="Editor";
        $getData = ArThemeAdmin::where('id',1)->first(); 
        return view('badmin.appearence.editor',compact('getData','title'));
    }
	
	public function editorProcess(Request $request){
		//dd($request->all());
        $getData = ArThemeAdmin::where('id',1)->update(['admin_header_script'=>$request->admin_header_script,
														'admin_footer_script'=>$request->admin_footer_script]); 
         return redirect()->back()->with('success', 'Data Updated Successfully');
    }
}