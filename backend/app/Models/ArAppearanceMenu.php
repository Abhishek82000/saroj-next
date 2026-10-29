<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class ArAppearanceMenu extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

	protected $primaryKey= 'menu_id';
    protected $table= 'ar_appearance_menu';

    public function pages()
    {
        return $this->belongsTo('App\Models\ArPages', 'menu_pageid');
    }
    
    public function categories()
    {
        return $this->belongsTo('App\Models\ArCategory', 'menu_categoryid');
    }

    public function parent()
    {
        return $this->belongsTo('App\Models\ArAppearanceMenu', 'menu_parent');
    }

    public function children()
    {
        return $this->hasMany('App\Models\ArAppearanceMenu', 'menu_parent');
    }

    public function subchildren()
    {
        return $this->hasMany('App\Models\ArAppearanceMenu', 'menu_parent');
    }
    
    public static function boot()
    {
        parent::boot();
        static::created(function ($product) {
            $product->menu_slug = $product->generateSlug($product->menu_name);
            $product->save();
        });
    }
    public function generateSlug($name)
    {
        if (static::whereMenuSlug($slug = Str::slug($name))->exists()) {
            $max = static::whereMenuName($name)->latest('menu_id')->skip(1)->value('menu_slug');
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