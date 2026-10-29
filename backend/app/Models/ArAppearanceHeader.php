<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class ArAppearanceHeader extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

	protected $primaryKey= 'header_id';

    protected $table = 'ar_appearance_header';
    
    public static function boot()
    {
        parent::boot();
        static::created(function ($header) {
            $header->header_slug = $header->generateSlug($header->header_name);
            $header->save();
        });
    }
    
    public function generateSlug($name)
    {
        if (static::whereHeaderSlug($slug = Str::slug($name))->exists()) {
            $max = static::whereHeaderName($name)->latest('header_id')->skip(1)->value('header_slug');
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