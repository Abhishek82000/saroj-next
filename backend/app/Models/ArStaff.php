<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArStaff extends Model
{
    use HasFactory;
    protected $primaryKey= 'staff_id';
    protected $table= 'ar_staffs';

	public function belongstoRole(){
       return $this->belongsTo(ArRole::class, 'staff_role');
    }
    
}
