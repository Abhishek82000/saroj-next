<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArPartner extends Model
{
    use HasFactory;
    protected $primaryKey= 'partner_id';
	protected $table= 'ar_partner';
}