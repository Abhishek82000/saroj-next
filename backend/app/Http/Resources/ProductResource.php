<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->product_id,
            'name'           => $this->product_name,
            'slug'           => $this->product_slug,
            'price'          => $this->product_price,
            'selling_price'  => $this->product_selling_price,
            'image'          => $this->product_image_cdn ?: $this->product_image,
            'image_alt'      => $this->product_img_alt,
            'moq'            => $this->product_moq,
            'stock'          => $this->product_stock,
            'inventory'      => $this->product_inventory,
            'type'           => $this->product_type,
            'label'          => $this->product_label_name,
            'rating'         => $this->product_rating,
            'review_count'   => $this->product_review,
            'style_type'     => $this->product_style_type,
            'shipping'     => $this->product_shipping_free,
            // gallery relation, if loaded, becomes a flat array of CDN urls
            'gallery'        => $this->whenLoaded('gallery', function () {
                return $this->gallery->pluck('image_cdn')->filter()->values();
            }),
        ];
    }
}
