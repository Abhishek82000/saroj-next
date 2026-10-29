<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArProductResults extends Model
{
    use HasFactory;
    protected $primaryKey = 'result_id';
    protected $table = 'ar_product_result';
}
