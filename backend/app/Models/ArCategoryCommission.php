<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArCategoryCommission extends Model
{
    use HasFactory;
    protected $primaryKey= 'cc_id';
	protected $table= 'ar_category_commission';

    public function category()
    {
        return $this->belongsTo('App\Models\ArCategory','cc_category_id');
    } 
}