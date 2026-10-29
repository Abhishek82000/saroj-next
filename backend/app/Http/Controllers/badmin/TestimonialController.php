<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArTestimonials;
use Hash;


class TestimonialController extends Controller
{
    public function testimonial(){
        $title='Testimonials';
        $testimonial = ArTestimonials::orderBy('testimonial_id','DESC')->paginate(50);

        return view('badmin.testimonials.testimonial',compact('title','testimonial'));
    }
	
    public function addtestimonial($id=0){
        $title='Add Testimonials';
        $gettestimonialdetails= array();
        if (isset($id) && $id > 0) {
            $gettestimonialdetails = ArTestimonials::where('testimonial_id',$id)->first();
        }
        return view('badmin.testimonials.addtestimonial',compact('title','gettestimonialdetails'));
    }    
    
    public function testimonialprocess(Request $request){
         if ($request->isMethod('post')) 
         {
            $requestData = $request->all();
			  $request->validate([
                        'author_name' => 'required',
                    ]);
                if (isset($requestData['testimonial_id']) && $requestData['testimonial_id'] > 0) {
                    $testimonialdata = ArTestimonials::where('testimonial_id',$requestData['testimonial_id'])->first();
                }else{
                   
                    $testimonialdata = new ArTestimonials;
                }
                $testimonialdata->testimonial_name = $requestData['author_name'];
                $testimonialdata->testimonial_desc = $requestData['testimonial_desc'];
                $testimonialdata->testimonial_rating = $requestData['testimonial_rating'];
                
                 if($request->hasFile('testimonial_image_')){
                    $image = $request->file('testimonial_image_');
                    $name = time().'.'.$image->getClientOriginalExtension();
                    $destinationPath = public_path(env('SITE_UPLOAD_PATH')."testimonial");
                    $image->move($destinationPath, $name);
                    $testimonialdata->testimonial_image=$name;
                } 
                else{
                    $testimonialdata->testimonial_image = $testimonialdata->testimonial_image;
                }
                
                if($testimonialdata->save()){
                    
                if (isset($requestData['testimonial_id']) && $requestData['testimonial_id'] > 0) {
                return redirect()->route('badmin.testimonial')->with('success', 'Testimonial Updated Successfully');
                }else{
                return redirect()->route('badmin.testimonial')->with('success', 'Testimonial Added Successfully');
                }
                }
            }else{
            return redirect()->back()->with('error', 'Invalid Method');
             }
    }
    
	public function testimonialfeatured($id=null,$status=null)
    {
        $testimonialdata = ArTestimonials::where('testimonial_id',$id)->first();
        if($testimonialdata->testimonial_featured == 0)
        {
            $testimonialdata->testimonial_featured = 1;
        } else{
            $testimonialdata->testimonial_featured = 0;
        }
        if ($testimonialdata->save())
        {
            return redirect()->back()->with('success', 'Featured Updated Successfully');
        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }
    
    public function testimonialstatus($id){
        $testimonial = ArTestimonials::where('testimonial_id',$id)->first();
        if($testimonial->testimonial_status == 0)
        {
        $testimonial->testimonial_status = 1;
        }
        else{
            $testimonial->testimonial_status = 0;
        }
        if ($testimonial->save()) {
            return redirect()->back()->with('success', 'Status Updated Successfully');

        }
        return redirect()->back()->with('error', 'Something Went Wrong');
    }
    
    public function deletetestimonial($id){
			 if($id>0){
						ArTestimonials::where('testimonial_id',$id)->delete();
                       
						return redirect()->route('badmin.testimonial')->with('success', 'Testimonial Deleted Successfully');
					}
	}
			
        
        

}