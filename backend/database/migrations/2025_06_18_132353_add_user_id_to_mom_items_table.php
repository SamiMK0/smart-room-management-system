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
        Schema::table('mom_items', function (Blueprint $table) {
            // Add the new column with foreign key constraint
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade')
                  ->after('mom_id'); // Places it after mom_id column
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mom_items', function (Blueprint $table) {
            // Drop the foreign key first
            $table->dropForeign(['user_id']);
            // Then drop the column
            $table->dropColumn('user_id');
        });
    }
};
