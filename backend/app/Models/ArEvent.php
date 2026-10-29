<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class ArEvent extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
	protected $primaryKey= 'event_id';

    public static function boot()
    {
        parent::boot();
        static::created(function ($events) {
            $events->event_slug = $events->generateSlug($events->event_name);
            $events->save();
        });
    }
    public function generateSlug($name)
    {
        if (static::whereEventSlug($slug = Str::slug($name))->exists()) {
            $max = static::whereEventName($name)->latest('event_id')->skip(1)->value('event_slug');
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