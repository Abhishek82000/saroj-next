<?php

namespace App\Jobs;

use App\Models\ArProduct;
use App\Services\GoogleMerchantService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GoogleProductSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $productId;

    public function __construct($productId)
    {
        $this->productId = $productId;
    }

    /**
     * Execute the job.
     */
    public function handle(GoogleMerchantService $merchant)
    {
        $product = ArProduct::find($this->productId);

        if (!$product || $product->product_status != 1) {
            \Log::warning("⏭️ Product {$this->productId} skipped (not active or missing)");
            return;
        }

        try {
            $merchant->upsertProduct($product);
            \Log::info("✅ Product ID {$this->productId} synced successfully to Google Merchant.");
        } catch (\Exception $e) {
            \Log::error("❌ GoogleProductSyncJob failed for Product ID {$this->productId}: " . $e->getMessage());
        }
    }
}
