<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArNewsletter;
use App\Models\ArContacts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NewsletterApiController extends Controller
{
    /** POST /api/newsletter/subscribe  { newsletter_email } */
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate(['newsletter_email' => 'required|email']);

        $existing = ArNewsletter::where('newsletter_email', $request->newsletter_email)->first();
        if ($existing) {
            return response()->json(['status' => 'failed', 'message' => 'Email Id already Subscribed']);
        }

        ArNewsletter::create(['newsletter_email' => $request->newsletter_email]);

        return response()->json(['status' => 'ok', 'message' => 'Email Id Subscribed successfully']);
    }
    public function processContact(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'    => 'required|string|max:255',
            'mobile'  => 'required|string|max:20',
            'email'   => 'required|email|max:255',
            'message' => 'nullable|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $contact = new ArContacts();

            $contact->contact_name    = $request->name;
            $contact->contact_mobile  = $request->mobile;
            $contact->contact_email   = $request->email;
            $contact->contact_message = $request->message;

            $contact->save();

            return response()->json([
                'success' => true,
                'message' => 'Thanks! Your message has been sent. We will get back to you soon.',
            ], 201);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong while submitting your message. Please try again.',
            ], 500);
        }
    }
}
