<?php

namespace App\Exports;

use App\Models\ArProduct;
use App\Models\ArProductByCategory;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithMapping;
use Illuminate\Support\Collection;

class FbProductExport implements FromCollection, WithHeadings, ShouldAutoSize, WithMapping
{
    protected $allProducts;

   public function collection()
{
    // $categoryIds = [45,24,19,46,31,54];
    $categoryIds = [45,24,19,62];
    // $categoryIds = [45];
    $limitPerCategory = 30;

    $categoryCount = array_fill_keys($categoryIds, 0);
    $assignedProducts = collect();
    $exportItems = collect();

    foreach ($categoryIds as $categoryId) {

        // Fetch latest products belonging to this category
        $products = ArProduct::select('ar_products.*')
            ->join('ar_product_by_category as apbc', 'apbc.cpc_product_id', '=', 'ar_products.product_id')
            ->where('apbc.cpc_category_id', $categoryId)
            ->where('ar_products.product_stock', '>', 0)
            ->with([
                'productVariations' => function ($q) {
                    $q->where('pv_default', 1);
                }
            ])
            ->orderBy('ar_products.created_at', 'DESC')
            ->get();

        foreach ($products as $product) {

            // Skip if already assigned to another category
            if ($assignedProducts->contains($product->product_id)) {
                continue;
            }

            if ($categoryCount[$categoryId] >= $limitPerCategory) {
                break;
            }

            if ($product->product_status == 1) {
                $exportItems->push([
                    'product' => $product,
                    'type' => 'retail'
                ]);
            }

            $productCategories = collect(explode(',', $product->product_category_id))
                ->map(fn($id) => (int) trim($id));

            if (
                $product->product_wholesale == 1 &&
                !$productCategories->contains(37)
            ) {
                $exportItems->push([
                    'product' => $product,
                    'type' => 'wholesale'
                ]);
            }

            $assignedProducts->push($product->product_id);
            $categoryCount[$categoryId]++;
        }
    }

    return $exportItems;
}

    public function map($item): array
    {
        $product = $item['product'];
        $type = $item['type'];

        $variation = $product->productVariations->first();

        $inStock = $product->product_stock > 0
            || ($variation && $variation->pv_quantity > 0);

        if($type === 'wholesale'){
            $price = '₹'.$product->product_wh_selling_price ?? '₹99';
        }else{
            $price = $variation && $variation->pv_sellingprice > 0
            ? '₹'.$variation->pv_sellingprice
            : ('₹'.$product->product_selling_price ?? 0);
        }
        

        // ✅ Retail vs Wholesale naming + link
        $title = $type === 'wholesale'
            ? $product->product_name . ' WS'
            : $product->product_name;

        $link = $type === 'wholesale'
            ? url('wholesale/product/' . $product->product_slug)
            : url('product/' . $product->product_slug);

        return [
            $product->product_uniqueid . ($type === 'wholesale' ? '_WS' : ''),
            $title,
            strip_tags($product->product_description),
            $inStock ? 'in stock' : 'out of stock',
            'new',
            $price,
            $link,
            $product->product_image,
            'Saroj Textile',
            $product->product_category_name,
            $product->product_category_name,
            $variation->pv_quantity ?? $product->product_stock ?? 0,
            $price,
            $product->created_at ? $product->created_at->format('d-m-Y') : '',
            '', // item_group_id
            '', // gender
            '', // color
            '', // size
            '', // age_group
            '', // material
            '', // pattern
            '', // shipping
            '', // shipping_weight
        ];
    }

    public function headings(): array
    {
        return [
            'id',
            'title',
            'description',
            'availability',
            'condition',
            'price',
            'link',
            'image_link',
            'brand',
            'google_product_category',
            'fb_product_category',
            'quantity_to_sell_on_facebook',
            'sale_price',
            'sale_price_effective_date',
            'item_group_id',
            'gender',
            'color',
            'size',
            'age_group',
            'material',
            'pattern',
            'shipping',
            'shipping_weight',
        ];
    }
}
