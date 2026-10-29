<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArProductByTag extends Model
{
    use HasFactory;
    protected $table='ar_product_by_tag';
    protected $primaryKey='pt_id';
}