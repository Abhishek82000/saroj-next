<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArProductGallery extends Model
{
    use HasFactory;
    protected $primaryKey = 'gallery_id';
    protected $table = 'ar_product_gallery';
}
