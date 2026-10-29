<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArShippingPincode extends Model
{
    use HasFactory;
    protected $primaryKey = 'shipping_pincodes_id';
    protected $fillable = ['shipping_pincodes'];
}