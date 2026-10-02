<?php

use App\Models\ArTransactionDetails;
use App\Models\ArTransactions;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the API checkout stores that the Blade one didn't: the order notes and
 * business name from the form, and which variation a line is — so stock comes
 * off the variation that was sold rather than whatever pv_id equals the
 * product id.
 */
class AddCheckoutColumnsToTransactions extends Migration
{
    public function up()
    {
        $trans = (new ArTransactions)->getTable();
        $details = (new ArTransactionDetails)->getTable();

        Schema::table($trans, function (Blueprint $t) use ($trans) {
            if (!Schema::hasColumn($trans, 'trans_notes')) {
                $t->text('trans_notes')->nullable();
            }
            if (!Schema::hasColumn($trans, 'trans_business_name')) {
                $t->string('trans_business_name', 150)->nullable();
            }
        });

        Schema::table($details, function (Blueprint $t) use ($details) {
            if (!Schema::hasColumn($details, 'td_variation_id')) {
                $t->unsignedBigInteger('td_variation_id')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table((new ArTransactions)->getTable(), function (Blueprint $t) {
            $t->dropColumn(['trans_notes', 'trans_business_name']);
        });
        Schema::table((new ArTransactionDetails)->getTable(), function (Blueprint $t) {
            $t->dropColumn('td_variation_id');
        });
    }
}
