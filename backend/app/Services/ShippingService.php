<?php

namespace App\Services;

use App\Models\ArProduct;
use App\Models\ArProductVariation;
use App\Models\ArShippingCharges;
use App\Models\ArThemeAdmin;

/**
 * Shipping and GST for the Next.js storefront's cart — the same rules as the
 * legacy CartController::getTotalShipping(), worked out from the priced lines.
 *
 * Shipping is by weight only (not pincode or address):
 *   - the cart's weight is product_weight (simple) or pv_weight (variation)
 *     × qty, counting only pieces with product_shipping_free = 0;
 *   - that weight is looked up in ar_shipping_charges (weight_range "min-max",
 *     live rows only); a weight above every band pays the highest charge.
 *
 * Retail: when admin_prepaid_shipping_free = 1, shipping is free once the
 * subtotal reaches admin_min_order (every order when that is 0). A cart of
 * nothing but product_shipping_free pieces weighs 0, so it ships free too.
 *
 * Wholesale: shipping is never free — product_shipping_free and the admin
 * offer don't apply — and 5% GST is added on the subtotal:
 *   total = subtotal + subtotal × 5% + shipping.
 */
class ShippingService
{
    public const WHOLESALE_GST_PERCENT = 5;

    /**
     * Adds `shipping_free` (0|1) and `weight` (one unit's) to each line. One
     * query for the products and one for the variations. Wholesale lines are
     * never shipping free.
     */
    public function annotate(array $lines, string $type): array
    {
        $ids = array_values(array_unique(array_map(fn ($l) => (int) $l['product_id'], $lines)));
        $vids = array_values(array_filter(array_unique(array_map(fn ($l) => (int) ($l['variation_id'] ?? 0), $lines))));

        $products = $ids
            ? ArProduct::whereIn('product_id', $ids)
                ->get(['product_id', 'product_type', 'product_weight', 'product_shipping_free'])
                ->keyBy('product_id')
            : collect();
        $variations = $vids
            ? ArProductVariation::whereIn('pv_id', $vids)->pluck('pv_weight', 'pv_id')
            : collect();

        return array_map(function (array $l) use ($products, $variations, $type) {
            $p = $products->get((int) $l['product_id']);
            $vid = (int) ($l['variation_id'] ?? 0);
            $weight = $p && (int) $p->product_type !== 0 && $vid && $variations->has($vid)
                ? (float) $variations->get($vid)
                : (float) ($p->product_weight ?? 0);
            $free = $type === CartService::RETAIL && $p && (int) $p->product_shipping_free === 1;

            return $l + ['shipping_free' => $free ? 1 : 0, 'weight' => $weight];
        }, $lines);
    }

    /**
     * Shipping for annotated lines (annotate()) at this subtotal. The shape
     * is also the retail cart's `offers.shipping` progress bar:
     *
     *   amount          rupees charged for shipping
     *   weight          the chargeable weight (shipping-free pieces left out)
     *   free            nothing to pay
     *   threshold       subtotal that makes it free (retail offer on, admin_min_order > 0), else null
     *   prepaid_free    free on every order (offer on, no minimum)
     *   all_items_free  every piece is product_shipping_free
     *   short_by / progress   towards `threshold`
     */
    public function quote(array $lines, float $subtotal, string $type): array
    {
        $lines = array_values(array_filter($lines, fn ($l) => empty($l['error'])));
        $wholesale = $type === CartService::WHOLESALE;

        $weight = round(array_sum(array_map(
            fn ($l) => empty($l['shipping_free']) ? (float) ($l['weight'] ?? 0) * (float) $l['qty'] : 0,
            $lines,
        )), 3);
        $allFree = !$wholesale && $lines && !array_filter($lines, fn ($l) => empty($l['shipping_free']));

        $progress = $wholesale
            ? ['threshold' => null, 'free' => false, 'prepaid_free' => false, 'all_items_free' => false, 'short_by' => 0.0, 'progress' => 0.0]
            : $this->progress($subtotal, $allFree);
        $amount = $progress['free'] || !$lines ? 0.0 : $this->charge($weight);

        return ['amount' => round($amount, 2), 'weight' => $weight] + array_merge($progress, ['free' => $amount <= 0]);
    }

    /**
     * Where a retail subtotal stands against the free-shipping offer — no
     * weights needed, so GET /api/offers can show it without a cart.
     * The offer is on when admin_prepaid_shipping_free = 1; it frees orders
     * from admin_min_order up (every order when that is 0).
     */
    public function progress(float $subtotal, bool $allFree = false): array
    {
        $admin = ArThemeAdmin::select('admin_prepaid_shipping_free', 'admin_min_order')->first();
        $offer = (int) ($admin->admin_prepaid_shipping_free ?? 0) === 1;
        $minimum = $offer ? max(0, (float) ($admin->admin_min_order ?? 0)) : 0.0;
        $free = $allFree || ($offer && $subtotal >= $minimum);

        return [
            'threshold'      => $offer && $minimum > 0 ? $minimum : null,
            'free'           => $free,
            'prepaid_free'   => $offer && $minimum <= 0,
            'all_items_free' => $allFree,
            'short_by'       => $offer && !$free ? round(max(0, $minimum - $subtotal), 2) : 0.0,
            'progress'       => $free ? 1.0 : ($offer && $minimum > 0 ? round(min(1, $subtotal / $minimum), 4) : 0.0),
        ];
    }

    /** Wholesale GST on the subtotal; 0 for retail (its prices include GST). */
    public function gst(float $subtotal, string $type): array
    {
        $rate = $type === CartService::WHOLESALE ? self::WHOLESALE_GST_PERCENT : 0;

        return ['rate' => $rate, 'amount' => round($subtotal * $rate / 100, 2)];
    }

    /**
     * The charge for this weight from ar_shipping_charges. Bands are taken in
     * order of their lower bound and the first whose upper bound covers the
     * weight wins, so a weight in a gap between bands ("4999-5001") pays the
     * next band up. Above every band: the highest charge.
     */
    public function charge(float $weight): float
    {
        if ($weight <= 0) {
            return 0.0;
        }
        $bands = ArShippingCharges::where('status', 1)->where('trash', 0)->get()
            ->map(function ($row) {
                if (strpos((string) $row->weight_range, '-') === false) {
                    return null;
                }
                [$min, $max] = array_map(fn ($v) => (float) trim($v), explode('-', $row->weight_range, 2));

                return ['min' => $min, 'max' => $max, 'charges' => (float) $row->charges];
            })
            ->filter()
            ->sortBy('min')
            ->values();

        if ($bands->isEmpty()) {
            return 0.0;
        }
        $band = $bands->first(fn ($b) => $weight <= $b['max']);

        return $band ? $band['charges'] : (float) $bands->max('charges');
    }
}
