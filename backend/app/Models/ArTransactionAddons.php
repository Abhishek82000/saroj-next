<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArTransactionAddons extends Model
{
    use HasFactory;
    protected $table='ar_transaction_addons';
    protected $primaryKey='ta_id';
  
}