<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArInstitutes extends Model
{
    use HasFactory;
    protected $primaryKey= 'institute_id';
	protected $table= 'ar_institutes';
}