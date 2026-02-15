<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class MeetingAttendeeController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Get all attendees that belong to meetings where user is organizer or attendee
     */
    public function index($meetingId)
    {
        $user = Auth::user();
        $meeting = Meeting::with('booking')->find($meetingId);

        if (!$meeting) {
            return response()->json(['message' => 'Meeting not found'], 404);
        }

        $isOrganizer = $meeting->booking->user_id === $user->id;

        if ($user->role !== 'admin' && !$isOrganizer) {
            return response()->json(['message' => 'Unauthorized to view attendees'], 403);
        }

        $attendees = $meeting->attendees()->with('user')->get();

        return response()->json($attendees);
    }

    /**
     * Add an attendee to a meeting
     */
    // In MeetingAttendeeController.php

    public function store(Request $request, $meetingId)
{
    $validator = Validator::make($request->all(), [
        'user_id' => 'required|exists:users,id',
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 400);
    }

    $user = Auth::user();
    $meeting = Meeting::with('booking')->find($meetingId);

    if (!$meeting) {
        return response()->json(['message' => 'Meeting not found'], 404);
    }

    $isOrganizer = $meeting->booking->user_id === $user->id;
    $isAdmin = $user->role === 'admin';

    if (!$isOrganizer && !$isAdmin) {
        return response()->json(['message' => 'Only meeting organizer can add attendees'], 403);
    }

    // Check if attendee already exists
    $exists = MeetingAttendee::where('meeting_id', $meetingId)
        ->where('user_id', $request->user_id)
        ->exists();

    if ($exists) {
        return response()->json(['message' => 'User is already an attendee'], 409);
    }

    try {
        $attendee = MeetingAttendee::create([
            'user_id' => $request->user_id,
            'meeting_id' => $meetingId,
        ]);

        return response()->json($attendee->load('user'), 201);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Failed to add attendee',
            'error' => $e->getMessage()
        ], 500);
    }
}
    /**
     * Show one attendee's record
     */
    public function show($id)
    {
        $attendee = MeetingAttendee::with(['user', 'meeting'])->find($id);

        if (!$attendee) {
            return response()->json(['message' => 'Meeting attendee not found'], 404);
        }

        $user = Auth::user();
        $isOrganizer = $attendee->meeting->booking->user_id === $user->id;
        $isSelf = $attendee->user_id === $user->id;

        if ($user->role !== 'admin' && !$isOrganizer && !$isSelf) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $attendee;
    }

    /**
     * Update an attendee (admin only)
     */
    public function update(Request $request, $id)
    {
        $attendee = MeetingAttendee::find($id);

        if (!$attendee) {
            return response()->json(['message' => 'Meeting attendee not found'], 404);
        }

        $user = Auth::user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Only admin can update attendees'], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'sometimes|exists:users,id',
            'meeting_id' => 'sometimes|exists:meetings,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $attendee->update($request->all());
        return response()->json($attendee->load(['user', 'meeting']));
    }

    /**
     * Remove an attendee (admin or organizer)
     */
    public function destroy($meetingId, $attendeeId)
    {
        $attendee = MeetingAttendee::with('meeting.booking')->find($attendeeId);

        if (!$attendee) {
            return response()->json(['message' => 'Meeting attendee not found'], 404);
        }

        $user = Auth::user();
        $isOrganizer = $attendee->meeting->booking->user_id === $user->id;
        $isAdmin = $user->role === 'admin';

        if (!$isAdmin && !$isOrganizer) {
            return response()->json(['message' => 'Unauthorized to remove attendee'], 403);
        }

        $attendee->delete();
        return response()->json(['message' => 'Meeting attendee deleted successfully']);
    }
}
