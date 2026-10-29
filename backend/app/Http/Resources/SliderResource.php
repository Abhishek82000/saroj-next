<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SliderResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->slider_id,
            'name'         => $this->slider_name,
            'description'  => $this->slider_desc,
            'image_web'    => $this->slider_web_cdn ?: $this->slider_image,
            'image_mobile' => $this->slider_mob_cdn ?: $this->slider_image_mobile,
            'image_mac'    => $this->slider_image_mac,
            'type'         => $this->slider_type,
            'url'          => $this->slider_url,
            'category'     => $this->whenLoaded('category', fn () => [
                'id'   => $this->category->cat_id ?? null,
                'name' => $this->category->cat_name ?? null,
                'slug' => $this->category->cat_slug ?? null,
            ]),
            'tag' => $this->whenLoaded('tag', fn () => [
                'id'   => $this->tag->tag_id ?? null,
                'name' => $this->tag->tag_name ?? null,
                'slug' => $this->tag->tag_slug ?? null,
            ]),
        ];
    }
}
