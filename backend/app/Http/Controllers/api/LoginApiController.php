<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArCart;
use App\Models\ArProductVariation;
use App\Models\ArUniqueIds;
use App\Models\ArUsers;
use App\Models\OtpVerification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Hash;
/**
 * Auth flow — all session-based (Session::put('AR_USER', ...)), exactly
 * like the original. Same requirement as the cart/favorites/reviews
 * endpoints: for a separately-hosted Next.js app to actually share this
 * session, you need Laravel Sanctum's *stateful* SPA mode (shared-domain
 * cookies, CSRF token fetched from /sanctum/csrf-cookie before the first
 * call, `credentials: 'include'` on every request). This is the most
 * important place to get that right, since it's the actual login flow —
 * worth setting up and testing before anything else here.
 */
class LoginApiController extends Controller
{
    /** POST /api/auth/send-otp  { mobile } — main login/registration entry point. */
    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'mobile' => ['required', 'digits:10'],
        ]);

        $mobile = $request->mobile;

        $user = ArUsers::where('user_mobile', $mobile)->first();

        if ($user && $user->user_profile_status == 1 && $user->user_status != 1) {
            return response()->json([
                'status' => 'error',
                'message' => 'Account is not active. Please contact support.',
            ], 403);
        }

        // Invalidate previous OTP challenges
        OtpVerification::where('mobile', $mobile)
            ->whereNull('verified_at')
            ->update([
                'expires_at' => now(),
            ]);

        $otp = random_int(1000, 9999);

        $challengeToken = Str::random(64);

        OtpVerification::create([
            'user_id' => $user?->user_id,
            'mobile' => $mobile,
            'otp_hash' => Hash::make($otp),
            'challenge_token_hash' => hash('sha256', $challengeToken),
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
        ]);

        $this->sendSms($mobile, $otp);

        return response()->json([
            'status' => 'success',
            'message' => 'OTP sent successfully.',
            'challenge_token' => $challengeToken,
            'is_registered' => $user && $user->user_profile_status == 1,
        ]);
    }

    /** POST /api/auth/verify-otp  { otp } */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'challenge_token' => ['required', 'string'],
            'otp' => ['required', 'digits:4'],
        ]);

        $challenge = OtpVerification::where(
            'challenge_token_hash',
            hash('sha256', $request->challenge_token)
        )
        ->whereNull('verified_at')
        ->first();

        if (!$challenge) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired OTP request.',
            ], 422);
        }

        if ($challenge->expires_at->isPast()) {
            return response()->json([
                'status' => 'error',
                'message' => 'OTP has expired. Please request a new OTP.',
            ], 422);
        }

        if ($challenge->attempts >= 5) {
            return response()->json([
                'status' => 'error',
                'message' => 'Too many attempts. Please request a new OTP.',
            ], 429);
        }

        if (!Hash::check($request->otp, $challenge->otp_hash)) {

            $challenge->increment('attempts');

            return response()->json([
                'status' => 'error',
                'message' => 'Invalid OTP.',
            ], 422);
        }

        $challenge->update([
            'verified_at' => now(),
        ]);

        $user = ArUsers::where(
            'user_mobile',
            $challenge->mobile
        )->first();

        /*
        |--------------------------------------------------------------------------
        | Existing user
        |--------------------------------------------------------------------------
        */

        if ($user && $user->user_profile_status == 1) {

            if ($user->user_status != 1) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Account is not active.',
                ], 403);
            }

            $token = $user->createToken(
                'nextjs-web'
            )->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful.',
                'user' => $this->userResponse($user),
                'token' => $token,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | New user
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'status' => 'success',
            'message' => 'registration_required',
            'registration_token' => $request->challenge_token,
            'mobile' => $challenge->mobile,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'registration_token' => ['required', 'string'],
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150'],
        ]);

        $challenge = OtpVerification::where(
            'challenge_token_hash',
            hash('sha256', $request->registration_token)
        )
        ->whereNotNull('verified_at')
        ->where('verified_at', '>=', now()->subMinutes(10))
        ->latest()
        ->first();

        if (!$challenge) {
            return response()->json([
                'status' => 'error',
                'message' => 'Registration session expired. Please verify your mobile again.',
            ], 422);
        }

        $user = ArUsers::where(
            'user_mobile',
            $challenge->mobile
        )->first();

        if (!$user) {
            $user = new ArUsers();

            $user->user_mobile = $challenge->mobile;
        }

        if ($user->user_profile_status == 1) {
            return response()->json([
                'status' => 'error',
                'message' => 'Account already registered. Please login.',
            ], 409);
        }

        $user->user_fname = $request->name;
        $user->user_email = $request->email;
        $user->user_unique_id = $this->getUniqueId(7);
        $user->user_status = 1;
        $user->user_profile_status = 1;
        $user->user_email_status = 0;

        $user->save();

        $token = $user->createToken(
            'nextjs-web'
        )->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Registration successful.',
            'user' => $this->userResponse($user),
            'token' => $token,
        ]);
    }
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'user' => $this->userResponse($request->user()),
        ]);
    }
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:150'],
        ]);

        $user = $request->user();

        $user->user_fname = $request->name;

        if ($request->filled('email')) {
            $user->user_email = $request->email;
        }

        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Account details updated successfully.',
            'user' => $this->userResponse($user),
        ]);
    }
    private function userResponse(ArUsers $user): array
    {
        return [
            'id' => $user->user_id,
            'name' => $user->user_fname,
            'email' => $user->user_email,
            'mobile' => $user->user_mobile,
            'email_verified' => (bool) $user->user_email_status,
        ];
    }
    /**
     * POST /api/auth/cart/send-otp  { mobile }
     *
     * !! SECURITY: faithful port of sendcartotp() — for an existing,
     * active, already-registered user, this logs them in IMMEDIATELY with
     * no OTP check at all, just by matching the mobile number. See the
     * writeup above the class. Kept as-is here ONLY so nothing changes
     * silently; see cartSendOtpSecure() below for the corrected version
     * that requires OTP verification for every user, same as the main
     * login flow. Strongly recommend switching to that one.
     */
    public function cartSendOtp(Request $request): JsonResponse
    {
        $request->validate(['mobile' => 'required|digits:10']);

        $user = ArUsers::where('user_mobile', $request->mobile)->first();
        $otp = rand(1000, 9999);

        if ($user) {
            if ($user->user_profile_status == 1) {
                if ($user->user_status != 1) {
                    return response()->json(['status' => 'error', 'message' => 'Account is not active. Please contact admin.']);
                }
                // No OTP check — logs the account in on mobile number alone.
                Session::put('AR_USER', $user);
                return response()->json(['status' => 'registered', 'message' => 'Already Register with Saroj Textile']);
            }
            $user->user_mobile_otp = $otp;
            $user->save();
            $message = 'New User';
        } else {
            $user = ArUsers::create([
                'user_mobile'         => $request->mobile,
                'user_mobile_otp'     => $otp,
                'user_status'         => 0,
                'user_profile_status' => 0,
            ]);
            $message = 'New User';
        }

        $this->sendSms($request->mobile, $otp);
        Session::put('TEMP_USER', $user);

        return response()->json(['status' => 'success', 'message' => $message]);
    }

    /**
     * POST /api/auth/cart/send-otp-secure  { mobile }
     *
     * Corrected version: ALWAYS requires OTP verification, registered or
     * not — closes the account-takeover gap in cartSendOtp() above. Same
     * response shape either way, so the frontend flow doesn't need to
     * branch on registration status.
     */
    public function cartSendOtpSecure(Request $request): JsonResponse
    {
        $request->validate(['mobile' => 'required|digits:10']);

        $user = ArUsers::where('user_mobile', $request->mobile)->first();
        $otp = rand(1000, 9999);

        if ($user) {
            if ($user->user_profile_status == 1 && $user->user_status != 1) {
                return response()->json(['status' => 'error', 'message' => 'Account is not active. Please contact admin.']);
            }
            $user->user_mobile_otp = $otp;
            $user->save();
        } else {
            $user = ArUsers::create([
                'user_mobile'         => $request->mobile,
                'user_mobile_otp'     => $otp,
                'user_status'         => 0,
                'user_profile_status' => 0,
            ]);
        }

        $this->sendSms($request->mobile, $otp);
        Session::put('TEMP_USER', $user);

        return response()->json(['status' => 'success', 'message' => 'OTP sent']);
    }

    /** POST /api/auth/cart/verify-otp  { otp } */
    public function cartVerifyOtp(Request $request): JsonResponse
    {
        $request->validate(['otp' => 'required']);

        $tempUser = Session::get('TEMP_USER');
        if (!$tempUser) {
            return response()->json(['status' => 'error', 'message' => 'OTP session expired, please request a new one.'], 419);
        }

        $user = ArUsers::find($tempUser->user_id);

        if (!$user || $user->user_mobile_otp != $request->otp) {
            return response()->json(['status' => 'error', 'message' => 'Invalid OTP']);
        }

        if ($user->user_profile_status != 1) {
            return response()->json(['status' => 'success', 'message' => 'new_register']);
        }

        if ($user->user_status != 1) {
            return response()->json(['status' => 'error', 'message' => 'Account is not active. Please contact support team.']);
        }

        Session::put('AR_USER', $user);
        ArCart::where('cart_user_id', $user->user_id)->delete();
        Session::forget('TEMP_USER');
        $this->saveLoginCart($user);

        return response()->json(['status' => 'success', 'message' => 'already_register']);
    }

    /**
     * GET /api/auth/verify-email/{hash}
     *
     * The original returned a Blade view — meaningless for an API, and
     * this link is clicked directly from an email client, not fetched by
     * your Next.js app. So instead of JSON, this redirects to a page on
     * your Next.js frontend so the person actually sees a normal page.
     * Set FRONTEND_URL in .env to your Next.js origin.
     */
    public function verifyEmail(string $hash)
    {
        $user = ArUsers::where('user_email_hash', $hash)->first();

        if (!$user) {
            return redirect()->away(rtrim(config('app.frontend_url'), '/') . '/account/email-verified?status=invalid');
        }

        ArUsers::where('user_id', $user->user_id)->update(['user_email_status' => 1]);

        return redirect()->away(rtrim(config('app.frontend_url'), '/') . '/account/email-verified?status=ok');
    }

    /** POST /api/auth/logout */
    public function logout(): JsonResponse
    {
        Session::forget('AR_USER');
        Session::forget('CART_SESSION');

        return response()->json(['status' => 'success', 'message' => 'Logged out']);
    }

    /**
     * Merges a guest CART_SESSION into the user's DB cart on login.
     *
     * BUG FIX: the original looked up an existing cart row by
     * `cart_user_id` + `cart_product_id` only — never `cart_variation_id`
     * — so two different variations of the same product being merged in
     * would collide on the same DB row and add quantities together
     * incorrectly. It also always did `cart_qty += $qty` even in the
     * "new row" branch, where `cart_qty` doesn't exist yet (PHP treats
     * that as `null + $qty`, which happens to evaluate to `$qty`, but
     * only by coincidence, and throws a deprecation notice on PHP 8.1+).
     * Both fixed below: match on product + variation, and set (not add
     * to) quantity for a brand-new row.
     */
    private function saveLoginCart(ArUsers $user): void
    {
        $cartSession = Session::get('CART_SESSION');
        if (!$cartSession) {
            return;
        }

        foreach ($cartSession as $key => $qty) {
            $parts = explode('####', trim((string) $key));
            $productId = $parts[0];
            $variationId = 0;

            if (isset($parts[1]) && $parts[1] > 0 && ArProductVariation::find($parts[1])) {
                $variationId = $parts[1];
            }

            $cartItem = ArCart::where('cart_user_id', $user->user_id)
                ->where('cart_product_id', $productId)
                ->where('cart_variation_id', $variationId)
                ->first();

            if ($cartItem) {
                $cartItem->cart_qty += $qty;
                $cartItem->save();
            } else {
                ArCart::create([
                    'cart_user_id'      => $user->user_id,
                    'cart_product_id'   => $productId,
                    'cart_variation_id' => $variationId,
                    'cart_qty'          => $qty,
                ]);
            }
        }

        Session::forget('CART_SESSION');
    }

    private function getUniqueId(int $id): string
    {
        $row = ArUniqueIds::where('ui_id', $id)->first();
        $next = $row->ui_current + 1;
        ArUniqueIds::where('ui_id', $id)->update(['ui_current' => $next]);

        return $row->ui_prefix . $next;
    }

    /**
     * SMS via Laravel's HTTP client instead of raw curl — same request,
     * easier to test/mock, and the API key now comes from config/services.php
     * (backed by SMS_API_KEY in .env) instead of being hardcoded in the
     * source. Add to config/services.php:
     *   'sms' => ['key' => env('SMS_API_KEY'), 'sender' => env('SMS_SENDER', 'MHEP'), 'template_id' => env('SMS_TEMPLATE_ID')]
     */
    private function sendSms(string $mobile, int $otp): bool
    {
        $message = "Dear Customer your OTP is $otp to verify your Saroj Textile account. Don't share this password to anyone. ML Ent.";

        try {
            Http::timeout(30)->get('http://sms.therytech.com/api/smsapi', [
                'key'        => config('services.sms.key'),
                'route'      => 1,
                'sender'     => config('services.sms.sender'),
                'number'     => $mobile,
                'sms'        => $message,
                'templateid' => config('services.sms.template_id'),
            ]);
        } catch (\Throwable $e) {
            report($e);
        }

        return true;
    }
}