<?php

namespace App\Models;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class ArProductLabel extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

	protected $primaryKey= 'label_id';
    protected $table = 'ar_product_label';
    
    public static function boot()
    {
        parent::boot();
        static::created(function ($label) {
            $label->label_slug = $label->generateSlug($label->label_name);
            $label->save();
        });
    }
    
    public function generateSlug($name)
    {
        if (static::whereLabelSlug($slug = Str::slug($name))->exists()) {
            $max = static::whereLabelName($name)->latest('label_id')->skip(1)->value('label_slug');
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
}