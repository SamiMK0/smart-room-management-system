<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeatureName;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FeatureNameController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:admin');
    }

    public function index()
    {
        return FeatureName::all();
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:feature_names',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $feature = FeatureName::create($request->all());
        return response()->json($feature, 201);
    }

    public function show($id)
    {
        $feature = FeatureName::find($id);
        if (!$feature) {
            return response()->json(['message' => 'Feature not found'], 404);
        }
        return $feature;
    }

    public function update(Request $request, $id)
    {
        $feature = FeatureName::find($id);
        if (!$feature) {
            return response()->json(['message' => 'Feature not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255|unique:feature_names,name,'.$feature->id,
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $feature->update($request->all());
        return response()->json($feature);
    }

    public function destroy($id)
    {
        $feature = FeatureName::find($id);
        if (!$feature) {
            return response()->json(['message' => 'Feature not found'], 404);
        }

        $feature->delete();
        return response()->json(['message' => 'Feature deleted successfully']);
    }
}
