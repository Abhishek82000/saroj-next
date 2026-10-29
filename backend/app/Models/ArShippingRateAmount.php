<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArShippingRateAmount extends Model
{
    use HasFactory;
    protected $primaryKey = 'sra_id';
    protected $table = 'ar_shipping_rate_amount';
}