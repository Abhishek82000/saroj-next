<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArProductByCategory extends Model
{
    use HasFactory;
    protected $table='ar_product_by_category';
    protected $primaryKey='cpc_id';
}