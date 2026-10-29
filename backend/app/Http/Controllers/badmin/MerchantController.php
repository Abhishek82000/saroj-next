<?php

namespace App\Http\Controllers\badmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\GoogleMerchantService;
use App\Models\ArProduct;

class MerchantController extends Controller
{
    protected $merchant;

    public function __construct(GoogleMerchantService $merchant)
    {
        $this->merchant = $merchant;
    }

    public function index()
    {
        $title = 'Merchant Products';
        return view('badmin.merchant.index', compact('title'));
    }

    /** Sync single product */
    public function syncProduct($id)
    {
        $product = ArProduct::findOrFail($id);
        try {
            $this->merchant->upsertProduct($product);
            return back()->with('success', 'Product synced to Google Merchant Center successfully.');
        } catch (\Exception $e) {
            \Log::error('Merchant Sync Error: ' . $e->getMessage());
            return back()->with('error', 'Sync failed: ' . $e->getMessage());
        }
    }

    /** Bulk sync all active products */
    public function bulkSync(Request $request)
    {
        try {
            $summary = $this->merchant->bulkSync();
            return back()->with('success', 'Dispatched ' . $summary['dispatched'] . ' products for background sync.');
        } catch (\Exception $e) {
            \Log::error('Bulk Sync Error: ' . $e->getMessage());
            return back()->with('error', 'Bulk sync failed: ' . $e->getMessage());
        }
    }

    /** Delete product from Google Merchant */
    public function deleteProduct($id)
    {
        $product = ArProduct::findOrFail($id);
        try {
            $this->merchant->deleteProduct($product);
            return back()->with('success', 'Product deleted from Google Merchant.');
        } catch (\Exception $e) {
            \Log::error('Merchant Delete Error: ' . $e->getMessage());
            return back()->with('error', 'Delete failed: ' . $e->getMessage());
        }
    }

    /** List all products from GMC */
    public function listProducts()
    {
        try {
            $products = $this->merchant->listProducts();
            $title = 'Merchant Product List';
            return view('badmin.merchant.list', compact('title', 'products'));
        } catch (\Exception $e) {
            \Log::error('Merchant List Error: ' . $e->getMessage());
            return back()->with('error', 'Failed to fetch products: ' . $e->getMessage());
        }
    }
}
