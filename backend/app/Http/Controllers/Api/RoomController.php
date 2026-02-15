<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoomController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        // $this->middleware('role:admin');
    }

    public function index()
    {
        return Room::with('features')->get();
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer',
            'location' => 'required|string',
            'features' => 'sometimes|array',
            'features.*' => 'exists:feature_names,id',
        ]);

          $validator->after(function ($validator) use ($request) {
        $exists = Room::where('name', $request->name)
                      ->where('location', $request->location)
                      ->exists();

        if ($exists) {
            $validator->errors()->add('name', 'A room with the same name and location already exists.');
        }
    });
        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $room = Room::create($request->only(['name', 'capacity', 'location']));

        if ($request->has('features')) {
            $room->features()->sync($request->features);
        }

        return response()->json($room->load('features'), 201);
    }

    public function show($id)
    {
        $room = Room::with('features')->find($id);
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }
        return $room;
    }

    public function update(Request $request, $id)
    {
        $room = Room::find($id);
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'capacity' => 'sometimes|integer',
            'location' => 'sometimes|string',
            'features' => 'sometimes|array',
            'features.*' => 'exists:feature_names,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $room->update($request->only(['name', 'capacity', 'location']));

        if ($request->has('features')) {
            $room->features()->sync($request->features);
        }

        return response()->json($room->load('features'));
    }

    public function destroy($id)
    {
        $room = Room::find($id);
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        $room->delete();
        return response()->json(['message' => 'Room deleted successfully']);
    }

    public function available()
        {
            return response()->json(Room::all());
        }
}
