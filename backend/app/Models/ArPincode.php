<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArPincode extends Model
{
    use HasFactory;
    protected $table='ar_pincode';
    protected $primaryKey='pin_id';
	
	public function pinstate()
    {
        return $this->belongsTo('App\Models\ArState', 'pin_state_id');
    }
	public function pincity()
    {
        return $this->belongsTo('App\Models\ArCities', 'pin_city_id');
    }
}