<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArUniqueIds extends Model
{
    use HasFactory;
    protected $table='ar_unique_ids';
    protected $primaryKey='ui_id';
}