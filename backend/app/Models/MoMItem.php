<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MoMItem extends Model
{
    use HasFactory;

    protected $table = 'mom_items';
    protected $fillable = [
        'mom_id', 'item_type', 'content',
        'sequence_order', 'assigned_to', 'due_date'
    ];

    public function mom()
    {
        return $this->belongsTo(MoM::class, 'mom_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    // app/Models/MoMItem.php

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

}
