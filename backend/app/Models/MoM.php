<?php

// app/Models/MoM.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MoM extends Model
{
    use HasFactory;

    protected $table = 'moms';

    protected $fillable = ['meeting_id', 'created_by'];

    // Relationships
    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(MoMItem::class, 'mom_id');
    }
}
