<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class ArNewsBlogsCategories extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table= 'ar_newsblogs_categories';
	protected $primaryKey= 'category_id';

    public function parent()
    {
        return $this->belongsTo('App\Models\ArNewsBlogsCategories', 'category_parent');
    }

    public function children()
    {
        return $this->hasMany('App\Models\ArNewsBlogsCategories', 'category_parent');
    }

    public function blogs()
{
    return $this->hasMany(ArNewsBlogs::class, 'blog_category_id', 'category_id');
}
    
}