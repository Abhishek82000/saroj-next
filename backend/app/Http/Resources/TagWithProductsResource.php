<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TagWithProductsResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'       => $this->tag_id,
            'name'     => $this->tag_name ?? null,
            'slug'     => $this->tag_slug ?? null,
            'products' => ProductResource::collection($this->whenLoaded('products')),
        ];
    }
}
