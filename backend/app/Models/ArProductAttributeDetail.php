<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArProductAttributeDetail extends Model
{
    use HasFactory;
	protected $table = 'ar_product_attribute_details';
    protected $primaryKey = 'attribute_details_id';

    public function attributes()
    {
        return $this->belongsTo('App\Models\ArProductAttribute', 'attribute_details_attid');
    }
}
