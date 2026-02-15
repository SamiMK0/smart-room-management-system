<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\FeatureName;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RoomFeatureController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:admin');
    }
    /**
     * Attach feature to room
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'room_id' => 'required|exists:rooms,id',
            'feature_name_id' => 'required|exists:feature_names,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // Check if relationship already exists
        $exists = DB::table('room_features')
            ->where('room_id', $request->room_id)
            ->where('feature_name_id', $request->feature_name_id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This feature is already assigned to the room'
            ], 409);
        }

        DB::table('room_features')->insert([
            'room_id' => $request->room_id,
            'feature_name_id' => $request->feature_name_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $feature = FeatureName::find($request->feature_name_id);

        return response()->json([
            'message' => 'Feature successfully added to room',
            'data' => [
                'room_id' => $request->room_id,
                'feature_name_id' => $request->feature_name_id,
                'feature_name' => $feature ? $feature->name : null,
            ]
        ], 201);

    }

    /**
     * List all features for a room
     */
    public function index($roomId)
    {
        $features = DB::table('room_features')
            ->join('feature_names', 'room_features.feature_name_id', '=', 'feature_names.id')
            ->where('room_id', $roomId)
            ->select('feature_names.*', 'room_features.room_id')
            ->get();

        return response()->json($features);
    }

    /**
     * Remove feature from room
     */
    public function destroy($roomId, $featureId)
    {
        $deleted = DB::table('room_features')
            ->where('room_id', $roomId)
            ->where('feature_name_id', $featureId)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'message' => 'Feature not found for this room'
            ], 404);
        }

        return response()->json([
            'message' => 'Feature successfully removed from room'
        ]);
    }
}
