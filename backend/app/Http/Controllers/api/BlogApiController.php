<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArNewsBlogs;
use App\Models\ArNewsBlogsCategories;
use App\Models\ArNewsBlogsTags;
use App\Models\ArPages;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The original split this across FOUR overlapping actions: blog_list (no
 * filter), blog_by_category, blog_by_tags, and blogUrl (which duplicated
 * both blog_by_category and blog_by_tags behind a single `$type` param,
 * plus its own page-lookup-by-current-URL logic that doesn't translate to
 * an API at all). Same pattern as the product list — one filterable
 * endpoint instead of four near-identical ones.
 *
 * GET /api/blogs?category=slug&tag=id&page=
 */
class BlogApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $category = null;
        $tag = null;

        $query = ArNewsBlogs::where('blog_status', 1)->orderBy('blog_id', 'DESC');

        if ($request->filled('category')) {
            $category = ArNewsBlogsCategories::where('category_slug', $request->category)->first();
            if (!$category) {
                return response()->json(['success' => false, 'message' => 'Category not found'], 404);
            }
            $query->whereRaw('FIND_IN_SET(?, blog_category_id)', [$category->category_id]);
        } elseif ($request->filled('tag')) {
            $tag = ArNewsBlogsTags::where('tag_id', $request->tag)->first();
            if (!$tag) {
                return response()->json(['success' => false, 'message' => 'Tag not found'], 404);
            }
            $query->whereRaw('FIND_IN_SET(?, blog_tag_id)', [$request->tag]);
        } else {
            $query->with('categories');
        }

        $blogs = $query->paginate(10)->withQueryString();

        // Sidebar data every blog-listing variant needed: recent posts,
        // categories (with post counts), and tags. One query set, shared
        // across the whole list view instead of re-fetched per filter type.
        $blogCategories = ArNewsBlogsCategories::where('category_status', 1)
            ->withCount('blogs')
            ->orderBy('category_id', 'DESC')
            ->get();
        $blogTags = ArNewsBlogsTags::where('tag_status', 1)->orderBy('tag_id', 'DESC')->get();
        $recentBlogs = ArNewsBlogs::where('blog_status', 1)->orderBy('blog_id', 'DESC')->limit(3)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'category'   => $category ? ['id' => $category->category_id, 'name' => $category->category_name ?? null, 'slug' => $category->category_slug] : null,
                'tag'        => $tag ? ['id' => $tag->tag_id, 'name' => $tag->tag_name ?? null] : null,
                'blogs'      => $blogs->items(),
                'pagination' => [
                    'current_page' => $blogs->currentPage(),
                    'last_page'    => $blogs->lastPage(),
                    'total'        => $blogs->total(),
                ],
                'categories' => $blogCategories,
                'tags'       => $blogTags,
                'recent'     => $recentBlogs,
            ],
        ]);
    }

    /** GET /api/blogs/{slug} */
    public function show(string $slug): JsonResponse
    {
        $blog = ArNewsBlogs::where('blog_slug', $slug)->first();

        if (!$blog) {
            return response()->json(['success' => false, 'message' => 'Blog not found'], 404);
        }

        // Related products, by category IDs stored on the blog post.
        // The original built this with raw string-concatenated SQL
        // (`DB::select("... FIND_IN_SET($label, ...) ...")`) — the
        // category IDs come from a DB column rather than user input, so
        // it wasn't directly request-injectable, but it's fragile (a
        // non-numeric stray value in that column breaks the query) and
        // inconsistent with how FIND_IN_SET is used everywhere else in
        // your codebase (as a bound parameter). Rewritten the same way as
        // the rest of the app: query builder + bound FIND_IN_SET.
        $categoryIds = array_filter(explode(',', (string) $blog->blog_prod_category_id));
        $relatedProducts = \App\Models\ArProduct::where('product_status', 1)
            ->where(function ($q) use ($categoryIds) {
                foreach ($categoryIds as $catId) {
                    $q->orWhereRaw('FIND_IN_SET(?, product_category_id)', [trim($catId)]);
                }
            })
            ->orderBy('product_id', 'DESC')
            ->limit(10)
            ->get();

        $blogCategories = ArNewsBlogsCategories::where('category_status', 1)
            ->orderBy('category_id', 'DESC')
            ->get()
            ->map(function ($cat) {
                // blog_category_id is a CSV column rather than a real
                // relation key, so this can't be a withCount() — it's the
                // same per-category count the original computed in a loop,
                // just not silently discarding $value outside the loop.
                $cat->blog_count = ArNewsBlogs::whereRaw('FIND_IN_SET(?, blog_category_id)', [$cat->category_id])
                    ->where('blog_status', 1)
                    ->count();
                return $cat;
            });

        $blogTags = ArNewsBlogsTags::where('tag_status', 1)->orderBy('tag_id', 'DESC')->get();
        $relatedTags = ArNewsBlogsTags::whereIn('tag_id', explode(',', (string) $blog->blog_tag_id))->get();
        $recentBlogs = ArNewsBlogs::where('blog_status', 1)->orderBy('blog_id', 'DESC')->limit(5)->get();

        $blogCatIds = explode(',', (string) $blog->blog_category_id);
        $relatedBlogs = ArNewsBlogs::where('blog_status', 1)
            ->where('blog_id', '!=', $blog->blog_id)
            ->where(function ($q) use ($blogCatIds) {
                foreach ($blogCatIds as $catId) {
                    $q->orWhereRaw('FIND_IN_SET(?, blog_category_id)', [$catId]);
                }
            })
            ->orderBy('blog_id', 'DESC')
            ->limit(7)
            ->get();

        $previous = ArNewsBlogs::where('blog_id', '<', $blog->blog_id)->where('blog_status', 1)->orderBy('blog_id', 'DESC')->first();
        $next = ArNewsBlogs::where('blog_id', '>', $blog->blog_id)->where('blog_status', 1)->orderBy('blog_id', 'ASC')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'blog'             => $blog,
                'related_products' => $relatedProducts,
                'related_blogs'    => $relatedBlogs,
                'related_tags'     => $relatedTags,
                'categories'       => $blogCategories,
                'tags'             => $blogTags,
                'recent'           => $recentBlogs,
                'previous'         => $previous,
                'next'             => $next,
            ],
        ]);
    }
}
