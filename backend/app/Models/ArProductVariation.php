<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// use Illuminate\Database\Eloquent\SoftDeletes; //add this line

class ArProductVariation extends Model
{
    use HasFactory;
    // use SoftDeletes; //add this line
    protected $primaryKey = 'pv_id';
    protected $table = 'ar_product_variations';
}