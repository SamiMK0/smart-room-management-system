<?php

// app/Models/FeatureName.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeatureName extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    // Relationships
    public function rooms()
    {
        return $this->belongsToMany(Room::class, 'room_features');
    }
}
