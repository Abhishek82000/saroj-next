<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArFaqs extends Model
{
    use HasFactory;
    protected $primaryKey= 'faq_id';
	protected $table= 'ar_faqs';
}