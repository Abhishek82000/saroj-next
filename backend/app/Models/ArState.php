<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArState extends Model
{
    use HasFactory;
    protected $primaryKey = 'state_id'; 
    protected $table = 'ar_states';
}