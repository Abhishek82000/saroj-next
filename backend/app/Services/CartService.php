<?php

namespace App\Services;

use App\Models\ArCart;
use App\Models\ArProduct;
use App\Models\ArProductVariation;
use Illuminate\Support\Collection;

/**
 * Cart pricing, stock checks and line formatting for the Next.js storefront.
 *
 * Each account has two carts, told apart by `cart_is_wholesale`:
 *
 *   retail    — open to guests. A guest's cart lives in the browser
 *               (localStorage); the API is sent its lines and only prices and
 *               stock-checks them. A logged-in user's retail cart is stored in
 *               ar_cart under the user the Bearer token belongs to.
 *   wholesale — login only, always stored in ar_cart. Priced at the
 *               product_wh_* trade rates (one rate per product, variations
 *               included — the same way CashFreeController bills it), with
 *               product_moq as the minimum order.
 *
 * Stored rows and guest lines both go through price()/line(), so a price or
 * stock rule only lives here. Nothing in here reads the session.
 */
class CartService
{
    public const RETAIL = 'retail';
    public const WHOLESALE = 'wholesale';
    public const TYPES = [self::RETAIL, self::WHOLESALE];

    /** The user's stored rows of one cart, newest first. */
    public function rows(int $userId, string $type): Collection
    {
        return ArCart::where('cart_user_id', $userId)
            ->where('cart_is_wholesale', $this->flag($type))
            ->orderByDesc('cart_id')
            ->get();
    }

    /** The user's stored row for this product/variation in one cart, if there is one. */
    public function findRow(int $userId, string $type, int $productId, ?int $variationId): ?ArCart
    {
        return ArCart::where('cart_user_id', $userId)
            ->where('cart_is_wholesale', $this->flag($type))
            ->where('cart_product_id', $productId)
            ->where(function ($q) use ($variationId) {
                if ($variationId) {
                    $q->where('cart_variation_id', $variationId);
                } else {
                    // Older rows stored a simple product's variation as NULL, newer as 0.
                    $q->whereNull('cart_variation_id')->orWhere('cart_variation_id', 0);
                }
            })
            ->first();
    }

    /** Sets the row's quantity (creating the row if needed) and saves it. Callers check() first. */
    public function store(int $userId, string $type, int $productId, ?int $variationId, float $qty, ?ArCart $row = null): ArCart
    {
        $row ??= new ArCart();
        $row->cart_user_id      = $userId;
        $row->cart_product_id   = $productId;
        $row->cart_variation_id = $variationId ?? 0;
        $row->cart_is_wholesale = $this->flag($type);
        $row->cart_qty          = round($qty, 2);
        $row->save();

        return $row;
    }

    /** Everything the drawer needs for a logged-in user's cart: priced lines, totals, both badge counts. */
    public function forUser(int $userId, string $type): array
    {
        $items = $this->rows($userId, $type)->map(fn (ArCart $row) => $this->itemFromRow($row))->all();

        return $this->payload($type, $this->price($items, $type), $this->counts($userId));
    }

    /** The same payload for the lines a guest's browser sent. Nothing is stored. */
    public function forGuest(array $items, string $type): array
    {
        return $this->payload($type, $this->price($items, $type), null);
    }

    /** Line counts of both carts, for the header badges. */
    public function counts(int $userId): array
    {
        $counts = ArCart::where('cart_user_id', $userId)
            ->selectRaw('cart_is_wholesale, COUNT(*) AS n')
            ->groupBy('cart_is_wholesale')
            ->pluck('n', 'cart_is_wholesale');

        return [
            self::RETAIL    => (int) ($counts[0] ?? 0),
            self::WHOLESALE => (int) ($counts[1] ?? 0),
        ];
    }

    /** Prices one line at `qty` — the whole quantity it would have, not the amount being added. */
    public function check(int $productId, ?int $variationId, float $qty, string $type, ?int $cartId = null): array
    {
        return $this->price([[
            'cart_id'      => $cartId,
            'product_id'   => $productId,
            'variation_id' => $variationId,
            'qty'          => $qty,
        ]], $type)[0];
    }

    public function itemFromRow(ArCart $row): array
    {
        return [
            'cart_id'      => (int) $row->cart_id,
            'product_id'   => (int) $row->cart_product_id,
            'variation_id' => (int) $row->cart_variation_id ?: null,
            'qty'          => (float) $row->cart_qty,
        ];
    }

    /**
     * Prices lines ({product_id, variation_id?, qty, cart_id?}) at `type`'s
     * rates. A line that can't be bought as it stands (product gone, out of
     * stock, over stock, under the wholesale minimum) is kept but carries an
     * `error` and is left out of the totals, so the drawer can say what's
     * wrong instead of the piece silently vanishing.
     */
    public function price(array $items, string $type): array
    {
        $items = array_map(fn ($item) => $this->normalize($item), array_values($items));

        $products = ArProduct::whereIn('product_id', array_unique(array_column($items, 'product_id')))
            ->get()->keyBy('product_id');
        $variations = ArProductVariation::whereIn('pv_id', array_unique(array_filter(array_column($items, 'variation_id'))))
            ->get()->keyBy('pv_id');

        return array_map(function (array $item) use ($products, $variations, $type) {
            $product = $products->get($item['product_id']);
            $variation = $item['variation_id'] ? $variations->get($item['variation_id']) : null;

            return $this->line($product, $variation, $item, $type);
        }, $items);
    }

    private function line(?ArProduct $product, ?ArProductVariation $variation, array $item, string $type): array
    {
        $line = [
            'cart_id'      => $item['cart_id'],
            // Stable id for the browser: "<product_id>" or "<product_id>-<variation_id>".
            'key'          => $item['product_id'] . ($item['variation_id'] ? '-' . $item['variation_id'] : ''),
            'type'         => $type,
            'product_id'   => $item['product_id'],
            'variation_id' => $item['variation_id'],
            'qty'          => $item['qty'],
            'name'         => null,
            'slug'         => null,
            'image'        => env('NO_IMAGE'),
            'unit'         => 'piece',
            'step'         => 1,
            'min_qty'      => null,
            'max_qty'      => null,
            'mrp'          => 0.0,
            'price'        => 0.0,
            'line_total'   => 0.0,
            'error'        => null,
        ];

        if (!$product) {
            return array_merge($line, ['error' => 'This product is no longer available.']);
        }

        // A simple product ignores any variation sent with it; a variable one
        // only takes a variation that is its own.
        if ((int) $product->product_type !== 1) {
            $variation = null;
            $line['variation_id'] = null;
            $line['key'] = (string) $item['product_id'];
        } elseif ($variation && (int) $variation->pv_product_id !== (int) $product->product_id) {
            $variation = null;
        }

        [$mrp, $price] = $this->rates($product, $variation, $type);
        $step = (float) $product->product_lgap > 0 ? (float) $product->product_lgap : 1.0;

        return array_merge($line, [
            'name'       => $product->product_name,
            'slug'       => $product->product_slug,
            'image'      => $this->image($variation?->pv_image ?: $product->product_image),
            'unit'       => (int) $product->product_style_type === 1 ? 'metre' : 'piece',
            'step'       => $step,
            'min_qty'    => $type === self::WHOLESALE && (float) $product->product_moq > 0 ? (float) $product->product_moq : null,
            'max_qty'    => $this->stockCap($product, $variation),
            'mrp'        => $mrp,
            'price'      => $price,
            'line_total' => round($price * $item['qty'], 2),
            'error'      => $this->problem($product, $variation, $item['qty'], $type),
        ]);
    }

    /** Why `qty` of this piece can't go in `type`'s cart, or null if it can. */
    private function problem(ArProduct $product, ?ArProductVariation $variation, float $qty, string $type): ?string
    {
        if ((int) $product->product_status !== 1) {
            return 'This product is no longer available.';
        }
        if ($type === self::WHOLESALE && (int) $product->product_wholesale !== 1) {
            return 'This product is not sold wholesale.';
        }
        if ((int) $product->product_type === 1 && !$variation) {
            return 'Please choose a variation.';
        }
        if ($type === self::WHOLESALE) {
            $moq = 10;
        }else{
            $moq = 1;
        }

        if ($type === self::WHOLESALE && $moq > 0 && $qty < $moq) {
            return 'Minimum wholesale order is ' . $this->number($moq) . '.';
        }

        $cap = $this->stockCap($product, $variation);
        if ($cap <= 0) {
            return 'Product is out of stock.';
        }
        if ($qty > $cap) {
            return 'Only ' . $this->number($cap) . ' in stock.';
        }

        return null;
    }

    /**
     * The most that can be ordered: a variation's own pv_quantity, else the
     * product's product_stock — always, whatever product_inventory /
     * product_backorder say, so nobody orders more than is on the shelf.
     */
    private function stockCap(ArProduct $product, ?ArProductVariation $variation): float
    {
        if ($variation) {
            return max(0, (float) $variation->pv_quantity);
        }

        return max(0, (float) $product->product_stock);
    }

    /** [mrp, selling] for one unit. */
    private function rates(ArProduct $product, ?ArProductVariation $variation, string $type): array
    {
        if ($type === self::WHOLESALE) {
            $selling = (float) $product->product_wh_selling_price;

            return [max((float) $product->product_wh_mrp_price, $selling), $selling];
        }

        $selling = (float) ($variation ? $variation->pv_sellingprice : $product->product_selling_price);
        $mrp = (float) ($variation ? $variation->pv_price : $product->product_price);

        return [max($mrp, $selling), $selling];
    }

    private function payload(string $type, array $lines, ?array $counts): array
    {
        $buyable = array_filter($lines, fn ($line) => $line['error'] === null);
        $subtotal = array_sum(array_column($buyable, 'line_total'));
        $mrp = array_sum(array_map(fn ($line) => $line['mrp'] * $line['qty'], $buyable));

        return [
            'type'   => $type,
            'items'  => array_values($lines),
            'count'  => count($lines),
            'totals' => [
                'mrp'      => round($mrp, 2),
                'discount' => round($mrp - $subtotal, 2),
                'subtotal' => round($subtotal, 2),
            ],
            // Both carts' line counts for a logged-in user; null for a guest.
            'counts' => $counts,
            // True when some line can't be checked out as it stands.
            'has_errors' => count($buyable) !== count($lines),
        ];
    }

    private function normalize(array $item): array
    {
        return [
            'cart_id'      => isset($item['cart_id']) ? (int) $item['cart_id'] : null,
            'product_id'   => (int) $item['product_id'],
            'variation_id' => !empty($item['variation_id']) ? (int) $item['variation_id'] : null,
            'qty'          => round((float) $item['qty'], 2),
        ];
    }

    private function image(?string $file): string
    {
        if (!$file) {
            return env('NO_IMAGE');
        }

        return preg_match('#^https?://#i', $file) ? $file : env('PRODUCT_IMAGE') . $file;
    }

    /** 2.5 → "2.5", 3.0 → "3". */
    private function number(float $n): string
    {
        return rtrim(rtrim(number_format($n, 2, '.', ''), '0'), '.');
    }

    private function flag(string $type): int
    {
        return $type === self::WHOLESALE ? 1 : 0;
    }
}
