<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
// use Illuminate\Database\Eloquent\SoftDeletes; //add this line

class ArProduct extends Model
{
    use HasFactory;
    // use SoftDeletes; //add this line
    protected $primaryKey = 'product_id';
    protected $table= 'ar_products';

    public static function boot()
    {
        parent::boot();
        static::created(function ($brand) {
            $brand->product_slug = $brand->generateSlug($brand->product_name);
            $brand->save();
        });
    }
    public function generateSlug($name)
    {
        if (static::whereProductSlug($slug = Str::slug($name))->exists()) {
            $max = static::whereProductName($name)->latest('product_id')->skip(1)->value('product_slug');
            if (isset($max[-1]) && is_numeric($max[-1])) {
                return preg_replace_callback('/(\d+)$/', function($mathces) {
                    return $mathces[1] + 1;
                }, $max);
               
            }
             return "{$slug}-1";
        }else{
            return $slug;
        }
        
    }   
	
	public function gallery()
    {
        return $this->hasMany('App\Models\ArProductGallery','gallery_product_id');
    }
	public function images()
    {
        return $this->hasMany('App\Models\ArProductImages','image_productid');
    }
	public function productByCat()
    {
        return $this->hasMany('App\Models\ArProductByCategory','cpc_product_id');
    }
    public function productAttributeDetails()
    {
        return $this->hasMany('App\Models\ArProductAttributeDetail','attribute_details_proid');
    }
    public function productVariations()
    {
        return $this->hasMany('App\Models\ArProductVariation','pv_product_id');
    }

    public function defaultVariation()
    {
        return $this->hasMany('App\Models\ArProductVariation','pv_product_id')->where('pv_default',1);
    }

	public function productTabs()
    {
        return $this->hasMany('App\Models\ArProductTabs','tab_product_id')->orderBy('tab_order','ASC');
    } 
    public function taxBelongsTo()
    {
        return $this->belongsTo('App\Models\ArTaxRates','product_tax_id');
    } 
    public function hasManyReviews()
    {
        return $this->hasMany('App\Models\ArProductReview', 'pr_product_id')->where('pr_status', '=', 1);
    }
    public function hasManyCart()
    {
        return $this->hasMany('App\Models\ArCart', 'cart_product_id');
    }
    
}