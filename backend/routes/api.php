<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\FeatureNameController;
use App\Http\Controllers\Api\MeetingAttendeeController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\MoMController;
use App\Http\Controllers\Api\MoMItemController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\RoomFeatureController;
use App\Http\Controllers\Api\UserController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // User routes
    Route::post('users', [UserController::class, 'store'])->middleware('role:admin');
    Route::get('/users/search', [UserController::class, 'search'])->middleware('auth:sanctum');
    Route::apiResource('users', UserController::class)->except(['store']);


    Route::post('users/{user}/profile', [UserController::class, 'updateProfile'])->middleware('auth:sanctum');

    // Room routes - all users can view, only admin can modify
    Route::prefix('rooms')->group(function () {
        Route::get('/', [RoomController::class, 'index']);
        Route::get('/available', [RoomController::class, 'available']); // Add this line
        Route::post('/', [RoomController::class, 'store'])->middleware('role:admin');
        Route::get('/{id}', [RoomController::class, 'show']);
        Route::put('/{id}', [RoomController::class, 'update'])->middleware('role:admin');
        Route::delete('/{id}', [RoomController::class, 'destroy'])->middleware('role:admin');
    });

    // Feature routes - admin only
    Route::apiResource('features', FeatureNameController::class)->middleware('role:admin');

    // Room features - admin only
    Route::prefix('rooms/{room}')->group(function () {
        Route::get('features', [RoomFeatureController::class, 'index']);
        Route::post('features', [RoomFeatureController::class, 'store'])->middleware('role:admin');
        Route::delete('features/{feature}', [RoomFeatureController::class, 'destroy'])->middleware('role:admin');
    });

    // Booking routes
    Route::prefix('bookings')->group(function () {
        Route::get('/', [BookingController::class, 'index']);
        Route::get('/stats', [BookingController::class, 'stats']);
        Route::post('/', [BookingController::class, 'store']);
        Route::get('/{id}', [BookingController::class, 'show']);
        Route::put('/{id}', [BookingController::class, 'update']);
        Route::delete('/{id}', [BookingController::class, 'destroy']);
    });

    // Meeting routes
    Route::post('/meetings', [MeetingController::class, 'store']);
    Route::get('/meetings', [MeetingController::class, 'index'])->middleware('role:admin');
    Route::get('/meetings/{meeting}', [MeetingController::class, 'show']);
    Route::put('/meetings/{meeting}', [MeetingController::class, 'update']);
    Route::delete('/meetings/{meeting}', [MeetingController::class, 'destroy']);


    // Meeting Attendee routes

    Route::prefix('meetings/{meeting}')->group(function () {
        Route::get('attendees', [MeetingAttendeeController::class, 'index']);
        Route::post('attendees', [MeetingAttendeeController::class, 'store']);
        Route::delete('attendees/{attendee}', [MeetingAttendeeController::class, 'destroy']);
        Route::get('attendees/{id}', [MeetingAttendeeController::class, 'show']);
        Route::put('attendees/{id}', [MeetingAttendeeController::class, 'update']); // admin only
    });



    // MoM routes
    Route::post('/moms', [MoMController::class, 'store']);
    Route::get('/moms', [MoMController::class, 'index']); // admin only
    Route::get('/moms/{mom}', [MoMController::class, 'show']); // attendee or organizer
    Route::put('/moms/{mom}', [MoMController::class, 'update']); // creator or admin
    Route::delete('/moms/{mom}', [MoMController::class, 'destroy']); // creator or admin
    Route::get('/moms/user', [MoMController::class, 'userMoms']); // optional, if needed
    Route::get('/moms/meeting/{meetingId}', [MoMController::class, 'getByMeeting']);


    // MoM Item routes
    Route::post('/mom-items', [MoMItemController::class, 'store']);
    Route::get('/mom-items', [MoMItemController::class, 'index']);
    Route::get('/mom-items/user', [MoMItemController::class, 'userMomItems']);

    Route::get('/mom-items/{momItem}', [MoMItemController::class, 'show']);
    Route::put('/mom-items/{momItem}', [MoMItemController::class, 'update']);
    Route::delete('/mom-items/{momItem}', [MoMItemController::class, 'destroy']);

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index'])->middleware('role:admin');
    Route::post('/notifications', [NotificationController::class, 'store'])->middleware('role:admin');
    Route::put('/notifications/{notification}', [NotificationController::class, 'update'])->middleware('role:admin');

    Route::get('/notifications/{notification}', [NotificationController::class, 'show']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);


    // Additional custom routes
    Route::get('/users/{id}/notifications', [UserController::class, 'notifications']);
    Route::get('/users/{id}/meetings', [UserController::class, 'meetings']);
});
