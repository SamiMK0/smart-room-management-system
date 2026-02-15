<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Admin can view all bookings
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            return Booking::with(['user', 'room', 'meeting' => function($q) {
                $q->with(['mom.items', 'attendees.user'])->withCount('attendees');
            }])->get();
        }

        return Booking::with(['room', 'meeting' => function($q) {
                $q->with(['mom.items', 'attendees.user'])->withCount('attendees');
            }])
            ->where('user_id', $user->id)
            ->get();
    }
    /**
     * Store a booking (admin can assign any user_id, user can only assign to self)
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $rules = [
            'room_id' => 'required|exists:rooms,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'booking_status' => 'required|string',
        ];

        if ($user->role === 'admin') {
            $rules['user_id'] = 'required|exists:users,id';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $userId = $user->role === 'admin' ? $request->user_id : $user->id;

        // Check for booking conflicts
        $conflictingBooking = Booking::where('room_id', $request->room_id)
            ->where(function ($query) use ($request) {
                $query->whereBetween('start_time', [$request->start_time, $request->end_time])
                    ->orWhereBetween('end_time', [$request->start_time, $request->end_time])
                    ->orWhere(function ($query) use ($request) {
                        $query->where('start_time', '<=', $request->start_time)
                            ->where('end_time', '>=', $request->end_time);
                    });
            })
            ->exists();

        if ($conflictingBooking) {
            return response()->json(['message' => 'The room is already booked for the selected time period'], 409);
        }

        $booking = Booking::create([
            'user_id' => $userId,
            'room_id' => $request->room_id,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'booking_status' => $request->booking_status,
        ]);

        return response()->json($booking->load(['user', 'room']), 201);
    }

    /**
     * Show a specific booking — admin or booking owner only
     */
    public function show($id)
{
    $booking = Booking::with(['user', 'room', 'meeting.attendees'])->find($id);
    if (!$booking) {
        return response()->json(['message' => 'Booking not found'], 404);
    }

    $user = Auth::user();
    if ($user->role !== 'admin' && $booking->user_id !== $user->id) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    return response()->json($booking);
}

    /**
     * Update booking — only by admin or booking owner
     */
    public function update(Request $request, $id)
    {
        $booking = Booking::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        $user = Auth::user();
        if ($user->role !== 'admin' && $booking->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $rules = [
            'room_id' => 'sometimes|exists:rooms,id',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'booking_status' => 'sometimes|string',
        ];

        if ($user->role === 'admin') {
            $rules['user_id'] = 'sometimes|exists:users,id';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $data = $user->role === 'admin' ? $request->all() : $request->except(['user_id']);

        // Conflict check: only if start_time, end_time, or room_id is being changed
        $newRoomId = $data['room_id'] ?? $booking->room_id;
        $newStartTime = $data['start_time'] ?? $booking->start_time;
        $newEndTime = $data['end_time'] ?? $booking->end_time;

        $conflictingBooking = Booking::where('room_id', $newRoomId)
            ->where('id', '!=', $booking->id) // exclude self
            ->where(function ($query) use ($newStartTime, $newEndTime) {
                $query->whereBetween('start_time', [$newStartTime, $newEndTime])
                    ->orWhereBetween('end_time', [$newStartTime, $newEndTime])
                    ->orWhere(function ($query) use ($newStartTime, $newEndTime) {
                        $query->where('start_time', '<=', $newStartTime)
                            ->where('end_time', '>=', $newEndTime);
                    });
            })
            ->exists();

        if ($conflictingBooking) {
            return response()->json(['message' => 'The room is already booked for the selected time period'], 409);
        }

        $booking->update($data);

        return response()->json($booking->load(['user', 'room']));
    }

    /**
     * Delete booking — only by admin or booking owner
     */
    public function destroy($id)
    {
        $booking = Booking::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        $user = Auth::user();
        if ($user->role !== 'admin' && $booking->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $booking->delete();
        return response()->json(['message' => 'Booking deleted successfully']);
    }

    public function stats()
{
    $user = Auth::user();
    $today = now()->toDateString(); // Explicitly get today's date

    return response()->json([
        'todayBookings' => Booking::whereDate('start_time', $today)
            ->when($user->role !== 'admin', fn($q) => $q->where('user_id', $user->id))
            ->count(),
        'todayConfirmed' => Booking::whereDate('start_time', $today)
            ->where('booking_status', 'confirmed')
            ->when($user->role !== 'admin', fn($q) => $q->where('user_id', $user->id))
            ->count(),
        'todayPending' => Booking::whereDate('start_time', $today)
            ->where('booking_status', 'pending')
            ->when($user->role !== 'admin', fn($q) => $q->where('user_id', $user->id))
            ->count(),
        'monthlyBookings' => Booking::whereMonth('start_time', now()->month)
            ->when($user->role !== 'admin', fn($q) => $q->where('user_id', $user->id))
            ->count(),
        'availableRooms' => Room::count() - Booking::where('start_time', '>', now())->count(),
        'totalRooms' => Room::count()
    ]);
}
}
