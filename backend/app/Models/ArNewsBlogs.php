<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class ArNewsBlogs extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'ar_newsblogs';
	protected $primaryKey= 'blog_id';

    public function categories()
    {
        return $this->belongsTo('App\Models\ArNewsBlogsCategories','blog_category_id');
    }
}