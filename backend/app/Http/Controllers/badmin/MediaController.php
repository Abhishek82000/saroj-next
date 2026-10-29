<?php

namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArMedia;
use Illuminate\Support\Facades\File; 

class MediaController extends Controller
{
    public function media($id=0)
    {
        $title='Media';
        $mediaIdData= array();
        $mediaIdData = ArMedia::orderBy('media_id','DESC')->paginate(50);
        return view('badmin.medias.media',compact('title','mediaIdData'));
    }

    public function addmedia($id=0)
    {
        $title='Add Media';
        $mediaIdData = array();
        if(isset($id) && $id>0){
            $mediaIdData = ArMedia::where('media_id',$id)->first();
        }
        return view('badmin.medias.add_media',compact('title','mediaIdData'));
    }
    
    public function mediaProcess(Request $request)
    {
        if ($request->isMethod('post'))
        {
            $requestData = $request->all();
            if (isset($requestData['media_id']) && $requestData['media_id'] > 0)
            {
                $mediaObj = ArMedia::where('media_id',$requestData['media_id'])->first();
            }else{
                 $request->validate([
                    'media' => 'required',
                ]);
                $mediaObj = new ArMedia;
            }
            if($request->hasFile('media'))
            {
                $image = $request->file('media');
                $name = rand(0000,9999).time().'.'.$image->getClientOriginalExtension();

                $destinationPath = public_path("img/uploads/media");
                $localPath = $destinationPath . '/' . $name;

                $image->move($destinationPath, $name);

                $bunny = new \App\Services\Bunny();
                $cdnUrl = $bunny->upload('media/' . $name, file_get_contents($localPath));

                if(!$cdnUrl){
                    return response()->json(['error' => 'Upload failed'], 500);
                }
                $mediaObj->media = $name;
                $mediaObj->media_cdn_url = $cdnUrl;

            }

            if($mediaObj->save())
            {
                if (isset($requestData['media_id']) && $requestData['media_id'] > 0) {
                    return redirect()->route('badmin.media')->with('success', 'Media Updated Successfully');
                }else{
                    return redirect()->route('badmin.media')->with('success', 'Media Added Successfully');
                }
            }
        }else{
                return redirect()->route('badmin.media')->with('error', 'Invalid Method');
            }
    }
    
    public function deletemedia($id)
    {
        $getImage =  ArMedia::where('media_id',$id)->first();
        $image_path = public_path("img/uploads/media/".$getImage->media);
        if(File::exists($image_path)) {
            File::delete($image_path);
        }
         $deletedata =  ArMedia::where('media_id',$id)->delete();
         if($deletedata){
                return redirect()->back()->with('success', 'Media Deleted Successfully');
         }else{
                return redirect()->back()->with('error', 'Something went wrong. Please try again!!');
         }
    }

}