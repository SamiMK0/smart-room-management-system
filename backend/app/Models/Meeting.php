<?php

// app/Models/Meeting.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    use HasFactory;

    protected $fillable = ['booking_id', 'title', 'agenda'];

    // Relationships
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function attendees()
    {
        return $this->hasMany(MeetingAttendee::class);
    }

    public function mom()
    {
        return $this->hasOne(MoM::class);
    }

    protected $appends = ['start_time', 'end_time'];

    public function getStartTimeAttribute()
    {
        return $this->booking->start_time;
    }

    public function getEndTimeAttribute()
    {
        return $this->booking->end_time;
    }
}
