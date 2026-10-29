<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArShippingAgency extends Model
{
    use HasFactory;
    protected $primaryKey = 'agency_id';
    protected $table = 'ar_shipping_agency';
}