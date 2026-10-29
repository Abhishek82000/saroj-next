<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArProductBrand extends Model
{
    use HasFactory;
    protected $table='ar_product_brand';
    protected $primaryKey='brand_id';
}