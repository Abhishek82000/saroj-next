<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'    => $this->cat_id,
            'name'  => $this->cat_name,
            'slug'  => $this->cat_slug,
            'image' => $this->cat_cdn_url ?: $this->cat_image,
        ];
    }
}
