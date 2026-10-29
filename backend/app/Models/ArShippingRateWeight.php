<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArShippingRateWeight extends Model
{
    use HasFactory;
    protected $primaryKey = 'srw_id';
    protected $table = 'ar_shipping_rate_weight';
}