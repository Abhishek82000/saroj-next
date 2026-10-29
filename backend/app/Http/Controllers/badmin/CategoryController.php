<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArCategory;
use App\Models\ArProduct;
use App\Models\ArUniqueIds;
use App\Models\ArCategoryAttribute;
use App\Models\ArProductAttribute;
use App\Models\ArCategoryCommission;
use DB;
use Hash;
use Session;


class CategoryController extends Controller
{
    public function index(){
        $resCategoryData = ArCategory::orderBy('cat_order','ASC')->paginate(150);
        $tree = $this->buildTree($resCategoryData);
        $strCategoryHtml = $this->getCatgoryChildHtml($tree);

        $resCategoryListData = ArCategory::orderBy('cat_order','ASC')->get();
        $resVariationData = ArProductAttribute::orderBy('attribute_name','ASC')->get();
        $tree = $this->buildTree($resCategoryListData);
        
        $title = 'Category';
         
        return view('badmin.category.index',compact('title','strCategoryHtml','resCategoryData'));
    }
    public function addCategory($id=null){
        
        $resCategoryListData = ArCategory::orderBy('cat_order','ASC')->get();
        $tree = $this->buildTree($resCategoryListData);
        
        $rowCategoryData = array();
         if(isset($id) && $id>0){
            $rowCategoryData = ArCategory::where('cat_id',$id)->first();
            $strEntryHtml = $this->getCatgoryEntryChildHtml($tree,'',0,$rowCategoryData->cat_parent);
        }else{
            $strEntryHtml = $this->getCatgoryEntryChildHtml($tree,'',0,0);
        }
        $title = 'Category';
         
        return view('badmin.category.add_category',compact('title','strEntryHtml','rowCategoryData'));
    }
    
    function buildTree($elements, $parentId = 0) 
    {
        $branch = array();
        foreach ($elements as $element) {
            if ($element['cat_parent'] == $parentId) {
                $children = $this->buildTree($elements, $element['cat_id']);
                if ($children) {
                    $element['children'] = $children;
                }
                $branch[] = $element;
            } 
        }
        return $branch;
    }
    
    public function getCatgoryChildHtml($tree,$strExtraHtml='',$intLevel=0)
    {
        $strHtml = $strExtraHtml;
        $i = 1;
        $counter = 1;
         if(isset($tree) && $tree!='')
        { 
            foreach($tree as $key=>$label)
            {
                $strStyle = '';
                if($label['cat_parent']==0){
                    $intLevel=0;
                }else{
                    $intLevel = self::getcategorylevel($label);
                }
                
                $strExtraData = '';
                $strExtraDiv = '';
                for($i=0;$i<$intLevel;$i++){
                    $strExtraData .='<div style="display:flex;align-items:center;font-size: 13px;"><i class=" ri-subtract-fill"></i>';
                    $strExtraDiv .='</div>';
                }
                $appurl = url('/')."/";
                $adminurl = url('/')."/badmin/";
                $src = ($label['cat_image']!="")?asset('img/uploads/category/') . '/' . $label['cat_image']:asset('img/defaultimage.jpg');
                $strHtml .='<tr class="draggable" sliderid="'.$label['cat_id'].'" sliderorder="'.$label['cat_id'].'">
                                <td style="width:50px;text-align:center"><input type="checkbox" name="select"></td>';
                $strHtml .='<td style="text-align: center;width="50px;">
                                <img src="'.$src.'" alt="" style="width:28px; height:28px; border-radius:4px;border:1px solid #eee">
                            </td>';  
                $strHtml .='<td><a href="'.$appurl.'collections/'.$label['cat_slug'].'" target="new">'.$strExtraData.$label['cat_name'].$strExtraDiv.'</a></td>'; 

                if($label['cat_tier']==1){
                    $strHtml .='<td style="text-align: center;">1st Tier</td>';
                }elseif($label['cat_tier']==1){
                    $strHtml .='<td style="text-align: center;">2nd Tier</td>';
                }else{
                    $strHtml .='<td style="text-align: center;">Ground</td>';
                }
                if($label['cat_type']==0){
                    $strHtml .='<td style="text-align: center;">No</td>';
                }else{
                    $strHtml .='<td style="text-align: center;">Yes</td>';
                }

                if($label['cat_featured']==0){
                    $strHtml .='<td style="text-align: center;"><a href="'.$adminurl.'category-featured-change/'.$label['cat_id'].'"><i class="far fa-star"></i></a></td>';
                }else{
                    $strHtml .='<td style="text-align: center;"><a href="'.$adminurl.'category-featured-change/'.$label['cat_id'].'"><i class="fas fa-star"></i></a></td>';
                }

                if($label['cat_status']==0){
                    $strHtml .='<td style="text-align: center;"><a href="'.$adminurl.'category-status-change/'.$label['cat_id'].'" onclick="return confirm(\'Are you sure?\')"><span class="badge bg-danger font-size-12">Inactive</span></a></td>';
                }else{
                    $strHtml .='<td style="text-align: center;"><a href="'.$adminurl.'category-status-change/'.$label['cat_id'].'" onclick="return confirm(\'Are you sure?\')"><span class="badge bg-success font-size-12">Active</span></a></td>';
                }
                if($label['cat_is_wholesale']==0){
                    $strHtml .='<td style="text-align: center;"><a href="'.$adminurl.'category-wh-status-change/'.$label['cat_id'].'" onclick="return confirm(\'Are you sure?\')"><span class="badge bg-danger font-size-12">Inactive</span></a></td>';
                }else{
                    $strHtml .='<td style="text-align: center;"><a href="'.$adminurl.'category-wh-status-change/'.$label['cat_id'].'" onclick="return confirm(\'Are you sure?\')"><span class="badge bg-success font-size-12">Active</span></a></td>';
                }
        
                if($label['cat_id']==-1)
                {                
                    $strHtml .='<td colspan="1" style="text-align:center"></td>';
                    
                }else{
                    $strHtml .='
                        <td style="text-align: center;">
                            <a href="'.$adminurl.'add-category/'.$label['cat_id'].'" class="btn btn-info btn-sm btnaction"  data-bs-toggle="tooltip" data-placement="top" title="" data-bs-original-title="Edit" aria-label="Edit" ><i class="fas fa-pencil-alt"></i></a>
                            <a href="'.$adminurl.'category-delete/'.$label['cat_id'].'" onclick="return confirm(\'Are you sure you want to delete?\')" class="btn btn-danger  btn-sm btnaction"  data-bs-toggle="tooltip" data-placement="top"  data-bs-original-title="Delete" aria-label="Delete"  title="Delete"><i class="fas fa-trash " ></i></a>
                        </td>
                    ';
                }  
                $strHtml .='</tr>';
                
                if(isset($label->children))
                {
                    $intLevel++;
                    $strHtml = $this->getCatgoryChildHtml($label->children,$strHtml,$intLevel);
                }
                $i++;
            } 

         }else{
            $strHtml = '<td colspan="7" style="text-align:center">No Result found</td>';
        }  
        return $strHtml;
        exit();     
    }

    function getcategorylevel($aryCategory)
    {
        if($aryCategory['cat_parent']==0)
        {
            return 0;
        }else{
            $res = ArCategory::where('cat_id','=',$aryCategory['cat_parent'])->first();
            if($res->cat_parent==0)
            {
                return 1;
            }else{
               return 2; 
            }
        }
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

    function categoryProccess(Request $request)
    {
        $aryPostData = $request->all();
        $request->validate([
                    'category_name' => 'required',
                    'cat_desc' => 'sometimes',
					'cat_meta_title' => 'required',
                ]);
        if(isset($aryPostData['cat_id']) && $aryPostData['cat_id']>0)
        {
            $postobj = ArCategory::where('cat_id',$aryPostData['cat_id'])->first();
            $uniqueid =  $postobj->cat_uniqueid;
        }else{
            $postobj = new ArCategory;
             
             $uniqueid =  self::getUniqueId(2);
        }   
        if($aryPostData['cat_order']==''){
          $max = ArCategory::max('cat_order');
          $postobj->cat_order = $max+1;
        }else{
          $postobj->cat_order = $aryPostData['cat_order'];
        }
        $postobj->cat_status = 1;
        $postobj->cat_tier = $aryPostData['cat_tier'];
        $postobj->cat_type = $aryPostData['cat_type'];
        $postobj->cat_name = $aryPostData['category_name'];
        $postobj->cat_short_desc = $aryPostData['cat_short_desc'];
        $postobj->cat_parent = $aryPostData['cat_parent'];
        $postobj->cat_desc = $aryPostData['cat_desc'];
        $postobj->cat_handi_type = $aryPostData['cat_handi_type'];
        $postobj->cat_heading = $aryPostData['cat_heading'];
		$postobj->cat_meta_title = $aryPostData['cat_meta_title'];
		$postobj->cat_meta_keyword = $aryPostData['cat_meta_keyword'];
		$postobj->cat_meta_desc = $aryPostData['cat_meta_desc'];
        $postobj->cat_uniqueid =$uniqueid;
        if(isset($aryPostData['cat_show_on_app_home']) && $aryPostData['cat_show_on_app_home']==1){
            $postobj->cat_show_on_app_home = 1;
        }else{
            $postobj->cat_show_on_app_home = 0;
        }
        $destinationPath = public_path('img/uploads/category/');
        if($request->hasFile('cat_image_'))
        {
            $image1 = $request->file('cat_image_');
            $name1 = time().rand(999,9999).'.'.$image1->getClientOriginalExtension();
            $image1->move($destinationPath, $name1);
            $postobj->cat_image = $name1;

            $localPath = $destinationPath . '/' . $name1;

            $bunny = new \App\Services\Bunny();
            $cdnUrl = $bunny->upload('category/' . $name1, file_get_contents($localPath));

            if(!$cdnUrl){
                return response()->json(['error' => 'Upload failed'], 500);
            }
            $postobj->cat_cdn_url = $cdnUrl;
        } 

        if($request->hasFile('cat_banner_image_'))
        {
            $image2 = $request->file('cat_banner_image_');
            $name2 = time().rand(999,9999).'.'.$image2->getClientOriginalExtension();
            $image2->move($destinationPath, $name2);
            $postobj->cat_banner_image = $name2;
            $localPath2 = $destinationPath . '/' . $name2;

            $bunny2 = new \App\Services\Bunny();
            $cdnUrl2 = $bunny2->upload('category/' . $name2, file_get_contents($localPath2));

            if(!$cdnUrl2){
                return response()->json(['error' => 'Upload failed'], 500);
            }
            $postobj->cat_banner_cdn = $cdnUrl2;
        }

        if($request->hasFile('cat_mobile_image_'))
        {
            $image3 = $request->file('cat_mobile_image_');
            $name3 = time().rand(999,9999).'.'.$image3->getClientOriginalExtension();
            $image3->move($destinationPath, $name3);
            $postobj->cat_mobile_image = $name3;
        } 

        if($request->hasFile('cat_mobile_banner_image_'))
        {
            $image4 = $request->file('cat_mobile_banner_image_');
            $name4 = time().rand(999,9999).'.'.$image4->getClientOriginalExtension();
            $image4->move($destinationPath, $name4);
            $postobj->cat_mobile_banner_image = $name4;
        }
        
        if($postobj->save())    
        {
            return redirect()->route('badmin.category')->with('success', 'Category added Successfully.');   
        }else{
            return redirect()->route('badmin.category')->with('error', 'Server Not Responed');
        }
    }

    public function getUniqueId($id)
    { 
        $rowUniqueId = ArUniqueIds::where('ui_id',$id)->first();
        $intCurrentCounter = $rowUniqueId->ui_current+1;
        $strCategoryId = $rowUniqueId->ui_prefix.$intCurrentCounter;
        ArUniqueIds::where('ui_id',$id)->update(['ui_current'=>$intCurrentCounter]);
        return $strCategoryId;
    }

    public function categoryStatusChange($id)
    {
        $rowCategoryData = ArCategory::where('cat_id',$id)->first();
        if($rowCategoryData->cat_status==0){
            $status = 1;
        }else{
            $status = 0;
        }
        ArCategory::where('cat_id', $id)->update(array('cat_status' => $status));
        return redirect()->route('badmin.category')->with('success', 'Status updated Successfully');
    }
    public function categoryWhStatusChange($id)
    {
        $rowCategoryData = ArCategory::where('cat_id',$id)->first();
        if($rowCategoryData->cat_is_wholesale==0){
            $status = 1;
        }else{
            $status = 0;
        }
        ArCategory::where('cat_id', $id)->update(array('cat_is_wholesale' => $status));
        return redirect()->route('badmin.category')->with('success', 'Status updated Successfully');
    }
    
    public function categoryDelete($id=null){  
    if($id>0){
        $rowCategoryData = ArProduct::whereRaw('FIND_IN_SET(?, product_category_id)', [$id])->count();
        if($rowCategoryData>0){
            return redirect()->back()->with('error', 'This category is selected in a product. It can not be deleted.');
        }else{
            ArCategory::where('cat_id',$id)->delete();
            return redirect()->back()->with('success', 'Category Deleted Successfully');
        } 
    }
}

    public function categoryFeaturedChange($id=null,$status=null)
    {
        $postobj = ArCategory::where('cat_id',$id)->first();
        if($postobj->cat_featured == 0)
        {
            $postobj->cat_featured = 1;
        } else{
            $postobj->cat_featured = 0;
        }
        if ($postobj->save())
        {
            return redirect()->route('badmin.category')->with('success', 'Featured Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }

    function updateCategoryOrder(Request $request)
    {
        foreach($request['sliderid'] as $key=>$label)
        {
            ArCategory::where('cat_id',$label)->update(['cat_order'=>$request['ordernum'][$key]]);
        } 
        echo 'ok';
        exit;
    }

    // Attributes Section

    /*************************************************Attribute***********************************************/

    public function attribute($categoryid,$id=0){
        $title = 'Category';
        $attributeIdData= array();
        if (isset($id) && $id > 0) {
            $attributeIdData = ArCategoryAttribute::where('attribute_id',$id)->first();
        }
    
        $attributeData = ArCategoryAttribute::where('attribute_category_id',$categoryid)->orderBy('attribute_id','DESC')->paginate(50);

        return view('badmin.category.attribute',compact('attributeData','attributeIdData','title','categoryid'));  
    }

    public function attributeProccess(Request $request)
    {
            $requestData = $request->all();
            
            if (isset($requestData['attribute_id']) && $requestData['attribute_id'] > 0) {
                $attributeObj = ArCategoryAttribute::where('attribute_id',$requestData['attribute_id'])->first();
            }else{
                $attributeObj = new ArCategoryAttribute;
            }
            $attributeObj->attribute_name = $requestData['attribute_name'];
            $attributeObj->attribute_category_id = $requestData['attribute_category_id'];
            $attributeObj->save(); 
            
            if (isset($requestData['attribute_id']) && $requestData['attribute_id'] > 0) {
                return redirect()->route('badmin.attribute',$request->attribute_category_id)->with('success', 'Attribute Updated Successfully');
            }else{
                return redirect()->back()->with('success', 'Attribute Added Successfully');
            }
    }


    public function attributeStatus($categoryid,$id)
    {
        $attributeObj = ArCategoryAttribute::where('attribute_id',$id)->first();
        if($attributeObj->attribute_status == 0)
        {
        $attributeObj->attribute_status = 1;
        }
        else{
            $attributeObj->attribute_status = 0;
        }
        if ($attributeObj->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }

    public function attributeDelete($categoryid,$id)
    {
        ArCategoryAttribute::where('attribute_id',$id)->delete();
        return redirect()->route('badmin.attribute',$categoryid)->with('success', 'Attribute Deleted Successfully');
    }


/*************************************************Category Commission***********************************************/

    public function commissionList($id=0){
        $commissionIdData= array();
        if (isset($id) && $id > 0) {
            $commissionIdData = ArCategoryCommission::where('cc_id',$id)->first();
        }
        
        $commissionData = ArCategoryCommission::orderBy('cc_id','DESC')->with(['category'])->paginate(50);
        $resCategoryData = ArCategory::where('cat_parent',0)->where('cat_status',1)->orderBy('cat_order','ASC')->get();
        
        $title = 'Commission List';
        return view('badmin.category.commission_list',compact('commissionData','commissionIdData','title','resCategoryData'));  
    }

    public function commissionProccess(Request $request)
    {
        $requestData = $request->all();
        
        if (isset($requestData['cc_id']) && $requestData['cc_id'] > 0) {
            $commissionObj = ArCategoryCommission::where('cc_id',$requestData['cc_id'])->first();
            $categoryExists = ArCategoryCommission::where('cc_id','!=',$requestData['cc_id'])->where('cc_category_id',$requestData['cc_category_id'])->first();
            if($categoryExists){
                return redirect()->back()->with('error', "Commission already exists for this category!!");
            }
        }else{
            $commissionObj = new ArCategoryCommission;
            $request->validate([
                'cc_commission' => 'required',
                'cc_category_id' => 'required|unique:ar_category_commission,cc_category_id',
            ]);
        }
        $commissionObj->cc_category_id = $requestData['cc_category_id'];
        $commissionObj->cc_type = $requestData['cc_type'];
        $commissionObj->cc_commission = $requestData['cc_commission'];
        $commissionObj->save(); 
        
        if (isset($requestData['cc_id']) && $requestData['cc_id'] > 0) {
            return redirect()->route('badmin.commissionList')->with('success', 'Commission Updated Successfully');
        }else{
            return redirect()->back()->with('success', 'Commission Added Successfully');
        }
    }
    public function commissionDelete($id)
    {
        ArCategoryCommission::where('cc_id',$id)->delete();
        return redirect()->route('badmin.commissionList')->with('success', 'Commission Deleted Successfully');
    }

}