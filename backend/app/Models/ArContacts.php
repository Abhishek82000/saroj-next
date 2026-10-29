<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArContacts extends Model
{
    use HasFactory;
    protected $primaryKey= 'contact_id';
	protected $table= 'ar_contacts';
}