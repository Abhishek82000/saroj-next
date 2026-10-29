<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArCart extends Model
{
    use HasFactory;
    protected $primaryKey= 'cart_id';
	protected $table= 'ar_cart';

    public function product()
    {
        return $this->belongsTo('App\Models\ArProduct', 'cart_product_id');
    }
	public function user()
    {
        return $this->belongsTo('App\Models\ArUsers', 'cart_user_id');
    }
	public function variation()
    {
        return $this->belongsTo('App\Models\ArProductVariation', 'cart_variation_id');
    }
}