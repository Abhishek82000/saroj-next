<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArAppearanceSlider extends Model
{
    use HasFactory;
    protected $table='ar_appearance_slider';
    protected $primaryKey='slider_id';
	
	public function category()
    {
        return $this->belongsTo('App\Models\ArCategory', 'slider_category');
    }
	
	public function tag()
    {
        return $this->belongsTo('App\Models\ArProductTags', 'slider_tags');
    }
}