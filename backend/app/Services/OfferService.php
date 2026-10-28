<?php

namespace App\Services;

use App\Models\ArCategory;
use App\Models\ArProduct;
use App\Models\ArPromos;
use App\Models\ArTransactions;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Offers for the Next.js storefront — retail only, like the legacy cart.
 *
 * Three kinds of ar_promos rows matter here:
 *
 *   promo_type 0  General     — a coupon code, live between valid_from and valid_to.
 *   promo_type 1  Once a week — a coupon code, live on promo_week_day between the
 *                               *times* of valid_from and valid_to (dates ignored,
 *                               the same as CartController::updatetocartcouponbyname).
 *   promo_type 2  Milestone   — applied automatically; ar_promo_tiers says what
 *                               the cart unlocks at each amount. One runs at a time
 *                               (featured first, then newest).
 *
 * Nothing is stored: the browser keeps the coupon code it applied and sends it
 * with every price call, and summary() works the discounts out again from the
 * priced lines. The order endpoint must call summary() itself too — never take
 * a discount from the browser.
 */
class OfferService
{
    /** Tier rewards, as the admin form (_tier_row.blade.php) numbers them. */
    public const REWARD_PERCENT = 0;
    public const REWARD_FLAT = 1;
    public const REWARD_COUPON = 2;
    public const REWARD_PRODUCT = 3;

    /** Whether a coupon applies on top of the milestone reward. */
    public const STACK_COUPON_WITH_MILESTONE = true;

    /** Coupons count the whole cart, whatever category the admin set on them (milestones still honour theirs). */
    public const COUPON_IGNORES_CATEGORY = true;

    /** Categories (and their direct children) no coupon takes anything off — 37 Pre-Cut Fabrics. Milestones still count them. */
    public const COUPON_EXCLUDED_CATEGORIES = [37];

    private ?Collection $live = null;

    /**
     * Everything the cart needs about offers for these priced lines
     * (CartService::price() output) and their subtotal.
     *
     *   milestone   the running milestone offer and where the cart stands, or null
     *   shipping    progress to free shipping
     *   coupon      the coupon sent in, applied or with the reason it wasn't, or null
     *   available   featured coupons, each with how far the cart is from its minimum
     *   discount    milestone + coupon, in rupees
     *   total       subtotal − discount (shipping is worked out at checkout)
     */
    public function summary(array $lines, float $subtotal, ?string $coupon, $user): array
    {
        $lines = array_values(array_filter($lines, fn ($l) => $l['error'] === null));
        $categories = $this->productCategories($lines);

        $milestone = $this->milestone($lines, $categories, $user);
        $applied = $coupon ? $this->coupon($coupon, $lines, $categories, $user) : null;

        if ($applied && $applied['applied'] && $milestone && $milestone['discount'] > 0 && !self::STACK_COUPON_WITH_MILESTONE) {
            $applied = array_merge($applied, [
                'applied' => false, 'discount' => 0.0,
                'message' => "Can't be used with the {$milestone['name']} offer.",
            ]);
        }

        $discount = min($subtotal, ($milestone['discount'] ?? 0) + ($applied['discount'] ?? 0));
        // Every piece ships free on its own (product_shipping_free, set by CartApiController).
        $allFree = $lines && !array_filter($lines, fn ($l) => empty($l['shipping_free']));

        return [
            'milestone' => $milestone,
            'shipping'  => $this->shipping($subtotal, $allFree),
            'coupon'    => $applied,
            'available' => $this->available($lines, $categories),
            'discount'  => round($discount, 2),
            'total'     => round($subtotal - $discount, 2),
        ];
    }

    /** Featured, currently live coupons (not milestones) — for GET /api/offers. */
    public function list(): array
    {
        return $this->live()
            ->filter(fn (ArPromos $p) => (int) $p->promo_type !== 2 && (int) $p->promo_featured === 1)
            ->map(fn (ArPromos $p) => $this->card($p))
            ->values()->all();
    }

    /** The running milestone offer with its tiers, without a cart — for GET /api/offers. */
    public function milestoneOffer(): ?array
    {
        $promo = $this->milestonePromo();

        return $promo ? $this->milestoneShape($promo, 0.0) : null;
    }

    /**
     * Progress to free shipping at this subtotal (ShippingService::progress —
     * admin_prepaid_shipping_free + admin_min_order). `$allFree`: every line
     * ships free on its own. The cart's own call (CartApiController) replaces
     * this with the full quote, which adds the weight-based `amount`.
     */
    public function shipping(float $subtotal, bool $allFree = false): array
    {
        return app(ShippingService::class)->progress($subtotal, $allFree);
    }

    /* ------------------------------------------------------------------ */

    /** Live promos, featured first then newest. Read once per request. */
    private function live(): Collection
    {
        return $this->live ??= ArPromos::with('tiers')
            ->where('promo_status', 1)
            ->orderByDesc('promo_featured')
            ->orderByDesc('promo_id')
            ->get()
            ->filter(fn (ArPromos $p) => $this->isLive($p))
            ->values();
    }

    private function isLive(ArPromos $p, ?Carbon $now = null): bool
    {
        return $this->whyNotLive($p, $now) === null;
    }

    /** Why the promo can't be used right now, or null if it can. */
    private function whyNotLive(ArPromos $p, ?Carbon $now = null): ?string
    {
        $now ??= Carbon::now();

        if ((int) $p->promo_type === 1) {
            if ($p->promo_week_day !== $now->format('l')) {
                return 'This coupon is only valid on ' . $p->promo_week_day . 's.';
            }
            $from = Carbon::today()->setTimeFromTimeString(Carbon::parse($p->promo_valid_from)->format('H:i:s'));
            $to = Carbon::today()->setTimeFromTimeString(Carbon::parse($p->promo_valid_to)->format('H:i:s'));

            return $now->between($from, $to) ? null : 'This coupon is valid ' . $from->format('g:i A') . ' – ' . $to->format('g:i A') . '.';
        }

        if ($p->promo_valid_from && $now->lt(Carbon::parse($p->promo_valid_from))) {
            return 'This coupon is not active yet.';
        }
        if ($p->promo_valid_to && $now->gt(Carbon::parse($p->promo_valid_to))) {
            return 'This coupon has expired.';
        }

        return null;
    }

    private function milestonePromo(): ?ArPromos
    {
        return $this->live()->first(fn (ArPromos $p) => (int) $p->promo_type === 2 && $p->tiers->isNotEmpty());
    }

    /** The milestone offer and where these lines stand against it. */
    private function milestone(array $lines, array $categories, $user): ?array
    {
        $promo = $this->milestonePromo();
        if (!$promo) {
            return null;
        }
        // A first-order-only milestone still shows for someone who has ordered
        // before — as locked, so the bar doesn't vanish without a reason.
        $blocked = (int) $promo->promo_first_user === 1 && $this->hasOrdered($user);
        $amount = $this->eligibleAmount($promo, $lines, $categories);

        $shape = $this->milestoneShape($promo, $blocked ? 0.0 : $amount);
        if ($blocked) {
            $shape['message'] = 'This offer is for first orders only.';
        }

        return $shape;
    }

    private function milestoneShape(ArPromos $promo, float $amount): array
    {
        $tiers = $promo->tiers->values();
        $reached = $tiers->filter(fn ($t) => $amount >= (float) $t->tier_min_amount)->last();
        $next = $tiers->first(fn ($t) => $amount < (float) $t->tier_min_amount);
        $top = (float) $tiers->last()->tier_min_amount;
        $gifts = $this->giftProducts($tiers);

        return [
            'id'          => (int) $promo->promo_id,
            'name'        => $promo->promo_name,
            'description' => $promo->promo_description,
            'category_id' => (int) $promo->promo_cat_id ?: null,
            'amount'      => round($amount, 2),
            'progress'    => $top > 0 ? round(min(1, $amount / $top), 4) : 1.0,
            'tiers'       => $tiers->map(fn ($t) => [
                'id'          => (int) $t->tier_id,
                'min_amount'  => (float) $t->tier_min_amount,
                'label'       => $t->tier_label,
                'reward_type' => (int) $t->tier_reward_type,
                'reward_value'=> (float) $t->tier_reward_value,
                'max_amount'  => $t->tier_max_amount !== null ? (float) $t->tier_max_amount : null,
                'unlocked'    => $amount >= (float) $t->tier_min_amount,
                // Only shown once reached, so a code can't be read off an unreached tier.
                'coupon_code' => (int) $t->tier_reward_type === self::REWARD_COUPON && $amount >= (float) $t->tier_min_amount ? $t->tier_coupon_code : null,
                'product'     => (int) $t->tier_reward_type === self::REWARD_PRODUCT ? ($gifts[(int) $t->tier_product_id] ?? null) : null,
            ])->all(),
            'reached_tier_id' => $reached ? (int) $reached->tier_id : null,
            'next'        => $next ? [
                'tier_id'  => (int) $next->tier_id,
                'label'    => $next->tier_label,
                'short_by' => round((float) $next->tier_min_amount - $amount, 2),
            ] : null,
            'discount'    => $reached ? $this->tierDiscount($reached, $amount) : 0.0,
            'message'     => null,
        ];
    }

    /** Rupees off for a reached tier. Coupon and free-product tiers take nothing off the price. */
    private function tierDiscount($tier, float $amount): float
    {
        $value = (float) $tier->tier_reward_value;

        switch ((int) $tier->tier_reward_type) {
            case self::REWARD_PERCENT:
                $off = $amount * $value / 100;
                if ($tier->tier_max_amount !== null && (float) $tier->tier_max_amount > 0) {
                    $off = min($off, (float) $tier->tier_max_amount);
                }
                return round(min($off, $amount), 2);
            case self::REWARD_FLAT:
                return round(min($value, $amount), 2);
            default:
                return 0.0;
        }
    }

    /**
     * Checks a coupon code against the cart. Always returns the shape below;
     * `applied` false comes with the reason in `message`.
     */
    public function coupon(string $code, array $lines, array $categories, $user): array
    {
        $code = trim($code);
        $out = ['code' => $code, 'id' => null, 'name' => null, 'applied' => false, 'discount' => 0.0, 'message' => null, 'short_by' => null];

        $promo = ArPromos::where('promo_coupon_code', $code)->where('promo_status', 1)->first();
        if (!$promo || (int) $promo->promo_type === 2) {
            // A milestone's own code isn't a coupon — it applies by itself.
            return array_merge($out, ['message' => 'This coupon code is not valid.']);
        }
        $out = array_merge($out, ['id' => (int) $promo->promo_id, 'code' => $promo->promo_coupon_code, 'name' => $promo->promo_name]);

        // Guests see the coupons but can't use them.
        if (!$user) {
            return array_merge($out, ['message' => 'Log in to apply this coupon.']);
        }

        if ($why = $this->whyNotLive($promo)) {
            return array_merge($out, ['message' => $why]);
        }

        $userId = $user->user_id ?? null;
        if ((int) $promo->promo_first_user === 1 && $this->hasOrdered($user)) {
            return array_merge($out, ['message' => 'This coupon is only for your first order.']);
        }

        // An empty or 0 limit means no limit. (The legacy check compared against
        // NULL, which blocked every coupon without one.)
        $limit = (int) $promo->promo_usage_limit;
        if ($limit > 0 && $this->uses($promo->promo_id) >= $limit) {
            return array_merge($out, ['message' => 'This coupon has reached its usage limit.']);
        }
        $perUser = (int) $promo->promo_usage_user_limit;
        if ($perUser > 0 && $userId && $this->uses($promo->promo_id, $userId) >= $perUser) {
            return array_merge($out, ['message' => "You've already used this coupon."]);
        }

        $amount = $this->eligibleAmount($promo, $lines, $categories);
        $minimum = (float) $promo->promo_minimum_purchase;
        if ($amount <= 0) {
            return array_merge($out, ['message' => 'None of the items in your cart are eligible for this coupon.']);
        }
        if ($amount < $minimum) {
            $short = round($minimum - $amount, 2);
            return array_merge($out, [
                'short_by' => $short,
                'message'  => 'Add ₹' . $this->number($short) . ' more' . ($this->promoCategories($promo) || $amount < array_sum(array_column($lines, 'line_total')) ? ' of eligible items' : '') . ' to use this coupon.',
            ]);
        }

        return array_merge($out, [
            'applied'  => true,
            'discount' => $this->couponDiscount($promo, $amount),
            'message'  => $promo->promo_coupon_code . ' applied.',
        ]);
    }

    private function couponDiscount(ArPromos $p, float $amount): float
    {
        if ((int) $p->promo_discount_in === 0) {
            return round(min((float) $p->promo_amount, $amount), 2);
        }
        $off = $amount * (float) $p->promo_amount / 100;
        if ((float) $p->promo_max_amount > 0) {
            $off = min($off, (float) $p->promo_max_amount);
        }

        return round(min($off, $amount), 2);
    }

    /** Featured live coupons, each with how far these lines are from its minimum. */
    private function available(array $lines, array $categories): array
    {
        return array_map(function (array $card) use ($lines, $categories) {
            $promo = $this->live()->firstWhere('promo_id', $card['id']);
            $amount = $this->eligibleAmount($promo, $lines, $categories);
            $short = max(0, (float) $promo->promo_minimum_purchase - $amount);

            return $card + [
                'eligible' => $amount > 0 && $short <= 0,
                'short_by' => round($short, 2),
                // What it would take off this cart right now.
                'saves'    => $amount > 0 && $short <= 0 ? $this->couponDiscount($promo, $amount) : 0.0,
            ];
        }, $this->list());
    }

    /** A coupon as the storefront lists it. */
    private function card(ArPromos $p): array
    {
        $flat = (int) $p->promo_discount_in === 0;
        $amount = (float) $p->promo_amount;
        $cap = (float) $p->promo_max_amount;

        return [
            'id'           => (int) $p->promo_id,
            'code'         => $p->promo_coupon_code,
            'name'         => $p->promo_name,
            'description'  => $p->promo_description,
            // "₹200 off" / "10% off up to ₹500"
            'headline'     => $flat
                ? '₹' . $this->number($amount) . ' off'
                : $this->number($amount) . '% off' . ($cap > 0 ? ' up to ₹' . $this->number($cap) : ''),
            'discount_in'  => $flat ? 'flat' : 'percent',
            'value'        => $amount,
            'max_amount'   => $cap > 0 ? $cap : null,
            'min_purchase' => (float) $p->promo_minimum_purchase ?: null,
            'category_id'  => self::COUPON_IGNORES_CATEGORY ? null : ((int) $p->promo_cat_id ?: null),
            'first_order'  => (int) $p->promo_first_user === 1,
            'cashback'     => (int) $p->promo_discount_type === 0,
            'weekday'      => (int) $p->promo_type === 1 ? $p->promo_week_day : null,
            'valid_to'     => (int) $p->promo_type === 1 ? null : Carbon::parse($p->promo_valid_to)->toIso8601String(),
        ];
    }

    /** Subtotal of the lines the promo's category covers (all of them when it has none).
        Coupons leave out COUPON_EXCLUDED_CATEGORIES lines. */
    private function eligibleAmount(ArPromos $p, array $lines, array $categories): float
    {
        $allowed = $this->promoCategories($p);
        $excluded = (int) $p->promo_type !== 2 ? $this->couponExcludedCategories() : [];

        return round(array_sum(array_map(function (array $line) use ($allowed, $excluded, $categories) {
            $own = $categories[$line['product_id']] ?? [];
            if ($allowed && !array_intersect($allowed, $own)) {
                return 0;
            }
            if ($excluded && array_intersect($excluded, $own)) {
                return 0;
            }
            return $line['line_total'];
        }, $lines)), 2);
    }

    /** COUPON_EXCLUDED_CATEGORIES and their direct children, as strings like productCategories(). */
    private function couponExcludedCategories(): array
    {
        static $ids = null;
        if (!self::COUPON_EXCLUDED_CATEGORIES) {
            return [];
        }

        return $ids ??= collect(self::COUPON_EXCLUDED_CATEGORIES)
            ->merge(ArCategory::whereIn('cat_parent', self::COUPON_EXCLUDED_CATEGORIES)->pluck('cat_id'))
            ->map(fn ($c) => (string) $c)->unique()->values()->all();
    }

    /** The promo's category and its direct children, as the legacy coupon check did. Empty = all. */
    private function promoCategories(ArPromos $p): array
    {
        static $cache = [];
        $id = (int) $p->promo_cat_id;
        if (!$id || ((int) $p->promo_type !== 2 && self::COUPON_IGNORES_CATEGORY)) {
            return [];
        }

        return $cache[$id] ??= ArCategory::where('cat_status', 1)
            ->where(fn ($q) => $q->where('cat_id', $id)->orWhere('cat_parent', $id))
            ->pluck('cat_id')->map(fn ($c) => (string) $c)->all();
    }

    /** product_id → its category ids (product_category_id is a comma list). */
    private function productCategories(array $lines): array
    {
        $ids = array_unique(array_column($lines, 'product_id'));
        if (!$ids) {
            return [];
        }

        return ArProduct::whereIn('product_id', $ids)->pluck('product_category_id', 'product_id')
            ->map(fn ($c) => array_map('trim', explode(',', (string) $c)))
            ->all();
    }

    /** The free-gift products the tiers name, keyed by id. */
    private function giftProducts(Collection $tiers): array
    {
        $ids = $tiers->where('tier_reward_type', self::REWARD_PRODUCT)->pluck('tier_product_id')->filter()->map(fn ($i) => (int) $i)->all();
        if (!$ids) {
            return [];
        }

        return ArProduct::whereIn('product_id', $ids)->get()->mapWithKeys(fn ($p) => [(int) $p->product_id => [
            'id'    => (int) $p->product_id,
            'name'  => $p->product_name,
            'slug'  => $p->product_slug,
            'image' => $p->product_image
                ? (preg_match('#^https?://#i', $p->product_image) ? $p->product_image : env('PRODUCT_IMAGE') . $p->product_image)
                : env('NO_IMAGE'),
        ]])->all();
    }

    private function hasOrdered($user): bool
    {
        return $user && ArTransactions::where('trans_user_id', $user->user_id)->where('trans_payment_status', 1)->exists();
    }

    private function uses(int $promoId, ?int $userId = null): int
    {
        return ArTransactions::where('trans_coupon_id', $promoId)
            ->where('trans_payment_status', 1)
            ->when($userId, fn ($q) => $q->where('trans_user_id', $userId))
            ->count();
    }

    /** 2.5 → "2.5", 300.0 → "300". */
    private function number(float $n): string
    {
        return rtrim(rtrim(number_format($n, 2, '.', ''), '0'), '.');
    }
}
