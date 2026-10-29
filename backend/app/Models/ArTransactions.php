<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArTransactions extends Model
{
    use HasFactory;
    protected $primaryKey= 'trans_id';

    public function items(){
        return $this->hasMany('App\Models\ArTransactionDetails','td_trans_id');
    }

      
}