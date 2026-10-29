<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ArProductAttribute extends Model
{
    use HasFactory;
    protected $primaryKey = 'attribute_id';

    public static function boot()
    {
        parent::boot();
        static::created(function ($attribute) {
            $attribute->attribute_slug = $attribute->generateSlug($attribute->attribute_name);
            $attribute->save();
        });
    }
    public function generateSlug($name)
    {
        
        if (static::whereAttributeSlug($slug = Str::slug($name))->exists()) {
            $max = static::whereAttributeName($name)->latest('attribute_id')->skip(1)->value('attribute_slug');
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

    public function attributeterms()
    {
        return $this->hasMany('App\Models\ArProductAttributeterms', 'terms_attribute_id');
    }
}