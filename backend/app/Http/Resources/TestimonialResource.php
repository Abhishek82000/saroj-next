<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TestimonialResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'      => $this->testimonial_id,
            'name'    => $this->testimonial_name ?? null,
            'content' => $this->testimonial_content ?? null,
            'image'   => $this->testimonial_image ?? null,
            'rating'  => $this->testimonial_rating ?? null,
        ];
    }
}
