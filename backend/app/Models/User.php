<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'picture'
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    // Relationships
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function meetingAttendees()
    {
        return $this->hasMany(MeetingAttendee::class);
    }

    public function createdMoms()
    {
        return $this->hasMany(MoM::class, 'created_by');
    }

    public function assignedActionItems()
    {
        return $this->hasMany(MoMItem::class, 'assigned_to')->where('item_type', 'action_item');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
