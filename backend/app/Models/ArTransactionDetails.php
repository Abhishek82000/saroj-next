<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArTransactionDetails extends Model
{
    use HasFactory;
    protected $primaryKey= 'td_id';
	
	public function product()
    {
        return $this->belongsTo('App\Models\ArProduct', 'td_item_id');
    }
	
	public function taxrate()
    {
        return $this->belongsTo('App\Models\ArTaxRates', 'td_tax_id');
    }
	
	public function transaction()
    {
        return $this->belongsTo('App\Models\ArTransactions', 'td_trans_id');
    }
	public function seller()
    {
        return $this->belongsTo('App\Models\ArSeller', 'td_seller_id');
    }
}