<?php

// app/Models/Room.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'capacity', 'location'];

    // Relationships
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function features()
    {
        return $this->belongsToMany(FeatureName::class, 'room_features');
    }
}
