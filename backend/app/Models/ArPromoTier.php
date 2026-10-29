<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArPromoTier extends Model
{
    use HasFactory;
    protected $table = 'ar_promo_tiers';
    protected $primaryKey = 'tier_id';
    protected $guarded = [];
}