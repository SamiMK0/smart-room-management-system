<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {


            Schema::create('room_features', function (Blueprint $table) {
                $table->foreignId('room_id')->constrained()->onDelete('cascade');
                $table->foreignId('feature_name_id')->constrained()->onDelete('cascade');
                $table->primary(['room_id', 'feature_name_id']);
                $table->timestamps();
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_features');
    }
};
