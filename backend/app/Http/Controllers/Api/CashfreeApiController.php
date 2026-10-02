<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\sendingEmail;
use App\Models\ArCart;
use App\Models\ArProduct;
use App\Models\ArProductVariation;
use App\Models\ArThemeAdmin;
use App\Models\ArTransactionDetails;
use App\Models\ArTransactions;
use App\Models\ArUniqueIds;
use App\Models\ArUsers;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Facade;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Checkout for the Next.js storefront — retail (guest or logged in) and
 * wholesale (logged in only), paid through Cashfree or, wholesale only, by
 * bank transfer.
 *
 *   POST /api/cart/paynow                      place the order (lib/checkout.ts → placeOrder)
 *   GET  /api/cart/payment-status/{order_no}   where the payment stands; settles it with Cashfree
 *   POST /api/cashfree/webhook                 Cashfree's server-to-server notice (signed)
 *
 * Nothing the browser says about money is trusted: the cart is priced again
 * by POST /api/cart/price (the same call the cart page uses, so offers and
 * coupons come out identical), and an order whose total has moved since the
 * page showed it is refused rather than billed differently.
 *
 * A payment is only ever believed from Cashfree's own API. The return URL and
 * the webhook both just ask Cashfree, and whichever arrives first settles the
 * order — once: stock, cart and emails happen under a row lock.
 */
class CashfreeApiController extends Controller
{
    /** The guard /api/auth/* tokens resolve through. */
    private const GUARD = 'sanctum';

    private const API_VERSION = '2023-08-01';

    /* trans_status / trans_payment_status */
    private const PENDING = 0;
    private const PAID = 1;
    private const FAILED = 2;

    private const METHOD_ONLINE = 'cashfree';
    private const METHOD_BANK = 'bank_transfer';

    /** ar_unique_ids rows. */
    private const ORDER_SEQUENCE = 3;
    private const USER_SEQUENCE = 7;

    /** How far (₹) the page's total may sit from the server's before the order is refused. */
    private const TOLERANCE = 1.0;

    /** ar_promo_tiers.tier_reward_type for "a free product". */
    private const REWARD_PRODUCT = 3;

    /**
     * POST /api/cart/paynow — the body lib/checkout.ts `buildPayNowPayload` sends:
     * type, products[], user, shipping_address, notes, payment_method,
     * coupon_code, final_amount, gst. Bearer token when logged in.
     *
     * 200 { status, message, order_number, amount, payment: { gateway, mode, payment_session_id } | null }
     * 401 wholesale without a login · 409 the total moved · 422 bad form / unavailable piece · 502 Cashfree said no
     */
    public function payNow(Request $request): JsonResponse
    {
        $account = $request->user(self::GUARD);
        $type = $request->input('type');
        $mobile = ['regex:/^[6-9]\d{9}$/'];

        $v = Validator::make($request->all(), [
            'type'                      => 'required|in:retail,wholesale',
            'products'                  => 'required|array|min:1|max:100',
            'products.*.product_id'     => 'required|integer|min:1',
            'products.*.variation_id'   => 'nullable|integer|min:1',
            'products.*.qty'            => 'required|numeric|gt:0',
            // Logged in, the buyer is the token; the form still says who to bill.
            'user'                      => $account ? 'nullable|array' : 'required|array',
            'user.mobile'               => array_merge([$account ? 'nullable' : 'required'], $mobile),
            'user.first_name'           => [$account ? 'nullable' : 'required', 'string', 'max:100'],
            'user.last_name'            => 'nullable|string|max:100',
            'user.email'                => 'nullable|email|max:150',
            'shipping_address'          => 'required|array',
            'shipping_address.address'  => 'required|string|max:255',
            'shipping_address.landmark' => 'nullable|string|max:255',
            'shipping_address.pincode'  => ['required', 'regex:/^[1-9]\d{5}$/'],
            'shipping_address.state'    => 'required|string|max:100',
            'shipping_address.city'     => 'required|string|max:100',
            'shipping_address.phone'    => array_merge(['required'], $mobile),
            'notes'                     => 'nullable|string|max:1000',
            'payment_method'            => 'required|in:online,bank',
            'coupon_code'               => 'nullable|string|max:50',
            'final_amount'              => 'required|numeric|min:0',
            'gst'                       => 'nullable|array',
            'gst.gstin'                 => ['nullable', 'regex:/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/'],
            'gst.business_name'         => 'nullable|string|max:150',
        ], [
            'user.mobile.regex'            => 'Enter a 10-digit mobile number.',
            'shipping_address.phone.regex' => 'Enter a 10-digit phone for delivery.',
            'shipping_address.pincode.regex' => 'Enter a 6-digit pincode.',
            'gst.gstin.regex'              => "That GSTIN doesn't look right.",
        ]);
        if ($v->fails()) {
            return $this->fail($v->errors()->first(), 422, $v->errors()->toArray());
        }

        $wholesale = $type === 'wholesale';
        if ($wholesale && !$account) {
            return $this->fail('Log in to place a wholesale order.', 401);
        }
        if (!$wholesale && $request->input('payment_method') === 'bank') {
            return $this->fail('Retail orders are paid online.', 422);
        }

        /* ---------- price the cart the way the cart page did ---------- */

        $items = collect($request->input('products'))->map(fn ($p) => [
            'product_id'   => (int) $p['product_id'],
            'variation_id' => !empty($p['variation_id']) ? (int) $p['variation_id'] : null,
            'qty'          => (float) $p['qty'],
        ])->values()->all();
        $coupon = $wholesale ? null : (trim((string) $request->input('coupon_code')) ?: null);

        $priced = $this->priceCart($request, $type, $items, $coupon);
        if (!$priced) {
            return $this->fail("Couldn't price your cart — please try again.", 503);
        }

        $lines = [];
        foreach ($items as $item) {
            $line = collect($priced['items'] ?? [])->first(fn ($s) =>
                (int) ($s['product_id'] ?? 0) === $item['product_id']
                && (int) ($s['variation_id'] ?? 0) === (int) $item['variation_id']);
            if (!$line) {
                return $this->fail('A piece in your cart is no longer available — remove it and try again.', 422);
            }
            if (!empty($line['error'])) {
                return $this->fail(($line['name'] ?? 'A piece') . ': ' . $line['error'], 422);
            }
            $lines[] = $line;
        }

        $totals = $priced['totals'] ?? [];
        $offers = $wholesale ? null : ($priced['offers'] ?? null);
        $payable = round((float) ($offers['total'] ?? $totals['subtotal'] ?? 0), 2);
        if ($payable <= 0) {
            return $this->fail("Couldn't work out your total — please try again.", 422);
        }
        if (abs($payable - (float) $request->input('final_amount')) > self::TOLERANCE) {
            return response()->json([
                'status'       => 'error',
                'message'      => 'Prices have changed — your total is now ₹' . number_format($payable, 2)
                    . '. Please check your order and pay again.',
                'final_amount' => $payable,
            ], 409);
        }

        $appliedCoupon = !empty($offers['coupon']['applied']) ? $offers['coupon'] : null;
        $discount = (float) ($totals['discount'] ?? 0) + (float) ($offers['discount'] ?? 0);
        $gift = $this->milestoneGift($offers);

        /* ---------- the buyer ---------- */

        $form = $request->input('user') ?? [];
        $ship = $request->input('shipping_address');
        $gst = $wholesale ? ($request->input('gst') ?? []) : [];
        $online = $request->input('payment_method') === 'online';

        $user = $account
            ? ArUsers::find($account->user_id ?? $account->getKey())
            : $this->guestUser($form, $ship);
        if (!$user) {
            return $this->fail('Your session has expired — log in again.', 401);
        }
        if ($account) {
            $this->rememberAddress($user, $ship, $gst['gstin'] ?? null);
        }

        $name = trim(($form['first_name'] ?? '') . ' ' . ($form['last_name'] ?? ''))
            ?: trim($user->user_fname . ' ' . $user->user_lname);
        $email = ($form['email'] ?? '') ?: $user->user_email;
        $contact = ($form['mobile'] ?? '') ?: $user->user_mobile;

        /* ---------- the order ---------- */

        $order = DB::transaction(function () use (
            $user, $name, $email, $contact, $ship, $gst, $wholesale, $online, $payable,
            $discount, $appliedCoupon, $lines, $gift, $request
        ) {
            $address = implode(', ', array_filter([
                $ship['address'], $ship['landmark'] ?? null, $ship['city'], $ship['state'], $ship['pincode'],
            ]));

            $order = new ArTransactions;
            $order->trans_datetime = now()->format('Y-m-d H:i:s');
            $order->trans_order_number = $this->nextId(self::ORDER_SEQUENCE);
            $order->trans_amt = number_format($payable, 2, '.', '');
            $order->trans_currency = '₹';
            $order->trans_method = $online ? self::METHOD_ONLINE : self::METHOD_BANK;
            $order->trans_gstin = $gst['gstin'] ?? '';
            $order->trans_business_name = $gst['business_name'] ?? null;
            $order->trans_notes = $request->input('notes') ?: null;
            $order->trans_shipping_amount = '0.00';
            $order->trans_discount_amount = number_format($discount, 2, '.', '');
            $order->trans_status = self::PENDING;
            $order->trans_payment_status = self::PENDING;
            $order->trans_user_id = $user->user_id;
            $order->trans_user_name = $name;
            $order->trans_user_email = $email;
            $order->trans_user_mobile = $contact;
            $order->trans_billing_address = $address;
            $order->trans_delivery_address = $address;
            $order->trans_city = $ship['city'];
            $order->trans_address_landmark = $ship['landmark'] ?? '';
            $order->trans_delivery_mobile = $ship['phone'];
            $order->trans_pincode = $ship['pincode'];
            $order->trans_state = $ship['state'];
            $order->trans_country = 'India';
            $order->trans_is_wholesale = $wholesale ? 1 : 0;
            $order->trans_coupon_id = $appliedCoupon['id'] ?? 0;
            $order->trans_coupon_code = $appliedCoupon['code'] ?? '';
            $order->trans_coupon_dis_amt = number_format((float) ($appliedCoupon['discount'] ?? 0), 2, '.', '');
            $order->save();

            foreach ($lines as $line) {
                $this->addLine($order, $line, $ship);
            }
            if ($gift) {
                $this->addLine($order, [
                    'product_id' => $gift['id'], 'variation_id' => null, 'qty' => 1,
                    'mrp' => 0, 'price' => 0, 'line_total' => 0,
                ], $ship);
            }

            return $order;
        });

        /* ---------- payment ---------- */

        if (!$online) {
            // Bank transfer: the order stands now; the team confirms the money by hand.
            $this->clearCart($order);
            $this->sendOrderEmails($order);

            return response()->json([
                'status'       => 'success',
                'message'       => "Order placed — we'll email our bank details to complete the payment.",
                'order_number'  => $order->trans_order_number,
                'receipt_token' => $this->receiptToken($order->trans_order_number),
                'amount'        => (float) $order->trans_amt,
                'payment'       => null,
            ]);
        }

        $cf = $this->createCashfreeOrder($order, $user, $wholesale);
        if (!$cf || empty($cf['payment_session_id'])) {
            $order->trans_status = self::FAILED;
            $order->trans_payment_status = self::FAILED;
            $order->trans_cashfree_response = json_encode($cf);
            $order->save();

            return $this->fail("Couldn't start the payment — please try again.", 502);
        }

        return response()->json([
            'status'       => 'success',
            'message'       => 'Order created',
            'order_number'  => $order->trans_order_number,
            'receipt_token' => $this->receiptToken($order->trans_order_number),
            'amount'        => (float) $order->trans_amt,
            'payment'       => [
                'gateway'            => 'cashfree',
                'mode'               => $this->isProduction() ? 'production' : 'sandbox',
                'payment_session_id' => $cf['payment_session_id'],
            ],
        ]);
    }

    /**
     * GET /api/cart/payment-status/{orderNumber} — what the return page shows.
     * An online order still pending is settled with Cashfree first.
     *
     * Order numbers run in sequence, so on its own this says nothing about
     * the buyer. With ?t=<receipt_token> — handed out by paynow and carried
     * on Cashfree's return URL, so only whoever placed the order has it — a
     * paid or placed order also comes with `receipt`: the items, totals and
     * delivery details for the thank-you page.
     *
     * payment_status: paid | failed | pending | awaiting_transfer
     */
    public function status(Request $request, string $orderNumber): JsonResponse
    {
        $order = ArTransactions::where('trans_order_number', $orderNumber)->first();
        if (!$order) {
            return $this->fail('Order not found.', 404);
        }

        if ($order->trans_method !== self::METHOD_BANK && (int) $order->trans_payment_status !== self::PAID) {
            $this->settle($order);
            $order->refresh();
        }

        $state = (int) $order->trans_payment_status;
        $paymentStatus = $state === self::PAID ? 'paid'
            : ($state === self::FAILED ? 'failed'
            : ($order->trans_method === self::METHOD_BANK ? 'awaiting_transfer' : 'pending'));
        $owner = hash_equals($this->receiptToken($order->trans_order_number), (string) $request->query('t'));

        return response()->json([
            'status' => 'success',
            'order'  => [
                'order_number'   => $order->trans_order_number,
                'payment_status' => $paymentStatus,
                'amount'         => (float) $order->trans_amt,
                'is_wholesale'   => (int) $order->trans_is_wholesale === 1,
                'receipt'        => $owner && in_array($paymentStatus, ['paid', 'awaiting_transfer'], true)
                    ? $this->receipt($order) : null,
            ],
        ]);
    }

    /** Proof of having placed the order — the thank-you page's key to its details. */
    private function receiptToken(string $orderNumber): string
    {
        return substr(hash_hmac('sha256', 'receipt|' . $orderNumber, (string) config('app.key')), 0, 32);
    }

    /** What the thank-you page shows. */
    private function receipt(ArTransactions $order): array
    {
        $items = ArTransactionDetails::where('td_trans_id', $order->trans_id)->get()->map(fn ($d) => [
            'name'    => $d->td_item_title,
            'image'   => $d->td_item_image,
            'variant' => $d->td_item_color ?: null,
            'qty'     => (float) $d->td_item_qty,
            'mrp'     => (float) $d->td_item_net_price,
            'price'   => (float) $d->td_item_sellling_price,
            'total'   => (float) $d->td_item_total,
        ])->values();

        return [
            'placed_at'        => $order->trans_datetime,
            'name'             => $order->trans_user_name,
            'email'            => $order->trans_user_email ?: null,
            'mobile'           => $order->trans_user_mobile,
            'delivery_address' => $order->trans_delivery_address,
            'delivery_phone'   => $order->trans_delivery_mobile,
            'city'             => $order->trans_city,
            'state'            => $order->trans_state,
            'pincode'          => $order->trans_pincode,
            'payment_method'   => $order->trans_method,
            'payment_ref'      => $order->trans_ref_id ?: null,
            'discount'         => (float) $order->trans_discount_amount,
            'coupon_code'      => $order->trans_coupon_code ?: null,
            'coupon_discount'  => (float) $order->trans_coupon_dis_amt,
            'shipping'         => (float) $order->trans_shipping_amount,
            'gstin'            => $order->trans_gstin ?: null,
            'items'            => $items,
        ];
    }

    /**
     * POST /api/cashfree/webhook — set as the order's notify_url. Catches the
     * buyer who pays and closes the tab before the return page loads. The
     * payload is only used to find the order; the verdict comes from the API.
     */
    public function webhook(Request $request): JsonResponse
    {
        $raw = $request->getContent();
        $timestamp = (string) $request->header('x-webhook-timestamp');
        $expected = base64_encode(hash_hmac('sha256', $timestamp . $raw, (string) config('services.cashfree.secret'), true));
        if (!$timestamp || !hash_equals($expected, (string) $request->header('x-webhook-signature'))) {
            return response()->json(['status' => 'error'], 401);
        }

        $orderId = data_get(json_decode($raw, true), 'data.order.order_id');
        $order = $orderId ? ArTransactions::where('trans_order_number', $orderId)->first() : null;
        if ($order && (int) $order->trans_payment_status !== self::PAID) {
            $this->settle($order);
        }

        return response()->json(['status' => 'ok']);
    }

    /* ================================================================ */

    /**
     * Asks Cashfree how the order stands and records it. PAID wins over an
     * earlier FAILED (a late success is still money taken). A payment attempt
     * that failed or was abandoned marks the order failed; the buyer starts a
     * fresh one from checkout.
     */
    private function settle(ArTransactions $order): void
    {
        $res = $this->cashfree()->get('/orders/' . rawurlencode($order->trans_order_number));
        if (!$res->ok()) {
            Log::warning('Cashfree order lookup failed', ['order' => $order->trans_order_number, 'body' => $res->body()]);
            return;
        }
        $cfOrder = $res->json();
        $payments = $this->cashfree()->get('/orders/' . rawurlencode($order->trans_order_number) . '/payments');
        $attempts = $payments->ok() ? collect($payments->json()) : collect();
        $success = $attempts->firstWhere('payment_status', 'SUCCESS');

        if (($cfOrder['order_status'] ?? null) === 'PAID' && $success) {
            if (abs((float) $cfOrder['order_amount'] - (float) $order->trans_amt) > 0.01) {
                Log::error('Cashfree amount mismatch', ['order' => $order->trans_order_number, 'cashfree' => $cfOrder['order_amount']]);
                return;
            }
            $this->markPaid((int) $order->trans_id, $success, $payments->body());
            return;
        }

        $latest = $attempts->sortByDesc('payment_time')->first();
        $dead = in_array($cfOrder['order_status'] ?? null, ['EXPIRED', 'TERMINATED'], true)
            || in_array($latest['payment_status'] ?? null, ['FAILED', 'USER_DROPPED', 'CANCELLED'], true);
        if ($dead) {
            ArTransactions::where('trans_id', $order->trans_id)
                ->where('trans_payment_status', '!=', self::PAID)
                ->update([
                    'trans_status'            => self::FAILED,
                    'trans_payment_status'    => self::FAILED,
                    'trans_cashfree_response' => $payments->body(),
                ]);
        }
    }

    /** Records the payment, takes the stock and clears the cart — once, however many callers race here. */
    private function markPaid(int $transId, array $payment, string $raw): void
    {
        $order = DB::transaction(function () use ($transId, $payment, $raw) {
            $order = ArTransactions::where('trans_id', $transId)->lockForUpdate()->first();
            if (!$order || (int) $order->trans_payment_status === self::PAID) {
                return null;
            }

            $order->trans_status = self::PAID;
            $order->trans_payment_status = self::PAID;
            $order->trans_ref_id = $payment['cf_payment_id'] ?? null;
            $order->trans_method = $payment['payment_group'] ?? (is_array($payment['payment_method'] ?? null)
                ? array_key_first($payment['payment_method']) : self::METHOD_ONLINE);
            $order->trans_cashfree_response = $raw;
            $order->save();

            foreach (ArTransactionDetails::where('td_trans_id', $order->trans_id)->get() as $d) {
                $qty = (float) $d->td_item_qty;
                if ($d->td_variation_id) {
                    ArProductVariation::where('pv_id', $d->td_variation_id)
                        ->update(['pv_quantity' => DB::raw('GREATEST(pv_quantity - ' . $qty . ', 0)')]);
                } else {
                    ArProduct::where('product_id', $d->td_item_id)
                        ->update(['product_stock' => DB::raw('GREATEST(product_stock - ' . $qty . ', 0)')]);
                }
            }

            $this->clearCart($order);
            return $order;
        });

        if ($order) {
            $this->sendOrderEmails($order);
        }
    }

    /**
     * The cart, priced by POST /api/cart/price — dispatched in-process so
     * prices, offers and coupons come from the one place the cart page
     * already trusts. The caller's token goes along (wholesale rates need it).
     */
    private function priceCart(Request $request, string $type, array $items, ?string $coupon): ?array
    {
        $server = ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'];
        if ($token = $request->bearerToken()) {
            $server['HTTP_AUTHORIZATION'] = 'Bearer ' . $token;
        }
        $body = ['type' => $type, 'items' => $items] + ($coupon ? ['coupon' => $coupon] : []);
        $sub = Request::create('/api/cart/price', 'POST', [], [], [], $server, json_encode($body));

        try {
            $res = app()->handle($sub);
        } finally {
            // The sub-request replaced the container's request; put ours back.
            app()->instance('request', $request);
            Facade::clearResolvedInstance('request');
        }

        $json = json_decode($res->getContent(), true);
        if ($res->getStatusCode() !== 200 || !is_array($json) || !isset($json['items'])) {
            Log::warning('Cart pricing failed at checkout', ['status' => $res->getStatusCode(), 'body' => $res->getContent()]);
            return null;
        }
        return $json;
    }

    /** The free product a reached milestone tier gives, if any. */
    private function milestoneGift(?array $offers): ?array
    {
        $m = $offers['milestone'] ?? null;
        if (!$m || empty($m['reached_tier_id'])) {
            return null;
        }
        foreach ($m['tiers'] ?? [] as $tier) {
            if ($tier['id'] === $m['reached_tier_id'] && (int) $tier['reward_type'] === self::REWARD_PRODUCT) {
                return $tier['product'] ?? null;
            }
        }
        return null;
    }

    /** One order line, priced from the server's cart line; names, tax and images from the catalogue. */
    private function addLine(ArTransactions $order, array $line, array $ship): void
    {
        $product = ArProduct::where('product_id', $line['product_id'])->with('taxBelongsTo')->first();
        if (!$product) {
            return;
        }
        $variation = !empty($line['variation_id']) ? ArProductVariation::where('pv_id', $line['variation_id'])->first() : null;
        $qty = (float) $line['qty'];
        $price = (float) $line['price'];

        $d = new ArTransactionDetails;
        $d->td_trans_id = $order->trans_id;
        $d->td_item_id = $product->product_id;
        $d->td_variation_id = $variation->pv_id ?? null;
        $d->td_user_id = $order->trans_user_id;
        $d->td_item_title = $product->product_name;
        $d->td_city = $ship['city'];
        $d->td_pincode = $ship['pincode'];
        $d->td_state = $ship['state'];
        $d->td_country = 'India';
        $d->td_item_hsn = $product->product_saccode;
        $d->td_tax_id = $product->product_tax_id;
        $d->td_gst = $product->taxBelongsTo->gst_tax_percentage ?? 5;
        $d->td_item_qty = $qty;
        $d->td_item_net_price = (float) ($line['mrp'] ?? 0) ?: $price;
        $d->td_item_sellling_price = $price;
        $d->td_item_total = round((float) ($line['line_total'] ?? $qty * $price), 2);
        $d->td_item_image = $product->product_image ?: env('NO_IMAGE');

        if ($variation) {
            $d->td_item_image = $variation->pv_image ?: $d->td_item_image;
            $d->td_item_sku = $variation->pv_sku;
            $extra = explode(',', (string) $variation->pv_variation_extra);
            $d->td_item_unit = $extra[0] ?? '';
            $d->td_item_color = $extra[1] ?? '';
            $d->td_item_img = $extra[2] ?? '';
        }
        $d->save();
    }

    /**
     * A guest is matched to the account on that mobile, or gets a new one —
     * so their orders are there when they log in later. An existing
     * account's profile is left as it is.
     */
    private function guestUser(array $form, array $ship): ArUsers
    {
        $existing = ArUsers::where('user_mobile', $form['mobile'])->first();
        if ($existing) {
            return $existing;
        }

        $user = new ArUsers;
        $user->user_fname = $form['first_name'];
        $user->user_lname = $form['last_name'] ?? '';
        $user->user_email = $form['email'] ?? '';
        $user->user_mobile = $form['mobile'];
        $user->user_delivery_mobile = $ship['phone'];
        $user->user_address = $ship['address'];
        $user->user_landmark = $ship['landmark'] ?? '';
        $user->user_city_name = $ship['city'];
        $user->user_state_name = $ship['state'];
        $user->user_country_name = 'India';
        $user->user_pincode = $ship['pincode'];
        $user->user_gstin = '';
        $user->user_status = 1;
        $user->user_profile_status = 1;
        $user->user_unique_id = DB::transaction(fn () => $this->nextId(self::USER_SEQUENCE));
        $user->save();

        return $user;
    }

    /** The address a logged-in buyer just typed becomes the account's — /api/auth/me hands it back next time. */
    private function rememberAddress(ArUsers $user, array $ship, ?string $gstin): void
    {
        $user->user_address = $ship['address'];
        $user->user_landmark = $ship['landmark'] ?? '';
        $user->user_city_name = $ship['city'];
        $user->user_state_name = $ship['state'];
        $user->user_pincode = $ship['pincode'];
        $user->user_country_name = 'India';
        $user->user_delivery_mobile = $ship['phone'];
        if ($gstin) {
            $user->user_gstin = $gstin;
        }
        $user->save();
    }

    /** The account's server cart of the order's kind. */
    private function clearCart(ArTransactions $order): void
    {
        ArCart::where('cart_user_id', $order->trans_user_id)
            ->where('cart_is_wholesale', (int) $order->trans_is_wholesale)
            ->delete();
    }

    /** Next number in an ar_unique_ids sequence. Call inside a transaction — the row is locked. */
    private function nextId(int $sequence): string
    {
        $row = ArUniqueIds::where('ui_id', $sequence)->lockForUpdate()->first();
        $next = $row->ui_current + 1;
        ArUniqueIds::where('ui_id', $sequence)->update(['ui_current' => $next]);

        return $row->ui_prefix . sprintf('%04d', $next);
    }

    private function createCashfreeOrder(ArTransactions $order, ArUsers $user, bool $wholesale): ?array
    {
        $customerId = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $user->user_unique_id) ?: 'cust_' . $user->user_id;
        $path = $wholesale ? '/wholesale-fabric/checkout/status' : '/checkout/status';
        $meta = ['return_url' => rtrim(config('services.cashfree.frontend_url'), '/') . $path
            . '?order_id={order_id}&t=' . $this->receiptToken($order->trans_order_number)];
        // Cashfree only calls https endpoints.
        $notify = route('cashfree.webhook');
        if (Str::startsWith($notify, 'https://')) {
            $meta['notify_url'] = $notify;
        }

        $res = $this->cashfree()->post('/orders', [
            'order_id'         => $order->trans_order_number,
            'order_amount'     => (float) $order->trans_amt,
            'order_currency'   => 'INR',
            'customer_details' => array_filter([
                'customer_id'    => $customerId,
                'customer_name'  => $order->trans_user_name,
                'customer_email' => $order->trans_user_email ?: null,
                'customer_phone' => $order->trans_user_mobile,
            ]),
            'order_meta'       => $meta,
            'order_note'       => $wholesale ? 'Wholesale order' : 'Retail order',
            'order_tags'       => ['type' => $wholesale ? 'wholesale' : 'retail'],
        ]);

        if (!$res->successful()) {
            Log::error('Cashfree create order failed', ['order' => $order->trans_order_number, 'body' => $res->body()]);
        }
        return $res->json();
    }

    private function cashfree(): PendingRequest
    {
        return Http::baseUrl($this->isProduction() ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg')
            ->withHeaders([
                'x-client-id'     => config('services.cashfree.app_id'),
                'x-client-secret' => config('services.cashfree.secret'),
                'x-api-version'   => self::API_VERSION,
            ])
            ->acceptJson()
            ->timeout(20);
    }

    private function isProduction(): bool
    {
        return config('services.cashfree.env') === 'production';
    }

    /** "Order placed" to the buyer and the shop. A mail failure never fails the order. */
    private function sendOrderEmails(ArTransactions $order): void
    {
        try {
            $rowTransData = ArTransactions::where('trans_id', $order->trans_id)->with(['items'])->first();
            if ($rowTransData->trans_user_email) {
                Mail::to($rowTransData->trans_user_email)->send(new sendingEmail([
                    'subject'      => 'Your Order Placed Successfully',
                    'rowTransData' => $rowTransData,
                    'template'     => 'frontend.emails.order_placed',
                ]));
            }
            $admin = ArThemeAdmin::first();
            if ($admin && $admin->administration_email) {
                Mail::to($admin->administration_email)->send(new sendingEmail([
                    'subject'      => 'New order received.',
                    'rowTransData' => $rowTransData,
                    'template'     => 'frontend.emails.order_placed',
                ]));
            }
        } catch (\Throwable $e) {
            Log::warning('Order email failed', ['order' => $order->trans_order_number, 'error' => $e->getMessage()]);
        }
    }

    private function fail(string $message, int $code, array $errors = []): JsonResponse
    {
        return response()->json(array_filter([
            'status'  => 'error',
            'message' => $message,
            'errors'  => $errors ?: null,
        ]), $code);
    }
}
