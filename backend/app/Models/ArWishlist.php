<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArWishlist extends Model
{
	use HasFactory;
	protected $primaryKey= 'wish_id';
	protected $table= 'ar_wishlist';
	
	public function product()
    {
        return $this->belongsTo('App\Models\ArProduct', 'wish_product_id');
    }
}