<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArProductAddons extends Model
{
    use HasFactory;
    protected $primaryKey= 'addons_id';
	protected $table= 'ar_product_addons';
}