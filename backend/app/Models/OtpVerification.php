<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OtpVerification extends Model
{
    use HasFactory;
    protected $table='otp_verifications';
    protected $primaryKey='id';
    protected $fillable = [
        'user_id',
        'mobile',
        'otp_hash',
        'challenge_token_hash',
        'expires_at',
        'attempts',
        'verified_at',
    ];
    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
    ];
}