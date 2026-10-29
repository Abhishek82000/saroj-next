<?php

namespace App\Services;

use Google\Client as GoogleClient;
use Google\Service\ShoppingContent;
use App\Models\ArProductByCategory;
use App\Models\ArProduct;
use App\Jobs\GoogleProductSyncJob;
use Exception;

class GoogleMerchantService
{
    protected $service;
    protected $merchantId;

    public function __construct()
    {
        $client = new GoogleClient();
        $client->setAuthConfig(config('google-merchant.credentials'));
        $client->addScope(ShoppingContent::CONTENT);
        $client->setApplicationName('Saroj Textile Google Merchant Integration');

        $this->service = new ShoppingContent($client);
        $this->merchantId = config('google-merchant.merchant_id');
    }

    /** Convert ArProduct → API Format */
    private function formatProduct(ArProduct $product)
    {
        return [
            'offerId'       => 'SKU-WS' . $product->product_id,
            // 'offerId'       => 'SKU-' . $product->product_id,
            'title'         => $product->product_name . ' ' . 'ws',
            // 'title'         => $product->product_name,
            'description'   => strip_tags($product->product_description ?: $product->product_content),
            // 'link'          => url('/product/' . $product->product_slug),
            'link'          => url('/wholesale/product/' . $product->product_slug),
            'imageLink'     => $product->product_image,
            'contentLanguage' => config('google-merchant.language', 'en'),
            'targetCountry'   => config('google-merchant.country', 'IN'),
            'channel'         => 'online',
            'availability'    => $product->product_stock > 9 ? 'in stock' : 'out of stock',
            'condition'       => 'new',
            'price' => [
                'value'    => (string) ($product->product_wh_selling_price ?? 75),
                // 'value'    => (string) ($product->product_selling_price ?? 99),
                'currency' => config('google-merchant.currency', 'INR'),
            ],
            'shippingWeight' => [
                'value' => (string) ($product->product_weight ?: '0.4'), // fallback to 0.5 if null
                'unit'  => 'g', // or 'g', depending on your data
            ],
            'brand' => config('google-merchant.brand', 'Saroj Textile'),
        ];
    }

    /** Upsert (insert or update) product */
    public function upsertProduct(ArProduct $product)
    {
        try {
            $body = new ShoppingContent\Product($this->formatProduct($product));
            return $this->service->products->insert($this->merchantId, $body);
        } catch (Exception $e) {
            \Log::error('Google Merchant Upsert Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /** Bulk sync active products */
    public function bulkSync()
    {
        $dispatched = 0;
        $productIdArr = ArProductByCategory::whereIn('cpc_category_id',[46,24,54,55,45])->pluck('cpc_product_id')->toArray();
        $productIdArr = array_unique($productIdArr);
        ArProduct::where('product_status', 1)->where('product_wholesale',1)->where('product_stock', '>', 9)->whereIn('product_id', $productIdArr)->orderBy('product_id', 'desc')
            ->chunk(100, function ($products) use (&$dispatched) {
                foreach ($products as $product) {
                    GoogleProductSyncJob::dispatch($product->product_id);
                    $dispatched++;
                }
            });
        // ArProduct::where('product_status', 1)->where('product_stock', '>', 0)->whereIn('product_id', $productIdArr)
        // ->orderBy('product_id', 'desc')
        //     ->chunk(100, function ($products) use (&$dispatched) {
        //         foreach ($products as $product) {
        //             GoogleProductSyncJob::dispatch($product->product_id);
        //             $dispatched++;
        //         }
        //     });

        return ['dispatched' => $dispatched];
    }


    /** Delete product from GMC */
    public function deleteProduct(ArProduct $product)
    {
        try {
            $productId = sprintf(
                'online:%s:%s:%s',
                config('google-merchant.language', 'en'),
                config('google-merchant.country', 'IN'),
                $product->product_sku ?: 'SKU-' . $product->product_id
            );

            return $this->service->products->delete($this->merchantId, $productId);
        } catch (Exception $e) {
            \Log::error('Google Merchant Delete Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /** List all GMC products */
    public function listProducts()
    {
        try {
            $response = $this->service->products->listProducts($this->merchantId);
            return $response->getResources() ?? [];
        } catch (Exception $e) {
            \Log::error('Google Merchant List Error: ' . $e->getMessage());
            throw $e;
        }
    }
}
