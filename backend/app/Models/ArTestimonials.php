<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArTestimonials extends Model
{
    use HasFactory;
    protected $primaryKey = 'testimonial_id'; 
	protected $table = 'ar_testimonials';
}