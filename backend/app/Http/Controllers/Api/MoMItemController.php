<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MoMItem;
use App\Models\MoM;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class MoMItemController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            return MoMItem::with(['mom.meeting.attendees', 'creator', 'assignee'])->get();
        }

        // Return items from meetings where the user is an attendee
        return MoMItem::with(['mom.meeting.attendees', 'creator', 'assignee'])
            ->whereHas('mom.meeting.attendees', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->orWhere('assigned_to', $user->id)
            ->get();
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mom_id' => 'required|exists:moms,id',
            'item_type' => 'required|in:discussion,decision,action_item',
            'content' => 'required|string',
            'sequence_order' => 'required|integer',
            'assigned_to' => 'required_if:item_type,action_item|exists:users,id',
            'due_date' => 'required_if:item_type,action_item|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $user = Auth::user();
        $mom = MoM::with('creator')->find($request->mom_id);

        if (!$mom) {
            return response()->json(['message' => 'MoM not found'], 404);
        }

        // Only creator of the MoM or admin can add items
        if ($user->role !== 'admin' && $mom->created_by !== $user->id) {
            return response()->json(['message' => 'Only MoM creator can add items'], 403);
        }

        $item = MoMItem::create([
            ...$request->all(),
            'user_id' => $user->id // track creator
        ]);

        return response()->json($item->load(['mom', 'creator', 'assignee']), 201);
    }

    public function show($id)
    {
        $item = MoMItem::with(['mom.meeting.attendees', 'creator', 'assignee'])->find($id);

        if (!$item) {
            return response()->json(['message' => 'MoM item not found'], 404);
        }

        $user = Auth::user();

        $isAttendee = $item->mom->meeting->attendees->pluck('user_id')->contains($user->id);
        $isAssigned = $item->assigned_to === $user->id;

        if (!$isAttendee && !$isAssigned && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized to view this item'], 403);
        }

        return $item;
    }

    public function update(Request $request, $id)
    {
        $item = MoMItem::with('mom')->find($id);
        if (!$item) {
            return response()->json(['message' => 'MoM item not found'], 404);
        }

        $user = Auth::user();
        $mom = $item->mom;

        if ($user->role !== 'admin' && $mom->created_by !== $user->id) {
            return response()->json(['message' => 'Only MoM creator can update items'], 403);
        }

        $validator = Validator::make($request->all(), [
            'mom_id' => 'sometimes|exists:moms,id',
            'item_type' => 'sometimes|in:discussion,decision,action_item',
            'content' => 'sometimes|string',
            'sequence_order' => 'sometimes|integer',
            'assigned_to' => 'required_if:item_type,action_item|exists:users,id',
            'due_date' => 'required_if:item_type,action_item|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $item->update($request->all());
        return response()->json($item->load(['mom', 'creator', 'assignee']));
    }

    public function destroy($id)
    {
        $item = MoMItem::with('mom')->find($id);
        if (!$item) {
            return response()->json(['message' => 'MoM item not found'], 404);
        }

        $user = Auth::user();
        $mom = $item->mom;

        if ($user->role !== 'admin' && $mom->created_by !== $user->id) {
            return response()->json(['message' => 'Only MoM creator can delete items'], 403);
        }

        $item->delete();
        return response()->json(['message' => 'MoM item deleted successfully']);
    }

    public function userMomItems()
    {
        $user = Auth::user();

        return MoMItem::with(['mom', 'creator', 'assignee'])
            ->where('assigned_to', $user->id)
            ->get();
    }
}
