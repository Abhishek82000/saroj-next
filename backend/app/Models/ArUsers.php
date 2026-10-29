<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class ArUsers extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'ar_users';
    protected $primaryKey = 'user_id';

    public function address()
    {
        return $this->hasMany(
            ArUserAddress::class,
            'ua_user_id'
        );
    }
}