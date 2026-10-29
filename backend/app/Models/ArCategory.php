<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class ArCategory extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

	protected $primaryKey= 'cat_id';
	protected $table= 'ar_category';

    public function parent()
    {
        return $this->belongsTo('App\Models\ArCategory', 'cat_parent');
    }

    public function children()
    {
        return $this->hasMany('App\Models\ArCategory', 'cat_parent');
    }
    public function hasManyProducts()
    {
        return $this->hasMany('App\Models\ArProductByCategory', 'cpc_category_id');
    }
     public static function boot()
    {
        parent::boot();
        static::created(function ($product) {
            $product->cat_slug = $product->generateSlug($product->cat_name);
            $product->save();
        });
    }
    public function generateSlug($name)
    {
        
        if (static::whereCatSlug($slug = Str::slug($name))->exists()) {
            $max = static::whereCatName($name)->latest('cat_id')->skip(1)->value('cat_slug');
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
    public function catProducts(){
        return $this->belongsToMany(ArProduct::class, 'ar_product_by_category', 'cpc_category_id', 'cpc_product_id', 'cat_id', 'product_id');
    }
    
}