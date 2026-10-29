<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArNewsletter extends Model
{
    use HasFactory;
    protected $table='ar_newsletter';
    protected $primaryKey='newsletter_id';
}