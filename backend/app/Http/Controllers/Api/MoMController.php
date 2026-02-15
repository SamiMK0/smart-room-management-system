<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\MoM;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;


class MoMController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        // $this->middleware('role:admin');
    }

    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            return MoM::with(['meeting', 'creator', 'items'])->get();
        }

        // For regular users, return only MoMs they created or are assigned to
        return MoM::with(['meeting', 'creator', 'items'])
            ->where('created_by', $user->id)
            ->orWhereHas('meeting.attendees', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get();
    }

    // In MoMController.php

public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'meeting_id' => 'required|exists:meetings,id',
        'created_by' => 'required|exists:users,id',
        'items' => 'required|array',
        'items.*.item_type' => 'required|in:discussion,decision,action_item',
        'items.*.content' => 'required|string',
        'items.*.sequence_order' => 'required|integer',
        'items.*.assigned_to' => 'required_if:items.*.item_type,action_item|nullable|exists:users,id',
        'items.*.due_date' => 'required_if:items.*.item_type,action_item|nullable|date',
        'items.*.duration' => 'sometimes|nullable|string',
        'items.*.priority' => 'sometimes|nullable|in:low,medium,high'
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 400);
    }

    $user = Auth::user();
    $meeting = Meeting::with('attendees')->find($request->meeting_id);

    if (!$meeting) {
        return response()->json(['message' => 'Meeting not found'], 404);
    }

    // Authorization check
    $isOrganizer = $meeting->booking->user_id === $user->id;
    $isAttendee = $meeting->attendees->contains('user_id', $user->id);

    if (!$isOrganizer && !$isAttendee && $user->role !== 'admin') {
        return response()->json(['message' => 'Unauthorized to create MoM for this meeting'], 403);
    }

    try {
        $mom = MoM::create([
            'meeting_id' => $request->meeting_id,
            'created_by' => $request->created_by
        ]);

        // Create items with proper relationships
        $items = collect($request->items)->map(function ($item) use ($mom) {
            return [
                'mom_id' => $mom->id,
                'item_type' => $item['item_type'],
                'content' => $item['content'],
                'sequence_order' => $item['sequence_order'],
                'assigned_to' => $item['assigned_to'] ?? null,
                'due_date' => $item['due_date'] ?? null,
                'duration' => $item['duration'] ?? null,
                'priority' => $item['priority'] ?? null,
                'user_id' => auth()->id() // Track who created the item
            ];
        });

        $mom->items()->createMany($items->toArray());

        return response()->json($mom->load(['meeting', 'creator', 'items.assignee']), 201);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Failed to create MoM',
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function show($id)
    {
        $mom = MoM::with(['meeting.attendees', 'creator', 'items'])->find($id);
        if (!$mom) {
            return response()->json(['message' => 'MoM not found'], 404);
        }

        $user = Auth::user();
        $isAttendee = $mom->meeting->attendees->pluck('user_id')->contains($user->id);
        $isOrganizer = $mom->meeting->booking->user_id === $user->id;

        if ($user->role !== 'admin' && !$isAttendee && !$isOrganizer) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $mom;
    }

    public function update(Request $request, $id)
    {
        $mom = MoM::with('creator')->find($id);
        if (!$mom) {
            return response()->json(['message' => 'MoM not found'], 404);
        }

        $user = Auth::user();
        if ($user->role !== 'admin' && $mom->created_by !== $user->id) {
            return response()->json(['message' => 'Only creator or admin can update'], 403);
        }

        $validator = Validator::make($request->all(), [
            'meeting_id' => 'sometimes|exists:meetings,id|unique:moms,meeting_id,' . $mom->id,
            'created_by' => 'sometimes|exists:users,id',
            'items' => 'sometimes|array',
            'items.*.item_type' => 'required_with:items|in:discussion,decision,action_item',
            'items.*.content' => 'required_with:items|string',
            'items.*.sequence_order' => 'required_with:items|integer',
            'items.*.assigned_to' => 'required_if:items.*.item_type,action_item|exists:users,id',
            'items.*.due_date' => 'required_if:items.*.item_type,action_item|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $mom->update($request->only(['meeting_id', 'created_by']));

        if ($request->has('items')) {
            $mom->items()->delete();
            $mom->items()->createMany($request->items);
        }

        return response()->json($mom->load(['meeting', 'creator', 'items']));
    }

    public function destroy($id)
    {
        $mom = MoM::find($id);
        if (!$mom) {
            return response()->json(['message' => 'MoM not found'], 404);
        }

        $user = Auth::user();
        if ($user->role !== 'admin' && $mom->created_by !== $user->id) {
            return response()->json(['message' => 'Only creator or admin can delete'], 403);
        }

        $mom->delete();
        return response()->json(['message' => 'MoM deleted successfully']);
    }

    public function getByMeeting($meetingId)
    {
        $user = Auth::user();
        $mom = MoM::with(['meeting', 'creator', 'items'])
            ->where('meeting_id', $meetingId)
            ->first();

        if (!$mom) {
            return response()->json(['message' => 'MoM not found for this meeting'], 404);
        }

        // Check if user is authorized (attendee, organizer, or admin)
        $isAttendee = $mom->meeting->attendees->pluck('user_id')->contains($user->id);
        $isOrganizer = $mom->meeting->booking->user_id === $user->id;

        if ($user->role !== 'admin' && !$isAttendee && !$isOrganizer) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $mom;
    }
}
