<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:admin')->only(['store', 'index', 'update']);
    }

    /**
     * Admin: Get all notifications
     */
    public function index()
    {
        return Notification::with('user')->get();
    }

    /**
     * Admin: Create a notification
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'message' => 'required|string',
            'type' => 'required|in:invitation,booking_confirmation,action_item_assigned',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $notification = Notification::create($request->all());
        return response()->json($notification->load('user'), 201);
    }

    /**
     * Admin or User (only own notification): Show a notification
     */
    public function show($id)
    {
        $notification = Notification::with('user')->find($id);
        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $user = Auth::user();
        if ($user->role !== 'admin' && $notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $notification;
    }

    /**
     * Admin: Update a notification
     */
    public function update(Request $request, $id)
    {
        $notification = Notification::find($id);
        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'sometimes|exists:users,id',
            'message' => 'sometimes|string',
            'type' => 'required|in:invitation,booking_confirmation,action_item_assigned',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $notification->update($request->all());
        return response()->json($notification->load('user'));
    }

    /**
     * Admin or User (only own notification): Delete a notification
     */
    public function destroy($id)
    {
        $notification = Notification::find($id);
        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $user = Auth::user();
        if ($user->role !== 'admin' && $notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->delete();
        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
