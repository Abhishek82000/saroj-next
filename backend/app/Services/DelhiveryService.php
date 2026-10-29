<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\ArTransactions;
use App\Models\ArTransactionDetails;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DelhiveryService
{
    protected $baseUrl;
    protected $token;
    protected $pickupLocation;

    public function __construct()
    {
        $this->baseUrl = config('services.delhivery.base_url');
        $this->token = config('services.delhivery.token');
        $this->pickupLocation = config('services.delhivery.pickup_location');
    }

    // ✅ 1️⃣ Check Pincode Serviceability
    public function checkServiceability($pincode)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Token ' . $this->token,
        ])->get($this->baseUrl . "/c/api/pin-codes/json/", [
            'filter_codes' => $pincode
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if (!empty($data['delivery_codes'])) {
                return [
                    'status' => true,
                    'data' => $data
                ];
            }
        }

        return [
            'status' => false,
            'message' => 'Pincode not serviceable'
        ];
    }

    // ✅ 2️⃣ Create Order in Delhivery
    public function createOrder($order_id, $weight = 0.5, $height = 10, $width = 10, $length = 10)
    {
        $order = ArTransactions::where('trans_id',$order_id)->first();
        $orderDetails = ArTransactionDetails::where('td_trans_id',$order_id)->pluck('td_item_title')->toArray();
        $orderTotalWeight = ArTransactionDetails::where('td_trans_id',$order_id)->sum('td_item_weight');
        $implodedProductItems = implode(", ", $orderDetails);
        $payload = [
            "shipments" => [
                [
                    "name" => $order->trans_user_name,
                    "add" => $order->trans_delivery_address,
                    "pin" => $order->trans_pincode,
                    "city" => $order->trans_city,
                    "state" => $order->trans_state,
                    "country" => "India",
                    "phone" => $order->trans_delivery_mobile,
                    "order" => $order->trans_order_number . '-' . time(),
                    "payment_mode" => "Prepaid",
                    "return_pin" => "302012",
                    "return_city" => "Jaipur",
                    "return_phone" => "9587986226",
                    "return_add" => "92-B, New Colony, Satya Nagar, Jhotwara, Jaipur",
                    "return_state" => "Rajasthan",
                    "return_country" => "India",
                    "products_desc" => $implodedProductItems,
                    "cod_amount" => 0,
                    "order_date" => now()->format('Y-m-d H:i:s'),
                    "total_amount" => $order->trans_amt,
                    "seller_add" => '92-B, New Colony, Satya Nagar, Jhotwara, Jaipur',
                    "quantity" => count($orderDetails),
                    "waybill" => "",
                    "shipment_width" => $width,
                    "shipment_height" => $height,
                    "shipment_length" => $length,
                    "weight" => $weight, 
                    "shipping_mode" => "Surface"
                ]
            ],
            "pickup_location" => [
                "name" => $this->pickupLocation
            ]
        ];

        
        $response = Http::asForm()->withHeaders([
            'Authorization' => 'Token ' . $this->token,
        ])->post($this->baseUrl . "/api/cmu/create.json", [
            'format' => 'json',
            'data' => json_encode($payload)
        ]);        

        return $response->json();
    }
    public function trackShipment($waybill, $verbose = 1)
    {
        $waybillString = is_array($waybill) ? implode(',', $waybill) : $waybill;

        $cacheKey = 'delhivery_track_' . md5($waybillString);

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($waybillString, $verbose) {
            $response = Http::withHeaders([
                'Authorization' => 'Token ' . $this->token,
            ])->timeout(15)
              ->retry(2, 500)
              ->get($this->baseUrl . "/api/v1/packages/json/", [
                  'waybill' => $waybillString,
                  'verbose' => $verbose,
              ]);

            if ($response->failed()) {
                Log::error('Delhivery tracking failed', [
                    'waybill' => $waybillString,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'status' => false,
                    'message' => 'Unable to fetch tracking info at the moment.'
                ];
            }

            $data = $response->json();

            if (empty($data['ShipmentData'])) {
                return [
                    'status' => false,
                    'message' => 'No tracking data found for this waybill.'
                ];
            }

            return [
                'status' => true,
                'shipments' => array_map(fn ($item) => $this->formatShipment($item['Shipment']), $data['ShipmentData']),
            ];
        });
    }

    // ✅ 4️⃣ Track by your internal order_id (looks up waybill from your order record)
    public function trackByOrderId($order_id)
    {
        $order = ArTransactions::where('trans_id', $order_id)->first();

        if (!$order || empty($order->trans_waybill)) {
            return [
                'status' => false,
                'message' => 'No waybill found for this order.'
            ];
        }

        return $this->trackShipment($order->trans_waybill);
    }

    protected function formatShipment(array $shipment): array
    {
        return [
            'waybill' => $shipment['AWB'] ?? null,
            'status' => $shipment['Status']['Status'] ?? null,
            'status_type' => $shipment['Status']['StatusType'] ?? null,
            'status_location' => $shipment['Status']['StatusLocation'] ?? null,
            'status_datetime' => $shipment['Status']['StatusDateTime'] ?? null,
            'origin' => $shipment['Origin'] ?? null,
            'destination' => $shipment['Destination'] ?? null,
            'consignee_name' => $shipment['Consignee']['Name'] ?? null,
            'expected_delivery' => $shipment['ExpectedDeliveryDate'] ?? null,
            'scans' => collect($shipment['Scans'] ?? [])->map(fn ($scan) => [
                'status' => $scan['ScanDetail']['Scan'] ?? null,
                'instructions' => $scan['ScanDetail']['Instructions'] ?? null,
                'location' => $scan['ScanDetail']['ScannedLocation'] ?? null,
                'datetime' => $scan['ScanDetail']['ScanDateTime'] ?? null,
            ])->toArray(),
        ];
    }
}
