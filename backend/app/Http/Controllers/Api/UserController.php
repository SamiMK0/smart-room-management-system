<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;



class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:admin')->only([
            'store', 'destroy'
        ]);
    }

    public function index(): JsonResponse
    {
        return response()->json(User::all());
    }

    public function store(Request $request): JsonResponse
{
    try {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email:rfc,dns|max:255|unique:users',
            'password' => 'sometimes|string|min:8',
            'picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Set default password if not provided
        $password = $validated['password'] ?? 'temporaryPassword123!';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($password),
            'role' => 'user',
            'picture' => $validated['picture'] ?? null,
        ]);

        return response()->json($user, 201);
    } catch (ValidationException $e) {
        return response()->json($e->errors(), 422);
    }
}

    public function show($id): JsonResponse
    {
        /** @var User $user */
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        /** @var User $requestUser */
        $requestUser = Auth::user();

        if ($requestUser->id != $id && $requestUser->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($user);
    }

    public function update(Request $request, $id): JsonResponse
    {
        Log::info('Update request received', ['id' => $id, 'data' => $request->all()]);

        /** @var User $user */
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        /** @var User $requestUser */
        $requestUser = Auth::user();
        if ($requestUser->id != $id && $requestUser->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:users,email,'.$user->id,
                'phone' => 'sometimes|string|max:20',
                'position' => 'sometimes|string|max:255',
                'location' => 'sometimes|string|max:255',
                'picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            Log::info('Validated data', $validated);


            if ($request->hasFile('picture')) {

                if ($user->picture) {
                    Storage::disk('public')->delete($user->picture);
                }
                $path = $request->file('picture')->store('profile_pictures', 'public');
                $validated['picture'] = $path;
                Log::info('Profile picture uploaded', ['path' => $path]);
            }elseif ($request->has('picture') && $request->input('picture') === '') {
                // Handle picture removal
                if ($user->picture) {
                    Storage::disk('public')->delete($user->picture);
                }
                $validated['picture'] = null;
            }

            $user->update($validated);

            Log::info('User updated successfully', ['user_id' => $user->id]);

            return response()->json($user);
        } catch (ValidationException $e) {
            Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json($e->errors(), 422);
        }catch (\Exception $e) {
            Log::error('Update failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Update failed'], 500);
        }
    }


    public function updateProfile(Request $request, $id)
{
    // Verify the authenticated user can only update their own profile
    if ($request->user()->id != $id) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    Log::info('Profile update request', [
        'user_id' => $id,
        'data' => $request->except(['picture']) // Don't log file content
    ]);

    try {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,'.$id,
            'phone' => 'sometimes|string|max:20|nullable',
            'position' => 'sometimes|string|max:255|nullable',
            'location' => 'sometimes|string|max:255|nullable',
            'picture' => 'nullable|sometimes|image|mimes:jpeg,png,jpg,gif|max:2048',
            'remove_picture' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::findOrFail($id);
        $data = $validator->validated();

        // Handle profile picture
        if ($request->hasFile('picture')) {
            // Delete old picture if exists
            if ($user->picture) {
                Storage::disk('public')->delete($user->picture);
            }

            $path = $request->file('picture')->store('profile-pictures', 'public');
            $data['picture'] = $path;
        } elseif ($request->boolean('remove_picture')) {
            // Handle picture removal
            if ($user->picture) {
                Storage::disk('public')->delete($user->picture);
            }
            $data['picture'] = null;
        }

        $user->update($data);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh()
        ]);
    } catch (\Exception $e) {
        Log::error('Profile update error', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json([
            'message' => 'Update failed',
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function destroy($id): JsonResponse
    {
        /** @var User $user */
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        /** @var User $requestUser */
        $requestUser = Auth::user();
        if ($requestUser->id != $id && $requestUser->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }


    // In UserController.php
public function search(Request $request)
{
    $validator = Validator::make($request->all(), [
        'email' => 'required_without:name|email',
        'name' => 'required_without:email|string',
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 400);
    }

    $query = User::query();

    if ($request->has('email')) {
        $query->where('email', 'like', '%' . $request->email . '%');
    }

    if ($request->has('name')) {
        $query->where('name', 'like', '%' . $request->name . '%');
    }

    $users = $query->get();

    return response()->json($users);
}
}
