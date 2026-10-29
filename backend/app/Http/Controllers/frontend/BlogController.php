<?php 
namespace App\Http\Controllers\frontend;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArNewsBlogs;
use App\Models\ArNewsBlogsCategories;
use App\Models\ArNewsBlogsTags;
use App\Models\ArPages;
use DB;
use Hash;
use URL;

class BlogController extends Controller
{
    public function blog_list(){
        
        $getblogs = ArNewsBlogs::where('blog_status',1)->orderBy('blog_id','DESC')->with(['categories'])->paginate(10);
        
        $blogCategories = ArNewsBlogsCategories::where('category_status',1)->withCount('blogs')->orderBy('category_id','DESC')->get();
        $blogTags = ArNewsBlogsTags::where('tag_status',1)->orderBy('tag_id','DESC')->get();
        $blogs = ArNewsBlogs::where('blog_status',1)->orderBy('blog_id','DESC')->limit(3)->get();
        
        $getpagedetails = ArPages::where('page_url','blog')->first();
        $defaultimage = env('NO_IMAGE');
        $blog_url =  env('BLOG_IMAGE').'/';
        $strTitle = 'Blogs';
        $meta_keyword = "Blogs";
        $meta_description = "Blogs";
		$meta_title = "Blogs";
		
        return view('frontend.blogs.blog_list',compact('strTitle','getblogs','blog_url','defaultimage','getpagedetails','meta_keyword','meta_description','meta_title','blogCategories','blogTags','blogs'));
    }

    public function blog_by_category($slug=null){
        
        $getpagedetails='';
        $category = ArNewsBlogsCategories::where('category_slug',$slug)->first();
        $getblogs = ArNewsBlogs::where('blog_status',1)->orderBy('blog_id','DESC')->whereRaw('FIND_IN_SET(?, blog_category_id)', [$category->category_id])->get();
        $defaultimage = env('NO_IMAGE');
        $blog_url =  env('BLOG_IMAGE').'/';
        $strTitle = 'Blogs';
		 $meta_keyword = "Blogs";
        $meta_description = "Blogs";
		$meta_title = "Blogs";
        return view('frontend.blogs.blogsbycategory',compact('strTitle','meta_keyword','meta_description','meta_title','getblogs','blog_url','getpagedetails','defaultimage','category'));
    }

    public function blog_by_tags($id=null){
        
        $getpagedetails='';
        $tags = ArNewsBlogsTags::where('tag_id',$id)->first();
        $getblogs = ArNewsBlogs::where('blog_status',1)->orderBy('blog_id','DESC')->whereRaw('FIND_IN_SET(?, blog_tag_id)', [$id])->get();
        $blogCategories = ArNewsBlogsCategories::where('category_status',1)->orderBy('category_id','DESC')->get();
        $blogTags = ArNewsBlogsTags::where('tag_status',1)->orderBy('tag_id','DESC')->get();
        $blogs = ArNewsBlogs::where('blog_status',1)->orderBy('blog_id','DESC')->limit(3)->get();
        $defaultimage = env('NO_IMAGE');
        $blog_url =  env('BLOG_IMAGE').'/';
        $strTitle = 'Blogs';
        return view('frontend.blogs.blogsbytags',compact('strTitle','getblogs','blog_url','getpagedetails','defaultimage','tags','blogCategories','blogTags','blogs'));
    }

    public function blog_detail($slug = null)
    {
        if (is_null($slug) || empty($slug)) {
            return redirect()->back()->with('error', 'Blog not found.');
        }

        $blog_url = env('BLOG_IMAGE') . '/';
        $defaultimage = env('NO_IMAGE');
        $strTitle = 'Blogs';
        $meta_keyword = "";
        $meta_description = "";
        $meta_title = "";

        $getblog = ArNewsBlogs::where('blog_slug', $slug)->first();

        if (!isset($getblog) || $getblog->blog_id <= 0) {
            return redirect()->back()->with('error', 'Blog not found.');
        }

        $title = $getblog->blog_name;
        $meta_keyword = $getblog->blog_meta_keyword;
        $meta_description = $getblog->blog_meta_desc;
        $meta_title = $getblog->blog_meta_title;
        $explodeCat = explode(',', $getblog->blog_prod_category_id);
        $strCondition = 'select * from ar_products where product_status = 1 AND (';
        foreach ($explodeCat as $Key => $label) {
            if ($Key != 0) {
                $strCondition .= ' OR';
            }
            $strCondition .= ' FIND_IN_SET(' . $label . ', product_category_id)';
        }
        $strCondition .= ') ORDER BY product_id DESC LIMIT 10';
        $related_products = DB::select($strCondition);
        $blogs = ArNewsBlogs::where('blog_status', 1)->orderBy('blog_id', 'DESC')->limit(5)->get();
        $blogCategories = ArNewsBlogsCategories::where('category_status', 1)->orderBy('category_id', 'DESC')->get();
        $relatedTags = ArNewsBlogsTags::whereIn('tag_id', explode(',', $getblog->blog_tag_id))->get();

        foreach ($blogCategories as $key => $value) {
            $value['blogCatCount'] = ArNewsBlogs::whereRaw('FIND_IN_SET(?, blog_category_id)', [$value->category_id])
                ->where('blog_status', 1)
                ->count();
        }

        $blogTags = ArNewsBlogsTags::where('tag_status', 1)->orderBy('tag_id', 'DESC')->get();

        $blogCatIdArr = explode(',', $getblog->blog_category_id); 
        $relatedblogs = ArNewsBlogs::where('blog_status', 1)->where('blog_id', '!=', $getblog->blog_id)
                ->where(function($query) use ($blogCatIdArr) {
                    foreach ($blogCatIdArr as $catId) {
                        $query->orWhereRaw('FIND_IN_SET(?, blog_category_id)', [$catId]);
                    }
                })
                ->orderBy('blog_id', 'DESC')
                ->take(7)
                ->get();
                // Previous blog (smaller ID)
        $previous = ArNewsBlogs::where('blog_id', '<', $getblog->blog_id)
            ->where('blog_status', 1)
            ->orderBy('blog_id', 'desc')
            ->first();

        // Next blog (greater ID)
        $next = ArNewsBlogs::where('blog_id', '>', $getblog->blog_id)
            ->where('blog_status', 1)
            ->orderBy('blog_id', 'asc')
            ->first();

        return view('frontend.blogs.blog_detail', compact('strTitle','getblog','blog_url','defaultimage','blogCategories','blogTags','blogs','meta_keyword','meta_description','meta_title','relatedTags','relatedblogs','next','previous','related_products'));
    }
    public function blogUrl($type,$id)
    {
        
        $strTitle = 'Blogs';
        $categories = array();
        $category = array();
        $tags = array();
        $currentURL = URL::current();
        $slug = str_replace(env('SITE_URL'),'',$currentURL);
        $getpagedetails = ArPages::where('page_url',$slug)->first();
        $blogs = ArNewsBlogs::where('blog_status',1)->orderBy('blog_id','DESC')->limit(3)->get();
        $blogCategories = ArNewsBlogsCategories::where('category_status',1)->orderBy('category_id','DESC')->get();
        $blogTags = ArNewsBlogsTags::where('tag_status',1)->orderBy('tag_id','DESC')->get();
        if(isset($type) && $type !=''){
            if($type == 'category'){
                $category = ArNewsBlogsCategories::where('category_slug',$id)->first();
                $getblogs = ArNewsBlogs::whereRaw('FIND_IN_SET(?, blog_category_id)', [$category->category_id])->where('blog_status',1)->orderBy('blog_id','DESC')->paginate(20);
            }else{
                
                $getblogs = ArNewsBlogs::whereRaw('FIND_IN_SET(?, blog_tag_id)', [$id])->where('blog_status',1)->orderBy('blog_id','DESC')->paginate(20);
            }
        }
        $defaultimage = env('NO_IMAGE');
        $blog_url =  env('BLOG_IMAGE').'/';
		$meta_keyword = "Blogs";
        $meta_description = "Blogs";
		$meta_title = "Blogs";
        return view('frontend.blogs.blog_list',compact('strTitle','meta_keyword','meta_description','meta_title','getblogs','blog_url','defaultimage','getpagedetails','blogCategories','blogTags','blogs'));
    }

}