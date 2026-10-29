<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArProductAttributeterms extends Model
{
    use HasFactory;
    protected $primaryKey = 'terms_id';
    protected $table = 'ar_product_attributeterms';
}