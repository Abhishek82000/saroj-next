<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArPromos extends Model
{
    use HasFactory;
    protected $table='ar_promos';
    protected $primaryKey='promo_id';

    public function tiers() {
        return $this->hasMany(ArPromoTier::class, 'promo_id', 'promo_id')->orderBy('tier_min_amount');
    }
}