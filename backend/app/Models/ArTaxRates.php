<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArTaxRates extends Model
{
    use HasFactory;
    protected $table='ar_tax_rates';
    protected $primaryKey='tax_id';
}