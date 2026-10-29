<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArProductReview;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReviewApiController extends Controller
{
    private const REVIEW_WAIT_DAYS = 7;

    /**
     * POST /api/products/{product_id}/reviews  (multipart/form-data)
     * Route must be inside the auth middleware group (e.g. auth:sanctum).
     */
    public function store(Request $request, int $productId): JsonResponse
    {
        $customer = $request->user();
        if (!$customer)  {
            return response()->json(['success' => false, 'message' => 'Login required'], 401);
        }

        $data = $request->validate([
            'pr_review'     => 'required|string|max:2000',
            'rating'        => 'required|integer|min:1|max:5',
            'review_image1' => 'nullable|image|max:4096',
            'review_image2' => 'nullable|image|max:4096',
            'review_video'  => 'nullable|mimetypes:video/mp4,video/quicktime,video/webm|max:20480',
        ]);

        // 1. Already reviewed?
        $alreadyReviewed = ArProductReview::where('pr_user_id', $customer->user_id)
            ->where('pr_product_id', $productId)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json([
                'success' => false,
                'message' => 'You have already given your review on this product.',
            ], 409);
        }

        // 2. Earliest PAID order of this product by this user
        $firstOrderAt = DB::table('ar_transaction_details')
            ->join('ar_transactions', 'ar_transaction_details.td_trans_id', '=', 'ar_transactions.trans_id')
            ->where('ar_transactions.trans_user_id', $customer->user_id) // check column name, see note
            ->where('ar_transactions.trans_payment_status', 1)
            ->where('ar_transaction_details.td_item_id', $productId)
            ->min('ar_transactions.created_at');

        if (!$firstOrderAt) {
            return response()->json([
                'success' => false,
                'message' => 'You can only review products you have purchased.',
            ], 403);
        }

        // 3. 7-day wait after the order
        $eligibleAt = Carbon::parse($firstOrderAt)->addDays(self::REVIEW_WAIT_DAYS);
        if (now()->lt($eligibleAt)) {
            return response()->json([
                'success'     => false,
                'message'     => 'You can review this product ' . self::REVIEW_WAIT_DAYS . ' days after your order.',
                'eligible_at' => $eligibleAt->toIso8601String(),
            ], 403);
        }

        // 4. Save
        $review = new ArProductReview();
        $review->pr_user_id    = $customer->user_id;
        $review->pr_product_id = $productId;
        $review->pr_review     = $data['pr_review'];
        $review->pr_title      = trim($customer->user_fname);
        $review->pr_rating     = $data['rating'];
        $review->pr_status     = 0; // pending moderation

        foreach (['review_image1' => 'pr_image1', 'review_image2' => 'pr_image2', 'review_video' => 'pr_video'] as $input => $column) {
            if ($request->hasFile($input)) {
                $review->{$column} = Storage::disk('public')->url(
                    $request->file($input)->store('reviews', 'public')
                );
            }
        }

        $review->save();

        return response()->json(['success' => true, 'message' => 'Thank you for your review']);
    }

    /**
     * GET /api/products/{product_id}/reviews?type=all|image|video|newest|oldest
     * Public endpoint (approved reviews only).
     */
    public function index(Request $request, int $productId): JsonResponse
    {
        $query = ArProductReview::where('pr_product_id', $productId)
            ->where('pr_status', 1);

        switch ($request->query('type', 'all')) {
            case 'image':
                $query->whereNotNull('pr_image1')->orderByDesc('pr_id');
                break;
            case 'video':
                $query->whereNotNull('pr_video')->orderByDesc('pr_id');
                break;
            case 'oldest':
                $query->orderBy('pr_id', 'ASC');
                break;
            default: // all, newest
                $query->orderByDesc('pr_id');
        }

        $reviews = $query->get()->map(fn ($r) => [
            'id'         => $r->pr_id,
            'title'      => $r->pr_title,
            'review'     => $r->pr_review,
            'rating'     => $r->pr_rating,
            'rating_pct' => $r->pr_rating * 20,
            'image1'     => $r->pr_image1,
            'image2'     => $r->pr_image2,
            'video'      => $r->pr_video,
            'likes'      => $r->pr_likes,
            'unlikes'    => $r->pr_unlikes,
            'created_at' => $r->created_at,
        ]);

        return response()->json(['success' => true, 'data' => $reviews]);
    }
}