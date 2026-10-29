<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArCategory;
use App\Models\ArProductTags;
use App\Models\ArProductBrand;
use App\Models\ArProductLabel;
use App\Models\ArUniqueIds;
use App\Models\ArProduct;
use App\Models\ArProductGallery;
use App\Models\ArProductAttribute;
use App\Models\ArProductAttributeterms;
use App\Models\ArProductAttributeDetail;
use App\Models\ArProductTemplate;
use App\Models\ArProductVariation;
use App\Models\ArProductAddons;
use App\Models\ArAddonsCategory;
use App\Models\ArProductReview;
use App\Models\ArProductTabs;
use App\Models\ArTaxRates;
use App\Models\ArUserFavProduct;
use App\Models\ArProductByCategory;
use App\Models\ArProductByTag;
use App\Models\ArCart;

use DB;
use Hash;
use Session;
use Illuminate\Support\Str;
use App\Models\ArThemeAdmin;
use Illuminate\Support\Facades\File;
use App\Exports\FbProductExport;
use Maatwebsite\Excel\Facades\Excel;

class ProductController extends Controller
{

    public function allproduct(Request $request, $id = 1)
    {
        $getproducts = ArProduct::orderBy('product_id', 'DESC')->get();
        // $catIds = ArCategory::where('cat_type',1)->pluck('cat_id')->toArray();
        // $catProdIds = ArProductByCategory::whereIn('cpc_category_id',$catIds)->pluck('cpc_product_id')->toArray();
        // $products = ArProduct::whereIn('product_id',$catProdIds)->orderBy('product_id', 'DESC')->get();
        // foreach ($products as $product) {
        //     $product->product_is_handicraft = 1;
        //     $product->save();
        // }
        // return "done";
        // foreach ($getproducts as $product) {

        //     $baseSlug = Str::slug($product->product_name, '-');
        //     $slug = $baseSlug;
        //     $count = 1;

        //     // Check for duplicate slug (excluding current product)
        //     while (
        //         ArProduct::where('product_slug', $slug)
        //             ->where('product_id', '!=', $product->product_id)
        //             ->exists()
        //     ) {
        //         $slug = $baseSlug . '-' . $count;
        //         $count++;
        //     }

        //     $product->product_slug = $slug;
        //     $product->save();
        // }
        // $getproducts = ArProduct::orderBy('product_id', 'DESC')->get();

            // foreach ($getproducts as $product) {
            //     if (!empty($product->product_category_id)) {
            //         $catIdArr = array_filter(explode(',', $product->product_category_id));

            //         $product->product_discount = $product->product_price - $product->product_selling_price;
            //         $product->product_stock = $product->product_moq ?? 0;
            //         $product->product_uniqueid = self::getUniqueId(1);
            //         $product->product_sku = 'STFAB-'.$product->product_id;
            //         $product->save();
            //         foreach ($catIdArr as $catid) {
            //             $checkexist = ArProductByCategory::where('cpc_product_id', $product->product_id)
            //                 ->where('cpc_category_id', $catid)
            //                 ->first();

            //             if (!$checkexist) {
            //                 $catData = new ArProductByCategory;
            //                 $catData->cpc_category_id = $catid;
            //                 $catData->cpc_product_id = $product->product_id;
            //                 $catData->save();
            //             }
            //         }
            //     }
            // }
            // return "done";
        $type = 'all';

        // Base query based on $id
        if ($id == 1) {
            $type = 'all';
            $getproducts = ArProduct::orderBy('product_id', 'DESC');
        } elseif ($id == 3) {
            $type = 'inactive';
            $getproducts = ArProduct::where('product_status', 0)->where('product_stock', '>', 0)->orderBy('product_id', 'DESC');
        } elseif ($id == 4) {
            $type = 'outofstock';
            $getproducts = ArProduct::where('product_stock', 0)->orderBy('product_id', 'DESC');
        } elseif ($id == 5) {
            $type = 'whactive';
            $getproducts = ArProduct::where('product_wholesale', 1)->where('product_stock', '>', 0)->orderBy('product_id', 'DESC');
        } elseif ($id == 6) {
            $type = 'whinactive';
            $getproducts = ArProduct::where('product_wholesale', 0)->where('product_stock', '>', 0)->orderBy('product_id', 'DESC');
        } else {
            $type = 'active';
            $getproducts = ArProduct::where('product_status', 1)
                ->where('product_stock', '>', 0)
                ->orderBy('product_id', 'DESC');
        }

        // Handle POST filter save
        if ($request->isMethod('post')) {
            Session::put('PRODUCT_FILTER', $request->all());
            Session::save();
        }

        $aryFilterSession = Session::get('PRODUCT_FILTER', []);

        // Apply filters if available
        if (!empty($aryFilterSession)) {
            if (!empty($aryFilterSession['search_filter'])) {
                $search = $aryFilterSession['search_filter'];
                $getproducts->where(function ($query) use ($search) {
                    $query->where('product_uniqueid', 'LIKE', "%{$search}%")
                        ->orWhere('product_category_name', 'LIKE', "%{$search}%")
                        ->orWhere('product_name', 'LIKE', "%{$search}%")
                        ->orWhere('product_tag_name', 'LIKE', "%{$search}%")
                        ->orWhere('product_sku', 'LIKE', "%{$search}%");
                });
            }

            if (!empty($aryFilterSession['category_filter'])) {
                $categoryFilter = $aryFilterSession['category_filter'];
                $productIds = ArProductByCategory::where('cpc_category_id', $categoryFilter)->pluck('cpc_product_id');
                $getproducts->whereIn('product_id', $productIds);
            }

            if (!empty($aryFilterSession['tag_filter'])) {
                $tagFilter = $aryFilterSession['tag_filter'];
                $productIds = ArProductByTag::where('pt_tag_id', $tagFilter)->pluck('pt_product_id');
                $getproducts->whereIn('product_id', $productIds);
            }

            if (isset($aryFilterSession['fea_rec']) && $aryFilterSession['fea_rec'] !== '') {
                $fea = (string) $aryFilterSession['fea_rec'];
                switch ($fea) {
                    case '1': // Featured
                        $getproducts->where('product_featured', 1);
                        break;
                    case '2': // Unfeatured
                        $getproducts->where('product_featured', 0);
                        break;
                    case '3': // Recommended
                        $getproducts->where('product_recommended', 1);
                        break;
                    case '4': // Unrecommended
                        $getproducts->where('product_recommended', 0);
                        break;
                }
            }
        }

        // Pagination
        $getproducts = $getproducts->paginate(100);

        // Counts
        $countall = ArProduct::count();
        $countactive = ArProduct::where('product_status', 1)->where('product_stock', '>', 0)->count();
        $countinactive = ArProduct::where('product_status', 0)->where('product_stock', '>', 0)->count();
        $countwhactive = ArProduct::where('product_wholesale', 1)->count();
        $countwhinactive = ArProduct::where('product_wholesale', 0)->count();
        $countoutofstock = ArProduct::where('product_stock', 0)->count();

        // Dropdowns
        $categoryDropdown = ArCategory::where('cat_status', 1)->orderBy('cat_order', 'ASC')->get();
        $tagDropdown = ArProductTags::where('tag_status', 1)->get();

        $title = 'Product';

        return view('badmin.product.allproduct', compact(
            'title',
            'getproducts',
            'countall',
            'countactive',
            'countinactive',
            'countoutofstock',
            'countwhinactive',
            'countwhactive',
            'type',
            'aryFilterSession',
            'tagDropdown',
            'categoryDropdown'
        ));
    }

	public function getProductTerms(Request $request)
    {
        $terms = ArProductAttributeterms::where('terms_attribute_id', $request->attribute_id)->get();
        if (count($terms) > 0) {
            return response()->json($terms);
        }
    }

    public function productReview(Request $request,$id=0){
        $title = 'Product';
        $resReviewData = ArProductReview::where('pr_product_id',$id)->paginate(50);  
        return view('badmin.product.productreview',compact('title','resReviewData'));
    }

    public function productDelete($id)
    {
        $deletedata =  ArProductReview::where('pr_id',$id)->delete();
         if($deletedata){
           return redirect()->back()->with('success', 'Review Deleted Successfully');
        }else{
           return redirect()->back()->with('error', 'Something went wrong. Please try again!!');
        }
    }

    public function productbulkaction(Request $request){
        // dd(array_filter(array_unique($request->customerid)));
        if($request->getstatus == 1){
            foreach(array_filter(array_unique($request->productid)) as $key => $value) {
               $update =ArProduct::where('product_id',$value)->update(['product_status'=>1]);
            }
            
        }

        if($request->getstatus == 2){
             foreach (array_filter(array_unique($request->productid)) as $key => $value) {
                $update =ArProduct::where('product_id',$value)->update(['product_status'=>0]);
            }
           
        }
        if($request->getstatus == 8){
            foreach(array_filter(array_unique($request->productid)) as $key => $value) {
               $update =ArProduct::where('product_id',$value)->update(['product_wholesale'=>1]);
            }
            
        }

        if($request->getstatus == 9){
             foreach (array_filter(array_unique($request->productid)) as $key => $value) {
                $update =ArProduct::where('product_id',$value)->update(['product_wholesale'=>0]);
            }
           
        }

        if($request->getstatus == 3){
            foreach (array_filter(array_unique($request->productid)) as $key => $value) {
                $update =ArProduct::where('product_id',$value)->delete();
            }
            
        }
        if($request->getstatus == 4){
        foreach (array_filter(array_unique($request->productid)) as $key => $value) {
                $update =ArProduct::where('product_id',$value)->first();
                $update->product_stock = $request->outofstock;
                $update->save();
            }
        }
        if($request->getstatus == 7){
        foreach (array_filter(array_unique($request->productid)) as $key => $value) {
                $update =ArProduct::where('product_id',$value)->first();
                $update->product_wh_min_qty = $request->outofstock;
                $update->save();
            }
        }
        if($request->getstatus == 5){
        foreach (array_filter(array_unique($request->productid)) as $key => $value) {
                $update =ArProduct::where('product_id',$value)->first();
                $update->product_price = $request->mrp;
                $update->product_selling_price = $request->selling_price;
                $discount = 0;
               if ($update->product_price > 0) {
                   $discount = $update->product_price - $update->product_selling_price;
                }

               $update->product_discount = round($discount, 2); 
                $update->save();
            }
        }
        if($request->getstatus == 6){
        foreach (array_filter(array_unique($request->productid)) as $key => $value) {
                $update =ArProduct::where('product_id',$value)->first();
                $update->product_wh_mrp_price = $request->mrp;
                $update->product_wh_selling_price = $request->selling_price;
                $discount = 0;
               if ($update->product_wh_mrp_price > 0) {
                   $discount = $update->product_wh_mrp_price - $update->product_wh_selling_price;
                }

               $update->product_wh_discount = round($discount, 2); 
                $update->save();
            }
        }
     

        if($update){
            return response()->json(['status' => true, 'message' => 'Status Updated successfully!!','type'=>$request->getstatus],200);
        }else{
            return response()->json(['status' => false, 'message' => 'something went wrong!!'],201);
        }
    }

    public function resetfilter(Request $request){
        Session::forget('PRODUCT_FILTER');
        return redirect()->back();
    }
	
    public function addproduct($type=null,$id=0){
        $productIdData=array();
        $productattribute=[];
        $resProductAddonsData = array();
        if(isset($id) && $id > 0)
        {
            $productIdData = ArProduct::where('product_id',$id)->with(['gallery','productAttributeDetails','productVariations','productTabs'])->first();
            $productattribute = ArProductAttributeDetail::where('attribute_details_proid',$id)->get();
            $resProductAddonsData = ArProductAddons::where('addons_product_id',$id)->get();
        }  
		$brand = ArProductBrand::where('brand_status',1)->get();
        $attributes = ArProductAttribute::get();
        $alltags = ArProductTags::get();
		$alllabel = ArProductLabel::get();
        $strCategory = array();
        if(isset($productIdData->product_category_id))
        {
            $strCategory = explode(',',$productIdData->product_category_id);
        }
        $resCategoryData = ArCategory::get();
                 
        $aryCategoryList = $this->buildTree($resCategoryData,0); 
        $strCategoryTreeStructure =$this->genrateHtml($aryCategoryList,0,$strCategory); 
        $resTaxRates = ArTaxRates::where('tax_status',1)->get();

        $title='Add Product';
        return view('badmin.product.addproduct',compact('productIdData','resTaxRates','resProductAddonsData','title','alltags','alllabel','productattribute','attributes','strCategoryTreeStructure','brand','type'));
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

    function genrateHtml($aryCategoryTree,$intLevel=0,$strSelectCategory=array()){
        $strHtml='';
        foreach($aryCategoryTree as $key=>$label){
            if($label->cat_parent==0){
                $intLevel=0;
            }
            $strChecked='';
            $strExtraChecked ='';
            if(in_array($label->cat_id,$strSelectCategory)){
                $strChecked = 'checked="checked"';
            }
            $margin = $intLevel*20;
            $strLevelByMargin = 'margin-left:'.$margin.'px;'; 
            $strHtml .='<div class="form-check form-check-inline" style="width: 100%; margin-bottom: 10px;'.$strLevelByMargin.'">
                <input class="form-check-input categorychcked" type="checkbox" id="inlineCheckbox'.$label->cat_id.'" value="'.$label->cat_id.'" name="category_id[]" '.$strChecked.'>
                <label class="form-check-label" for="inlineCheckbox'.$label->cat_id.'">'.$label->cat_name.'</label>
            </div>';
            if(isset($label->children)){
                $intLevel++;
                $strHtml .=$this->genrateHtml($label->children,$intLevel,$strSelectCategory);
            }
            $intLevel--;
        }
        return $strHtml;
    }
    
    public function productProcess(Request $request)
    {
        $requestData = $request->all();
        $arr=[];
        if (isset($requestData['product_id']) && $requestData['product_id'] > 0) {
            $productObj = ArProduct::where('product_id',$requestData['product_id'])->first();
            $uniqueid =  $productObj->product_uniqueid;
            $uniqueSku =  $productObj->product_sku;
        }else{
            $productObj = new ArProduct;
            $uniqueid =  self::getUniqueId(1);
            $uniqueSku =  self::getUniqueId(8);            
        }

        $request->validate([
            'product_name'=> 'required',
            'product_lgap'=> 'required',
        ]); 

        if(isset($requestData['product_type']) && $requestData['product_type']=='0')
        {
            $request->validate([
                'price'=> 'required',
                'discount'=> 'required'
            ]);
        }else{ 
            if($requestData['product_attributes'][0]==''){
                return redirect()->back()->with('error', 'Please select attribute');
            }else{
                if(isset($requestData['combinationdata'])){
                    if($requestData['pricev'][0]==''){
                        return redirect()->back()->with('error', 'Please enter variation price');
                    }
                    if($requestData['discountv'][0]==''){
                        return redirect()->back()->with('error', 'Please enter variation discount');
                    }
                }else{
                    return redirect()->back()->with('error', 'Please create product variation');
                }
            }
            
        }

        if(isset($requestData['category_id']) && $requestData['category_id']!=''){
            $categoryImp = implode(',',$requestData['category_id']);
            $categoryNames = ArCategory::whereIn('cat_id',$requestData['category_id'])->pluck('cat_name')->toArray();
            $categoryimplodeNames = implode(', ',$categoryNames);
        }        
        if(isset($requestData['product_highlight']) && $requestData['product_highlight'] !=''){
            $product_highlight = implode('##',array_filter($requestData['product_highlight']));
        }

        if(isset($requestData['tag_id']) && $requestData['tag_id'] != ''){
            $tagImp = implode(',',$requestData['tag_id']);
            $tagData = ArProductTags::whereIn('tag_id',$requestData['tag_id'])->pluck('tag_name')->toArray();
            $tag_name = implode(', ',$tagData);
        }else{
            $tagImp = 0;
            $tag_name = '';
        }
		
        
		if(isset($requestData['product_label_id']) && $requestData['product_label_id'] != ''){
            $labelImp = $requestData['product_label_id'];
            $labelData = ArProductLabel::where('label_id',$requestData['product_label_id'])->value('label_name');
            $label_name = $labelData;
        }else{
            $labelImp = 0;
            $label_name = '';
        }

        $productObj->product_name = $requestData['product_name'];
        $productObj->product_lgap = $requestData['product_lgap'];
        $productObj->product_category_id = $categoryImp;
        $productObj->product_category_name = $categoryimplodeNames;
        $productObj->product_tag_id = $tagImp;
        $productObj->product_label_id = $labelImp;
        $productObj->product_label_name = $label_name;
        $productObj->product_stock = $requestData['product_stock'];
        $productObj->product_tag_name = $tag_name;
        $productObj->product_brand_id = $requestData['product_brand_id'];
        $productObj->product_description = $requestData['product_description'];
        $productObj->product_discount =  $requestData['discount'];
        $productObj->product_selling_price = $requestData['selling_price'];
        $productObj->product_price = $requestData['price'];
        $productObj->product_tax_id = $requestData['product_tax_id'];
        $productObj->product_style_type = $requestData['product_style_type'];
        $productObj->product_wholesale = $requestData['product_wholesale'] ?? 0;
        $productObj->product_wh_mrp_price = (!empty($requestData['product_wholesale']) && $requestData['product_wholesale'] == 1)? ($requestData['product_wh_mrp_price'] ?? 0.00): 0.00;
        $productObj->product_wh_selling_price = (!empty($requestData['product_wholesale']) && $requestData['product_wholesale'] == 1)? ($requestData['product_wh_selling_price'] ?? 0.00): 0.00;
        $productObj->product_wh_discount = (!empty($requestData['product_wholesale']) && $requestData['product_wholesale'] == 1)? ($requestData['product_wh_discount'] ?? 0.00): 0.00;
         if($requestData['product_moq']==''){
            $productObj->product_moq = 0;
        }else{
            $productObj->product_moq = $requestData['product_moq'];
        }

        $productObj->product_shipping_free = $requestData['product_shipping_free'];
        $productObj->product_weight = $requestData['weight'];
        $productObj->product_img_alt = $requestData['product_img_alt'];
        $productObj->product_sku = $uniqueSku;
        $productObj->product_length = $requestData['length'];
        $productObj->product_width = $requestData['product_width'];
        $productObj->product_type = $requestData['product_type'];
        $productObj->product_height = $requestData['height'];
        $productObj->product_length = $requestData['length'];
        $productObj->product_width = $requestData['product_width'];
        $productObj->product_height = $requestData['height'];
        
        $productObj->product_highlight = $product_highlight;
        $productObj->product_uniqueid = $uniqueid;

        $productObj->product_meta_title = $requestData['product_meta_title'];
        $productObj->product_meta_keyword = $requestData['product_meta_keyword'];
        $productObj->product_meta_desc = $requestData['product_meta_desc'];
        // $productObj->product_video_link = $requestData['product_video_link'];
        // $productObj->product_video = $requestData['product_video'];
        
        // if($request->hasFile('product_image_')){
        //     $image = $request->file('product_image_');
        //     $name = rand(1000,9999).time().'.'.$image->getClientOriginalExtension();
        //     $destinationPath = public_path('/img/uploads/products/');
        //     $image->move($destinationPath, $name);
        //     $url = url('/').'/public/img/uploads/products/'.$name;
        //     $productObj->product_image = $url;
        // } 
        if($request->hasFile('product_image_'))
        {
            $image = $request->file('product_image_');
            $name = rand(0000,9999).time().'.'.$image->getClientOriginalExtension();

            $destinationPath = public_path("img/uploads/products");
            $localPath = $destinationPath . '/' . $name;

            $image->move($destinationPath, $name);
            $url = url('/').'/public/img/uploads/products/'.$name;
            $productObj->product_image = $url;
            $bunny = new \App\Services\Bunny();
            $cdnUrl = $bunny->upload('products/' . $name, file_get_contents($localPath));

            if(!$cdnUrl){
                return response()->json(['error' => 'Upload failed'], 500);
            }
            $productObj->product_image_cdn = $cdnUrl;
        }
		if($request->hasFile('product_video'))
        {
            $video = $request->file('product_video');
            $name1 = rand(0000,9999).time().'.'.$video->getClientOriginalExtension();
            $destinationPath1 = public_path("img/uploads/product_vid");
            $video->move($destinationPath1, $name1);
            $url1 = url('/').'/public/img/uploads/product_vid/'.$name1;
            $productObj->product_video = $url1;
            $localPath1 = $destinationPath1 . '/' . $name1;
            $bunny1 = new \App\Services\Bunny();
            $cdnUrl1 = $bunny1->upload('products/' . $name1, file_get_contents($localPath1));
            if(!$cdnUrl1){
                return response()->json(['error' => 'Upload failed'], 500);
            }
            $productObj->product_video_cdn = $cdnUrl1;
        }

        if($productObj->save())
        {
            ArProductByCategory::where('cpc_product_id',$productObj->product_id)->delete();
            if(isset($requestData['category_id']))
            {
                foreach($requestData['category_id'] as $catlabel){
                    if($catlabel!=''){
                        $catData = new ArProductByCategory;
                        $catData->cpc_category_id = $catlabel;
                        $catData->cpc_product_id = $productObj->product_id;
                        $catData->save();
                    }
                }
            } 
            ArProductByTag::where('pt_product_id',$productObj->product_id)->delete();
            if(isset($requestData['tag_id']))
            {
                foreach($requestData['tag_id'] as $collabel){
                    if($collabel!=''){
                        $collData = new ArProductByTag;
                        $collData->pt_tag_id = $collabel;
                        $collData->pt_product_id = $productObj->product_id;
                        $collData->save();
                    }
                }
            } 
			ArProductTabs::where('tab_product_id',$productObj->product_id)->delete();
            if(isset($requestData['tab_description']) && $requestData['tab_description'] !=''){
                
                foreach ($requestData['tab_description'] as $key => $value) {
                    if(isset($value) && $value!=''){
                        $productTabs = new ArProductTabs;
                        $productTabs->tab_product_id = $productObj->product_id;
                        $productTabs->tab_name = $requestData['tab_name'][$key];
                        $productTabs->tab_order = $requestData['tab_order'][$key];
                        $productTabs->tab_description = $value;
                        $productTabs->save();
                    }
                }
            }
			
            ArProductGallery::where('gallery_product_id',$productObj->product_id)->delete();
            if(isset($requestData['product_gallery']))
            {
                foreach($requestData['product_gallery'] as $label){
                    if($label!=''){
                        $galleryData = new ArProductGallery;
                        $galleryData->gallery_image = $label;
                        $galleryData->gallery_product_id = $productObj->product_id;
                        $galleryData->save();
                    }
                }
            }


            /* echo "<pre>";
            print_r($requestData['product_attributes']);
            die; */
            if(isset($requestData['product_attributes'])){
                ArProductAttributeDetail::where('attribute_details_proid',$productObj->product_id)->delete();
                foreach($requestData['product_attributes'] as $key=>$label){
                    if($label!=''){
                        $productdetails = new ArProductAttributeDetail;
                        $productdetails->attribute_details_proid = $productObj->product_id;
                        $productdetails->attribute_details_attid = $label;
                        $productdetails->attribute_details_attrterms = isset($requestData['product_terms'][$key])?implode(',',$requestData['product_terms'][$key]):'';

                        $attributes = ArProductAttribute::where('attribute_id',$label)->first();
                        if(isset($attributes) && $attributes->attribute_type==2){
                            $resAttrTermsData = ArProductAttributeterms::whereIn('terms_id',$requestData['product_terms'][$key])->pluck('terms_image')->toArray();
                        }elseif(isset($attributes) && $attributes->attribute_type==1){
                            $resAttrTermsData = ArProductAttributeterms::whereIn('terms_id',$requestData['product_terms'][$key])->pluck('terms_value')->toArray();
                        }else{
                            $resAttrTermsData = ArProductAttributeterms::whereIn('terms_id',$requestData['product_terms'][$key])->pluck('terms_name')->toArray();
                        }
                        $productdetails->attribute_details_attrterms_extra = implode(',',$resAttrTermsData);
                        $productdetails->save();
                    }
                }
            }

            if(isset($requestData['combinationdata'])){
                ArProductVariation::where('pv_product_id',$productObj->product_id)->delete();
                $count = 1;
                foreach($requestData['combinationdata'] as $key=>$label){
                    if($label!=''){
                        $productdetails = new ArProductVariation;
                        $productdetails->pv_variation = $label;
                        $productdetails->pv_price = $requestData['pricev'][$key];
                        $productdetails->pv_discount = $requestData['discountv'][$key];
                        $productdetails->pv_sellingprice = $requestData['sellingpricev'][$key];
                        $productdetails->pv_product_id = $productObj->product_id;
                        $productdetails->pv_image = $requestData['variationimagev'][$key];
                        $productdetails->pv_quantity = $requestData['quantityv'][$key];
                        $productdetails->pv_moq = $requestData['moqv'][$key];
                        $productdetails->pv_sku = $requestData['skuv'][$key];
                        $productdetails->pv_weight = $requestData['weightv'][$key];
                        $productdetails->pv_length = $requestData['lengthv'][$key];
                        $productdetails->pv_width = $requestData['product_widthv'][$key];
                        $productdetails->pv_height = $requestData['heightv'][$key];
                        $explodeLabel = explode(',',$label);
                        $locations = array(); 
                        foreach($explodeLabel as $keye=>$labels){
                            $resAttrTermsData = ArProductAttributeterms::where('terms_name',$labels)->first();
                            if(isset($resAttrTermsData) && $resAttrTermsData->terms_value==null && $resAttrTermsData->terms_image==null){
                                $locations[]  = $resAttrTermsData->terms_name;
                            }elseif(isset($resAttrTermsData) && $resAttrTermsData->terms_value!=null && $resAttrTermsData->terms_image==null){
                                $locations[]  = $resAttrTermsData->terms_value;
                            }elseif(isset($resAttrTermsData) && $resAttrTermsData->terms_value==null && $resAttrTermsData->terms_image!=null){
                                $locations[]  = $resAttrTermsData->terms_image;
                            }else{
                                $locations[]  = '';
                            }
                        } 
                        $productdetails->pv_variation_extra = implode(',',$locations);
                        if(isset($requestData['defaultselectedv'])){
                            if(isset($requestData['defaultselectedv'][0]) && $key == $requestData['defaultselectedv'][0])
                            {
                                $productdetails->pv_default = 1;
                            }else{
                                $productdetails->pv_default = 0;   
                            }
                        }else{
                            if($count==1){
                                $productdetails->pv_default = 1; 
                            }else{
                                $productdetails->pv_default = 0; 
                            }
                        }
                        $productdetails->save();
                        $count++;
                    }
                }
                $prodvar = ArProductVariation::where('pv_product_id',$productObj->product_id)->where('pv_default',1)->first();
                $productupdate = ArProduct::where('product_id',$productObj->product_id)->first();
                $productupdate->product_price = $prodvar->pv_price;
                $productupdate->product_selling_price = $prodvar->pv_sellingprice;
                $productupdate->product_discount = $prodvar->pv_discount;
                $productupdate->save();
            }          
            return redirect()->route('allproduct')->with('success', 'Product Added Successfully');
        }else{
            return redirect()->route('allproduct')->with('error', 'Something Went Wrong. Please try again');
        }
    }
	public function deleteproductvideo($id=0){
        $productData = ArProduct::where('product_id',$id)->first();
        if(isset($productData)){
            $destinationPath = public_path('/img/uploads/'."products/".$productData->product_video);
            if(File::delete($destinationPath)){
                ArProduct::where('product_id',$id)->update(['product_video' => '']);
                return redirect()->back()->with('success', 'Video Removed Successfully');
            }else{
                return redirect()->back()->with('success', 'Video did not remove. Please try after sometime.');
            }
        }
    }

    public function productCopy($productid)
    {
        $arr=[];
        $productObj = ArProduct::where('product_id',$productid)->with(['gallery','productAttributeDetails','productVariations','defaultVariation','addons'])->first();
        $uniqueid =  self::getUniqueId(1);
        $productCopy = new ArProduct;
        $productCopy->product_inventory = $productObj->product_inventory;
        $productCopy->product_stock =     $productObj->product_stock;
        $productCopy->product_backorder = $productObj->product_backorder;
        $productCopy->product_name = $productObj->product_name.'-copy';
        $productCopy->product_category_id = $productObj->product_category_id;
        $productCopy->product_category_name = $productObj->product_category_name;
        $productCopy->product_tag_id =   $productObj->product_tag_id;
        $productCopy->product_label_id = $productObj->product_label_id;
        $productCopy->product_tag_name = $productObj->product_tag_name;
        $productCopy->product_content =  $productObj->product_content;
        $productCopy->product_description = $productObj->product_description;
        $productCopy->product_discount =  $productObj->product_discount;
        $productCopy->product_selling_price = $productObj->product_selling_price;
        $productCopy->product_price = $productObj->product_price;
        $productCopy->product_moq = $productObj->product_moq;
        $productCopy->product_weight = $productObj->product_weight;
        $productCopy->product_sku = $productObj->product_sku;
        $productCopy->product_length = $productObj->product_length;
        $productCopy->product_width = $productObj->product_width;
        $productCopy->product_type = $productObj->product_type;
        $productCopy->product_height = $productObj->product_height;
        $productCopy->product_length = $productObj->product_length;
        $productCopy->product_width = $productObj->product_width;
        $productCopy->product_height = $productObj->product_height;
        $productCopy->product_highlight = $productObj->product_highlight;
        $productCopy->product_uniqueid = $uniqueid;
        $productCopy->product_image = $productObj->product_image;

        if($productCopy->save())
        {
            if(isset($productObj->gallery))
            {
                foreach($productObj->gallery as $label){
                    if($label!=''){
                        $galleryData = new ArProductGallery;
                        $galleryData->gallery_image = $label->gallery_image;
                        $galleryData->gallery_product_id = $productCopy->product_id;
                        $galleryData->save();
                    }
                }
            } 
            
            if(isset($productObj->productAttributeDetails)){
                foreach($productObj->productAttributeDetails as $key=>$label){
                    if($label!=''){
                        $productdetails = new ArProductAttributeDetail;
                        $productdetails->attribute_details_proid = $productCopy->product_id;
                        $productdetails->attribute_details_attid = $label->attribute_details_attid;
                        $productdetails->attribute_details_attrterms = $label->attribute_details_attrterms;
                        $productdetails->attribute_details_attrterms_extra = $label->attribute_details_attrterms_extra;
                        $productdetails->save();
                    }
                }
            }

            if(isset($productObj->productVariations)){
                $count = 1;
                foreach($productObj->productVariations as $key=>$label){
                    if($label!=''){
                        $productdetails = new ArProductVariation;
                        $productdetails->pv_variation = $label->pv_variation;
                        $productdetails->pv_price = $label->pv_price;
                        $productdetails->pv_discount = $label->pv_discount;
                        $productdetails->pv_sellingprice = $label->pv_sellingprice;
                        $productdetails->pv_product_id = $productCopy->product_id;
                        $productdetails->pv_image = $label->pv_image;
                        $productdetails->pv_quantity = $label->pv_quantity;
                        $productdetails->pv_moq = $label->pv_moq;
                        $productdetails->pv_sku = $label->pv_sku;
                        $productdetails->pv_weight = $label->pv_weight;
                        $productdetails->pv_length = $label->pv_length;
                        $productdetails->pv_width = $label->pv_width;
                        $productdetails->pv_height = $label->pv_height;
                        $explodeLabel = explode(',',$label->pv_variation);
                        $locations = array(); 
                        $productdetails->pv_variation_extra = $label->pv_variation_extra;
                        $productdetails->pv_default = $label->pv_default;
                        $productdetails->save();
                        $count++;
                    }
                }
                $prodvar = ArProductVariation::where('pv_product_id',$productCopy->product_id)->where('pv_default',1)->first();
                if(isset($prodvar) && $prodvar !=''){
                    $productupdate = ArProduct::where('product_id',$productCopy->product_id)->first();
                    $productupdate->product_price = $prodvar->pv_price;
                    $productupdate->product_selling_price = $prodvar->pv_sellingprice;
                    $productupdate->product_discount = $prodvar->pv_discount;
                    $productupdate->save();
                }
            }

            return redirect()->route('allproduct')->with('success', 'Product Copied Successfully');
        }else{
            return redirect()->route('allproduct')->with('error', 'Something Went Wrong. Please try again');
        }
    }

    public function getterms(Request $request)
    {
        $termsattr = ArProductAttributeterms::where('terms_attribute_id', $request->attributetId)->get();
        if (count($termsattr) > 0) {
            return response()->json($termsattr);
        }
    }
    
    public function uploadgalleryimage(Request $request)
{
    $request->validate([
        'Filedata' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048'
    ]);

    $image = $request->file('Filedata');
    $name = uniqid().'.'.$image->getClientOriginalExtension();
    $destinationPath = public_path('/img/uploads/products/');
    $image->move($destinationPath, $name);

    return response()->json([
        'status' => 'success',
        'url' => url('/public/img/uploads/products/'.$name),
        'message' => 'Image uploaded successfully'
    ]);
}


    public function checkfeatured($id=null,$status=null)
    {
        $prodObj = ArProduct::where('product_id',$id)->first();
        if($prodObj->product_featured == 0)
        {
            $prodObj->product_featured = 1;
        } else{
            $prodObj->product_featured = 0;
        }
        if ($prodObj->save())
        {
            return redirect()->back()->with('success', 'Featured Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }

    public function checkrecommended($id=null,$status=null)
    {
        $prodObj = ArProduct::where('product_id',$id)->first();
        if($prodObj->product_recommended == 0)
        {
            $prodObj->product_recommended = 1;
        } else{
            $prodObj->product_recommended = 0;
        }
        if ($prodObj->save())
        {
            return redirect()->back()->with('success', 'Product Recommended Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }

    public function statusupdate(Request $request, $id)
    {
        $productObj=ArProduct::where('product_id',$id)->first();
        if (isset($productObj->product_status) && $productObj->product_status==1) {
            $status=0;
        }else{
            $status=1;
        }
        ArProduct::where('product_id',$id)->update(array('product_status'=>$status));
        return redirect()->back()->with('success', 'Status Updated Successfully');
    }
    public function whstatusupdate(Request $request, $id)
    {
        $productObj=ArProduct::where('product_id',$id)->first();
        if (isset($productObj->product_wholesale) && $productObj->product_wholesale==1) {
            $status=0;
        }else{
            $status=1;
        }
        ArProduct::where('product_id',$id)->update(array('product_wholesale'=>$status));
        return redirect()->back()->with('success', 'Status Updated Successfully');
    }

    public function destroy($id)
    {
        $deletedata =  ArProduct::where('product_id',$id)->delete();
        ArProductGallery::where('gallery_product_id',$id)->delete();
        ArProductAttributeDetail::where('attribute_details_proid',$id)->delete();
        ArProductVariation::where('pv_product_id',$id)->delete();
        ArProductReview::where('pr_id',$id)->delete();
        ArCart::where('cart_product_id',$id)->delete();
        ArUserFavProduct::where('ufp_product_id',$id)->delete();

        if($deletedata){
           return redirect()->back()->with('success', 'Product Deleted Successfully');
        }else{
           return redirect()->back()->with('error', 'Something went wrong. Please try again!!');
        }
    }

    public function getProductUniqueId($id)
    { 
        $rowUniqueId = ArUniqueIds::where('ui_id',$id)->first();
        $intCurrentCounter = $rowUniqueId->ui_current+1;
        $strCategoryId = $rowUniqueId->ui_prefix.$intCurrentCounter;
        ArUniqueIds::where('ui_id',$id)->update(['ui_current'=>$intCurrentCounter]);
        return $strCategoryId;
    }
 
    public function getUniqueId($id)
    { 
        $rowUniqueId = ArUniqueIds::where('ui_id',$id)->first();
        $intCurrentCounter = $rowUniqueId->ui_current+1;
        $strCategoryId = $rowUniqueId->ui_prefix.$intCurrentCounter;
        ArUniqueIds::where('ui_id',$id)->update(['ui_current'=>$intCurrentCounter]);
        return $strCategoryId;
    } 

    public function fbProductExport()
    {
        $filename = 'fb-product-export-' . now()->format('Y-m-d') . '.xlsx';
        return Excel::download(new FbProductExport, $filename);
    }
	
    /*-----------------------------------------------------Tags Section------------------------------------------------------*/
	
    public function tags($id=0){
		$title = "Tags";
		$tagData= array();
        if (isset($id) && $id > 0) {
            $tagData = ArProductTags::where('tag_id',$id)->first();
        }
        $tagdetails = ArProductTags::orderBy('tag_id','DESC')->paginate(50);
        return view('badmin.product.tags',compact('title','tagdetails','tagData'));
    }
    
    public function tagprocess(Request $request)
    {
        if ($request->isMethod('post')) 
        {
            $requestData = $request->all();
            
            if (isset($requestData['tag_id']) && $requestData['tag_id'] > 0) {
                $tagObj = ArProductTags::where('tag_id',$requestData['tag_id'])->first();
            }else{
                $request->validate([
                    'tag_name' => 'required',
					 'tag_meta_title' => 'required'
                ]);
                $tagObj = new ArProductTags;
            }
            if(isset($requestData['tag_show_on_app_home']) && $requestData['tag_show_on_app_home']==1){
                $tagObj->tag_show_on_app_home = 1;
            }else{
                $tagObj->tag_show_on_app_home = 0;
            }

            $tagObj->tag_name = $requestData['tag_name'];
			 $tagObj->tag_meta_title = $requestData['tag_meta_title'];
			 $tagObj->tag_meta_keyword = $requestData['tag_meta_keyword'];
			 $tagObj->tag_meta_desc = $requestData['tag_meta_desc'];
            if($tagObj->save()){
                
            if (isset($requestData['tag_id']) && $requestData['tag_id'] > 0) {
                return redirect()->back()->with('success', 'Tag Updated Successfully');
            }else{
                return redirect()->back()->with('success', 'Tag Added Successfully');
            }
            }
            }else{
                return redirect()->back()->with('error', 'Invalid Method');
            }
    }
    
    public function deletetag($id)
    {
        if($id>0){
            $deletetag = ArProduct::whereRaw('FIND_IN_SET(?, product_tag_id)', [$id])->count();
            if($deletetag>0){
                return redirect()->back()->with('error', 'This Tag is selected in a product. It can not be deleted');
            }else{
                ArProductTags::where('tag_id',$id)->delete();
                return redirect()->back()->with('success', 'Tag Deleted Successfully');
            } 
        }
    }
	
    public function tagFeatured($id=null,$status=null)
    {
        $tagObj = ArProductTags::where('tag_id',$id)->first();
        if($tagObj->tag_featured == 0)
        {
            $tagObj->tag_featured = 1;
        } else{
            $tagObj->tag_featured = 0;
        }
        if ($tagObj->save())
        {
            return redirect()->route('badmin.tags')->with('success', 'Featured Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }
    
    public function tagstatus($id=null)
    {
        $tagObj = ArProductTags::where('tag_id',$id)->first();
        if($tagObj->tag_status == 0)
        {
        $tagObj->tag_status = 1;
        }
        else{
            $tagObj->tag_status = 0;
        }
        if ($tagObj->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }
	
	
      /*---------------------------------------BrandSection---------------------------------*/
	
	public function brand($id=0){
        $title='Brand';
		$brandData= array();
        if (isset($id) && $id > 0) {
            $brandData = ArProductBrand::where('brand_id',$id)->first();
        }
        $branddetails = ArProductBrand::orderBy('brand_id','DESC')->paginate(50);
        return view('badmin.product.brand',compact('title','branddetails','brandData'));
    }
	
	 public function brandprocess(Request $request)
     {
        if ($request->isMethod('post')) 
        {
            $requestData = $request->all();
            
            if (isset($requestData['brand_id']) && $requestData['brand_id'] > 0) {
                $brandObj = ArProductBrand::where('brand_id',$requestData['brand_id'])->first();
            }else{
                $request->validate([
                    'brand_name' => 'required',
					'brand_meta_title' => 'required'
                ]);
                $brandObj = new ArProductBrand;
            }

            $brandObj->brand_name = $requestData['brand_name'];
			 $brandObj->brand_meta_title = $requestData['brand_meta_title'];
			 $brandObj->brand_meta_keyword = $requestData['brand_meta_keyword'];
			 $brandObj->brand_meta_desc = $requestData['brand_meta_desc'];
            if($brandObj->save()){
                
            if (isset($requestData['brand_id']) && $requestData['brand_id'] > 0) {
                return redirect()->back()->with('success', 'Brand Updated Successfully');
            }else{
                return redirect()->back()->with('success', 'Brand Added Successfully');
            }
            }
            }else{
                return redirect()->back()->with('error', 'Invalid Method');
            }
    }
	
	public function deletebrand($id){
        if($id>0){
            $deletebrand = ArProduct::where('product_brand_id',$id)->first();
            if($deletebrand){
                return redirect()->back()->with('error', 'Brand is selected in all product. It can not be deleted');
            }else{
                ArProductBrand::where('brand_id',$id)->delete();
                return redirect()->back()->with('success', 'Brand Deleted Successfully');
            } 
        }
    }
	
	public function brandstatus($id=null)
    {
        $brandObj = ArProductBrand::where('brand_id',$id)->first();
        if($brandObj->brand_status == 0)
        {
        $brandObj->brand_status = 1;
        }
        else{
            $brandObj->brand_status = 0;
        }
        if ($brandObj->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }
	
	/*---------------------------------------LabelSection---------------------------------*/
    public function label($id=0)
    {
        $title='Label';
        $labelIdData= array();
        if (isset($id) && $id > 0) {
            $labelIdData = ArProductLabel::where('label_id',$id)->first();
        }
        $labelData = ArProductLabel::paginate(20);
        return view('badmin.product.label',compact('title','labelIdData','labelData'));
    }
    
    public function labelprocess(Request $request)
    { 
        if ($request->isMethod('post')) 
        {
            $requestData = $request->all();
            
            if (isset($requestData['label_id']) && $requestData['label_id'] > 0) {
                $labelObj = ArProductLabel::where('label_id',$requestData['label_id'])->first();
                $getslug = $labelObj->label_slug;
            }else{
                $request->validate([
                    'label_name' => 'required',
					'label_meta_title' => 'required'
                ]);
                $labelObj = new ArProductLabel;
                $gettitleslug = ArProductLabel::where('label_slug',[Str::slug($requestData['label_name'], '-')])->get();
                
            }
            $labelObj->label_name = $requestData['label_name'];
			 $labelObj->label_meta_title = $requestData['label_meta_title'];
			 $labelObj->label_meta_keyword = $requestData['label_meta_keyword'];
			 $labelObj->label_meta_desc = $requestData['label_meta_desc'];
            if($labelObj->save()){
            if (isset($requestData['label_id']) && $requestData['label_id'] > 0) {
            return redirect()->route('badmin.label')->with('success', 'Label Updated Successfully');
            }else{
            return redirect()->back()->with('success', 'Label Added Successfully');
            }
            }
        }else{
            return redirect()->back()->with('error', 'Invalid Method');
            }
    }

    public function labelstatus($id=null)
    {
        $labelObj = ArProductLabel::where('label_id',$id)->first();
        if($labelObj->label_status == 0)
        {
        $labelObj->label_status = 1;
        }
        else{
            $labelObj->label_status = 0;
        }
        if ($labelObj->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }

    public function deletelabel($id=null)
    {
        if($id>0){
            $deletelabel = ArProduct::whereRaw('FIND_IN_SET(?, product_label_id)', [$id])->count();
            if($deletelabel>0){
                return redirect()->back()->with('error', 'This label is selected in a product. It can not be deleted.');
            }else{
                ArProductLabel::where('label_id',$id)->delete();
                return redirect()->back()->with('success', 'Label Deleted Successfully');
            } 
        } 
    }

    /*------------------------------------------------------------------------------------------------------Attribute Section-----------------------------------------------------------------------------*/
    
    public function productAttributes($id=null)
    {
        $title = 'Attributes';
        $attributeIdData= array();
        if (isset($id) && $id > 0) {
            $attributeIdData = ArProductAttribute::where('attribute_id',$id)->first();
        }
        $attributeData = ArProductAttribute::orderby('attribute_id','DESC')->paginate(50);
        return view('badmin.product.attribute',compact('title','attributeIdData','attributeData'));
    }

    public function attributeProcess(Request $request)
    {
        if ($request->isMethod('post')) 
        {
            $requestData = $request->all();
            if (isset($requestData['attribute_id']) && $requestData['attribute_id'] > 0) {
                $attributeObj = ArProductAttribute::where('attribute_id',$requestData['attribute_id'])->first();
            }else{
                $request->validate([
                    'attribute_name' => 'required|unique:ar_product_attributes',
                    'attribute_type' => 'required'
                ]);
                $attributeObj = new ArProductAttribute;
            }
                
            $attributeObj->attribute_name = $request->attribute_name;
            $attributeObj->attribute_type = $request->attribute_type;
            $attributeObj->attribute_terms = $request->attribute_terms;
            $attributeObj->attribute_status = 1;
                
            if($attributeObj->save()){
                if (isset($requestData['attribute_id']) && $requestData['attribute_id'] > 0) {
                    return redirect()->route('badmin.product.attributes')->with('success', 'Attribute Updated Successfully');
                }else{
                    return redirect()->back()->with('success', 'Attribute Added Successfully');
                }
            }
            }else{
                return redirect()->back()->with('error', 'Invalid Method');
            }
    }

    public function deleteattribute($id)
    {
        if($id>0){
            ArProductAttribute::where('attribute_id',$id)->delete();
            ArProductAttributeterms::where('terms_attribute_id',$id)->delete();
            return redirect()->route('badmin.product.attributes')->with('success', 'Attribute Deleted Successfully');
        }
    }

    public function attributeStatus(Request $request, $id)
    {
        $attributeObj = ArProductAttribute::where('attribute_id',$id)->first();
        if (isset($attributeObj->attribute_status) && $attributeObj->attribute_status==1) {
            $status=0;
        }else{
            $status=1;
        }
        ArProductAttribute::where('attribute_id',$id)->update(array('attribute_status'=>$status));
        return redirect()->back()->with('success', 'Status Updated Successfully');
    }

    public function attributeSlug(Request $request)
    {
        $slug = Str::slug($request->attribute_name);
        $title = $request->attribute_name;
        return response()->json(['slug' => $slug, 'attribute_name' => $title]);
    }

    //Attribut terms section started
    public function attributeTerms($slug=null,$id=null)
    {
        $title = 'Attributes Terms';
        $attributeIdData= array();
        $termsslug =   ArProductAttribute::where('attribute_slug',$slug)->first();
        if (isset($id) && $id > 0) {
            $attributeIdData = ArProductAttributeterms::where('terms_id',$id)->first();
        }
        $attributeData = ArProductAttributeterms::whereIn('terms_attribute_id',[$termsslug->attribute_id])->orderby('terms_id','DESC')->paginate(50);
        return view('badmin.product.attribute_terms',compact('title','attributeIdData','attributeData','termsslug'));
    }

    public function termsProcess(Request $request)
    {
        if ($request->isMethod('post')) 
        {
            $requestData = $request->all();
            $termsslug =   ArProductAttribute::where('attribute_slug',$requestData['termsslug'])->first();
            if (isset($requestData['terms_id']) && $requestData['terms_id'] > 0) {
                $attributeObj = ArProductAttributeterms::where('terms_id',$requestData['terms_id'])->first();
                $slug = $attributeObj->terms_slug;
                ArProductVariation::where('pv_variation',$attributeObj->terms_name)->update(['pv_variation'=>$requestData['terms_name'],'pv_variation_extra'=>$requestData['terms_name']]);
            }else{
                $request->validate([
                    'terms_name' => 'required'
                ]);
                $attributeObj = new ArProductAttributeterms;
                $slug = Str::slug($requestData['terms_name'],'-');
            } 
            $attributeObj->terms_name = $request->terms_name;
            $attributeObj->terms_description = $request->terms_description;
            $attributeObj->terms_value = $request->terms_value;
            $attributeObj->terms_attribute_id = $termsslug->attribute_id;
            $attributeObj->terms_status = 1;
            $attributeObj->terms_slug = $slug;
            if($request->hasFile('terms_image'))
            {
                $image = $request->file('terms_image');
                $name = time().'.'.$image->getClientOriginalExtension();
                $destinationPath =public_path("img/uploads/terms_image/");
                $image->move($destinationPath, $name);
                $attributeObj->terms_image=$name;
            }else{
                $attributeObj->terms_image = $request->htermsimage;
            }
                
            if($attributeObj->save()){
                if (isset($requestData['terms_id']) && $requestData['terms_id'] > 0) {
                    return redirect()->back()->with('success', 'Terms Updated Successfully');
                }else{
                    return redirect()->back()->with('success', 'Terms Added Successfully');
                }
            }
        }else{
            return redirect()->back()->with('error', 'Invalid Method');
        }
    }
            
    public function deleteTerms($id)
    {
        if($id>0){
            ArProductAttributeterms::where('terms_id',$id)->delete();
            return redirect()->back()->with('success', 'Terms Deleted Successfully');
        }
    }

    public function termsStatus(Request $request, $id)
    {
        $attributeObj=ArProductAttributeterms::where('terms_id',$id)->first();
        if (isset($attributeObj->terms_status) && $attributeObj->terms_status==1) {
            $status=0;
        }else{
            $status=1;
        }
        ArProductAttributeterms::where('terms_id',$id)->update(array('terms_status'=>$status));
        return redirect()->back()->with('success', 'Status Updated Successfully');
    }
    public function productchange(Request $request)
    {
        $productIds = array_filter(array_unique($request->productid ?? []));
        $update = false;

        // 🔹 Category update
        if (!empty($request->category_change)) {
            $categoryIds   = $request->category_change;
            $categoryNames = ArCategory::whereIn('cat_id', $categoryIds)->pluck('cat_name')->toArray();

            foreach ($productIds as $productId) {
                ArProductByCategory::where('cpc_product_id', $productId)->delete();

                foreach ($categoryIds as $catId) {
                    $collData = new ArProductByCategory;
                    $collData->cpc_category_id = $catId;
                    $collData->cpc_product_id = $productId;
                    $collData->save();
                }

                $update = ArProduct::where('product_id', $productId)->update([
                    'product_category_id'   => implode(',', $categoryIds),
                    'product_category_name' => implode(',', $categoryNames),
                ]);
            }
        }

        // 🔹 Tag update
        if (!empty($request->tag_change)) {
            $tagId = $request->tag_change;
            if (str_starts_with($tagId, 'remove-')) {
                $removeTagId = str_replace('remove-', '', $tagId);

                foreach ($productIds as $productId) {
                    // delete only this tag mapping
                    ArProductByTag::where('pt_product_id', $productId)
                                ->where('pt_tag_id', $removeTagId)
                                ->delete();

                    // if product_tag_id is a single value (not multiple), reset only if matches
                    $update = ArProduct::where('product_id', $productId)->first();
                    if ($update && $update->product_tag_id == $removeTagId) {
                        $update->product_tag_id = null;
                        $update->product_tag_name = null;
                        $update->save();
                        $update = true;
                    }
                }
            }else {
                $tagName = ArProductTags::where('tag_id', $tagId)->value('tag_name');

                foreach ($productIds as $productId) {
                    // remove old tags (if you want only one active tag per product)
                    ArProductByTag::where('pt_product_id', $productId)->delete();

                    $collData = new ArProductByTag;
                    $collData->pt_tag_id     = $tagId;
                    $collData->pt_product_id = $productId;
                    $collData->save();

                    $update = ArProduct::where('product_id', $productId)->update([
                    'product_tag_id'   => $tagId,
                    'product_tag_name' => $tagName,
                    ]) || $update;
                }
            }
        }
        if (!empty($request->label_change)) {
            $labelId = $request->label_change;
            if (str_starts_with($labelId, 'remove-')) {
                $removelabelId = str_replace('remove-', '', $labelId);
                foreach ($productIds as $productId) {                    
                    $update = ArProduct::where('product_id', $productId)->first();
                    if ($update && $update->product_label_id == $removelabelId) {
                        $update->product_label_id = null;
                        $update->product_label_name = null;
                        $update->save();
                    }
                }
            }else {
                $labelName = ArProductLabel::where('label_id', $labelId)->value('label_name');
                foreach ($productIds as $productId) {
                    $update = ArProduct::where('product_id', $productId)->update([
                        'product_label_id'   => $labelId,
                        'product_label_name' => $labelName,
                    ]);
                }
            }
        }

        // 🔹 Featured / Recommended update
        if (!empty($request->fea_rec_change)) {
            foreach ($productIds as $productId) {
                switch ($request->fea_rec_change) {
                    case 1: $update = ArProduct::where('product_id', $productId)->update(['product_featured' => 1]); break;
                    case 2: $update = ArProduct::where('product_id', $productId)->update(['product_featured' => 0]); break;
                    case 3: $update = ArProduct::where('product_id', $productId)->update(['product_recommended' => 1]); break;
                    case 4: $update = ArProduct::where('product_id', $productId)->update(['product_recommended' => 0]); break;
                }
            }
        }

        return response()->json([
            'status'  => (bool) $update,
            'message' => $update ? 'Status Updated successfully!!' : 'Something went wrong!!',
            'type'    => $request->getstatus
        ], 200);
    }
    public function productcat(Request $request,$id=1){
        $getproducts=[];
        if($id == 1)
        {
            $type = 'all';    
            $getproducts = ArProduct::orderBy('product_id','DESC');   
        }else if($id == 3)
        {
            $type = 'inactive';    
            $getproducts = ArProduct::where('product_status',0)->orderBy('product_id','DESC');  
        }else if($id == 4)
        {
            $type = 'outofstock';    
            $getproducts = ArProduct::where('product_stock',0)->orderBy('product_id','DESC'); 
        }else{
            $type = 'active';
            $getproducts = ArProduct::where('product_status',1)->orderBy('product_id','DESC');
        }
        

        if($request->isMethod('post')) {
            Session::put('PRODUCT_FILTER', $request->all());
            Session::save();
        } 
        $aryFilterSession = array();
        if(Session::has('PRODUCT_FILTER')){
            $aryFilterSession = Session::get('PRODUCT_FILTER');
           if(isset($aryFilterSession) && isset($aryFilterSession['search_filter']) && $aryFilterSession['search_filter']!='')
            {
                $getproducts = ArProduct::where( 'product_uniqueid', 'LIKE', '%' . $aryFilterSession['search_filter'] . '%' )
                    ->orWhere( 'product_category_name', 'LIKE', '%' . $aryFilterSession['search_filter'] . '%' )
                    ->orWhere( 'product_name', 'LIKE', '%' . $aryFilterSession['search_filter'] . '%' )
                    ->orWhere( 'product_tag_name', 'LIKE', '%' . $aryFilterSession['search_filter'] . '%' )
                    ->orWhere( 'product_sku', 'LIKE', '%' . $aryFilterSession['search_filter'] . '%' )
                    ; 
                                        
            }
            if (isset($aryFilterSession['category_filter']) && $aryFilterSession['category_filter'] != '') {
                $categoryFilter = $aryFilterSession['category_filter'];
                $getcategories = ArProductByCategory::where('cpc_category_id', $categoryFilter)->pluck('cpc_product_id');
                $getproducts->whereIn('product_id', $getcategories) ;
            }
            if (isset($aryFilterSession['tag_filter']) && $aryFilterSession['tag_filter'] != '') {
                $categoryFilter = $aryFilterSession['tag_filter'];
                $gettag = ArProductByTag::where('pt_tag_id', $categoryFilter)->pluck('pt_product_id');
                $getproducts->whereIn('product_id', $gettag) ;
            }
            if (isset($aryFilterSession['label_filter']) && $aryFilterSession['label_filter'] != '') {
                $labelFilter = $aryFilterSession['label_filter'];
                $getproducts->where('product_label_id', $labelFilter) ;
            }
            if (isset($aryFilterSession['fea_rec']) && $aryFilterSession['fea_rec'] !== '') {
                $fea = (string) $aryFilterSession['fea_rec'];
                switch ($fea) {
                    case '1': // Featured
                        $getproducts->where('product_featured', 1);
                        break;
                    case '2': // Unfeatured
                        $getproducts->where('product_featured', 0);
                        break;
                    case '3': // Recommended
                        $getproducts->where('product_recommended', 1);
                        break;
                    case '4': // Unrecommended
                        $getproducts->where('product_recommended', 0);
                        break;
                }
            }
        }
        $getproducts = $getproducts->paginate(50);
        $labelData = ArProductLabel::where('label_status',1)->get();
        $title = 'Product';
        $countall = ArProduct::count(); 
        $countactive = ArProduct::where('product_status',1)->count();
        $countinactive = ArProduct::where('product_status',0)->count();  
        $countoutofstock = ArProduct::where('product_stock',0)->count();  
        $categoryDropdown = ArCategory::where('cat_status', 1)->get();
        $tagDropdown = ArProductTags::where('tag_status', 1)->get();
        return view('badmin.product.product_cat',compact('title','getproducts','countall','countactive','countinactive','type','aryFilterSession','countoutofstock','categoryDropdown','tagDropdown','labelData'));
    }
}   