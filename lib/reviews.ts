import { site } from "./site";
import type { Failure } from "./auth";

/**
 * Posting a product review — logged-in only.
 *
 *   POST /api/process/{product_id}/reviews   [Authorization: Bearer <token>]
 *     multipart: pr_review, rating, review_image1?, review_image2?, review_video?
 *
 * Multipart rather than query params, since it carries files. The success
 * payload hasn't been seen yet, so anything 2xx without an explicit
 * `status: "error"` / `success: false` counts as posted.
 */
export interface ReviewInput {
  rating: number;
  text: string;
  image1?: File | null;
  image2?: File | null;
  video?: File | null;
}

export async function submitReview(
  productId: number,
  token: string,
  input: ReviewInput,
): Promise<{ ok: true; message?: string } | Failure> {
  const form = new FormData();
  form.append("pr_review", input.text.trim());
  form.append("rating", String(input.rating));
  if (input.image1) form.append("review_image1", input.image1);
  if (input.image2) form.append("review_image2", input.image2);
  if (input.video) form.append("review_video", input.video);

  try {
    const res = await fetch(`${site.url}/api/process/${productId}/reviews`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: form,
    });
    const json: { status?: string; success?: boolean; message?: string; errors?: Record<string, string[]> } =
      await res.json().catch(() => ({}));
    if (res.status === 401) return { ok: false, message: "Your session has expired — log in again." };
    if (res.status === 413) return { ok: false, message: "Those files are too large — try smaller ones." };
    if (res.status === 429) return { ok: false, message: "Too many attempts — wait a minute and try again." };
    if (!res.ok || json.success === false || (json.status && json.status !== "success")) {
      const first = json.errors ? Object.values(json.errors)[0]?.[0] : undefined;
      return { ok: false, message: first ?? json.message ?? "Couldn't post the review — please try again." };
    }
    return { ok: true, message: json.message };
  } catch {
    return { ok: false, message: "Couldn't reach the server — check your connection." };
  }
}
