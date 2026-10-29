<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use App\Models\ArThemeAdmin;
use App\Models\ArCategory;
use App\Models\ArProduct;
use App\Models\ArPages;
use App\Models\ArAppearanceHeader;
use App\Models\ArUsers;
use App\Models\ArFooter;
use App\Models\ArAppearanceMenu;
use App\Models\ArAppearanceSlider;
use App\Models\ArPromos;
use App\Models\ArProductTags;
use App\Models\ArStaff;
use App\Models\ArPermission;
use View;
use URL;
use Session;
class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;
	protected $site_settings,$getfooter,$getloginsliders,$getPageurl,$resSideCouponsData;
	protected $pagedata;
  	
	public function __construct() 
     {
        $this->settingData = ArThemeAdmin::first();
 
        $resCategoryData = ArCategory::where('cat_parent',0)->get();
         
        foreach($resCategoryData as $value)
        {
          $value['categorychild'] = ArCategory::where('cat_parent',$value->cat_id)->get();
        }
        $currDateTime = date("Y-m-d");
        $this->featuredcategory = ArCategory::where('cat_featured',1)->where('cat_status',1)->orderBy('cat_order','ASC')->get();
        $this->getfooter = ArFooter::where('footer_id', 1)->first();
        $this->getMenuDatas = ArAppearanceMenu::with(['children' => function($query) { $query->with(['pages','categories'])->orderBy('menu_order','ASC');}])->where('menu_parent',0)->where('menu_status', 1)->with(['pages'])->orderBy('menu_order','ASC')->get(); 
        $this->getloginsliders = ArAppearanceSlider::where('slider_status',1)->where('slider_position',7)->first();
        $this->resCategoryTreeData = ArAppearanceMenu::where('menu_status', 1)->with(['pages','categories'])->orderBy('menu_order','ASC')->get()->toArray(); 
        $this->aryCategoryList =self::buildTreeWeb($this->resCategoryTreeData);
        $this->resSideCouponsData = ArPromos::where('promo_status',1)->where('promo_type',0)->where('promo_valid_to','>',$currDateTime)->orderBy('promo_id','DESC')->get();
        $isthisWholesale = false;
        if (request()->is('wholesale*')) {
            $isthisWholesale = true;
        }

        //View::share('pagedata', $this->pagedata);
        View::share('resCategoryData', $resCategoryData);
        View::share('settingData', $this->settingData);
        View::share('featuredcategory', $this->featuredcategory);
        View::share('getfooter', $this->getfooter);
        View::share('getMenuDatas', $this->getMenuDatas);
        View::share('getloginsliders', $this->getloginsliders);
        View::share('aryCategoryList', $this->aryCategoryList);
        //View::share('getPageurl', $this->getPageurl);
        View::share('resSideCouponsData', $this->resSideCouponsData);
        View::share('isthisWholesale', $isthisWholesale);

        //Multiple Login 
        $this->middleware(function ($request, $next) {
            if(\Session::get("B_ADMIN") != null) {
                $user = \Session::get("B_ADMIN");
                $user_type=$user->type;
                $id = $user->id;
                if($user_type == '2')
                {
                    $resuserData = ArStaff::where('staff_id', $id)->first();
                    $name = $resuserData->staff_name;
                    $permission = explode(',',$resuserData->staff_role);
                    $permissionData = ArPermission::whereIn('permission_role_id',$permission)->where('permission_status',1)->get()->pluck('permission_type')->unique()->toArray(); 
                
                }
                else if($user_type == '1')
                {
                    $resuserData = ArThemeAdmin::where('id', $id)->first();
                    $name = $resuserData->admin_name;
                    $permission = explode(',',1);
                    $permissionData = ArPermission::whereIn('permission_role_id',$permission)->where('permission_status',1)->get()->pluck('permission_type')->unique()->toArray(); 

                }else{
                    $resuserData = "";
                    $name = "";
                    $permissionData = ""; 
                }
                View::share(compact('resuserData','name','permissionData','user','user_type'));
            }
            // return $request;
            return $next($request);
        });
     }

     public function buildTreeWeb(array $elements, $parentId = 0) {
      $branch = array();
      foreach ($elements as $element) {
          if ($element['menu_parent'] == $parentId) {
              $children = $this->buildTreeWeb($elements, $element['menu_id']);
              if ($children) {
                  $element['children'] = $children;
              }
              $branch[] = $element;
          }
      }
      return $branch;
     }
}
