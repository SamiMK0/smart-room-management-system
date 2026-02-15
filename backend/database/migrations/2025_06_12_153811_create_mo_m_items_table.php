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
        // database/migrations/[timestamp]_create_mom_items_table.php

            Schema::create('mom_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mom_id')->constrained()->onDelete('cascade');
                $table->enum('item_type', ['discussion', 'decision', 'action_item']);
                $table->text('content');
                $table->integer('sequence_order');
                $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('cascade');
                $table->date('due_date')->nullable();
                $table->timestamps();
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mo_m_items');
    }
};
