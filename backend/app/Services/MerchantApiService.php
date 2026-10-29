<?php

namespace App\Services;

use GuzzleHttp\Client;
use App\Models\ArProduct;
use Exception;
use Illuminate\Support\Facades\Log;

class MerchantApiService
{
    private $client;
    private $merchantId;
    private $language;
    private $country;
    private $currency;
    private $brand;

    public function __construct()
    {
        $this->merchantId = config('merchantapi.merchant_id');
        $this->language   = config('merchantapi.language');
        $this->country    = config('merchantapi.country');
        $this->currency   = config('merchantapi.currency');
        $this->brand      = config('merchantapi.brand');

        $this->client = new Client([
            'base_uri' => config('merchantapi.http.base_uri'),
            'timeout'  => config('merchantapi.http.timeout'),
        ]);
    }

    /** Format Laravel Product to Google Merchant payload */
    private function formatProduct(ArProduct $product)
    {
        return [
            'offerId'         => $product->product_sku ?: 'SKU-'.$product->product_id,
            'channel'         => 'online',
            'contentLanguage' => 'en',
            'targetCountry'   => 'IN',
            'title'           => $product->product_name,
            'description'     => strip_tags($product->product_description ?: $product->product_content),
            'link'            => url('/product/'.$product->product_slug),
            'imageLink'       => $product->product_image,
            'availability'    => $product->product_stock > 0 ? 'in stock' : 'out of stock',
            'condition'       => 'new',
            'price' => [
                'value'    => (string)($product->product_selling_price ?: $product->product_price),
                'currency' => $this->currency,
            ],
            'brand' => $this->brand,
        ];
    }

    /** Insert or update product (upsert) */
    public function upsertProduct(ArProduct $product)
    {
        $payload = $this->formatProduct($product);
        $url = "accounts/{$this->merchantId}/products";

        // OfferId must be unique and channel:language:country format
        $payload['offerId'] = $payload['offerId'];

        try {
            $response = $this->client->post($url, [
                'json' => $payload,
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->getAccessToken(),
                    'Accept'        => 'application/json',
                ],
            ]);

            return json_decode($response->getBody(), true);
        } catch (Exception $e) {
            Log::error('Google Merchant Sync Error: '.$e->getMessage());
            throw $e;
        }
    }

    /** Delete product */
    public function deleteProduct(ArProduct $product)
    {
        $resourceName = "online:{$this->language}:{$this->country}:".($product->product_sku ?: 'SKU-'.$product->product_id);
        $url = "accounts/{$this->merchantId}/products/{$resourceName}";

        try {
            $response = $this->client->delete($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->getAccessToken(),
                    'Accept'        => 'application/json',
                ],
            ]);

            return json_decode($response->getBody(), true);
        } catch (Exception $e) {
            Log::error('Google Merchant Delete Error: '.$e->getMessage());
            return false;
        }
    }

    /** List products */
    public function listProducts($pageSize = 50)
    {
        $url = "accounts/{$this->merchantId}/products?pageSize={$pageSize}";
        try {
            $response = $this->client->get($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->getAccessToken(),
                    'Accept'        => 'application/json',
                ],
            ]);
            return json_decode($response->getBody(), true);
        } catch (Exception $e) {
            Log::error('Google Merchant List Error: '.$e->getMessage());
            return [];
        }
    }

    /** Bulk sync */
    public function bulkSync($chunkSize = 100)
    {
        $products = ArProduct::where('product_status', 1)->chunk($chunkSize, function($chunk){
            foreach($chunk as $p){
                $this->upsertProduct($p);
            }
        });
        return ['status'=>'success'];
    }

    /** Get Google access token using service account JSON */
    private function getAccessToken()
    {
        $keyFile = config('merchantapi.service_account');
        $json = json_decode(file_get_contents($keyFile), true);

        $jwt = new \Firebase\JWT\JWT();
        $client_email = $json['client_email'];
        $private_key = $json['private_key'];
        $token_uri = $json['token_uri'];

        $now = time();
        $payload = [
            "iss" => $client_email,
            "scope" => "https://www.googleapis.com/auth/content",
            "aud" => $token_uri,
            "iat" => $now,
            "exp" => $now + 3600
        ];

        $jwt_assertion = \Firebase\JWT\JWT::encode($payload, $private_key, 'RS256');

        $guzzle = new Client();
        $res = $guzzle->post($token_uri, [
            'form_params' => [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt_assertion
            ],
        ]);

        $body = json_decode($res->getBody(), true);
        return $body['access_token'];
    }
}
