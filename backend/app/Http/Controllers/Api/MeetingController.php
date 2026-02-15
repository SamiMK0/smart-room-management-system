<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class MeetingController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:admin')->only(['index']);
    }

    public function index()
    {
        $user = Auth::user();
        if ($user->role === 'admin') {
            return Meeting::with(['booking', 'attendees.user', 'mom'])->get();
        }

        return Meeting::with(['booking', 'attendees.user', 'mom'])
            ->whereHas('booking', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->orWhereHas('attendees', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get();
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'booking_id' => 'required|exists:bookings,id|unique:meetings',
            'title' => 'required|string|max:255',
            'agenda' => 'required|string',
            'attendees' => 'sometimes|array',
            'attendees.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $meeting = Meeting::create($request->only(['booking_id', 'title', 'agenda']));

        // Get organizer id (booking owner)
        $organizerId = $meeting->booking->user_id;

        // Collect attendees and ensure organizer is included
        $attendees = $request->attendees ?? [];
        if (!in_array($organizerId, $attendees)) {
            $attendees[] = $organizerId;
        }

        // Add attendees
        $meeting->attendees()->createMany(
            array_map(fn($userId) => ['user_id' => $userId], $attendees)
        );

        return response()->json($meeting->load(['booking', 'attendees']), 201);
    }

    public function show($id)
{
    $meeting = Meeting::with([
        'booking',
        'attendees.user', // Make sure this relationship exists
        'mom.items.assignee' // Changed from 'assignee.user' to just 'assignee'
    ])->find($id);

    if (!$meeting) {
        return response()->json(['message' => 'Meeting not found'], 404);
    }

    $user = Auth::user();
    $isOrganizer = $meeting->booking->user_id === $user->id;
    $isAttendee = $meeting->attendees->contains('user_id', $user->id);

    if ($user->role !== 'admin' && !$isOrganizer && !$isAttendee) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Add booking time to meeting response
    $meeting->start_time = $meeting->booking->start_time;
    $meeting->end_time = $meeting->booking->end_time;

    return response()->json($meeting);
}

    public function update(Request $request, $id)
    {
        $meeting = Meeting::find($id);
        if (!$meeting) {
            return response()->json(['message' => 'Meeting not found'], 404);
        }

        $user = Auth::user();
        $isOrganizer = $meeting->booking->user_id === $user->id;
        if ($user->role !== 'admin' && !$isOrganizer) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'booking_id' => 'sometimes|exists:bookings,id|unique:meetings,booking_id,' . $meeting->id,
            'title' => 'sometimes|string|max:255',
            'agenda' => 'sometimes|string',
            'attendees' => 'sometimes|array',
            'attendees.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $meeting->update($request->only(['booking_id', 'title', 'agenda']));

        if ($request->has('attendees')) {
            $meeting->attendees()->delete();

            // Get updated organizer id (in case booking_id changed)
            $organizerId = $meeting->booking->user_id;

            // Ensure organizer is included
            $attendees = $request->attendees;
            if (!in_array($organizerId, $attendees)) {
                $attendees[] = $organizerId;
            }

            $meeting->attendees()->createMany(
                array_map(fn($userId) => ['user_id' => $userId], $attendees)
            );
        }

        return response()->json($meeting->load(['booking', 'attendees']));
    }

    public function destroy($id)
    {
        $meeting = Meeting::find($id);
        if (!$meeting) {
            return response()->json(['message' => 'Meeting not found'], 404);
        }

        $user = Auth::user();
        $isOrganizer = $meeting->booking->user_id === $user->id;
        if ($user->role !== 'admin' && !$isOrganizer) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $meeting->delete();
        return response()->json(['message' => 'Meeting deleted successfully']);
    }
}
