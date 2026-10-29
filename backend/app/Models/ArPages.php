<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArPages extends Model
{
    use HasFactory;
    protected $table='ar_pages';
    protected $primaryKey='page_id';
}