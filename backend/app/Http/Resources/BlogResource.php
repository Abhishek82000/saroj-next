<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BlogResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'name'  => $this->blog_name,
            'slug'  => $this->blog_slug,
            'image' => $this->blog_image,
        ];
    }
}
